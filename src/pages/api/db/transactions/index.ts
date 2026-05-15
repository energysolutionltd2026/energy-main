import { Transaction } from "@/lib/models/Transaction";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(Transaction, {
  filterFields: ["status", "type", "userRole", "depot", "aiFlagged", "paymentMethod"],
  defaultSort: { timestamp: -1 },
  pageSize: 200,
  allowedRoles: ["admin"],
});
