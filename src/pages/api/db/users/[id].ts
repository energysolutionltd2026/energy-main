import { User } from "@/lib/models/User";
import { documentHandler } from "@/lib/crud";

export default documentHandler(User, {
  immutableFields: ["_id", "__v", "email", "joinedAt", "role", "passwordHash"],
});
