import { Session } from "@/lib/models/Session";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Session, {
  immutableFields: ["_id", "__v", "token", "userEmail", "userId", "role", "createdAt"],
  allowedRoles: ["admin"],
});
