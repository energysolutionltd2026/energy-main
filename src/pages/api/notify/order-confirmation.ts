import type { NextApiRequest, NextApiResponse } from "next";
import { sendOrderConfirmation } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSessionUser(req);
  if (!session) return res.status(403).json({ error: "Forbidden" });

  const { email, name, orderId, companyName, product, quantity, depot, paymentMethod } = req.body;

  if (!email || !orderId) return res.status(400).json({ error: "email and orderId are required" });

  await sendOrderConfirmation(email, {
    name: name || "Customer",
    orderId,
    companyName: companyName || "",
    product: product || "",
    quantity: String(quantity || ""),
    depot: depot || "",
    paymentMethod: paymentMethod || "",
  });

  // Look up phone and send SMS
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (user?.phone) {
    const smsText = `e-Nergy: Order confirmed! Order ID: ${orderId}. Product: ${product || "N/A"}, Qty: ${quantity || "N/A"}L from ${depot || "N/A"} depot. Check your email for full details.`;
    sendSms(user.phone, smsText).catch(() => null);
  }

  res.status(200).json({ ok: true });
}
