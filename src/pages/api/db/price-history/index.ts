import { PriceHistory } from "@/lib/models/PriceHistory";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(PriceHistory, {
  filterFields: [],
  defaultSort: { recordedAt: 1 },
  pageSize: 24,
  // Anyone signed in may read price history (dashboards/graphs); only admins
  // may create rows so history can't be fabricated.
  writeRoles: ["admin"],
});
