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
};

export default function BarChart({
  data,
  height = 300,
  horizontal = false,
  showValues = true
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">No data available</div>;
  }

  const padding = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const barSpacing = 10;
  const barWidth = horizontal
    ? chartHeight / data.length - barSpacing
    : chartWidth / data.length - barSpacing;

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (horizontal) {
    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="text-[var(--foreground)]">
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={chartHeight}
              stroke="var(--border)"
              strokeWidth="2"
            />

            {/* X-axis */}
            <line
              x1={0}
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke="var(--border)"
              strokeWidth="2"
            />

            {/* Bars */}
            {data.map((item, index) => {
              const barHeight = barWidth;
              const barLength = (item.value / maxValue) * chartWidth;
              const y = index * (barHeight + barSpacing);
              const color = item.color || defaultColors[index % defaultColors.length];

              return (
                <g key={index}>
                  {/* Bar */}
                  <rect
                    x={0}
                    y={y}
                    width={barLength}
                    height={barHeight}
                    fill={color}
                    rx="4"
                    opacity="0.8"
                  >
                    <title>{`${item.label}: ${item.value}`}</title>
                  </rect>

                  {/* Value label */}
                  {showValues && (
                    <text
                      x={barLength + 5}
                      y={y + barHeight / 2}
                      alignmentBaseline="middle"
                      fontSize="12"
                      fill="var(--foreground)"
                      fontWeight="600"
                    >
                      {item.value}
                    </text>
                  )}

                  {/* Y-axis label */}
                  <text
                    x={-10}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fontSize="12"
                    fill="var(--muted-foreground)"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  }

  // Vertical bars
  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="text-[var(--foreground)]">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="var(--border)"
            strokeWidth="2"
          />

          {/* X-axis */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="var(--border)"
            strokeWidth="2"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={chartHeight * (1 - ratio)}
                x2={chartWidth}
                y2={chartHeight * (1 - ratio)}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <text
                x={-10}
                y={chartHeight * (1 - ratio)}
                textAnchor="end"
                alignmentBaseline="middle"
                fontSize="12"
                fill="var(--muted-foreground)"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = index * (barWidth + barSpacing) + barSpacing / 2;
            const y = chartHeight - barHeight;
            const color = item.color || defaultColors[index % defaultColors.length];

            return (
              <g key={index}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx="4"
                  opacity="0.8"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </rect>

                {/* Value label */}
                {showValues && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--foreground)"
                    fontWeight="600"
                  >
                    {item.value}
                  </text>
                )}

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--muted-foreground)"
                >
                  {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
