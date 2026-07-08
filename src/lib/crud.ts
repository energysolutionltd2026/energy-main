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
     * Roles permitted to POST (create). Defaults to `allowedRoles`. Use this to
     * allow broad read access while restricting writes (e.g. price-history:
     * anyone may read, only admin may create).
     */
    writeRoles?: UserRole[];
    /**
     * Field holding the owning user's email. When set, non-admin callers are
     * scoped to their own records: list queries are forced to
     * `{ [ownerField]: session.email }` and creates have that field forced to
     * the session email (prevents reading/spoofing other users' data).
     */
    ownerField?: string;
    /**
     * Restrict how `ownerField` is applied. "all" (default) scopes both list
     * reads and forces the field on create. "read" scopes list reads only,
     * leaving create free (e.g. notifications, where a user legitimately
     * creates a message addressed to an admin).
     */
    ownerScope?: "all" | "read";
    /**
     * Mongoose projection string applied to every read. Because `.lean()`
     * bypasses schema `toJSON` transforms, sensitive fields (e.g. passwordHash)
     * would otherwise be returned. Pass an exclusion projection such as
     * "-passwordHash -resetToken" for models with secret columns.
     */
    projection?: string;
  } = {}
) {
  const { filterFields = [], defaultSort = { createdAt: -1 }, pageSize = 100, allowedRoles, writeRoles, ownerField, ownerScope = "all", projection } = options;

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

    const isAdmin = user.role === "admin";

    // ── GET: list with optional filters, pagination, sort ──
    if (req.method === "GET") {
      try {
        const filter: Record<string, unknown> = {};

        // Apply allowed filter fields from query string. Coerce to primitive
        // strings so a crafted query (?field[$ne]=x) can't inject a Mongo
        // operator object into the filter.
        for (const field of filterFields) {
          const raw = req.query[field];
          if (raw !== undefined && raw !== "") {
            filter[field] = Array.isArray(raw) ? String(raw[0]) : String(raw);
          }
        }

        // Scope non-admins to their own records.
        if (ownerField && !isAdmin) {
          filter[ownerField] = user.email;
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
      const postRoles = writeRoles ?? allowedRoles;
      if (postRoles && !postRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden — insufficient role" });
      }
      try {
        const body = { ...req.body };
        // Force ownership to the session so a caller can't create records
        // attributed to another user (unless ownership scopes reads only).
        if (ownerField && ownerScope === "all" && !isAdmin) {
          body[ownerField] = user.email;
        }
        const doc = await Model.create(body);
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
    /**
     * Roles permitted to PUT (update). Defaults to `allowedRoles`. DELETE is
     * always admin-only regardless of this setting.
     */
    writeRoles?: UserRole[];
    /**
     * Field holding the owning user's email. When set, non-admin callers may
     * only GET/PUT a record they own (`doc[ownerField] === session.email`);
     * others receive 404 so record existence isn't leaked.
     */
    ownerField?: string;
    /**
     * Fields only an admin may change. Stripped from PUT payloads for non-admin
     * callers (e.g. `status`, `paymentStatus`, prices) to prevent a user from
     * self-approving or marking their own record paid.
     */
    adminOnlyFields?: string[];
    /** Mongoose exclusion projection applied to GET/PUT reads (see collectionHandler). */
    projection?: string;
  } = {}
) {
  const { immutableFields = ["_id", "__v"], allowedRoles, writeRoles, ownerField, adminOnlyFields = [], projection } = options;

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
    const isAdmin = user.role === "admin";

    // Non-admins are scoped to records they own. Building the ownership clause
    // into the query means a non-owned id is indistinguishable from a missing
    // one (404), avoiding existence disclosure.
    const scope = ownerField && !isAdmin ? { [ownerField]: user.email } : {};

    // ── GET: fetch one ──
    if (req.method === "GET") {
      try {
        const doc = await Model.findOne({ _id: id, ...scope }).select(projection || "").lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        return res.status(200).json(doc);
      } catch (err) {
        console.error(`[${Model.modelName}] GET one error:`, err);
        return res.status(500).json({ error: "Failed to fetch record" });
      }
    }

    // ── PUT: update (partial) ──
    if (req.method === "PUT") {
      const putRoles = writeRoles ?? allowedRoles;
      if (putRoles && !putRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden — insufficient role" });
      }
      try {
        const updates = { ...req.body };

        // Strip immutable fields from update payload
        for (const field of immutableFields) {
          delete updates[field];
        }

        // Strip privileged fields for non-admins (status, prices, …).
        if (!isAdmin) {
          for (const field of adminOnlyFields) {
            delete updates[field];
          }
        }

        const doc = await Model.findOneAndUpdate(
          { _id: id, ...scope },
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
      if (!isAdmin) {
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
