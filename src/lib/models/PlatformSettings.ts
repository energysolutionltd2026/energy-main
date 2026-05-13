import { Schema, model, models, type InferSchemaType } from "mongoose";

// Single-document collection — use upsert with a fixed settingsKey.
// All admin_settings from localStorage map to this model.
// Usage: PlatformSettings.findOneAndUpdate({ settingsKey: "global" }, patch, { upsert: true })
const PlatformSettingsSchema = new Schema(
  {
    settingsKey: { type: String, required: true, unique: true, default: "global" },

    // ── Platform identity ──────────────────────────────────────────────────────
    platformName:    { type: String, default: "e-Nergy" },
    tagline:         { type: String },
    businessAddress: { type: String },
    rcNumber:        { type: String },
    vatNumber:       { type: String },

    // ── Contact & support ──────────────────────────────────────────────────────
    supportEmail:   { type: String },
    supportPhone:   { type: String },
    whatsappNumber: { type: String },
    facebookUrl:    { type: String },
    instagramUrl:   { type: String },
    twitterUrl:     { type: String },

    // ── Fuel prices (₦ per litre) ──────────────────────────────────────────────
    pmsPricePerLitre:  { type: Number, default: 897 },
    agoPricePerLitre:  { type: Number, default: 1200 },
    atkPricePerLitre:  { type: Number, default: 1095 },
    lgpPricePerLitre:  { type: Number, default: 620 },
    depotCapacityLitres: { type: Number, default: 5000000 },
    lowStockThreshold:   { type: Number, default: 20 },   // percentage

    // ── Operations ────────────────────────────────────────────────────────────
    urgentDeliveryFee:     { type: Number, default: 50000 },
    emergencyDeliveryFee:  { type: Number, default: 50000 },
    platformCommissionPct: { type: Number, default: 0 },
    minOrderLitres:        { type: Number, default: 33000 },
    maxOrderLitres:        { type: Number, default: 1000000 },
    standardLeadTimeHours: { type: Number, default: 72 },
    urgentLeadTimeHours:   { type: Number, default: 24 },

    // ── Union dues & levies ───────────────────────────────────────────────────
    annualMembershipFee:  { type: Number, default: 50000 },
    monthlyLevy:          { type: Number, default: 5000 },
    loadingSurcharge:     { type: Number, default: 2500 },
    bulkDealerYearlyFee:  { type: Number, default: 150000 },

    // ── Payment methods ───────────────────────────────────────────────────────
    paystackPublicKey:  { type: String },
    bankName:           { type: String, default: "First Bank of Nigeria" },
    bankAccountName:    { type: String, default: "PNB Energy Ltd" },
    bankAccountNumber:  { type: String },
    enablePaystack:     { type: Boolean, default: true },
    enableBankTransfer: { type: Boolean, default: true },
    enableCash:         { type: Boolean, default: true },
    enableWallet:       { type: Boolean, default: true },
    enableOpay:         { type: Boolean, default: true },

    // ── API / backend ─────────────────────────────────────────────────────────
    backendUrl:       { type: String },
    apiKey:           { type: String },                    // internal API key — never sent to client
    mongoDbConnected: { type: Boolean, default: false },

    // ── Notifications ─────────────────────────────────────────────────────────
    notifyNewSupplyRequests:   { type: Boolean, default: true },
    notifyNewPurchaseOrders:   { type: Boolean, default: true },
    notifyLowStock:            { type: Boolean, default: true },
    notifyTruckRegistrations:  { type: Boolean, default: true },

    // ── Access ────────────────────────────────────────────────────────────────
    allowNewRegistrations: { type: Boolean, default: true },
    depotCodeTtlHours:     { type: Number, default: 3 },
    depotCodeSecret:       { type: String },               // never sent to client

    // ── Homepage tank levels (admin override, 0–100%) ─────────────────────────
    pmsLevel: { type: Number, min: 0, max: 100 },
    agoLevel: { type: Number, min: 0, max: 100 },
    atkLevel: { type: Number, min: 0, max: 100 },

    // ── Homepage tank max capacities (litres) ─────────────────────────────────
    pmsMaxVolume: { type: Number, default: 16000000 },
    agoMaxVolume: { type: Number, default: 16000000 },
    atkMaxVolume: { type: Number, default: 16000000 },
  },
  { timestamps: true }
);

// Never return secrets to the client
PlatformSettingsSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.apiKey;
    delete ret.depotCodeSecret;
    delete ret.paystackPublicKey;   // served separately via env
    return ret;
  },
});

export type PlatformSettingsDoc = InferSchemaType<typeof PlatformSettingsSchema>;
export const PlatformSettings = models.PlatformSettings ?? model("PlatformSettings", PlatformSettingsSchema);
