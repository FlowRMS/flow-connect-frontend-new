import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../AdvancedFilters.css';
import type { FilterOption } from '../../types';

type DateRangeFilterProps = {
  option: FilterOption;
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  onApply: (option: FilterOption) => void;
};

export function DateRangeFilter({ 
  option, 
  dateRangeStart, 
  dateRangeEnd, 
  onDateRangeChange,
  onApply 
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-gray-100 -mx-3 -mb-3">
        <div className="advanced-filters-datepicker">
          <DatePicker
            selected={dateRangeStart}
            startDate={dateRangeStart}
            endDate={dateRangeEnd}
            selectsRange
            inline
            onChange={(dates) => {
              const [start, end] = dates as [Date | null, Date | null];
              onDateRangeChange(start, end);
            }}
          />
        </div>
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button
          onClick={() => onApply(option)}
          disabled={!dateRangeStart && !dateRangeEnd}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

