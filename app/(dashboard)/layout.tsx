import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { UserProvider } from "@/components/providers/user-provider";

/**
 * Decode JWT token payload to extract org_name
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use ensureSignedIn: true to automatically handle token refresh/re-authentication
  // This prevents showing "Access Denied" when the token is just expired but can be refreshed
  // If the session is invalid, WorkOS will redirect to sign-in automatically
  const { user, accessToken } = await withAuth({ ensureSignedIn: true });

  // At this point, user and accessToken are guaranteed to exist due to ensureSignedIn: true
  // TypeScript still sees them as potentially null, so we add a safety check
  if (!user || !accessToken) {
    // This should never happen with ensureSignedIn: true, but handle gracefully
    redirect("/sign-in");
  }

  // Check if user belongs to "admin" org - sign out of CRM and redirect to admin portal
  // This ensures CRM session is cleared so future logins get fresh redirect_uri
  const payload = decodeJwtPayload(accessToken);
  if (payload?.org_name === "admin") {
    redirect("/api/auth/admin-redirect");
  }

  return (
    <UserProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
