import { PriceHistory } from "@/lib/models/PriceHistory";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(PriceHistory, {
  filterFields: [],
  defaultSort: { recordedAt: 1 },
  pageSize: 24,
});
