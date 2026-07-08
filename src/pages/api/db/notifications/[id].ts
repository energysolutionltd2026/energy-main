import { Notification } from "@/lib/models/Notification";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Notification, {
  // Only `read` status should be updated by the client
  immutableFields: ["_id", "__v", "recipientEmail", "recipientRole", "title", "message", "createdAt"],
  // A user may only read/mark-read their own notifications; admin sees all.
  ownerField: "recipientEmail",
});
