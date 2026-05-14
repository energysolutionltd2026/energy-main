import type { NextApiRequest, NextApiResponse } from "next";
import { sendOrderConfirmation } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";

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

  res.status(200).json({ ok: true });
}
