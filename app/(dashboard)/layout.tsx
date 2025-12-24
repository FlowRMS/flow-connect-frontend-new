import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { UserProvider } from "@/components/providers/user-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <UserProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
