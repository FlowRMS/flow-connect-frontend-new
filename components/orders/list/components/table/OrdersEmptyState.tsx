/**
 * OrdersEmptyState Component
 * Displayed when no orders match the current filters
 */

export function OrdersEmptyState() {
  return (
    <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
      No orders found
    </div>
  );
}
