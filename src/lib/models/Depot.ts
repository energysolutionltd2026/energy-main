import { Schema, model, models, type InferSchemaType } from "mongoose";

const ProductStockSchema = new Schema(
  {
    level:          { type: Number, required: true, min: 0, max: 100 }, // percentage (derived or stored)
    price:          { type: Number, required: true, min: 0 },           // ₦ per litre
    status:         { type: String, enum: ["available", "limited", "unavailable"], required: true },
    capacityLitres: { type: Number, min: 0 },   // max tank volume in litres
    currentLitres:  { type: Number, min: 0 },   // actual volume in litres
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
