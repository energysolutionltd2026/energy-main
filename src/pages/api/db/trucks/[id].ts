import { Truck } from "@/lib/models/Truck";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Truck, {
  immutableFields: ["_id", "__v", "submittedAt", "ownerEmail"],
  allowedRoles: ["admin", "truck_owner"],
  // Owners may view only their own trucks; admin sees all.
  ownerField: "ownerEmail",
  // Truck approval/status is an admin decision — an owner must not self-approve.
  writeRoles: ["admin"],
});
