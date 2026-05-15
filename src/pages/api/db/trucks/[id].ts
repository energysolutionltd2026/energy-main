import { Truck } from "@/lib/models/Truck";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Truck, {
  immutableFields: ["_id", "__v", "submittedAt", "ownerEmail"],
  allowedRoles: ["admin", "truck_owner"],
});
