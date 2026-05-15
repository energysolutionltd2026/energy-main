import { StationManager } from "@/lib/models/StationManager";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(StationManager, {
  filterFields: ["depot", "status"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin"],
});
