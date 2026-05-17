/**
 * POST /api/ai/supply-fulfillment
 *
 * MODE: AUTO-EXECUTE — multi-step chain
 *
 * Orchestrates the full lifecycle of a supply request across 4 stages.
 * Call once per stage transition; runs the right sub-steps in parallel
 * where possible and returns a typed result for that stage.
 *
 * Stage flow:
 *   new        → route to depot  →  notify customer (sequential — notification needs routing result)
 *   processing → notify customer + notify truck owner (parallel)
 *   in_transit → notify customer (single step)
 *   delivered  → notify customer + regenerate report insights (parallel)
 *
 * Body:
 *   {
 *     stage: "new" | "processing" | "in_transit" | "delivered",
 *     requestId: string,
 *     truckOwnerEmail?: string,  // optional for stage "processing"
 *   }
 *
 * All data is fetched from DB — no caller needs to send document bodies.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL, AI_MODEL_FAST, AI_MODEL_MID } from "@/lib/anthropic";
import {
  SupplyRoutingSchema,
  NotificationSchema,
  ReportInsightsSchema,
  type SupplyRoutingResult,
  type NotificationResult,
  type ReportInsightsResult,
  type FulfillmentChainResult,
  type FulfillmentStage,
} from "@/lib/ai-types";
import { connectDB } from "@/lib/db";
import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { Depot } from "@/lib/models/Depot";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import { buildMetricsSnapshot } from "@/lib/db-metrics";
import { getSessionUser } from "@/lib/auth";

// ─── Depot coordinates (same as supply-routing) ──────────────────────────────

const DEPOT_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  "Atlas Cove":    { lat: 6.4281,  lng: 3.3958,  state: "Lagos" },
  "Mosimi":        { lat: 6.7319,  lng: 3.3958,  state: "Ogun" },
  "Warri":         { lat: 5.5167,  lng: 5.7500,  state: "Delta" },
  "Port Harcourt": { lat: 4.8156,  lng: 7.0498,  state: "Rivers" },
  "Kaduna":        { lat: 10.5167, lng: 7.4333,  state: "Kaduna" },
  "Ilorin":        { lat: 8.4966,  lng: 4.5421,  state: "Kwara" },
  "Ore":           { lat: 6.7667,  lng: 4.8667,  state: "Ondo" },
  "Enugu":         { lat: 6.4584,  lng: 7.5464,  state: "Enugu" },
  "Calabar":       { lat: 4.9517,  lng: 8.3220,  state: "Cross River" },
  "Kano":          { lat: 12.0000, lng: 8.5167,  state: "Kano" },
};

// ─── Sub-step helpers (called directly, no HTTP round-trip) ──────────────────

async function runRouting(
  request: Record<string, unknown>,
  depots: Record<string, unknown>[]
): Promise<SupplyRoutingResult> {
  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: zodOutputFormat(SupplyRoutingSchema) },
    system: `You are a logistics AI for PNB, a Nigerian petroleum distribution platform.
You automatically assign supply requests to the best available depot.
Your decisions are executed immediately — be accurate and conservative.
Never assign to a depot with "unavailable" stock for the requested product.`,
    messages: [
      {
        role: "user",
        content: `Assign this fuel supply request to the optimal depot.

Supply Request:
${JSON.stringify(request, null, 2)}

Available Depots (current stock snapshot):
${JSON.stringify(depots, null, 2)}

Depot Coordinates (lat/lng for distance reasoning):
${JSON.stringify(DEPOT_COORDINATES, null, 2)}

Assignment rules:
1. Only assign to depots with "available" or "limited" stock for the requested product
2. Primary sort: highest stock level for the requested product
3. Tiebreaker: when two depots are within 15% stock of each other, prefer the closer one
4. For "emergency": choose best-stocked depot regardless of distance
5. For "urgent": balance stock level and distance equally
6. For "normal": full tiebreaker applies; list 2 alternates
7. MAY escalate priority if platform-wide stock for that product is critically low (<20%)
8. Never downgrade priority. Set actionTaken to "auto_assigned".`,
      },
    ],
  });
  if (!response.parsed_output) throw new Error("Routing returned no output");
  return response.parsed_output;
}

async function runNotification(
  action: string,
  targetRole: string,
  context: Record<string, unknown>
): Promise<NotificationResult> {
  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: AI_MODEL_FAST,
    max_tokens: 512,
    output_config: { format: zodOutputFormat(NotificationSchema) },
    system: [
      {
        type: "text",
        text: `You are a communications AI for PNB, a Nigerian petroleum distribution platform.
Write clear, professional push notification copy. Be warm but concise.
Use ₦ for Nigerian Naira. Reference specific details from context to personalise.
Title: max 60 characters. Message: max 200 characters.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generate a push notification.
Action: ${action}
Target: ${targetRole}
Context: ${JSON.stringify(context)}`,
      },
    ],
  });
  if (!response.parsed_output) throw new Error("Notification returned no output");
  return response.parsed_output;
}

async function runInsights(
  metrics: Record<string, unknown>
): Promise<ReportInsightsResult> {
  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: AI_MODEL_MID,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(ReportInsightsSchema) },
    system: [
      {
        type: "text",
        text: `You are a business intelligence AI for PNB, a Nigerian petroleum distribution platform.
Generate executive-level insights from platform metrics.
Be specific with numbers and percentages. Prioritise actionable findings over observations.
Nigerian energy sector context: fuel scarcity is a recurring issue; depot stock levels are critical;
demand peaks Monday–Friday mornings; PMS (petrol) moves highest volume.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Analyse this platform metrics snapshot and generate an executive report.

Platform Metrics:
${JSON.stringify(metrics, null, 2)}

Provide executiveSummary, topInsights, recommendations, alerts, and forecastNote.`,
      },
    ],
  });
  if (!response.parsed_output) throw new Error("Insights returned no output");
  return response.parsed_output;
}

// ─── Notification persistence helper ─────────────────────────────────────────

async function saveNotification(
  notification: NotificationResult,
  recipientEmail: string,
  recipientRole: string,
  action: string,
  reference?: string
): Promise<void> {
  await Notification.create({
    recipientEmail,
    recipientRole,
    title: notification.title,
    message: notification.message,
    actionRequired: notification.actionRequired,
    action,
    reference,
    read: false,
  });
}

// ─── Stage handlers ───────────────────────────────────────────────────────────

async function handleNew(
  request: Record<string, unknown>,
  depots: Record<string, unknown>[],
  requestId: string
): Promise<FulfillmentChainResult> {
  // Routing must finish first — notification needs the assigned depot name
  const routing = await runRouting(request, depots);

  // Save routing fields back to the supply request
  await SupplyRequest.findByIdAndUpdate(requestId, {
    $set: {
      aiAssignedDepot: routing.assignedDepot,
      aiAdjustedPriority: routing.adjustedPriority,
      aiReasoning: routing.reasoning,
      aiEstimatedDeliveryDays: routing.estimatedDeliveryDays,
      aiAlternateDepots: routing.alternateDepots ?? [],
      depot: routing.assignedDepot,
    },
  });

  const customerNotification = await runNotification(
    "supply_request_assigned",
    "customer",
    {
      stationName: request.stationName,
      product: request.product,
      quantity: request.quantity,
      assignedDepot: routing.assignedDepot,
      estimatedDeliveryDays: routing.estimatedDeliveryDays,
      adjustedPriority: routing.adjustedPriority,
    }
  );

  // Persist customer notification
  const requestedBy = request.requestedBy as string | undefined;
  if (requestedBy) {
    await saveNotification(
      customerNotification,
      requestedBy,
      "customer",
      "supply_request_assigned",
      requestId
    );
  }

  return { stage: "new", routing, customerNotification };
}

async function handleProcessing(
  request: Record<string, unknown>,
  truckOwner: Record<string, unknown> | null,
  requestId: string
): Promise<FulfillmentChainResult> {
  const notificationJobs: [
    Promise<NotificationResult>,
    Promise<NotificationResult | null>
  ] = [
    runNotification("supply_processing", "customer", {
      stationName: request.stationName,
      product: request.product,
      quantity: request.quantity,
      assignedDepot: request.depot ?? request.aiAssignedDepot,
    }),
    truckOwner
      ? runNotification("new_delivery_job", "truck_owner", {
          ownerName: truckOwner.name,
          product: request.product,
          quantity: request.quantity,
          depot: request.depot ?? request.aiAssignedDepot,
          deliveryDate: request.deliveryDate,
        })
      : Promise.resolve(null),
  ];

  const [customerNotification, truckOwnerNotification] = await Promise.all(notificationJobs);

  // Persist notifications in parallel
  const saves: Promise<void>[] = [];
  const requestedBy = request.requestedBy as string | undefined;
  if (requestedBy) {
    saves.push(
      saveNotification(customerNotification, requestedBy, "customer", "supply_processing", requestId)
    );
  }
  if (truckOwnerNotification && truckOwner) {
    saves.push(
      saveNotification(
        truckOwnerNotification,
        truckOwner.email as string,
        "truck_owner",
        "new_delivery_job",
        requestId
      )
    );
  }
  await Promise.all(saves);

  return { stage: "processing", customerNotification, truckOwnerNotification };
}

async function handleInTransit(
  request: Record<string, unknown>,
  requestId: string
): Promise<FulfillmentChainResult> {
  const customerNotification = await runNotification("supply_in_transit", "customer", {
    stationName: request.stationName,
    product: request.product,
    quantity: request.quantity,
    assignedDepot: request.depot ?? request.aiAssignedDepot,
    deliveryDate: request.deliveryDate,
  });

  const requestedBy = request.requestedBy as string | undefined;
  if (requestedBy) {
    await saveNotification(
      customerNotification,
      requestedBy,
      "customer",
      "supply_in_transit",
      requestId
    );
  }

  return { stage: "in_transit", customerNotification };
}

async function handleDelivered(
  request: Record<string, unknown>,
  requestId: string
): Promise<FulfillmentChainResult> {
  // Fetch fresh metrics and run notification in parallel
  const [customerNotification, metrics] = await Promise.all([
    runNotification("supply_delivered", "customer", {
      stationName: request.stationName,
      product: request.product,
      quantity: request.quantity,
      assignedDepot: request.depot ?? request.aiAssignedDepot,
    }),
    buildMetricsSnapshot(),
  ]);

  // Run insights with fresh metrics
  const insights = await runInsights(metrics as unknown as Record<string, unknown>);

  const requestedBy = request.requestedBy as string | undefined;
  if (requestedBy) {
    await saveNotification(
      customerNotification,
      requestedBy,
      "customer",
      "supply_delivered",
      requestId
    );
  }

  return { stage: "delivered", customerNotification, insights };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FulfillmentChainResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { stage, requestId, truckOwnerEmail } = req.body as {
    stage: FulfillmentStage;
    requestId: string;
    truckOwnerEmail?: string;
  };

  if (!stage || !requestId) {
    return res.status(400).json({ error: "Missing stage or requestId" });
  }

  await connectDB();

  const supplyRequest = await SupplyRequest.findById(requestId).lean();
  if (!supplyRequest) {
    return res.status(404).json({ error: "Supply request not found" });
  }

  const request = supplyRequest as Record<string, unknown>;

  try {
    let result: FulfillmentChainResult;

    switch (stage) {
      case "new": {
        const depots = await Depot.find().lean();
        if (!depots.length) {
          return res.status(500).json({ error: "No depots available" });
        }
        result = await handleNew(request, depots as Record<string, unknown>[], requestId);
        break;
      }

      case "processing": {
        let truckOwner: Record<string, unknown> | null = null;
        if (truckOwnerEmail) {
          truckOwner = (await User.findOne({ email: truckOwnerEmail }).lean()) as Record<string, unknown> | null;
        }
        result = await handleProcessing(request, truckOwner, requestId);
        break;
      }

      case "in_transit":
        result = await handleInTransit(request, requestId);
        break;

      case "delivered":
        result = await handleDelivered(request, requestId);
        break;

      default:
        return res.status(400).json({ error: `Unknown stage: ${stage}` });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(`[supply-fulfillment:${stage}] Error:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
