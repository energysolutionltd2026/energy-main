import { TruckRental } from "@/lib/models/TruckRental";
import { documentHandler } from "@/lib/crud";

export default documentHandler(TruckRental, {
  immutableFields: ["_id", "__v", "rentalId", "truckId", "rentedBy", "createdAt", "dailyRateLocked", "totalAmount"],
  allowedRoles: ["admin", "truck_owner", "bulk_dealer", "customer"],
  // Confirmation and payment state are set by admin / the payment webhook — a
  // renter must not be able to mark their own rental confirmed or paid. The
  // renter can still attach their transactionId after initiating checkout.
  adminOnlyFields: ["status", "paymentStatus"],
});
