import { Notification } from "@/lib/models/Notification";
import { collectionHandler } from "@/lib/crud";

export default collectionHandler(Notification, {
  filterFields: ["recipientEmail", "recipientRole", "read", "action"],
  defaultSort: { createdAt: -1 },
  pageSize: 50,
  // Non-admins may only list their OWN notifications (every notification has a
  // required recipientEmail); admins can query anyone's. Reads only, so the
  // contact form can still create a notification addressed to admins.
  ownerField: "recipientEmail",
  ownerScope: "read",
});
