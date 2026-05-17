import { Schema, model, models, type InferSchemaType } from "mongoose";

// Records a physical truck loading event at the depot.
// Created by an authorized loader after verifying a purchase order.
const LoadingRecordSchema = new Schema(
  {
    loadId:        { type: String, required: true, unique: true },   // LOAD-{timestamp}

    // ── Linked order ──────────────────────────────────────────────────────────
    orderId:       { type: String, required: true },                 // FK → purchase_orders.orderId
    orderRef:      { type: Schema.Types.ObjectId },                  // FK → purchase_orders._id
    product:       { type: String, enum: ["PMS", "AGO", "ATK"] },
    depot:         { type: String },                                 // FK → depots.name

    // ── Truck & driver (denormalised from order for audit trail) ──────────────
    truckRegNumber:  { type: String, trim: true },
    driverName:      { type: String, trim: true },
    companyName:     { type: String, trim: true },

    // ── Loading details ───────────────────────────────────────────────────────
    loadingDate:     { type: Date, required: true },
    // Up to 5 compartments — litres loaded per compartment
    compartments:    [{ type: Number, min: 0 }],
    totalLitresLoaded:{ type: Number, min: 0 },                      // sum of compartments

    // ── Quality & seal data ───────────────────────────────────────────────────
    sealNumbers:     [{ type: String, trim: true }],                 // one per compartment
    temperature:     { type: Number },                               // °C at loading
    density:         { type: Number },                               // kg/L at loading

    // ── Personnel ─────────────────────────────────────────────────────────────
    loaderName:      { type: String, trim: true },
    loaderId:        { type: String, trim: true },                   // FK → users.email or SM.email

    // ── Notes & status ────────────────────────────────────────────────────────
    remarks:         { type: String },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

LoadingRecordSchema.index({ orderId: 1 });
LoadingRecordSchema.index({ orderRef: 1 });
LoadingRecordSchema.index({ depot: 1, loadingDate: -1 });
LoadingRecordSchema.index({ truckRegNumber: 1 });

export type LoadingRecordDoc = InferSchemaType<typeof LoadingRecordSchema>;
export const LoadingRecord = models.LoadingRecord ?? model("LoadingRecord", LoadingRecordSchema);
