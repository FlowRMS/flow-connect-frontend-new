import { Suspense } from 'react';
import InvoicesContent from '@/components/invoices/InvoicesContent';

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <InvoicesContent />
    </Suspense>
  );
}
