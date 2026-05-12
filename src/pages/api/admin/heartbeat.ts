import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { StationManager } from "@/lib/models/StationManager";
import { getSessionUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  await connectDB();

  const now = new Date();

  const user = await User.findByIdAndUpdate(
    session.userId,
    { lastSeen: now },
    { new: true }
  ).select("_id name email role lastSeen").lean();

  if (!user) {
    await StationManager.findByIdAndUpdate(session.userId, { lastSeen: now });
  }

  return res.status(200).json({ ok: true });
}

// GET /api/admin/online-users — returns users seen in the last 2 minutes
export async function getOnlineUsersHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  await connectDB();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);

  const [users, managers] = await Promise.all([
    User.find({ lastSeen: { $gte: cutoff } }).select("_id name email role lastSeen depot").lean(),
    StationManager.find({ lastSeen: { $gte: cutoff } }).select("_id name email role lastSeen depot").lean(),
  ]);

  return res.status(200).json({ data: [...users, ...managers] });
}
