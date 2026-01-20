/**
 * ProductStatCard Component
 * Reusable card component for displaying product statistics
 */

interface ProductStatCardProps {
  label: string;
  subtitle: string;
  value: number;
  isLoading: boolean;
  color: 'foreground' | 'green-600' | 'amber-600' | 'purple-600';
}

// Map color to actual Tailwind classes
const colorClasses: Record<ProductStatCardProps['color'], string> = {
  'foreground': 'text-[var(--foreground)]',
  'green-600': 'text-green-600',
  'amber-600': 'text-amber-600',
  'purple-600': 'text-purple-600',
};

export function ProductStatCard({
  label,
  subtitle,
  value,
  isLoading,
  color,
}: ProductStatCardProps) {
  const colorClass = colorClasses[color];

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      {isLoading ? (
        <div className="mt-1">
          <div className="h-8 w-16 bg-[var(--muted)] rounded animate-pulse" />
        </div>
      ) : (
        <div className={`text-2xl font-semibold ${colorClass} mt-1`}>
          {value.toLocaleString()}
        </div>
      )}
      <div className="text-xs text-[var(--muted-foreground)] mt-1">{subtitle}</div>
    </div>
  );
}
