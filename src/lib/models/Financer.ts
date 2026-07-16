import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Dedicated financer login accounts.
 *
 * These are SEPARATE from the normal `users` collection: a financer has no
 * customer/dealer/etc role and can only reach the read-only financer overview
 * dashboard. Accounts are created and revoked by an admin from the admin
 * dashboard. Capacity is set by MAX_FINANCER_ACCOUNTS (high default,
 * env-configurable) in the API routes so many banks can be onboarded.
 */
const FinancerSchema = new Schema(
  {
    // ── Login credentials ──────────────────────────────────────────────────
    name:         { type: String, required: true, trim: true },   // full legal bank name
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // ── Bank profile (admin-managed, all optional) ─────────────────────────
    shortCode:    { type: String, trim: true },   // short label / code, e.g. "GTB"
    logoUrl:      { type: String, trim: true },   // branding image shown on the bank's dashboard
    contactName:  { type: String, trim: true },   // relationship manager
    contactPhone: { type: String, trim: true },
    address:      { type: String, trim: true },   // HQ / office address

    // ── Lifecycle ──────────────────────────────────────────────────────────
    status:       { type: String, enum: ["active", "suspended"], default: "active" },
    lastLogin:    { type: Date },
    createdBy:    { type: String },   // admin email that created the account
  },
  { timestamps: true }
);

// Never leak the password hash to the client.
FinancerSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.passwordHash;
    return ret;
  },
});

export type FinancerDoc = InferSchemaType<typeof FinancerSchema>;
export const Financer = models.Financer ?? model("Financer", FinancerSchema);
