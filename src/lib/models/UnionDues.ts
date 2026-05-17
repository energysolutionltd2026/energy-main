import { Schema, model, models, type InferSchemaType } from "mongoose";

// Full schema matching every field captured in the paydues multi-step form
const UnionDuesSchema = new Schema(
  {
    paymentId:     { type: String, required: true, unique: true },     // DUES-{timestamp}

    // ── Stage 1: Member information ───────────────────────────────────────────
    userEmail:     { type: String, required: true },                   // FK → users.email
    fullName:      { type: String, required: true, trim: true },
    companyName:   { type: String, required: true, trim: true },
    membershipId:  { type: String, required: true, trim: true },
    telephone:     { type: String, required: true, trim: true },
    address:       { type: String, required: true, trim: true },
    paymentDepot:  { type: String, required: true },                   // depot name

    // ── Stage 2: Dues amount ──────────────────────────────────────────────────
    amountDue:     { type: Number, required: true, min: 0 },           // ₦ — from admin_settings
    amountPaid:    { type: Number, default: 0, min: 0 },               // ₦

    // Custom levies included in this payment [{id, name, amount, frequency}]
    customLevies:  [
      {
        levyId:    { type: String },
        name:      { type: String },
        amount:    { type: Number },
        frequency: { type: String },
        _id:       false,
      },
    ],

    // ── Stage 3: Levy details (cargo declaration — optional) ──────────────────
    productType:   { type: String, enum: ["PMS", "AGO", "DPK", "LPG", "CRUDE"] },
    litres:        { type: Number, min: 0 },
    truckCount:    { type: Number, min: 0 },
    declaredValue: { type: Number, min: 0 },

    // ── Stage 4: Payment ──────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "card", "wallet", "opay", "cash"],
      required: true,
    },
    bankName:       { type: String, trim: true },
    bankAccountName:{ type: String, trim: true },
    transactionRef: { type: String, required: true, trim: true },

    // ── Status & linking ──────────────────────────────────────────────────────
    userRole: {
      type: String,
      enum: ["customer", "bulk_dealer", "truck_owner"],
      required: true,
    },
    duesPeriod:    { type: String },                                   // e.g. "Q1 2025"
    periodStart:   { type: Date },
    periodEnd:     { type: Date },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "waived"],
      default: "pending",
    },
    transactionId: { type: Schema.Types.ObjectId },                    // FK → transactions._id
    paidAt:        { type: Date },
  },
  { timestamps: true }
);

UnionDuesSchema.index({ userEmail: 1, createdAt: -1 });
UnionDuesSchema.index({ status: 1 });
UnionDuesSchema.index({ membershipId: 1 });
UnionDuesSchema.index({ paymentDepot: 1, status: 1 });

export type UnionDuesDoc = InferSchemaType<typeof UnionDuesSchema>;
export const UnionDues = models.UnionDues ?? model("UnionDues", UnionDuesSchema);
