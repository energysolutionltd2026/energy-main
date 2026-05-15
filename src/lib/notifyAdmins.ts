import { User } from "./models/User";
import { Notification } from "./models/Notification";

export async function notifyAdmins(title: string, message: string, reference?: string): Promise<void> {
  try {
    const admins = await User.find({ role: "admin" }).select("email").lean();
    if (!admins.length) return;
    await Notification.insertMany(
      admins.map((a) => ({
        recipientEmail: a.email,
        recipientRole:  "admin",
        title,
        message,
        read:           false,
        ...(reference ? { reference } : {}),
      }))
    );
  } catch (err) {
    console.error("[notifyAdmins] failed:", err);
  }
}
