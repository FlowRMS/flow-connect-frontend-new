import { getSignUpUrl, withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function SignUpPage() {
  const { user } = await withAuth();

  if (user) {
    redirect("/");
  }

  const signUpUrl = await getSignUpUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary)] opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--primary)] opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg p-8">
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <Image
              src="/flow-logo.png"
              alt="FlowCRM Logo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Create an account
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Sign up to get started with FlowCRM
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Link
            href={signUpUrl}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Sign up
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <div className="text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-[var(--primary)] hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
