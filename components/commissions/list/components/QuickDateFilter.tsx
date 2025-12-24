/**
 * QuickDateFilter Component
 * Quick date filter with preset options (All, Today, This Week, Last Week)
 * and field selector (Entry Date or Commission Month)
 */

import type { QuickDatePreset, QuickDateField } from '../types';
import { QUICK_DATE_OPTIONS, QUICK_DATE_FIELD_OPTIONS } from '../constants';

interface QuickDateFilterProps {
  quickDatePreset: QuickDatePreset;
  setQuickDatePreset: (preset: QuickDatePreset) => void;
  quickDateField: QuickDateField;
  setQuickDateField: (field: QuickDateField) => void;
  showQuickDateFieldDropdown: boolean;
  setShowQuickDateFieldDropdown: (show: boolean) => void;
}

export function QuickDateFilter({
  quickDatePreset,
  setQuickDatePreset,
  quickDateField,
  setQuickDateField,
  showQuickDateFieldDropdown,
  setShowQuickDateFieldDropdown,
}: QuickDateFilterProps) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-sm text-[var(--muted-foreground)]">
        Quick filter:
      </span>
      <div className="flex items-center bg-[var(--muted)]/30 rounded-lg p-1">
        {QUICK_DATE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setQuickDatePreset(option.value as QuickDatePreset)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              quickDatePreset === option.value
                ? 'bg-white shadow-sm text-[var(--foreground)] font-medium'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Date Field Selector */}
      <div className="relative">
        <button
          onClick={() => setShowQuickDateFieldDropdown(!showQuickDateFieldDropdown)}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg transition-colors"
        >
          <span>
            {QUICK_DATE_FIELD_OPTIONS.find(opt => opt.value === quickDateField)?.label || 'Entry Date'}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M6 8l4 4 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {showQuickDateFieldDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowQuickDateFieldDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
              {QUICK_DATE_FIELD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setQuickDateField(option.value as QuickDateField);
                    setShowQuickDateFieldDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                    quickDateField === option.value
                      ? 'text-[var(--primary)] font-medium'
                      : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

