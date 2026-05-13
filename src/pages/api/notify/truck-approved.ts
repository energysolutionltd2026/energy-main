import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { sendTruckApprovalCredentials } from "@/lib/email";
import { sendSms } from "@/lib/sms";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { ownerName, ownerEmail, ownerPhone, truckRegNumber, reviewNote } = req.body;

  if (!ownerEmail || !truckRegNumber) {
    return res.status(400).json({ error: "ownerEmail and truckRegNumber are required" });
  }

  await connectDB();

  // Check if user account already exists
  const existing = await User.findOne({ email: ownerEmail.toLowerCase().trim() }).lean();

  let password: string | null = null;
  let isNewAccount = false;

  if (!existing) {
    // Create new truck_owner account with generated credentials
    password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name:          ownerName || ownerEmail.split("@")[0],
      email:         ownerEmail.toLowerCase().trim(),
      phone:         ownerPhone || undefined,
      role:          "truck_owner",
      status:        "active",
      emailVerified: true,
      passwordHash,
    });
    isNewAccount = true;
  }

  // Send email
  await sendTruckApprovalCredentials(ownerEmail, {
    name:           ownerName || "Truck Owner",
    email:          ownerEmail,
    password:       password ?? "(use your existing password)",
    truckRegNumber,
    reviewNote,
  });

  // Send SMS if phone provided
  if (ownerPhone) {
    const smsMessage = isNewAccount
      ? `e-Nergy: Your truck ${truckRegNumber} is approved! Login: ${ownerEmail} | Password: ${password} | Visit e-nergy.com.ng`
      : `e-Nergy: Your truck ${truckRegNumber} has been approved and is now live on the platform. Log in at e-nergy.com.ng`;
    await sendSms(ownerPhone, smsMessage);
  }

  res.status(200).json({ ok: true, isNewAccount });
}
