import { LoadingRecord } from "@/lib/models/LoadingRecord";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(LoadingRecord, {
  filterFields: ["orderId", "depot", "status", "truckRegNumber", "loaderId"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin"],
});
