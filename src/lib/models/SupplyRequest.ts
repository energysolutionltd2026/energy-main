import { Schema, model, models, type InferSchemaType } from "mongoose";

const SupplyRequestSchema = new Schema(
  {
    requestId:    { type: String, required: true, unique: true }, // SUP-REQ-xxx
    stationId:    { type: Schema.Types.ObjectId },               // FK → fuel_stations._id
    stationName:  { type: String, required: true },
    product:      { type: String, enum: ["PMS", "AGO", "ATK"], required: true },
    depot:        { type: String },       // assigned depot (may be set by AI)
    quantity:     { type: Number, required: true, min: 1 },
    priority:     { type: String, enum: ["normal", "urgent", "emergency"], default: "normal" },
    deliveryDate: { type: Date },
    notes:        { type: String },
    requestedBy:  { type: String, required: true }, // user email
    status:       {
      type: String,
      enum: ["pending", "processing", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },

    // AI routing fields — populated by /api/ai/supply-routing or /api/ai/supply-fulfillment
    aiAssignedDepot:        { type: String },
    aiAdjustedPriority:     { type: String, enum: ["normal", "urgent", "emergency"] },
    aiReasoning:            { type: String },
    aiEstimatedDeliveryDays:{ type: Number },
    aiAlternateDepots:      [{ type: String }],
  },
  { timestamps: true }
);

SupplyRequestSchema.index({ stationId: 1, createdAt: -1 });
SupplyRequestSchema.index({ requestedBy: 1, createdAt: -1 });

export type SupplyRequestDoc = InferSchemaType<typeof SupplyRequestSchema>;
export const SupplyRequest = models.SupplyRequest ?? model("SupplyRequest", SupplyRequestSchema);
