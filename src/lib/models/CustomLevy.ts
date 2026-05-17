import { Schema, model, models, type InferSchemaType } from "mongoose";

// Admin-defined custom dues and levies shown in the Pay Dues flow.
// Corresponds to admin_custom_levies in localStorage.
const CustomLevySchema = new Schema(
  {
    name:      { type: String, required: true, trim: true },           // e.g. "Emergency Relief Fund"
    amount:    { type: Number, required: true, min: 0 },               // ₦
    frequency: {
      type: String,
      enum: ["one_time", "annual", "monthly", "quarterly", "weekly"],
      required: true,
    },
    isActive:  { type: Boolean, default: true },
    createdBy: { type: String },                                        // admin email
    notes:     { type: String },
  },
  { timestamps: true }
);

CustomLevySchema.index({ isActive: 1 });

export type CustomLevyDoc = InferSchemaType<typeof CustomLevySchema>;
export const CustomLevy = models.CustomLevy ?? model("CustomLevy", CustomLevySchema);
