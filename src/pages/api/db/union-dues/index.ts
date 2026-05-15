import { UnionDues } from "@/lib/models/UnionDues";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(UnionDues, {
  filterFields: ["userEmail", "userRole", "status", "duesPeriod"],
  defaultSort: { periodStart: -1 },
  allowedRoles: ["admin"],
});
