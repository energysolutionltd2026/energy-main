import { Schema, model, models, type InferSchemaType } from "mongoose";

// Full schema matching every field captured in the RentTruck registration form
const TruckSchema = new Schema(
  {
    // ── Owner ─────────────────────────────────────────────────────────────────
    ownerName:  { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, trim: true },      // FK → users.email
    ownerPhone: { type: String, required: true, trim: true },

    // ── Vehicle identity ──────────────────────────────────────────────────────
    vehicleType:     { type: String, required: true },             // tanker | mini-tanker | articulated-tanker | rigid-tanker
    tankCapacity:    { type: Number, required: true, min: 1 },    // litres
    compartments:    { type: Number },                             // number of compartments
    truckRegNumber:  { type: String, required: true, unique: true, trim: true },
    tractorColor:    { type: String, trim: true },
    tankColor:       { type: String, trim: true },
    chassisNumber:   { type: String, trim: true },
    engineNumber:    { type: String, trim: true },
    yearOfManufacture: { type: String, trim: true },
    bodyInscription:   { type: String, trim: true },

    // ── Insurance & compliance ────────────────────────────────────────────────
    insuranceProvider:     { type: String, trim: true },
    insurancePolicyNumber: { type: String, trim: true },
    insuranceExpiry:       { type: Date },
    dprCertNumber:         { type: String, trim: true },
    dprCertExpiry:         { type: Date },
    roadWorthinessExpiry:  { type: Date },

    // ── Cargo ─────────────────────────────────────────────────────────────────
    productTypes: [{ type: String }],                              // ["PMS", "AGO", "ATK"]

    // ── Rates ─────────────────────────────────────────────────────────────────
    dailyRate:         { type: Number, required: true, min: 0 },  // ₦ base daily rate
    // State-specific zone rates set by truck owner
    zoneRates:         { type: Schema.Types.Mixed },               // Record<state, ₦ per litre>
    // Rates approved/adjusted by admin
    approvedZoneRates: { type: Schema.Types.Mixed },

    // ── Driver ───────────────────────────────────────────────────────────────
    driverName:          { type: String, required: true, trim: true },
    driverPhone:         { type: String, trim: true },
    driverLicenseNumber: { type: String, trim: true },
    driverLicenseExpiry: { type: Date },

    // ── Motor boy (assistant driver) ──────────────────────────────────────────
    motorBoyName:     { type: String, trim: true },
    motorBoyPhone:    { type: String, trim: true },
    motorBoyIdType:   { type: String, trim: true },
    motorBoyIdNumber: { type: String, trim: true },

    // ── Destination preferences ───────────────────────────────────────────────
    destinationState: { type: String },
    destinationTown:  { type: String },

    // ── Images (URLs after upload) ────────────────────────────────────────────
    tractorImageUrl: { type: String },
    tankImageUrl:    { type: String },

    // ── Review ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
    },
    reviewNote: { type: String },

    // ── AI review fields (populated by /api/ai/truck-review) ─────────────────
    aiScore:          { type: Number, min: 0, max: 100 },
    aiRecommendation: { type: String, enum: ["approve", "reject"] },
    aiSummary:        { type: String },
    aiStrengths:      [{ type: String }],
    aiConcerns:       [{ type: String }],
    aiConfidenceGate: {
      type: String,
      enum: ["decisive_approve", "decisive_reject", "needs_manual_review"],
    },
  },
  { timestamps: { createdAt: "submittedAt", updatedAt: "updatedAt" } }
);

TruckSchema.index({ ownerEmail: 1 });
TruckSchema.index({ status: 1 });
TruckSchema.index({ productTypes: 1, status: 1 });

export type TruckDoc = InferSchemaType<typeof TruckSchema>;
export const Truck = models.Truck ?? model("Truck", TruckSchema);
