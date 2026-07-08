import { Allocation } from "@/lib/models/Allocation";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Allocation, {
  immutableFields: ["_id", "__v", "allocationId", "dealerEmail", "createdBy", "createdAt"],
  allowedRoles: ["admin"],
});
