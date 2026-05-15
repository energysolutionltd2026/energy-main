import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

// Official ID types accepted on the platform
const ID_TYPES = ["nin", "nimc-slip", "passport", "drivers-license", "voters-card", "bvn", "tin", "nysc", "birth-certificate"] as const;

const UserSchema = new Schema(
  {
    // ── Core identity ──────────────────────────────────────────────────────────
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:         { type: String, trim: true },
    role:          { type: String, enum: ["customer", "bulk_dealer", "truck_owner", "admin"], required: true },
    status:        { type: String, enum: ["active", "suspended", "pending"], default: "active" },

    // ── Auth ──────────────────────────────────────────────────────────────────
    passwordHash:    { type: String },                   // bcrypt hash — never returned to client
    emailVerified:   { type: Boolean, default: false },
    emailVerifyCode:     { type: String },               // SHA-256 hash of 6-digit OTP
    emailVerifyExp:      { type: Date },                 // OTP expiry
    emailVerifyAttempts: { type: Number, default: 0 },  // failed attempts counter
    resetToken:          { type: String },               // SHA-256 hash of reset token
    resetTokenExp:       { type: Date },

    // ── Business details ──────────────────────────────────────────────────────
    companyName:       { type: String, trim: true },
    rcNumber:          { type: String, trim: true },      // CAC RC number (bulk dealers)
    dprRegNo:          { type: String, trim: true },      // DPR registration number
    dprLicence:        { type: String, trim: true },      // DPR licence (bulk dealers)
    tinNumber:         { type: String, trim: true },      // Tax ID number
    cacRegNo:          { type: String, trim: true },      // CAC cert number
    dealerCode:        { type: String, trim: true },      // e.g. BD-CH1P3T (bulk dealers)
    memberId:          { type: String, trim: true },      // union membership ID

    // ── Address ───────────────────────────────────────────────────────────────
    state:             { type: String, trim: true },
    lga:               { type: String, trim: true },
    headOfficeAddress: { type: String, trim: true },
    stationAddress:    { type: String, trim: true },

    // ── Official ID ───────────────────────────────────────────────────────────
    officialIdType:       { type: String, enum: [...ID_TYPES] },
    idNumber:             { type: String, trim: true },
    idIssueDate:          { type: Date },
    idExpiryDate:         { type: Date },
    idIssuingAuthority:   { type: String, trim: true },

    // ── Bank details ──────────────────────────────────────────────────────────
    bankName:          { type: String, trim: true },
    bankAccountName:   { type: String, trim: true },
    bankAccountNumber: { type: String, trim: true },     // NUBAN — 10 digits
    bankBranch:        { type: String, trim: true },

    // ── Tank storage volumes (bulk dealers only, set by admin) ────────────────
    // Values in mega-litres (ML). Default 5 = 5,000,000 litres per product.
    pmsTankMaxML:  { type: Number, default: 5, min: 0 },
    agoTankMaxML:  { type: Number, default: 5, min: 0 },
    atkTankMaxML:  { type: Number, default: 5, min: 0 },

    // ── Metadata ──────────────────────────────────────────────────────────────
    lastLogin:         { type: Date },
  },
  {
    timestamps: { createdAt: "joinedAt", updatedAt: "updatedAt" },
  }
);

// Never return password hash or OTP fields to the client
UserSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.emailVerifyCode;
    delete ret.resetToken;
    return ret;
  },
});

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = models.User ?? model("User", UserSchema);
