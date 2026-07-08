/**
 * Access control for the restricted read-only financer overview dashboard.
 *
 * Access is limited to an explicit allowlist of emails (the super admin plus
 * one other user), configured via OVERVIEW_ALLOWED_EMAILS (comma-separated).
 * An empty/unset allowlist denies everyone — fail closed.
 *
 * This module is intentionally dependency-free (only reads process.env) so it
 * can be imported from API routes, getServerSideProps, and middleware alike.
 */
export function overviewAllowedEmails(): string[] {
  return (process.env.OVERVIEW_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOverviewAllowed(email?: string | null): boolean {
  if (!email) return false;
  return overviewAllowedEmails().includes(email.toLowerCase());
}
