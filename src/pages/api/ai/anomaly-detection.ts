/**
 * POST /api/ai/anomaly-detection
 *
 * MODE: AUTO-EXECUTE
 * Claude scans a batch of transactions and flags suspicious ones with
 * severity levels and suggested actions. Flagged transactions are
 * highlighted in the admin Transactions section automatically.
 *
 * Body: { limit?: number; status?: string }
 * Fetches up to `limit` (default 200) recent transactions from DB,
 * optionally filtered by status (e.g. "Completed" to scan settled txns).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, AI_MODEL_FAST } from "@/lib/anthropic";
import { AnomalyDetectionSchema, type AnomalyDetectionResult } from "@/lib/ai-types";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Transaction } from "@/lib/models/Transaction";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnomalyDetectionResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { limit = 200, status } = req.body as {
    limit?: number;
    status?: string;
  };

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const transactions = await Transaction.find(query)
    .sort({ timestamp: -1 })
    .limit(Math.min(limit, 500))
    .lean();

  if (transactions.length === 0) {
    return res.status(200).json({ anomalies: [], summary: "No transactions to analyse.", totalFlagged: 0 });
  }

  try {
    const client = getAnthropicClient();

    const response = await client.messages.parse({
      model: AI_MODEL_FAST,
      max_tokens: 4096,
      output_config: {
        format: zodOutputFormat(AnomalyDetectionSchema),
      },
      system: `You are a financial fraud detection AI for PNB, a Nigerian petroleum distribution platform.
Analyse transactions and flag genuine anomalies — not minor variations.
Be precise: cite the exact transaction ID and amounts. Avoid false positives.
Only flag what you have clear evidence for in the data provided.`,
      messages: [
        {
          role: "user",
          content: `Scan these transactions and flag any anomalies.

Platform context:
- Transaction types: fuel_purchase, truck_rental, union_dues, supply_fulfillment
- Payment methods: bank_transfer, card, wallet, opay, cash
- Typical amount ranges:
    fuel_purchase: ₦5,000–₦2,000,000
    truck_rental: ₦50,000–₦300,000/day
    union_dues: ₦5,000–₦50,000
    supply_fulfillment: ₦100,000–₦5,000,000
- Products: PMS (petrol), AGO (diesel), ATK (aviation fuel)
- ATK transactions are rare and high-value — flag unusual volume

Transactions (${transactions.length} records):
${JSON.stringify(transactions, null, 2)}

Flag anomalies including:
1. Amounts wildly outside the normal range for that transaction type
2. Exact duplicate transactions (same user, type, amount, within short time)
3. Multiple "Failed" transactions from the same user in quick succession
4. Quantity-to-amount ratio inconsistency (e.g., 1000L PMS at ₦100 — too cheap)
5. Unusual payment method for the transaction type
6. Very high-value cash transactions (>₦500,000)

Severity guide:
- low: minor irregularity, worth monitoring
- medium: likely error or abuse, should be reviewed
- high: probable fraud, needs immediate investigation

Set totalFlagged to the count of anomalies array.
If no anomalies found, return empty array with a clean summary.`,
        },
      ],
    });

    if (!response.parsed_output) {
      return res.status(500).json({ error: "AI returned no structured output" });
    }

    // Ensure totalFlagged matches actual array length
    const result = {
      ...response.parsed_output,
      totalFlagged: response.parsed_output.anomalies.length,
    };

    // Persist flags back to each flagged transaction
    if (result.anomalies.length > 0) {
      await Promise.all(
        result.anomalies.map((anomaly) =>
          Transaction.findOneAndUpdate(
            { txnId: anomaly.transactionId },
            {
              $set: {
                aiFlagged: true,
                aiAnomalySeverity: anomaly.severity,
                aiAnomalyDesc: anomaly.description,
              },
            }
          )
        )
      );
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[anomaly-detection] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
