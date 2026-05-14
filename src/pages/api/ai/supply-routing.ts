/**
 * POST /api/ai/supply-routing
 *
 * MODE: AUTO-EXECUTE
 * Claude picks the optimal depot for a supply request and may escalate
 * the priority if conditions warrant it. The result is applied immediately
 * — no admin confirmation required.
 *
 * Body: { requestId: string }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { SupplyRoutingSchema, type SupplyRoutingResult } from "@/lib/ai-types";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { Depot } from "@/lib/models/Depot";

// Fixed coordinates for all 10 PNB depots.
// Injected into every routing prompt so Claude can factor in distance
// when stock levels are within 15% of each other.
const DEPOT_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  "Atlas Cove":   { lat: 6.4281,  lng: 3.3958,  state: "Lagos" },
  "Mosimi":       { lat: 6.7319,  lng: 3.3958,  state: "Ogun" },
  "Warri":        { lat: 5.5167,  lng: 5.7500,  state: "Delta" },
  "Port Harcourt":{ lat: 4.8156,  lng: 7.0498,  state: "Rivers" },
  "Kaduna":       { lat: 10.5167, lng: 7.4333,  state: "Kaduna" },
  "Ilorin":       { lat: 8.4966,  lng: 4.5421,  state: "Kwara" },
  "Ore":          { lat: 6.7667,  lng: 4.8667,  state: "Ondo" },
  "Enugu":        { lat: 6.4584,  lng: 7.5464,  state: "Enugu" },
  "Calabar":      { lat: 4.9517,  lng: 8.3220,  state: "Cross River" },
  "Kano":         { lat: 12.0000, lng: 8.5167,  state: "Kano" },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SupplyRoutingResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { requestId } = req.body as { requestId?: string };
  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }

  await connectDB();
  const [supplyRequest, depots] = await Promise.all([
    SupplyRequest.findById(requestId).lean(),
    Depot.find().lean(),
  ]);

  if (!supplyRequest) {
    return res.status(404).json({ error: "Supply request not found" });
  }
  if (!depots.length) {
    return res.status(500).json({ error: "No depots available" });
  }

  try {
    const client = getAnthropicClient();

    const response = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(SupplyRoutingSchema),
      },
      system: `You are a logistics AI for PNB, a Nigerian petroleum distribution platform.
You automatically assign supply requests to the best available depot.
Your decisions are executed immediately — be accurate and conservative.
Never assign to a depot with "Unavailable" stock for the requested product.`,
      messages: [
        {
          role: "user",
          content: `Assign this fuel supply request to the optimal depot.

Supply Request:
${JSON.stringify(supplyRequest, null, 2)}

Available Depots (current stock snapshot):
${JSON.stringify(depots, null, 2)}

Depot Coordinates (lat/lng for distance reasoning):
${JSON.stringify(DEPOT_COORDINATES, null, 2)}

Assignment rules:
1. Only assign to depots with "Available" or "Limited" stock for the requested product
2. Primary sort: highest stock level for the requested product
3. Tiebreaker: when two depots are within 15% stock of each other, prefer the one
   geographically closer to the requesting station's state (use coordinates above)
4. For "emergency" priority: choose the best-stocked depot regardless of distance
5. For "urgent": balance stock level and distance equally
6. For "normal": full tiebreaker applies; list 2 alternates in case of failure
7. You MAY escalate adjustedPriority (e.g., normal→urgent) if platform-wide stock
   for that product is critically low (<20% across all depots)
8. Never downgrade priority

This result is AUTO-EXECUTED. Set actionTaken to "auto_assigned".
Provide clear reasoning so the admin can audit the decision.`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    const result = response.parsed_output;

    // Persist AI routing fields back to the supply request
    await SupplyRequest.findByIdAndUpdate(requestId, {
      $set: {
        aiAssignedDepot: result.assignedDepot,
        aiAdjustedPriority: result.adjustedPriority,
        aiReasoning: result.reasoning,
        aiEstimatedDeliveryDays: result.estimatedDeliveryDays,
        aiAlternateDepots: result.alternateDepots ?? [],
        // Also set the working depot field so downstream queries can use it
        depot: result.assignedDepot,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[supply-routing] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
