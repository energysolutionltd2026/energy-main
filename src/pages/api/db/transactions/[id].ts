import { Transaction } from "@/lib/models/Transaction";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Transaction, {
  immutableFields: ["_id", "__v", "txnId", "timestamp", "type", "user", "totalAmount", "reference"],
  allowedRoles: ["admin"],
});
