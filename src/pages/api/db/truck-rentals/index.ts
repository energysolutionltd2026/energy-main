import { TruckRental } from "@/lib/models/TruckRental";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(TruckRental, {
  filterFields: ["rentedBy", "truckOwnerEmail", "status", "paymentStatus", "pickupDepot"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin", "truck_owner", "bulk_dealer", "customer"],
});
