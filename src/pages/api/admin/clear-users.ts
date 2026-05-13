import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getSessionUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  await connectDB();
  const result = await User.deleteMany({ role: { $ne: "admin" } });

  return res.status(200).json({ deleted: result.deletedCount, message: `Deleted ${result.deletedCount} non-admin users.` });
}
