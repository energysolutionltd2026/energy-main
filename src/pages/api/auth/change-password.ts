import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getSessionUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  await connectDB();

  const user = await User.findById(session.userId).select("+passwordHash").lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, (user as any).passwordHash ?? "");
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

  const hash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(session.userId, { passwordHash: hash });

  return res.status(200).json({ ok: true });
}
