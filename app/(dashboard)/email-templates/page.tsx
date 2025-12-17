import { Suspense } from 'react';
import EmailTemplatesContent from '@/components/email-templates/EmailTemplatesContent';

function EmailTemplatesLoading() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--muted-foreground)]">Loading templates...</p>
      </div>
    </main>
  );
}

export default function EmailTemplatesPage() {
  return (
    <Suspense fallback={<EmailTemplatesLoading />}>
      <EmailTemplatesContent />
    </Suspense>
  );
}
