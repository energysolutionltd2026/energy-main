import { FuelStation } from "@/lib/models/FuelStation";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(FuelStation, {
  filterFields: ["ownerEmail", "state", "status"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin", "bulk_dealer", "truck_owner"],
  // Non-admins are scoped to stations they own (list) and can only create
  // stations under their own email.
  ownerField: "ownerEmail",
});
