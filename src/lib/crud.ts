/**
 * CRUD factory — shared logic for all /api/db/* routes.
 *
 * Provides two handler factories:
 *   collectionHandler(Model)  →  GET list + POST create
 *   documentHandler(Model)    →  GET one + PUT update + DELETE
 *
 * Each route file calls one of these and exports the result directly.
 * All handlers call connectDB() before touching the model.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import type { Model, Document } from "mongoose";
import { connectDB } from "./db";
import { getSessionUser } from "./auth";
import type { UserRole } from "./db-types";

type AnyDoc = Document & Record<string, unknown>;

// ─── Collection handler: GET list + POST create ───────────────────────────────

export function collectionHandler<T extends AnyDoc>(
  Model: Model<T>,
  options: {
    filterFields?: string[];
    defaultSort?: Record<string, 1 | -1>;
    pageSize?: number;
    allowedRoles?: UserRole[];
    /**
     * Mongoose projection string applied to every read. Because `.lean()`
     * bypasses schema `toJSON` transforms, sensitive fields (e.g. passwordHash)
     * would otherwise be returned. Pass an exclusion projection such as
     * "-passwordHash -resetToken" for models with secret columns.
     */
    projection?: string;
  } = {}
) {
  const { filterFields = [], defaultSort = { createdAt: -1 }, pageSize = 100, allowedRoles, projection } = options;

  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    await connectDB();

    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized — please log in" });
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden — insufficient role" });
    }

    // ── GET: list with optional filters, pagination, sort ──
    if (req.method === "GET") {
      try {
        const filter: Record<string, unknown> = {};

        // Apply allowed filter fields from query string
        for (const field of filterFields) {
          if (req.query[field]) {
            filter[field] = req.query[field];
          }
        }

        const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
        const limit = Math.min(pageSize, parseInt(req.query.limit as string) || pageSize);
        const skip  = (page - 1) * limit;

        const [docs, total] = await Promise.all([
          Model.find(filter).select(projection || "").sort(defaultSort).skip(skip).limit(limit).lean(),
          Model.countDocuments(filter),
        ]);

        return res.status(200).json({
          data: docs,
          total,
          page,
          pages: Math.ceil(total / limit),
        });
      } catch (err) {
        console.error(`[${Model.modelName}] GET list error:`, err);
        return res.status(500).json({ error: "Failed to fetch records" });
      }
    }

    // ── POST: create ──
    if (req.method === "POST") {
      try {
        const doc = await Model.create(req.body);
        return res.status(201).json(doc);
      } catch (err: unknown) {
        console.error(`[${Model.modelName}] POST error:`, err);
        if ((err as { code?: number }).code === 11000) {
          return res.status(409).json({ error: "Duplicate record — a unique field already exists" });
        }
        return res.status(400).json({ error: (err as Error).message ?? "Validation error" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  };
}

// ─── Document handler: GET one + PUT update + DELETE ─────────────────────────

export function documentHandler<T extends AnyDoc>(
  Model: Model<T>,
  options: {
    immutableFields?: string[];
    allowedRoles?: UserRole[];
    /** Mongoose exclusion projection applied to GET/PUT reads (see collectionHandler). */
    projection?: string;
  } = {}
) {
  const { immutableFields = ["_id", "__v"], allowedRoles, projection } = options;

  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    await connectDB();

    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized — please log in" });
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden — insufficient role" });
    }

    const { id } = req.query as { id: string };

    // ── GET: fetch one ──
    if (req.method === "GET") {
      try {
        const doc = await Model.findById(id).select(projection || "").lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        return res.status(200).json(doc);
      } catch (err) {
        console.error(`[${Model.modelName}] GET one error:`, err);
        return res.status(500).json({ error: "Failed to fetch record" });
      }
    }

    // ── PUT: update (partial) ──
    if (req.method === "PUT") {
      try {
        const updates = { ...req.body };

        // Strip immutable fields from update payload
        for (const field of immutableFields) {
          delete updates[field];
        }

        const doc = await Model.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true, projection: projection || undefined }
        ).lean();

        if (!doc) return res.status(404).json({ error: "Not found" });
        return res.status(200).json(doc);
      } catch (err) {
        console.error(`[${Model.modelName}] PUT error:`, err);
        return res.status(400).json({ error: (err as Error).message ?? "Update failed" });
      }
    }

    // ── DELETE (admin only) ──
    if (req.method === "DELETE") {
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden — only admins can delete records" });
      }
      try {
        const doc = await Model.findByIdAndDelete(id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        return res.status(200).json({ deleted: true });
      } catch (err) {
        console.error(`[${Model.modelName}] DELETE error:`, err);
        return res.status(500).json({ error: "Delete failed" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  };
}
