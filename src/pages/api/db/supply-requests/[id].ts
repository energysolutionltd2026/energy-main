import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { documentHandler } from "@/lib/crud";

export default documentHandler(SupplyRequest, {
  immutableFields: ["_id", "__v", "requestId", "requestedBy", "createdAt"],
  allowedRoles: ["admin", "bulk_dealer", "customer"],
});
