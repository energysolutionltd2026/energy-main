import { Schema, model, models, type InferSchemaType } from "mongoose";

const ProductStockSchema = new Schema(
  {
    level:  { type: Number, required: true, min: 0, max: 100 }, // percentage
    price:  { type: Number, required: true, min: 0 },           // ₦ per litre
    status: { type: String, enum: ["Available", "Limited", "Unavailable"], required: true },
  },
  { _id: false }
);

const CoordinatesSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const DepotSchema = new Schema(
  {
    name:        { type: String, required: true, unique: true },
    location:    { type: String, required: true },
    state:       { type: String },
    coordinates: { type: CoordinatesSchema },
    logo:        { type: String },
    PMS:         { type: ProductStockSchema, required: true },
    AGO:         { type: ProductStockSchema, required: true },
    ATK:         { type: ProductStockSchema, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: "lastUpdated" } }
);

export type DepotDoc = InferSchemaType<typeof DepotSchema>;
export const Depot = models.Depot ?? model("Depot", DepotSchema);
