/**
 * POST /api/ai/report-insights
 *
 * MODE: AUTO-EXECUTE
 * Claude analyses the full platform metrics snapshot and generates an
 * executive report with insights, recommendations, and alerts.
 * Rendered automatically in the admin Reports section.
 *
 * Body: {} (metrics fetched from DB server-side)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL_MID } from "@/lib/anthropic";
import { ReportInsightsSchema, type ReportInsightsResult } from "@/lib/ai-types";
import { buildMetricsSnapshot } from "@/lib/db-metrics";
import { getSessionUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportInsightsResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const metrics = await buildMetricsSnapshot();

  try {
    const client = getAnthropicClient();

    const response = await client.messages.parse({
      model: AI_MODEL_MID,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(ReportInsightsSchema),
      },
      // System prompt is identical on every call — cache it to save ~90% on repeated input tokens
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

Provide:
1. executiveSummary — 2–3 sentences covering overall platform health
2. topInsights — 3–5 key observations backed by the data
   (e.g., "AGO transactions increased 23% vs last week", "3 depots below 20% stock")
3. recommendations — 3–5 specific, actionable steps for the admin
   (e.g., "Restock Mosimi depot AGO — currently at 12% and serving 4 active requests")
4. alerts — any critical issues needing immediate attention
   (low depot stock, high failed transaction rate, spike in suspended users, etc.)
5. forecastNote — short outlook based on current trends

Use ₦ for Naira amounts. Be direct and data-driven.`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    return res.status(200).json(response.parsed_output);
  } catch (error) {
    console.error("[report-insights] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
