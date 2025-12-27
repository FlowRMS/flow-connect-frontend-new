'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SparklineProps {
  manufacturerPriceHistory: number[];
  quotedPriceHistory: number[];
  productNumber?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  manufacturerPriceHistory,
  quotedPriceHistory,
  productNumber,
  width = 60,
  height = 20
}: SparklineProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!manufacturerPriceHistory || manufacturerPriceHistory.length === 0) return null;

  // Calculate combined min/max for proper scaling of both lines
  const allData = [...manufacturerPriceHistory, ...(quotedPriceHistory || [])];
  const globalMin = Math.min(...allData);
  const globalMax = Math.max(...allData);
  const globalRange = globalMax - globalMin || 1;

  // Manufacturer price stats
  const mfrMin = Math.min(...manufacturerPriceHistory);
  const mfrMax = Math.max(...manufacturerPriceHistory);
  const mfrAvg = manufacturerPriceHistory.reduce((a, b) => a + b, 0) / manufacturerPriceHistory.length;
  const mfrLastValue = manufacturerPriceHistory[manufacturerPriceHistory.length - 1];
  const mfrFirstValue = manufacturerPriceHistory[0];
  const mfrChange = mfrLastValue - mfrFirstValue;
  const mfrChangePercent = ((mfrChange / mfrFirstValue) * 100).toFixed(1);

  // Quoted price stats
  const hasQuotedData = quotedPriceHistory && quotedPriceHistory.length > 0;
  const quotedMin = hasQuotedData ? Math.min(...quotedPriceHistory) : 0;
  const quotedMax = hasQuotedData ? Math.max(...quotedPriceHistory) : 0;
  const quotedAvg = hasQuotedData ? quotedPriceHistory.reduce((a, b) => a + b, 0) / quotedPriceHistory.length : 0;
  const quotedLastValue = hasQuotedData ? quotedPriceHistory[quotedPriceHistory.length - 1] : 0;
  const quotedFirstValue = hasQuotedData ? quotedPriceHistory[0] : 0;
  const quotedChange = quotedLastValue - quotedFirstValue;
  const quotedChangePercent = hasQuotedData ? ((quotedChange / quotedFirstValue) * 100).toFixed(1) : '0';

  // Calculate points for mini sparkline (manufacturer only for mini view)
  const mfrPoints = manufacturerPriceHistory.map((value, index) => {
    const x = (index / (manufacturerPriceHistory.length - 1)) * width;
    const y = height - ((value - globalMin) / globalRange) * height;
    return `${x},${y}`;
  }).join(' ');

  const quotedPoints = hasQuotedData ? quotedPriceHistory.map((value, index) => {
    const x = (index / (quotedPriceHistory.length - 1)) * width;
    const y = height - ((value - globalMin) / globalRange) * height;
    return `${x},${y}`;
  }).join(' ') : '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setShowTooltip(true);
  };

  const tooltip = showTooltip && typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed z-[9999] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl p-3 w-80"
      style={{
        left: tooltipPos.x,
        top: tooltipPos.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
        {productNumber ? `Price History: ${productNumber}` : 'Price History'}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
          <span className="text-[var(--muted-foreground)]">Mfr Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500 rounded"></div>
          <span className="text-[var(--muted-foreground)]">Quoted Price</span>
        </div>
      </div>

      {/* Mini Chart with both lines */}
      <div className="bg-[var(--muted)]/20 rounded p-2 mb-3">
        <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
          {/* Manufacturer price line (blue) */}
          <polyline
            points={manufacturerPriceHistory.map((value, index) => {
              const x = (index / (manufacturerPriceHistory.length - 1)) * 200;
              const y = 55 - ((value - globalMin) / globalRange) * 50;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Manufacturer current value dot */}
          <circle
            cx="200"
            cy={55 - ((mfrLastValue - globalMin) / globalRange) * 50}
            r="3"
            fill="#3b82f6"
          />

          {/* Quoted price line (green) */}
          {hasQuotedData && (
            <>
              <polyline
                points={quotedPriceHistory.map((value, index) => {
                  const x = (index / (quotedPriceHistory.length - 1)) * 200;
                  const y = 55 - ((value - globalMin) / globalRange) * 50;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Quoted current value dot */}
              <circle
                cx="200"
                cy={55 - ((quotedLastValue - globalMin) / globalRange) * 50}
                r="3"
                fill="#22c55e"
              />
            </>
          )}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1">
          {months.slice(0, Math.min(6, manufacturerPriceHistory.length)).map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>

      {/* Stats - Two columns */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Manufacturer Price Stats */}
        <div className="space-y-1">
          <div className="font-medium text-blue-600 mb-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Manufacturer Price
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">12-mo:</span>
            <span className={mfrChange >= 0 ? 'text-red-600' : 'text-green-600'}>
              {mfrChange >= 0 ? '+' : ''}${mfrChange.toFixed(2)} ({mfrChange >= 0 ? '+' : ''}{mfrChangePercent}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Min:</span>
            <span className="text-[var(--foreground)]">${mfrMin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Max:</span>
            <span className="text-[var(--foreground)]">${mfrMax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Avg:</span>
            <span className="text-[var(--foreground)]">${mfrAvg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[var(--border)]">
            <span className="text-[var(--muted-foreground)]">Current:</span>
            <span className="font-medium text-[var(--foreground)]">${mfrLastValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Quoted Price Stats */}
        <div className="space-y-1">
          <div className="font-medium text-green-600 mb-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Quoted Price
          </div>
          {hasQuotedData ? (
            <>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">12-mo:</span>
                <span className={quotedChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {quotedChange >= 0 ? '+' : ''}${quotedChange.toFixed(2)} ({quotedChange >= 0 ? '+' : ''}{quotedChangePercent}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Min:</span>
                <span className="text-[var(--foreground)]">${quotedMin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Max:</span>
                <span className="text-[var(--foreground)]">${quotedMax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Avg:</span>
                <span className="text-[var(--foreground)]">${quotedAvg.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Current:</span>
                <span className="font-medium text-[var(--foreground)]">${quotedLastValue.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="text-[var(--muted-foreground)] italic">No data</div>
          )}
        </div>
      </div>

      {/* Margin indicator */}
      {hasQuotedData && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between text-xs">
          <span className="text-[var(--muted-foreground)]">Current Margin:</span>
          <span className="font-medium text-[var(--foreground)]">
            ${(quotedLastValue - mfrLastValue).toFixed(2)} ({((quotedLastValue - mfrLastValue) / mfrLastValue * 100).toFixed(1)}%)
          </span>
        </div>
      )}

      {/* Arrow pointer */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="w-2 h-2 bg-[var(--card)] border-r border-b border-[var(--border)] rotate-45"></div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <svg width={width} height={height}>
        {/* Manufacturer price line (blue) */}
        <polyline
          points={mfrPoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Quoted price line (green) */}
        {hasQuotedData && (
          <polyline
            points={quotedPoints}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {tooltip}
    </div>
  );
}
