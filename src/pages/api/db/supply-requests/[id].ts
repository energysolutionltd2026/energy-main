import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { documentHandler } from "@/lib/crud";

export default documentHandler(SupplyRequest, {
  immutableFields: ["_id", "__v", "requestId", "requestedBy", "createdAt"],
  // Read stays broad: bulk dealers browse open requests to fulfil them.
  allowedRoles: ["admin", "bulk_dealer", "customer"],
  // Only admins and fulfilling bulk dealers may mutate a request (status).
  // Customers must not be able to edit other customers' requests.
  writeRoles: ["admin", "bulk_dealer"],
});
