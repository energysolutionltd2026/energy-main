import { Schema, model, models, type InferSchemaType } from "mongoose";

const TransactionSchema = new Schema(
  {
    txnId:         { type: String, required: true, unique: true }, // TXN-xxx
    type:          {
      type: String,
      enum: ["supply_request", "truck_rental", "union_dues", "purchase_order", "supply_fulfillment", "daily_sales"],
      required: true,
    },
    user:          { type: String, required: true },   // display name
    userEmail:     { type: String },                   // for DB lookups
    userRole:      { type: String, enum: ["customer", "bulk_dealer"], required: true },
    product:       { type: String },
    quantity:      { type: String },                   // kept as string to match existing format
    totalAmount:   { type: Number, required: true },   // stored as number, formatted on frontend
    status:        { type: String, enum: ["completed", "pending", "failed"], default: "pending" },
    paymentMethod: { type: String, enum: ["bank_transfer", "card", "wallet", "opay", "cash"] },
    depot:         { type: String },
    reference:     { type: String, required: true },   // original record ID (SUP-REQ-xxx etc.)
    referenceType: {
      type: String,
      enum: ["supply_request", "purchase_order", "truck_rental", "union_dues"],
    },
    referenceId:   { type: Schema.Types.ObjectId },    // FK to the source document

    // AI anomaly flag — set by /api/ai/anomaly-detection
    aiFlagged:          { type: Boolean, default: false },
    aiAnomalySeverity:  { type: String, enum: ["low", "medium", "high"] },
    aiAnomalyDesc:      { type: String },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

TransactionSchema.index({ userEmail: 1, timestamp: -1 });
TransactionSchema.index({ referenceId: 1 });
TransactionSchema.index({ aiFlagged: 1 });

export type TransactionDoc = InferSchemaType<typeof TransactionSchema>;
export const Transaction = models.Transaction ?? model("Transaction", TransactionSchema);
