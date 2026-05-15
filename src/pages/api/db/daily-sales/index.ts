import { DailySales } from "@/lib/models/DailySales";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(DailySales, {
  filterFields: ["stationId", "recordedBy", "isVerified"],
  defaultSort: { saleDate: -1 },
  pageSize: 60,
  allowedRoles: ["admin", "station_manager"],
});
