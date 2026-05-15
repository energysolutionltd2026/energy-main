import { Depot } from "@/lib/models/Depot";
import { documentHandler } from "@/lib/crud";

export default documentHandler(Depot, {
  immutableFields: ["_id", "__v", "name", "coordinates"],
  allowedRoles: ["admin", "station_manager"],
});
