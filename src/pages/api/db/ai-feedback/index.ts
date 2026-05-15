import { AIFeedback } from "@/lib/models/AIFeedback";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(AIFeedback, {
  filterFields: ["route", "adminOverrode", "adminEmail"],
  defaultSort: { createdAt: -1 },
  allowedRoles: ["admin"],
});
