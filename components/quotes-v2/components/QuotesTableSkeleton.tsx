/**
 * QuotesTableSkeleton
 * Skeleton loader for quotes list (used on loading / refetch / sort / filter)
 */

interface QuotesTableSkeletonProps {
  rowCount?: number;
}

export function QuotesTableSkeleton({ rowCount = 8 }: QuotesTableSkeletonProps) {
  // Column widths aligned with table headers to prevent layout shift
  // Total: 18 columns (checkbox, preview, quote number, customer, status, pipeline stage, total, commission, entry date, quote date, exp date, created by, published, part numbers, sales reps, factories, end users, categories)
  const columnClasses = [
    'w-10', // checkbox
    'w-10', // preview
    'w-[140px]', // quote number
    'w-[150px]', // customer
    'w-[120px]', // status
    'w-[150px]', // pipeline stage
    'w-[120px]', // total
    'w-[130px]', // commission
    'w-[120px]', // entry date
    'w-[120px]', // quote date
    'w-[110px]', // exp date
    'w-[120px]', // created by
    'w-[110px]', // published
    'w-[120px]', // part numbers
    'w-[150px]', // sales reps
    'w-[120px]', // factories
    'w-[120px]', // end users
    'w-[120px]', // categories
  ];

  return (
    <>
      {Array.from({ length: rowCount }).map((_, idx) => (
        <tr key={idx} className="border-b border-gray-100">
          {columnClasses.map((cls, colIdx) => (
            <td key={colIdx} className={`px-3 py-3 ${cls}`}>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

