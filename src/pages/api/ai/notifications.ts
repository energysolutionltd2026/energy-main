/**
 * POST /api/ai/notifications
 *
 * MODE: AUTO-EXECUTE
 * Claude writes contextual, professional push notification copy for any
 * admin action (truck approval, suspension, supply update, etc.).
 * The generated message is saved to the Notification collection and
 * returned — no admin editing required.
 *
 * Body: {
 *   action: string,
 *   recipientEmail: string,
 *   recipientRole: "customer" | "bulk_dealer" | "truck_owner" | "admin",
 *   context: Record<string, unknown>,
 *   reference?: string,   // linked record ID (e.g. supply request ID)
 * }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL_FAST } from "@/lib/anthropic";
import { NotificationSchema, type NotificationResult } from "@/lib/ai-types";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Notification } from "@/lib/models/Notification";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NotificationResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { action, recipientEmail, recipientRole, context, reference } = req.body as {
    action: string;
    recipientEmail: string;
    recipientRole: string;
    context: Record<string, unknown>;
    reference?: string;
  };

  if (!action || !recipientEmail || !recipientRole) {
    return res.status(400).json({ error: "Missing action, recipientEmail, or recipientRole" });
  }

  try {
    const client = getAnthropicClient();

    const response = await client.messages.parse({
      model: AI_MODEL_FAST,
      max_tokens: 1024,
      output_config: {
        format: zodOutputFormat(NotificationSchema),
      },
      system: `You are a communications AI for PNB, a Nigerian petroleum distribution platform.
Write clear, professional push notification copy. Be warm but concise.
Use ₦ for Nigerian Naira. Reference specific details from context to personalise.
Title: max 60 characters. Message: max 200 characters.`,
      messages: [
        {
          role: "user",
          content: `Generate a push notification for this platform event.

Action: ${action}
Target audience: ${recipientRole} users
Context details:
${JSON.stringify(context, null, 2)}

Examples of good notifications:
- Title: "Supply Request Assigned" / Message: "Your PMS request (500L) has been assigned to Atlas Cove Depot. Expected in 2 days."
- Title: "Truck Registration Approved" / Message: "Your tanker (LAG-345-AB) has been approved. You can now accept fuel delivery jobs on PNB."
- Title: "Account Notice" / Message: "Your account has been temporarily suspended. Contact support@pnb.ng for assistance."

Write the title and message for the current action. If the user needs to take an action, include it in actionRequired.`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    const result = response.parsed_output;

    // Persist the generated notification to the DB
    await connectDB();
    await Notification.create({
      recipientEmail,
      recipientRole,
      title: result.title,
      message: result.message,
      actionRequired: result.actionRequired,
      action,
      reference,
      read: false,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[notifications] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
