'use client';

import { getTerritoryTypeLabel, getTerritoryTypeColor, type TerritoryType } from '../../lib/graphql/territories';

interface TerritoryBadgeProps {
  type: TerritoryType;
  size?: 'sm' | 'md';
}

export function TerritoryBadge({ type, size = 'sm' }: TerritoryBadgeProps) {
  const label = getTerritoryTypeLabel(type);
  const colorClass = getTerritoryTypeColor(type);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded font-medium ${colorClass} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
}

interface TerritoryStatusBadgeProps {
  configured: boolean;
  summary?: string;
}

export function TerritoryStatusBadge({ configured, summary }: TerritoryStatusBadgeProps) {
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-green-100 text-green-700">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {summary || 'Configured'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      Not configured
    </span>
  );
}
