import { Schema, model, models, type InferSchemaType } from "mongoose";

// Full schema matching every field captured in the BuyNow multi-step form
const PurchaseOrderSchema = new Schema(
  {
    orderId:  { type: String, required: true, unique: true }, // BUY-{timestamp}

    // ── Status & linking ───────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["Pending", "Processing", "In Transit", "Delivered", "Cancelled"],
      default: "Pending",
    },
    dealer:          { type: String },                        // bulk dealer email (if via dealer portal)
    transactionId:   { type: Schema.Types.ObjectId },         // FK → transactions._id

    // ── Stage 1: Company information ──────────────────────────────────────────
    loadingDepot:       { type: String, required: true },
    companyName:        { type: String, required: true, trim: true },
    dprRegNo:           { type: String, required: true, trim: true },
    cacRegNo:           { type: String, required: true, trim: true },
    companyAddress:     { type: String, required: true, trim: true },  // headOfficeAddress
    companyTelephone:   { type: String, required: true, trim: true },
    companyEmail:       { type: String, required: true, lowercase: true, trim: true },
    stationAddress:     { type: String, required: true, trim: true },

    // ── Stage 2: Owner / director information ─────────────────────────────────
    ownerName:          { type: String, required: true, trim: true },
    ownerTelephone:     { type: String, required: true, trim: true },
    ownerAddress:       { type: String, required: true, trim: true },
    ownerEmail:         { type: String, required: true, lowercase: true, trim: true },
    ownerIdType:        { type: String, enum: ["nin", "passport", "drivers-license", "voters-card"], required: true },
    ownerIdNumber:      { type: String, required: true, trim: true },

    // ── Stage 3: Product & truck details ──────────────────────────────────────
    productType:        { type: String, enum: ["PMS", "AGO", "ATK"], required: true },
    productQuantity:    { type: Number, required: true, min: 1 },      // litres
    haulageTruck:       { type: String, enum: ["Owned Truck", "Rent Truck"], required: true },

    // Owned truck fields (required when haulageTruck === "Owned Truck")
    vehicleType:        { type: String },                              // tanker | mini-tanker | etc.
    tankCapacity:       { type: Number },                              // litres
    truckRegNumber:     { type: String, trim: true },
    tractorColor:       { type: String, trim: true },
    tankColor:          { type: String, trim: true },
    bodyInscription:    { type: String, trim: true },
    truckChart:         { type: String, trim: true },
    calibrationChart:   { type: String, trim: true },
    otherTruckDetails:  { type: String, trim: true },
    // Compartment ullage readings (up to 5)
    ullages:            [{ type: Number }],

    driverName:         { type: String, trim: true },                  // optional if Rent Truck
    driverIdType:       { type: String },
    driverIdNumber:     { type: String, trim: true },

    // Rented truck reference (when haulageTruck === "Rent Truck")
    rentalId:           { type: Schema.Types.ObjectId },               // FK → truck_rentals._id

    // ── Stage 4: Payment ──────────────────────────────────────────────────────
    paymentMethod:      {
      type: String,
      enum: ["bank_transfer", "card", "wallet", "opay", "cash"],
      required: true,
    },
    bankName:           { type: String, trim: true },
    bankAccountName:    { type: String, trim: true },
    transactionRef:     { type: String, required: true, trim: true },

    // ── Pricing (locked at order time) ────────────────────────────────────────
    pricePerLitre:      { type: Number },                              // ₦ at submission
    totalAmount:        { type: Number },                              // productQuantity × pricePerLitre
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ companyEmail: 1, createdAt: -1 });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ dealer: 1, createdAt: -1 });
PurchaseOrderSchema.index({ loadingDepot: 1, status: 1 });

export type PurchaseOrderDoc = InferSchemaType<typeof PurchaseOrderSchema>;
export const PurchaseOrder = models.PurchaseOrder ?? model("PurchaseOrder", PurchaseOrderSchema);
