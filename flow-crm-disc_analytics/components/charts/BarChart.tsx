'use client';

import React from 'react';

type DataPoint = {
  label: string;
  value: number;
  color?: string;
};

type BarChartProps = {
  data: DataPoint[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  color?: string;
};

export default function BarChart({
  data,
  height = 200,
  horizontal = false,
  showValues = true,
  color = '#3b82f6'
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]">No data available</div>;
  }

  // Use a single consistent color for all bars
  const barColor = color;

  if (horizontal) {
    const barHeight = 20;
    const labelWidth = 100;
    const valueWidth = 60;
    const rowHeight = barHeight + 6;
    const totalHeight = data.length * rowHeight;
    const maxValue = Math.max(...data.map(d => d.value));

    return (
      <div className="w-full">
        {data.map((item, index) => {
          const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-2 mb-1.5">
              <div className="text-xs text-[var(--muted-foreground)] truncate" style={{ width: labelWidth }}>
                {item.label}
              </div>
              <div className="flex-1 h-5 bg-[var(--muted)] rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${barWidth}%`, backgroundColor: item.color || barColor }}
                />
              </div>
              {showValues && (
                <div className="text-xs font-medium text-[var(--foreground)] text-right" style={{ width: valueWidth }}>
                  {typeof item.value === 'number' && item.value >= 1000
                    ? `${(item.value / 1000).toFixed(1)}K`
                    : item.value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bars
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 40; // Reserve space for labels and values

  return (
    <div className="w-full" style={{ height }}>
      {/* Chart area */}
      <div className="flex items-end justify-around gap-3" style={{ height: chartHeight }}>
        {data.map((item, index) => {
          const barHeightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-end h-full"
              style={{ flex: 1, maxWidth: 60 }}
            >
              {showValues && (
                <div className="text-xs font-medium text-[var(--foreground)] mb-1">
                  {typeof item.value === 'number' && item.value >= 1000
                    ? `${(item.value / 1000).toFixed(0)}K`
                    : item.value}
                </div>
              )}
              <div
                className="w-full rounded-t"
                style={{
                  height: `${barHeightPercent}%`,
                  minHeight: item.value > 0 ? 8 : 0,
                  backgroundColor: item.color || barColor,
                  maxWidth: 40
                }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-around gap-3 mt-2 pt-2 border-t border-[var(--border)]">
        {data.map((item, index) => (
          <div
            key={index}
            className="text-xs text-[var(--muted-foreground)] text-center truncate"
            style={{ flex: 1, maxWidth: 60 }}
            title={item.label}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
