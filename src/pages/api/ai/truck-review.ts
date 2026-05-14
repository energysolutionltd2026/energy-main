/**
 * POST /api/ai/truck-review
 *
 * MODE: ADMIN EXECUTES
 * Claude scores a truck registration submission and writes a ready-to-use
 * review note. The admin sees the recommendation + reasoning and decides
 * whether to approve or reject.
 *
 * Body: { truckId: string }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import {
  TruckReviewSchema,
  type TruckReviewResult,
  type TruckReviewConfidence,
} from "@/lib/ai-types";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Truck } from "@/lib/models/Truck";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TruckReviewResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { truckId } = req.body as { truckId?: string };
  if (!truckId) {
    return res.status(400).json({ error: "Missing truckId" });
  }

  await connectDB();
  const truck = await Truck.findById(truckId).lean();
  if (!truck) {
    return res.status(404).json({ error: "Truck not found" });
  }

  try {
    const client = getAnthropicClient();

    const response = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(TruckReviewSchema),
      },
      system: `You are an expert fleet compliance officer for PNB, a Nigerian petroleum distribution platform.
Your role is to review truck owner registration submissions and provide clear, actionable assessments.
Always be fair and thorough. Your review note will be sent directly to the truck owner.`,
      messages: [
        {
          role: "user",
          content: `Review this truck registration submission for PNB platform approval.

Platform context:
- PNB operates fuel distribution across Nigerian depots
- Products transported: PMS (Premium Motor Spirit/petrol), AGO (diesel), ATK (aviation fuel)
- Trucks do last-mile delivery from depots to fuel stations
- Typical daily rates: ₦50,000–₦300,000 depending on capacity

Submission details:
${JSON.stringify(truck, null, 2)}

Evaluate:
1. Owner identity completeness (name, email, phone)
2. Vehicle type suitability for fuel transport (tanker, bowser, etc.)
3. Tank capacity reasonableness (typical: 5,000–45,000 litres)
4. Product type compatibility (PMS/AGO/ATK)
5. Nigerian truck registration format (e.g., ABC-123-DE or LND-234-ZA)
6. Daily rate reasonableness vs. capacity
7. Driver name provided
8. Any inconsistencies or red flags

Provide:
- recommendation: approve or reject
- score: 0–100 (60+ = approvable, <60 = reject)
- summary: one-sentence verdict
- strengths: what looks legitimate
- concerns: any red flags or missing info
- reviewNote: professional message to send to the truck owner explaining the decision`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    // Confidence gate — computed from score, never asked of the LLM
    // score ≥ 75 → decisive approve  (green banner, one-click)
    // score ≤ 40 → decisive reject   (red banner, one-click)
    // score 41–74 → needs manual review (amber banner, admin must read fully)
    const { score } = response.parsed_output;
    const confidenceGate: TruckReviewConfidence =
      score >= 75 ? "decisive_approve"
      : score <= 40 ? "decisive_reject"
      : "needs_manual_review";

    const result: TruckReviewResult = { ...response.parsed_output, confidenceGate };

    // Persist AI fields back to the truck document
    await Truck.findByIdAndUpdate(truckId, {
      $set: {
        aiScore: result.score,
        aiRecommendation: result.recommendation,
        aiSummary: result.summary,
        aiStrengths: result.strengths,
        aiConcerns: result.concerns,
        aiConfidenceGate: confidenceGate,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[truck-review] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
