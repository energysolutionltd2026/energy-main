import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { documentHandler } from "@/lib/crud";

export default documentHandler(PurchaseOrder, {
  immutableFields: ["_id", "__v", "orderId", "createdAt"],
  allowedRoles: ["admin", "bulk_dealer", "customer"],
  // A dealer/customer may only see & edit their own orders; admin sees all.
  ownerField: "ownerEmail",
  // Order status and the amount are set by the platform/admin — a buyer must
  // not be able to mark their own order processing/paid or alter the price.
  adminOnlyFields: ["status", "totalAmount"],
});
