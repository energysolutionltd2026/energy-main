import { CustomLevy } from "@/lib/models/CustomLevy";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(CustomLevy, {
  filterFields: ["isActive", "frequency"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin"],
});
