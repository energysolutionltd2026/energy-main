import { Schema, model, models } from "mongoose";

const PriceHistorySchema = new Schema(
  {
    month:      { type: String, required: true }, // e.g. "May 2026"
    monthShort: { type: String, required: true }, // e.g. "May"
    pms:        { type: Number, required: true, min: 0 },
    atk:        { type: Number, required: true, min: 0 },
    ago:        { type: Number, required: true, min: 0 },
    lgp:        { type: Number, default: 0, min: 0 },
    recordedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// One snapshot per calendar month
PriceHistorySchema.index({ month: 1 }, { unique: true });
PriceHistorySchema.index({ recordedAt: -1 });

export const PriceHistory = models.PriceHistory ?? model("PriceHistory", PriceHistorySchema);
