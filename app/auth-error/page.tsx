import { handleSignOut } from "@/lib/actions";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg p-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Access Denied
          </h1>
          <p className="text-[var(--muted-foreground)]">
            You are not authorized to access FlowConnect.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Please contact the administrator to get your account set up.
            </p>
          </div>

          <form action={handleSignOut}>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-[var(--destructive)] rounded-lg hover:opacity-90 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
