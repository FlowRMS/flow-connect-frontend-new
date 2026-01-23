'use client';

import React from 'react';
import { TerritoryBadge } from './TerritoryBadge';
import { useTerritory } from '../api/useTerritories';
import { type TerritoryLite, getTerritoryTypeLabel } from '../../lib/graphql/territories';

interface TerritoryDetailPanelProps {
  territoryId: string | null;
  onEdit: () => void;
  onClose: () => void;
}

export function TerritoryDetailPanel({
  territoryId,
  onEdit,
  onClose,
}: TerritoryDetailPanelProps) {
  const { data: territory, isLoading, isError } = useTerritory(territoryId);

  if (!territoryId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--muted-foreground)]"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-medium text-[var(--foreground)] mb-1">Select a territory</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Choose a territory from the tree to view its details
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--muted)]/50 rounded w-2/3" />
          <div className="h-4 bg-[var(--muted)]/50 rounded w-1/3" />
          <div className="h-24 bg-[var(--muted)]/50 rounded" />
          <div className="h-24 bg-[var(--muted)]/50 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !territory) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h3 className="font-medium text-[var(--foreground)] mb-1">Error loading territory</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Could not load territory details
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{territory.name}</h2>
            <TerritoryBadge type={territory.territoryType} />
            {!territory.active && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">
                Inactive
              </span>
            )}
          </div>
          <div className="text-sm text-[var(--muted-foreground)] font-mono">{territory.code}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Hierarchy */}
        {territory.parent && (
          <Section title="Parent">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--foreground)]">{territory.parent.name}</span>
              <TerritoryBadge type={territory.parent.territoryType} />
            </div>
          </Section>
        )}

        {/* Geographic Boundaries */}
        <Section title="Geographic Boundaries">
          {territory.stateCodes.length === 0 &&
          territory.countyCodes.length === 0 &&
          territory.cityNames.length === 0 &&
          territory.zipCodes.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No boundaries configured</p>
          ) : (
            <div className="space-y-3">
              {territory.stateCodes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1.5">
                    States ({territory.stateCodes.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {territory.stateCodes.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {territory.countyCodes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1.5">
                    Counties ({territory.countyCodes.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {territory.countyCodes.slice(0, 10).map((code) => (
                      <span
                        key={code}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                      >
                        {code}
                      </span>
                    ))}
                    {territory.countyCodes.length > 10 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{territory.countyCodes.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {territory.cityNames.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1.5">
                    Cities ({territory.cityNames.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {territory.cityNames.slice(0, 10).map((name) => (
                      <span
                        key={name}
                        className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                      >
                        {name}
                      </span>
                    ))}
                    {territory.cityNames.length > 10 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{territory.cityNames.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {territory.zipCodes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1.5">
                    Zip Codes ({territory.zipCodes.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {territory.zipCodes.slice(0, 15).map((zip) => (
                      <span
                        key={zip}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono"
                      >
                        {zip}
                      </span>
                    ))}
                    {territory.zipCodes.length > 15 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{territory.zipCodes.length - 15} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Outside Rep Splits */}
        <Section title="Outside Rep Splits">
          {territory.splitRates.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No rep splits configured</p>
          ) : (
            <div className="space-y-2">
              {territory.splitRates.map((sr) => (
                <div
                  key={sr.id}
                  className="flex items-center gap-3 p-3 bg-[var(--muted)]/30 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-green-700">
                      {sr.user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">
                      {sr.user.fullName}
                    </div>
                    {sr.user.email && (
                      <div className="text-xs text-[var(--muted-foreground)] truncate">
                        {sr.user.email}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--primary)]">
                    {parseFloat(sr.splitRate).toFixed(0)}%
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end pt-2 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--muted-foreground)] mr-2">Total:</span>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {territory.splitRates
                    .reduce((sum, sr) => sum + parseFloat(sr.splitRate), 0)
                    .toFixed(0)}
                  %
                </span>
              </div>
            </div>
          )}
        </Section>

        {/* Managers */}
        <Section title="Territory Managers">
          {territory.managers.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No managers assigned</p>
          ) : (
            <div className="space-y-2">
              {territory.managers.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center gap-3 p-3 bg-[var(--muted)]/30 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-700">
                      {manager.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">
                      {manager.fullName}
                    </div>
                    {manager.email && (
                      <div className="text-xs text-[var(--muted-foreground)] truncate">
                        {manager.email}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{title}</h3>
      {children}
    </div>
  );
}
