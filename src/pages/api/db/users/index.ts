import { User } from "@/lib/models/User";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(User, {
  filterFields: ["role", "status", "state"],
  defaultSort: { joinedAt: -1 },
  allowedRoles: ["admin"],
});
