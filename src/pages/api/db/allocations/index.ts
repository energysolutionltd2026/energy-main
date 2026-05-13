import { Allocation } from "@/lib/models/Allocation";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(Allocation, {
  filterFields: ["dealerEmail", "product", "depot", "status"],
  defaultSort: { createdAt: -1 },
});
