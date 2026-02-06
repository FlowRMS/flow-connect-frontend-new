'use client';

interface SummaryStatProps {
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantColors: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
};

export function SummaryStat({ value, label, variant = 'default' }: SummaryStatProps) {
  return (
    <div className="p-4 bg-muted rounded-lg text-center">
      <p className={`text-2xl font-bold ${variantColors[variant]}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface SummaryStatsGridProps {
  stats: SummaryStatProps[];
  columns?: 2 | 3 | 4;
}

export function SummaryStatsGrid({ stats, columns = 3 }: SummaryStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => (
        <SummaryStat key={index} {...stat} />
      ))}
    </div>
  );
}
