import { StationManager } from "@/lib/models/StationManager";
import { documentHandler } from "@/lib/crud";

// `.lean()` bypasses the schema toJSON strip, so secret columns must be
// projected out explicitly. Station-manager records are admin-managed only.
export default documentHandler(StationManager, {
  immutableFields: ["_id", "__v", "email", "passwordHash", "createdAt"],
  allowedRoles: ["admin"],
  projection: "-passwordHash -resetToken -resetTokenExp",
});
