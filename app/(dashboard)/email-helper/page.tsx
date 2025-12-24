import { Suspense } from 'react';
import EmailHelperContent from '@/components/EmailHelperContent';

function EmailHelperLoading() {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        <span className="ml-3 text-[var(--muted-foreground)]">Loading...</span>
      </div>
    </main>
  );
}

export default function EmailHelperPage() {
  return (
    <Suspense fallback={<EmailHelperLoading />}>
      <EmailHelperContent />
    </Suspense>
  );
}
