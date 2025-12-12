import { Suspense } from 'react';
import ExpensesContent from '@/components/expenses/ExpensesContent';

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <ExpensesContent />
    </Suspense>
  );
}
