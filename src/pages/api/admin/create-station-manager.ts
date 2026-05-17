import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { StationManager } from "@/lib/models/StationManager";
import { getSessionUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { name, email, password, depot } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password || !depot?.trim()) {
    return res.status(400).json({ error: "name, email, password and depot are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const sm = await StationManager.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      depot: depot.trim(),
      assignedBy: user.email,
      status: "active",
    });
    return res.status(201).json(sm);
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ error: "Email already in use" });
    return res.status(400).json({ error: err?.message ?? "Failed to create station manager" });
  }
}
