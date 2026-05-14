/**
 * POST /api/ai/user-risk
 *
 * MODE: ADMIN EXECUTES
 * Claude assesses a user's risk profile and explains any flags.
 * The admin reviews the assessment and decides whether to act
 * (warn, monitor, or suspend the account).
 *
 * Body: { userId: string }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import {
  UserRiskSchema,
  type UserRiskResult,
  type UserRiskConfidence,
} from "@/lib/ai-types";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { Transaction } from "@/lib/models/Transaction";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserRiskResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { userId } = req.body as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Fetch the last 90 days of transactions for this user
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentTransactions = await Transaction.find({
    userEmail: (user as Record<string, unknown>).email,
    timestamp: { $gte: ninetyDaysAgo },
  })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  try {
    const client = getAnthropicClient();

    const activitySection =
      recentTransactions.length > 0
        ? `\nRecent Transactions (last 90 days, up to 50):\n${JSON.stringify(recentTransactions, null, 2)}`
        : "\nNo recent transactions found.";

    const response = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(UserRiskSchema),
      },
      system: `You are a fraud and risk analyst for PNB, a Nigerian petroleum distribution platform.
Your assessments inform admin decisions — be specific, evidence-based, and fair.
Flag real risks, not hypothetical ones. The admin will review before taking any action.`,
      messages: [
        {
          role: "user",
          content: `Assess the risk profile of this PNB platform user.

Platform context:
- User roles: customer (fuel station owner), bulk_dealer (wholesaler), truck_owner (logistics)
- Common fraud patterns: fake registrations, account sharing, payment chargebacks,
  bulk order inflation, ghost deliveries
- Suspended users cannot place orders or accept jobs

User Profile:
${JSON.stringify(user, null, 2)}
${activitySection}

Evaluate:
1. Profile completeness — missing phone, company, state, or inconsistent data
2. Account age vs. activity level (very new + high activity = flag)
3. Status history — previously suspended accounts are higher risk
4. Role-specific red flags:
   - customer: unusually high order frequency or amounts
   - bulk_dealer: orders from multiple depots simultaneously
   - truck_owner: multiple pending reviews, rejected then re-submitted
5. Any patterns in the transaction data suggesting abuse

Score 0–100 (0 = no risk, 100 = definite fraud).
riskLevel: low (0–30), medium (31–60), high (61–85), critical (86–100).
recommendation: none / monitor / warn / suspend

Be specific in flags — cite actual data points, not generic concerns.`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    // Confidence gate — computed from riskLevel, never asked of the LLM
    // critical → decisive        (red banner, one-click suspend)
    // high     → review_recommended (amber banner, admin must read flags)
    // low/medium → monitor       (no banner, soft indicator only)
    const { riskLevel } = response.parsed_output;
    const confidenceGate: UserRiskConfidence =
      riskLevel === "critical" ? "decisive"
      : riskLevel === "high" ? "review_recommended"
      : "monitor";

    const result: UserRiskResult = { ...response.parsed_output, confidenceGate };
    return res.status(200).json(result);
  } catch (error) {
    console.error("[user-risk] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
