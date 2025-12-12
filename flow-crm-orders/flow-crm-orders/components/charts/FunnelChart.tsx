'use client';

import React from 'react';

type DataPoint = {
  label: string;
  value: number;
  count?: number;
  color?: string;
};

type FunnelChartProps = {
  data: DataPoint[];
  height?: number;
  showValues?: boolean;
};

export default function FunnelChart({
  data,
  height = 400,
  showValues = true
}: FunnelChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">No data available</div>;
  }

  const width = 600;
  const padding = { top: 20, right: 100, bottom: 20, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const stageHeight = chartHeight / data.length;
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="text-[var(--foreground)]">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {data.map((stage, index) => {
            const stageWidth = (stage.value / maxValue) * chartWidth;
            const y = index * stageHeight;
            const x = (chartWidth - stageWidth) / 2;
            const color = stage.color || defaultColors[index % defaultColors.length];

            // Calculate conversion rate from previous stage
            const conversionRate = index > 0
              ? ((stage.value / data[index - 1].value) * 100).toFixed(1)
              : '100.0';

            return (
              <g key={index}>
                {/* Funnel stage */}
                <rect
                  x={x}
                  y={y + 5}
                  width={stageWidth}
                  height={stageHeight - 10}
                  fill={color}
                  opacity="0.8"
                  rx="4"
                >
                  <title>{`${stage.label}: $${stage.value.toLocaleString()}`}</title>
                </rect>

                {/* Label on left */}
                <text
                  x={x - 10}
                  y={y + stageHeight / 2}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fontSize="14"
                  fontWeight="600"
                  fill="var(--foreground)"
                >
                  {stage.label}
                </text>

                {/* Value on right */}
                {showValues && (
                  <g>
                    <text
                      x={x + stageWidth + 10}
                      y={y + stageHeight / 2 - 8}
                      textAnchor="start"
                      alignmentBaseline="middle"
                      fontSize="14"
                      fontWeight="600"
                      fill="var(--foreground)"
                    >
                      ${(stage.value / 1000).toFixed(0)}K
                    </text>
                    {stage.count && (
                      <text
                        x={x + stageWidth + 10}
                        y={y + stageHeight / 2 + 8}
                        textAnchor="start"
                        alignmentBaseline="middle"
                        fontSize="12"
                        fill="var(--muted-foreground)"
                      >
                        ({stage.count} deals)
                      </text>
                    )}
                  </g>
                )}

                {/* Conversion rate indicator */}
                {index > 0 && (
                  <text
                    x={chartWidth / 2}
                    y={y + stageHeight / 2}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="white"
                  >
                    {conversionRate}%
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
