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
              Access Denied
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              You are not authorized to access FlowRMS.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Please contact the FlowRMS team to get your account set up.
            </p>
          </div>

          <p className="text-center text-xs text-[var(--muted-foreground)]">
            If you believe this is an error, please reach out to your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
