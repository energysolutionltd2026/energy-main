import { Schema, model, models, type InferSchemaType } from "mongoose";

// Station managers are created by admin and stored separately from the main users collection.
// They log in via the same /auth/login page but are stored under sm_user in localStorage.
const StationManagerSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },                    // bcrypt hash
    phone:        { type: String, trim: true },

    // ── Assignment ────────────────────────────────────────────────────────────
    depot:        { type: String, required: true },                    // FK → depots.name
    assignedBy:   { type: String, required: true },                    // admin email

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "blocked", "inactive"],
      default: "active",
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    lastLogin:    { type: Date },
    resetToken:   { type: String },
    resetTokenExp:{ type: Date },
  },
  { timestamps: true }
);

// Never return password hash to the client
StationManagerSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.passwordHash;
    delete ret.resetToken;
    return ret;
  },
});

StationManagerSchema.index({ depot: 1 });
StationManagerSchema.index({ status: 1 });

export type StationManagerDoc = InferSchemaType<typeof StationManagerSchema>;
export const StationManager = models.StationManager ?? model("StationManager", StationManagerSchema);
