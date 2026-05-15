import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(PurchaseOrder, {
  filterFields: ["status", "depot", "dealer", "orderId"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin", "bulk_dealer"],
});
