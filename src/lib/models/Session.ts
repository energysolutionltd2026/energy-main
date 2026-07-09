import { Schema, model, models, type InferSchemaType } from "mongoose";

const SessionSchema = new Schema(
  {
    userEmail:    { type: String, required: true },              // FK → users.email
    userId:       { type: Schema.Types.ObjectId, required: true }, // FK → users._id
    token:        { type: String, required: true, unique: true }, // hashed JWT / session token
    role:         {
      type: String,
      enum: ["customer", "bulk_dealer", "truck_owner", "admin", "station_manager", "financer"],
      required: true,
    },
    ipAddress:    { type: String },
    userAgent:    { type: String },
    expiresAt:    { type: Date, required: true },
    lastActiveAt: { type: Date, default: Date.now },
    isValid:      { type: Boolean, default: true },              // false on logout / revocation
  },
  { timestamps: true }
);

SessionSchema.index({ userEmail: 1 });
SessionSchema.index({ userId: 1 });
// Auto-delete expired sessions — MongoDB TTL index
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = InferSchemaType<typeof SessionSchema>;
export const Session = models.Session ?? model("Session", SessionSchema);
