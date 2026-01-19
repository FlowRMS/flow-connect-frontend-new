/**
 * AdjustmentsTableHeader Component
 * Header row for the adjustments table
 * Note: Column filters and sorting will be added in later steps
 */

interface AdjustmentsTableHeaderProps {
  sortField?: 'date' | 'amount' | 'number';
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: 'date' | 'amount' | 'number') => void;
}

export function AdjustmentsTableHeader({
  sortField,
  sortDirection,
  onSort,
}: AdjustmentsTableHeaderProps) {
  const handleSort = (field: 'date' | 'amount' | 'number') => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <thead className="bg-white border-b-2 border-[var(--border)] sticky top-0 z-10 shadow-sm">
      <tr>
        <th
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
          onClick={() => handleSort('number')}
          style={{ minWidth: '180px' }}
        >
          <div className="flex items-center gap-1">
            Adjustment #
            {sortField === 'number' && (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                <path d="M5 8l5 5 5-5"/>
              </svg>
            )}
          </div>
        </th>
        <th
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
          onClick={() => handleSort('date')}
          style={{ minWidth: '130px' }}
        >
          <div className="flex items-center gap-1">
            Date
            {sortField === 'date' && (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                <path d="M5 8l5 5 5-5"/>
              </svg>
            )}
          </div>
        </th>
        <th 
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '250px' }}
        >
          Reason
        </th>
        <th
          className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
          onClick={() => handleSort('amount')}
          style={{ minWidth: '120px' }}
        >
          <div className="flex items-center justify-end gap-1">
            Amount
            {sortField === 'amount' && (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                <path d="M5 8l5 5 5-5"/>
              </svg>
            )}
          </div>
        </th>
        <th 
          className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '130px' }}
        >
          Status
        </th>
        <th 
          className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '100px' }}
        >
          Locked
        </th>
        <th 
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '120px' }}
        >
          Created By
        </th>
        <th 
          className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '120px' }}
        >
          Actions
        </th>
      </tr>
    </thead>
  );
}
