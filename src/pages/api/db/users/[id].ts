/**
 * /api/db/users/[id] — read / update / delete a single user.
 *
 * This route is NOT the generic CRUD factory because user records carry
 * privileged fields (status, role, financerAccess, tank volumes, security
 * columns). Authorization is enforced per-method:
 *
 *   GET    — admin, or the user reading their own record.
 *   PUT    — admin may edit any non-immutable field; a non-admin may edit only
 *            their OWN record and only the self-service profile whitelist.
 *            Privileged fields (financerAccess, status, tank volumes, security
 *            columns) can therefore only be changed by an admin. This prevents
 *            a logged-in user from granting themselves financer access or
 *            un-suspending their own account.
 *   DELETE — admin only.
 *
 * Reads use SAFE_USER_PROJECTION because `.lean()` bypasses the schema toJSON
 * strip, so secret columns must be excluded explicitly.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";

// Never return secret columns (`.lean()` bypasses the schema toJSON strip).
const SAFE_USER_PROJECTION =
  "-passwordHash -emailVerifyCode -emailVerifyExp -emailVerifyAttempts -resetToken -resetTokenExp";

// Hard cap on how many users may hold the DB-granted financer dashboard flag.
// (The OVERVIEW_ALLOWED_EMAILS env allowlist is a separate super-admin
// bootstrap and is not counted here.)
const MAX_FINANCER_USERS = 2;

// Fields that may never be changed through this route, by anyone.
const IMMUTABLE_FIELDS = new Set([
  "_id",
  "__v",
  "email",
  "joinedAt",
  "role",
  "passwordHash",
]);

// Fields a non-admin may edit on their OWN record. Anything not listed here
// (financerAccess, status, pms/ago/atkTankMaxML, verification/security columns)
// is admin-only.
const SELF_EDITABLE_FIELDS = new Set([
  "name",
  "phone",
  "companyName",
  "rcNumber",
  "dprRegNo",
  "dprLicence",
  "tinNumber",
  "cacRegNo",
  "memberId",
  "state",
  "lga",
  "headOfficeAddress",
  "stationAddress",
  "officialIdType",
  "idNumber",
  "idIssueDate",
  "idExpiryDate",
  "idIssuingAuthority",
  "bankName",
  "bankAccountName",
  "bankAccountNumber",
  "bankBranch",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized — please log in" });
  }

  const { id } = req.query as { id: string };
  const isAdmin = session.role === "admin";
  const isSelf = session.userId === id;

  // ── GET: fetch one ──
  if (req.method === "GET") {
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const doc = await User.findById(id).select(SAFE_USER_PROJECTION).lean();
      if (!doc) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(doc);
    } catch (err) {
      console.error("[User] GET one error:", err);
      return res.status(500).json({ error: "Failed to fetch record" });
    }
  }

  // ── PUT: update (partial) ──
  if (req.method === "PUT") {
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const updates: Record<string, unknown> = { ...req.body };

      // Strip fields nobody may change.
      for (const field of IMMUTABLE_FIELDS) delete updates[field];

      // Non-admins may only touch their own profile whitelist. Privileged
      // fields (financerAccess, status, tank volumes, …) are silently dropped.
      if (!isAdmin) {
        for (const key of Object.keys(updates)) {
          if (!SELF_EDITABLE_FIELDS.has(key)) delete updates[key];
        }
      }

      // Toggling financer dashboard access CONVERTS the account to/from a
      // financer-only identity. Turning it on sets role → "financer" (saving the
      // prior role in previousRole); turning it off restores the prior role.
      // Because login and every route gate key off `role`, this makes every
      // future login land on the read-only overview. We also revoke the user's
      // active sessions so the change takes effect immediately (they can't keep
      // using an old customer/dealer session).
      const togglingFinancer = typeof updates.financerAccess === "boolean";
      if (togglingFinancer) {
        const target = (await User.findById(id)
          .select("role previousRole")
          .lean()) as { role?: string; previousRole?: string } | null;
        if (!target) return res.status(404).json({ error: "Not found" });

        if (updates.financerAccess === true) {
          // Enforce the cap. Count other users who already hold the flag.
          const current = await User.countDocuments({
            financerAccess: true,
            _id: { $ne: id },
          });
          if (current >= MAX_FINANCER_USERS) {
            return res.status(409).json({
              error: `Financer dashboard access is limited to ${MAX_FINANCER_USERS} users. Revoke an existing user first.`,
            });
          }
          if (target.role !== "financer") {
            updates.previousRole = target.role; // remember for restore
            updates.role = "financer";
          }
        } else {
          // Revoking — restore the pre-conversion role.
          if (target.role === "financer") {
            updates.role = target.previousRole || "customer";
          }
          updates.previousRole = null;
        }
      }

      const doc = await User.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true, projection: SAFE_USER_PROJECTION }
      ).lean();

      if (!doc) return res.status(404).json({ error: "Not found" });

      // Kill existing sessions so a role conversion is enforced on next login.
      if (togglingFinancer) {
        await Session.updateMany({ userId: id, isValid: true }, { isValid: false });
      }

      return res.status(200).json(doc);
    } catch (err) {
      console.error("[User] PUT error:", err);
      return res.status(400).json({ error: (err as Error).message ?? "Update failed" });
    }
  }

  // ── DELETE (admin only) ──
  if (req.method === "DELETE") {
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden — only admins can delete records" });
    }
    try {
      const doc = await User.findByIdAndDelete(id);
      if (!doc) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ deleted: true });
    } catch (err) {
      console.error("[User] DELETE error:", err);
      return res.status(500).json({ error: "Delete failed" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
