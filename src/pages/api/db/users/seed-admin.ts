/**
 * POST /api/db/users/seed-admin
 *
 * Creates the initial admin account if none exists.
 * Protected by SEED_SECRET header.
 *
 * Body (required): { name, email, password }
 *
 * curl -X POST https://your-app/api/db/users/seed-admin \
 *   -H "x-seed-secret: YOUR_SEED_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Admin","email":"admin@yourdomain.ng","password":"your-strong-password"}'
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
  if (req.method !== "POST" && req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const secret = req.headers["x-seed-secret"];
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: "Invalid or missing seed secret" });
  }

  await connectDB();

  // PUT — promote a user to admin or update existing admin credentials
  if (req.method === "PUT") {
    const { name, email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedEmail = email.toLowerCase().trim();
    // If the target email already exists, promote that user to admin
    const updated = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { role: "admin", passwordHash, ...(name ? { name } : {}), emailVerified: true, status: "active" } },
      { new: true }
    );
    if (updated) return res.status(200).json({ message: "User promoted to admin", email: updated.email });
    // Otherwise update whichever user currently has role:admin
    const updatedAdmin = await User.findOneAndUpdate(
      { role: "admin" },
      { $set: { email: normalizedEmail, passwordHash, ...(name ? { name } : {}), emailVerified: true, status: "active" } },
      { new: true }
    );
    if (!updatedAdmin) return res.status(404).json({ error: "No admin found to update" });
    return res.status(200).json({ message: "Admin updated", email: updatedAdmin.email });
  }

  const existing = await User.findOne({ role: "admin" }).lean();
  if (existing) {
    return res.status(200).json({ message: "Admin already exists", email: existing.email });
  }

  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await User.create({
    name,
    email: email.toLowerCase().trim(),
    role: "admin",
    passwordHash,
    emailVerified: true,
    status: "active",
  });

  return res.status(201).json({
    message: "Admin created",
    email: admin.email,
  });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}
