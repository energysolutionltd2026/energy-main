import { Schema, model, models, type InferSchemaType } from "mongoose";

const AllocationSchema = new Schema(
  {
    allocationId: { type: String, required: true, unique: true },

    dealerEmail:  { type: String, required: true, lowercase: true, trim: true },
    dealerName:   { type: String, required: true, trim: true },

    product:      { type: String, enum: ["PMS", "AGO", "ATK"], required: true },
    volumeLitres: { type: Number, required: true, min: 1 },
    usedLitres:   { type: Number, default: 0, min: 0 },

    depot:        { type: String, required: true, trim: true },
    validFrom:    { type: Date, required: true },
    validTo:      { type: Date, required: true },

    status: {
      type: String,
      enum: ["Active", "Exhausted", "Expired", "Revoked"],
      default: "Active",
    },

    notes:        { type: String, trim: true },
    createdBy:    { type: String, required: true },
  },
  { timestamps: true }
);

AllocationSchema.index({ dealerEmail: 1, status: 1 });
AllocationSchema.index({ product: 1, depot: 1 });
AllocationSchema.index({ validTo: 1, status: 1 });

export type AllocationDoc = InferSchemaType<typeof AllocationSchema>;
export const Allocation = models.Allocation ?? model("Allocation", AllocationSchema);
