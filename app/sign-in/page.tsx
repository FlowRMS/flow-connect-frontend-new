import { getSignInUrl, withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SignInPage() {
  const { user, accessToken } = await withAuth();

  if (user && accessToken) {
    redirect("/");
  }

  const signInUrl = await getSignInUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary)] opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--primary)] opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg p-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Welcome back
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Sign in to access FlowConnect
          </p>
        </div>

        <div className="space-y-6">
          <Link
            href={signInUrl}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Sign in
          </Link>

          <div className="text-center text-sm text-[var(--muted-foreground)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-[var(--primary)] hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
