import { LoadingRecord } from "@/lib/models/LoadingRecord";
import { documentHandler } from "@/lib/crud";

export default documentHandler(LoadingRecord, {
  immutableFields: ["_id", "__v", "loadId", "orderId", "orderRef", "createdAt"],
  allowedRoles: ["admin"],
});
