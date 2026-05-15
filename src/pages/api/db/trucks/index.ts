import { Truck } from "@/lib/models/Truck";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(Truck, {
  filterFields: ["status", "ownerEmail"],
  defaultSort: { submittedAt: -1 },
  allowedRoles: ["admin", "truck_owner"],
});
