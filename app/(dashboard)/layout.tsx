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
  const { user, accessToken } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user belongs to "admin" org - sign out of CRM and redirect to admin portal
  // This ensures CRM session is cleared so future logins get fresh redirect_uri
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.org_name === "admin") {
      redirect("/api/auth/admin-redirect");
    }
  }

  return (
    <UserProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
