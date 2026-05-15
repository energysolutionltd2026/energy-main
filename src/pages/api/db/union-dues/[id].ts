import { UnionDues } from "@/lib/models/UnionDues";
import { documentHandler } from "@/lib/crud";

export default documentHandler(UnionDues, {
  immutableFields: ["_id", "__v", "paymentId", "userEmail", "duesPeriod", "amountDue", "createdAt"],
  allowedRoles: ["admin"],
});
