import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Dedicated financer login accounts.
 *
 * These are SEPARATE from the normal `users` collection: a financer has no
 * customer/dealer/etc role and can only reach the read-only financer overview
 * dashboard. Accounts are created and revoked by an admin from the admin
 * dashboard, and are hard-capped (see MAX_FINANCER_ACCOUNTS in the API routes).
 */
const FinancerSchema = new Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
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
