import React from "react";

export const ProductSparkline = ({ data = [], height = 60, color = "#3b82f6" }) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-xs"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  // Parse values and find min/max
  const values = data.map((d) => parseFloat(d.value) || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // SVG dimensions
  const width = 100; // percentage-based, will scale
  const padding = 2;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  // Calculate points for the sparkline
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");

  // Create area fill path
  const areaPath = `
    M ${padding},${padding + chartHeight}
    L ${points.join(" L ")}
    L ${padding + chartWidth},${padding + chartHeight}
    Z
  `.replace(/\s+/g, " ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      {/* Area fill */}
      <path d={areaPath} fill={color} fillOpacity="0.1" />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      {values.length > 0 && (
        <circle
          cx={padding + chartWidth}
          cy={
            padding +
            chartHeight -
            ((values[values.length - 1] - minValue) / range) * chartHeight
          }
          r="2"
          fill={color}
        />
      )}
    </svg>
  );
};
