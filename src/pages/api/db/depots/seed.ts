/**
 * POST /api/db/depots/seed
 *
 * One-time route to insert all 10 PNB depots into MongoDB.
 * Safe to call again — uses upsert on depot name so it won't duplicate.
 *
 * Call once after connecting MongoDB:
 *   curl -X POST https://your-app/api/db/depots/seed
 *   or hit it from the browser while logged in as admin.
 *
 * Protected: requires SEED_SECRET header to prevent accidental public calls.
 * Set SEED_SECRET in .env.local (dev) and Sliplane dashboard (prod).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { Depot } from "@/lib/models/Depot";

const SEED_DEPOTS = [
  {
    name: "Atlas Cove",
    location: "Apapa, Lagos",
    state: "Lagos",
    coordinates: { lat: 6.4281, lng: 3.3958 },
    PMS: { level: 75, price: 1300, status: "available" },
    AGO: { level: 60, price: 1900, status: "available" },
    ATK: { level: 45, price: 1300, status: "available" },
  },
  {
    name: "Mosimi",
    location: "Sagamu, Ogun State",
    state: "Ogun",
    coordinates: { lat: 6.7319, lng: 3.6500 },
    PMS: { level: 82, price: 1300, status: "available" },
    AGO: { level: 55, price: 1900, status: "available" },
    ATK: { level: 0,  price: 1300, status: "unavailable" },
  },
  {
    name: "Warri",
    location: "Warri, Delta State",
    state: "Delta",
    coordinates: { lat: 5.5167, lng: 5.7500 },
    PMS: { level: 90, price: 1300, status: "available" },
    AGO: { level: 80, price: 1900, status: "available" },
    ATK: { level: 30, price: 1300, status: "available" },
  },
  {
    name: "Port Harcourt",
    location: "Port Harcourt, Rivers State",
    state: "Rivers",
    coordinates: { lat: 4.8156, lng: 7.0498 },
    PMS: { level: 65, price: 1300, status: "available" },
    AGO: { level: 70, price: 1900, status: "available" },
    ATK: { level: 50, price: 1300, status: "available" },
  },
  {
    name: "Kaduna",
    location: "Kaduna, Kaduna State",
    state: "Kaduna",
    coordinates: { lat: 10.5167, lng: 7.4333 },
    PMS: { level: 40, price: 1300, status: "available" },
    AGO: { level: 25, price: 1900, status: "limited" },
    ATK: { level: 0,  price: 1300, status: "unavailable" },
  },
  {
    name: "Ilorin",
    location: "Ilorin, Kwara State",
    state: "Kwara",
    coordinates: { lat: 8.4966, lng: 4.5421 },
    PMS: { level: 55, price: 1300, status: "available" },
    AGO: { level: 48, price: 1900, status: "available" },
    ATK: { level: 0,  price: 1300, status: "unavailable" },
  },
  {
    name: "Ore",
    location: "Ore, Ondo State",
    state: "Ondo",
    coordinates: { lat: 6.7667, lng: 4.8667 },
    PMS: { level: 18, price: 1300, status: "limited" },
    AGO: { level: 35, price: 1900, status: "available" },
    ATK: { level: 0,  price: 1300, status: "unavailable" },
  },
  {
    name: "Enugu",
    location: "Enugu, Enugu State",
    state: "Enugu",
    coordinates: { lat: 6.4584, lng: 7.5464 },
    PMS: { level: 70, price: 1300, status: "available" },
    AGO: { level: 60, price: 1900, status: "available" },
    ATK: { level: 15, price: 1300, status: "limited" },
  },
  {
    name: "Calabar",
    location: "Calabar, Cross River State",
    state: "Cross River",
    coordinates: { lat: 4.9517, lng: 8.3220 },
    PMS: { level: 50, price: 1300, status: "available" },
    AGO: { level: 45, price: 1900, status: "available" },
    ATK: { level: 20, price: 1300, status: "limited" },
  },
  {
    name: "Kano",
    location: "Kano, Kano State",
    state: "Kano",
    coordinates: { lat: 12.0000, lng: 8.5167 },
    PMS: { level: 60, price: 1300, status: "available" },
    AGO: { level: 55, price: 1900, status: "available" },
    ATK: { level: 0,  price: 1300, status: "unavailable" },
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["x-seed-secret"];
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: "Invalid or missing seed secret" });
  }

  try {
    await connectDB();

    const results = await Promise.all(
      SEED_DEPOTS.map((depot) =>
        Depot.findOneAndUpdate(
          { name: depot.name },
          { $setOnInsert: depot }, // only insert if doesn't exist — never overwrite live stock
          { upsert: true, new: true, runValidators: true }
        )
      )
    );

    const inserted = results.filter(Boolean).length;

    return res.status(200).json({
      message: `Depot seed complete. ${inserted} depots processed.`,
      depots: results.map((d) => d?.name),
    });
  } catch (err) {
    console.error("[depot-seed] Error:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
