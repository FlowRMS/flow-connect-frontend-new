'use client';

import React from 'react';

type DataPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showPoints?: boolean;
};

export default function LineChart({
  data,
  height = 300,
  color = '#3b82f6',
  showGrid = true,
  showPoints = true
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">No data available</div>;
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  // Scale functions
  const scaleX = (index: number) => (index / (data.length - 1)) * chartWidth;
  const scaleY = (value: number) => chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for gradient fill)
  const areaPath = `${pathData} L ${scaleX(data.length - 1)} ${chartHeight} L 0 ${chartHeight} Z`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minValue + (valueRange * i) / (yTicks - 1);
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="text-[var(--foreground)]">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {showGrid && yTickValues.map((value, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={scaleY(value)}
                x2={chartWidth}
                y2={scaleY(value)}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#lineGradient)"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {showPoints && data.map((point, index) => (
            <g key={index}>
              <circle
                cx={scaleX(index)}
                cy={scaleY(point.value)}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
              <title>{`${point.label}: ${point.value}`}</title>
            </g>
          ))}

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

          {/* Y-axis labels */}
          {yTickValues.map((value, i) => (
            <text
              key={i}
              x={-10}
              y={scaleY(value)}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize="12"
              fill="var(--muted-foreground)"
            >
              {Math.round(value)}
            </text>
          ))}

          {/* X-axis labels */}
          {data.map((point, index) => {
            // Show every nth label to avoid crowding
            const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
            if (!showLabel) return null;

            return (
              <text
                key={index}
                x={scaleX(index)}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fill="var(--muted-foreground)"
              >
                {point.label}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
