import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { user } = await withAuth();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Welcome to FlowConnect
        </h1>
        {user && (
          <p className="mt-4 text-[var(--muted-foreground)]">Logged in as {user.email}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/nemra-pos/distributor" className="w-full">
              Distributor
            </Link>
          </Button>

          <Button asChild>
            <Link href="/nemra-pos/manufacturer" className="w-full">
              Manufacturer
            </Link>
          </Button>

          <Button asChild>
            <Link href="/nemra-pos/rep" className="w-full">
              Reps
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
