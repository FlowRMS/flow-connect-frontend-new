'use client';

import React from 'react';

type DataPoint = {
  label: string;
  value: number;
  color?: string;
};

type PieChartProps = {
  data: DataPoint[];
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
};

export default function PieChart({
  data,
  size = 300,
  showLegend = true,
  showPercentages = true
}: PieChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">No data available</div>;
  }

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.min(size / 2 - 20, 120);

  // Calculate angles for each slice
  let currentAngle = -Math.PI / 2; // Start at top
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    // Calculate label position
    const labelAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.65;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    const color = item.color || defaultColors[index % defaultColors.length];

    return {
      path,
      labelX,
      labelY,
      percentage,
      color,
      label: item.label,
      value: item.value
    };
  });

  return (
    <div className="flex items-start gap-8">
      {/* Pie Chart */}
      <svg width={size} height={size}>
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.path}
              fill={slice.color}
              opacity="0.8"
              stroke="white"
              strokeWidth="2"
            >
              <title>{`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title>
            </path>
            {showPercentages && slice.percentage > 5 && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="13"
                fontWeight="600"
                fill="white"
              >
                {slice.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2 py-4">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <div className="text-sm">
                <div className="text-[var(--foreground)] font-medium">{slice.label}</div>
                <div className="text-[var(--muted-foreground)]">
                  {slice.value} ({slice.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
