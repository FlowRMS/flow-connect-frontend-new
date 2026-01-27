'use client';

import React, { useState } from 'react';

export type DeliverySortField = 'poNumber' | 'vendorName' | 'itemCount' | 'eta' | 'expectedDate' | 'status';
export type SortDirection = 'asc' | 'desc';

export function SortIcon({
  field,
  currentSortField,
  currentSortDirection,
}: {
  field: DeliverySortField;
  currentSortField: DeliverySortField;
  currentSortDirection: SortDirection;
}) {
  const isActive = currentSortField === field;
  return (
    <span className="ml-1 inline-flex flex-col">
      <svg
        className={`w-2 h-2 ${isActive && currentSortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg
        className={`w-2 h-2 -mt-0.5 ${isActive && currentSortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );
}

export function TextFilterDropdown({
  value,
  onChange,
  placeholder,
  isOpen,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasValue = value !== '';
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        title="Filter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {hasValue && (
              <button
                onClick={() => onChange('')}
                className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function MultiSelectFilterDropdown({
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  renderLabel,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  renderLabel?: (opt: string) => string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const hasValue = value.length > 0;
  const filteredOptions = options.filter((opt) =>
    (renderLabel ? renderLabel(opt) : opt).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        title="Filter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {hasValue && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
            {value.length}
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
            <div className="p-2 border-b border-[var(--border)]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto flex-1 py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div>
              ) : (
                filteredOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(opt)}
                      onChange={() => toggleOption(opt)}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
                    />
                    <span className={value.includes(opt) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>
                      {renderLabel ? renderLabel(opt) : opt}
                    </span>
                  </label>
                ))
              )}
            </div>
            {hasValue && (
              <div className="p-2 border-t border-[var(--border)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                  className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function DateRangeFilterDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
}: {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasValue = value.start !== '' || value.end !== '';
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        title="Filter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label>
                <input
                  type="date"
                  value={value.start}
                  onChange={(e) => onChange({ ...value, start: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label>
                <input
                  type="date"
                  value={value.end}
                  onChange={(e) => onChange({ ...value, end: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {hasValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ start: '', end: '' });
                  }}
                  className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
