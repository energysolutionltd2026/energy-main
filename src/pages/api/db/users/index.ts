import { User } from "@/lib/models/User";
import { collectionHandler } from "@/lib/crud";

// Exclude secret columns from every read. `.lean()` in the CRUD factory bypasses
// the User schema's toJSON strip, so these must be projected out explicitly.
export const SAFE_USER_PROJECTION =
  "-passwordHash -emailVerifyCode -emailVerifyExp -emailVerifyAttempts -resetToken -resetTokenExp";

export default collectionHandler(User, {
  filterFields: ["role", "status", "state"],
  defaultSort: { joinedAt: -1 },
  allowedRoles: ["admin"],
  projection: SAFE_USER_PROJECTION,
});
