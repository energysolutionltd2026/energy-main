/**
 * POST /api/ai/overview-briefing
 *
 * MODE: AUTO-EXECUTE
 * Claude generates a daily admin briefing from the full platform snapshot.
 * Includes a personalised greeting, today's summary, and a prioritised
 * action list. Shown automatically at the top of the admin Overview section.
 *
 * Body: {} (snapshot fetched from DB server-side)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL_MID } from "@/lib/anthropic";
import { OverviewBriefingSchema, type OverviewBriefingResult } from "@/lib/ai-types";
import { buildPlatformSnapshot } from "@/lib/db-metrics";
import { getSessionUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OverviewBriefingResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const snapshot = await buildPlatformSnapshot();

  try {
    const client = getAnthropicClient();

    const now = new Date();
    const timeOfDay =
      now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
    const dayName = now.toLocaleDateString("en-NG", { weekday: "long" });

    const response = await client.messages.parse({
      model: AI_MODEL_MID,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(OverviewBriefingSchema),
      },
      // System prompt is identical on every call — cache it to save ~90% on repeated input tokens
      system: [
        {
          type: "text",
          text: `You are the operations AI for PNB, a Nigerian petroleum distribution platform.
Generate a concise, useful daily briefing for the platform admin.
Be direct and action-oriented — the admin is busy. Prioritise what needs attention now.
Nigerian context: Mon–Fri peak demand, fuel scarcity awareness, ₦ for Naira.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate the admin overview briefing for this ${dayName} ${timeOfDay}.

Platform Snapshot:
${JSON.stringify(snapshot, null, 2)}

Provide:
1. greeting — friendly, personalised opening acknowledging the day/state
   (e.g., "Good morning — busy Monday ahead with 8 pending supply requests.")
2. todaySummary — 2 sentences covering the most important platform metrics right now
3. priorityActions — ordered list of what the admin should do first
   Each action needs: title, urgency (low/medium/high), description, suggestedAction
   Focus on: pending truck reviews, critical depot stock, urgent supply requests,
   high-risk users flagged, failed transactions
4. watchItems — things to keep an eye on but not urgent
   (e.g., "Warri depot AGO at 35% — restock in next 48h", "New bulk dealer awaiting verification")

Keep greeting and todaySummary conversational.
Keep priorityActions concrete and specific — include names, amounts, counts.
Maximum 5 priority actions, maximum 5 watch items.`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    return res.status(200).json(response.parsed_output);
  } catch (error) {
    console.error("[overview-briefing] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
