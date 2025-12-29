"use client";

import { Card, CardContent } from "..//ui/card";
import { StatsCardSkeleton } from "./StatsCardSkeleton";
import { formatCurrency } from "@/lib/analytics/lib/format";

export function StatsCard({
  title,
  value,
  change,
  changeVariant = "percentage",
  progress,
  progressColor = "#3b82f6",
  comparisonText = "vs last YTD",
  progressLabel,
  loading = false,
}) {
  const rawChange =
    typeof change === "number" ? change : parseFloat(String(change));
  const numericChange = Number.isFinite(rawChange) ? rawChange : 0;
  const isPositive = numericChange >= 0;
  const trendSymbol = isPositive ? "▲" : "▼";

  // Determine color based on variance ranges
  let colorClass;
  if (numericChange > 10) {
    colorClass = "text-green-800"; // dark green for >+10%
  } else if (numericChange > 0) {
    colorClass = "text-green-600"; // light green for 0-10% positive
  } else if (numericChange >= -10) {
    colorClass = "text-red-600"; // light red for 0-10% negative
  } else {
    colorClass = "text-red-800"; // dark red for <-10%
  }

  let changeLabel;
  if (changeVariant === "currency") {
    changeLabel = `${trendSymbol} ${formatCurrency(Math.abs(numericChange))}`;
  } else if (changeVariant === "absolute") {
    changeLabel = `${trendSymbol} ${Math.abs(numericChange).toFixed(2)}`;
  } else {
    changeLabel = `${trendSymbol} ${Math.abs(numericChange).toFixed(2)}%`;
  }

  if (loading) {
    return <StatsCardSkeleton />;
  }

  return (
    <Card className="h-full">
      <CardContent className="h-full px-4 py-1 flex flex-col justify-between">
        <div className="text-base font-semibold text-gray-700 mb-2">
          {title}
        </div>
        <div className="flex flex-col justify-center flex-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className={`text-sm mt-2 font-semibold ${colorClass}`}>
            {changeLabel}
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              {comparisonText}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CircularProgress({ value = 0, stroke = 6, color = "#3b82f6", label }) {
  const size = 72;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#eef2ff"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="font-medium"
        style={{ fontSize: 9 }}
      >
        {label || `${Math.round(value)}%`}
      </text>
    </svg>
  );
}

