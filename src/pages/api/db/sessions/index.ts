import { Session } from "@/lib/models/Session";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(Session, {
  filterFields: ["userEmail", "userId", "role", "isValid"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin"],
});
