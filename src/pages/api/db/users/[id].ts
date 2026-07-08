import { User } from "@/lib/models/User";
import { documentHandler } from "@/lib/crud";

// Never return secret columns (`.lean()` bypasses the schema toJSON strip).
const SAFE_USER_PROJECTION =
  "-passwordHash -emailVerifyCode -emailVerifyExp -emailVerifyAttempts -resetToken -resetTokenExp";

export default documentHandler(User, {
  immutableFields: ["_id", "__v", "email", "joinedAt", "role", "passwordHash"],
  projection: SAFE_USER_PROJECTION,
});
