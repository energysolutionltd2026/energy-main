import { CustomLevy } from "@/lib/models/CustomLevy";
import { documentHandler } from "@/lib/crud";

export default documentHandler(CustomLevy, {
  immutableFields: ["_id", "__v", "createdAt", "createdBy"],
  allowedRoles: ["admin"],
});
