/**
 * ColumnFilterDropdown Component
 * Generic filter dropdown with support for text, multiselect, and date range filters
 */

import { useState } from 'react';
import type { DateRange } from '../../types';

// Text Filter Props
interface TextFilterProps {
  type: 'text';
  filterId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
}

// MultiSelect Filter Props
interface MultiSelectFilterProps {
  type: 'multiselect';
  filterId: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
}

// Date Range Filter Props
interface DateRangeFilterProps {
  type: 'daterange';
  filterId: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
  isOpen: boolean;
  onToggle: () => void;
}

type ColumnFilterDropdownProps =
  | TextFilterProps
  | MultiSelectFilterProps
  | DateRangeFilterProps;

export function ColumnFilterDropdown(props: ColumnFilterDropdownProps) {
  const { filterId, isOpen, onToggle, type } = props;

  const hasValue =
    type === 'text'
      ? props.value !== ''
      : type === 'multiselect'
      ? props.value.length > 0
      : props.value.start !== '' || props.value.end !== '';

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${
          hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'
        }`}
        title="Filter"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {type === 'multiselect' && hasValue && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
            {props.value.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          {type === 'text' && <TextFilterContent {...props} />}
          {type === 'multiselect' && <MultiSelectFilterContent {...props} />}
          {type === 'daterange' && <DateRangeFilterContent {...props} />}
        </>
      )}
    </div>
  );
}

// Text Filter Content
function TextFilterContent({ value, onChange, placeholder }: TextFilterProps) {
  const hasValue = value !== '';

  return (
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
  );
}

// MultiSelect Filter Content
function MultiSelectFilterContent({
  options,
  value,
  onChange,
}: MultiSelectFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const hasValue = value.length > 0;

  return (
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
          <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
            No results
          </div>
        ) : (
          filteredOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
              />
              <span
                className={
                  value.includes(opt.value)
                    ? 'text-[var(--primary)] font-medium'
                    : 'text-[var(--foreground)]'
                }
              >
                {opt.label}
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
  );
}

// Date Range Filter Content
function DateRangeFilterContent({ value, onChange }: DateRangeFilterProps) {
  const hasValue = value.start !== '' || value.end !== '';

  return (
    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            From
          </label>
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            To
          </label>
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
  );
}
