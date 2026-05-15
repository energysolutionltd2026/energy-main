import { TruckRental } from "@/lib/models/TruckRental";
import { documentHandler } from "@/lib/crud";

export default documentHandler(TruckRental, {
  immutableFields: ["_id", "__v", "rentalId", "truckId", "rentedBy", "createdAt", "dailyRateLocked", "totalAmount"],
  allowedRoles: ["admin", "truck_owner", "bulk_dealer", "customer"],
});
