/**
 * InvoicesEmptyState Component
 * Displayed when no invoices match the current filters
 */

export function InvoicesEmptyState() {
  return (
    <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
      No invoices found
    </div>
  );
}

