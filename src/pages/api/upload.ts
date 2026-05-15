/**
 * POST /api/upload
 * Accepts a base64 data URI, uploads to Cloudinary, returns the secure URL.
 * Body: { data: string (data URI), folder?: string }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({ error: "Cloudinary not configured" });
  }

  const { data, folder = "trucks" } = req.body as { data?: string; folder?: string };
  if (!data || !data.startsWith("data:")) {
    return res.status(400).json({ error: "data must be a base64 data URI" });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(`${paramsToSign}${API_SECRET}`)
    .digest("hex");

  const body = new URLSearchParams({
    file:      data,
    folder,
    timestamp: String(timestamp),
    api_key:   API_KEY,
    signature,
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: body.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const result = await response.json() as { secure_url?: string; error?: { message: string } };

    if (!response.ok || result.error) {
      console.error("[upload] Cloudinary error:", result.error);
      return res.status(500).json({ error: result.error?.message ?? "Upload failed" });
    }

    return res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error("[upload] threw:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
}
