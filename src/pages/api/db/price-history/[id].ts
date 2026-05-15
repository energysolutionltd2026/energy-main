import { PriceHistory } from "@/lib/models/PriceHistory";
import { documentHandler } from "@/lib/crud";

export default documentHandler(PriceHistory, {
  immutableFields: ["_id", "__v", "month", "monthShort", "recordedAt", "createdAt"],
  allowedRoles: ["admin"],
});
