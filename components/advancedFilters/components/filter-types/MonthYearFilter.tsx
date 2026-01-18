import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../AdvancedFilters.css';
import type { FilterOption } from '../../types';

type MonthYearFilterProps = {
  option: FilterOption;
  selectedMonthYear: Date | null;
  onMonthYearChange: (date: Date | null) => void;
  onApply: (option: FilterOption) => void;
};

export function MonthYearFilter({ 
  option, 
  selectedMonthYear, 
  onMonthYearChange,
  onApply 
}: MonthYearFilterProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Filter function to disable future months
  const filterDate = (date: Date) => {
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();
    
    // Disable if year is in the future
    if (dateYear > currentYear) {
      return false;
    }
    
    // Disable if same year but month is in the future
    if (dateYear === currentYear && dateMonth > currentMonth) {
      return false;
    }
    
    return true;
  };

  // Validate on change to prevent selecting future months
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onMonthYearChange(null);
      return;
    }

    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();

    // If selected date is in the future, don't update
    if (dateYear > currentYear || (dateYear === currentYear && dateMonth > currentMonth)) {
      return;
    }

    onMonthYearChange(date);
  };

  return (
    <div className="flex flex-col">
      <div className="p-2 border-b border-gray-100 -mx-3 -mb-3">
        <div className="advanced-filters-monthpicker">
          <DatePicker
            selected={selectedMonthYear}
            onChange={handleDateChange}
            showMonthYearPicker
            inline
            dateFormat="MMMM yyyy"
            maxDate={today}
            filterDate={filterDate}
          />
        </div>
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button
          onClick={() => onApply(option)}
          disabled={!selectedMonthYear}
          className="px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
