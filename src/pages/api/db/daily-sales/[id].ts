import { DailySales } from "@/lib/models/DailySales";
import { documentHandler } from "@/lib/crud";

export default documentHandler(DailySales, {
  immutableFields: ["_id", "__v", "stationId", "recordedBy", "saleDate", "createdAt"],
  allowedRoles: ["admin", "station_manager"],
  // A station manager may only read/edit sales they recorded; admin sees all.
  ownerField: "recordedBy",
  // Verification sign-off is an admin action, not self-serviceable.
  adminOnlyFields: ["isVerified"],
});
