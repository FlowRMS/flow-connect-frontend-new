import Link from "next/link";
import Image from "next/image";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
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
              Authentication Error
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Something went wrong with your session. This can happen if your session expired or there&apos;s a configuration issue.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">Try these steps:</h3>
            <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
              <li>Clear your browser cookies for this site</li>
              <li>Close and reopen your browser</li>
              <li>Try signing in again</li>
            </ol>
          </div>

          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Go to Sign In
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

          <p className="text-center text-xs text-[var(--muted-foreground)]">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
