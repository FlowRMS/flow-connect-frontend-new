'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const MONTH_LABELS: Record<string, string> = {
  january: 'Jan',
  february: 'Feb',
  march: 'Mar',
  april: 'Apr',
  may: 'May',
  june: 'Jun',
  july: 'Jul',
  august: 'Aug',
  september: 'Sep',
  october: 'Oct',
  november: 'Nov',
  december: 'Dec',
};

const MONTH_FULL_LABELS: Record<string, string> = {
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
};

interface MonthYear {
  month: string;
  year: number;
}

interface MonthRangePickerProps {
  /** Current value in format "month-year" or "month-year to month-year" for ranges */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Whether to allow range selection */
  allowRange?: boolean;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Custom className for the trigger button */
  className?: string;
  /** Minimum selectable year */
  minYear?: number;
  /** Maximum selectable year */
  maxYear?: number;
}

function parseValue(value: string): { start: MonthYear | null; end: MonthYear | null } {
  if (!value) return { start: null, end: null };

  // Check if it's a range
  if (value.includes(' to ')) {
    const [startStr, endStr] = value.split(' to ');
    return {
      start: parseMonthYear(startStr),
      end: parseMonthYear(endStr),
    };
  }

  // Single month
  return {
    start: parseMonthYear(value),
    end: null,
  };
}

function parseMonthYear(str: string): MonthYear | null {
  if (!str) return null;
  const [month, yearStr] = str.split('-');
  const year = parseInt(yearStr, 10);
  if (!month || isNaN(year)) return null;
  return { month: month.toLowerCase(), year };
}

function formatMonthYear(my: MonthYear): string {
  return `${my.month}-${my.year}`;
}

function formatDisplayValue(value: string): string {
  const { start, end } = parseValue(value);

  if (!start) return '';

  const startDisplay = `${MONTH_FULL_LABELS[start.month]} ${start.year}`;

  if (!end) return startDisplay;

  const endDisplay = `${MONTH_FULL_LABELS[end.month]} ${end.year}`;
  return `${startDisplay} - ${endDisplay}`;
}

function compareMonthYear(a: MonthYear, b: MonthYear): number {
  if (a.year !== b.year) return a.year - b.year;
  return MONTHS.indexOf(a.month as typeof MONTHS[number]) - MONTHS.indexOf(b.month as typeof MONTHS[number]);
}

function isMonthInRange(month: MonthYear, start: MonthYear | null, end: MonthYear | null): boolean {
  if (!start) return false;
  if (!end) return month.month === start.month && month.year === start.year;

  const monthIndex = compareMonthYear(month, start);
  const monthEndIndex = compareMonthYear(month, end);

  return monthIndex >= 0 && monthEndIndex <= 0;
}

function isMonthEqual(a: MonthYear | null, b: MonthYear | null): boolean {
  if (!a || !b) return false;
  return a.month === b.month && a.year === b.year;
}

export function MonthRangePicker({
  value,
  onValueChange,
  allowRange = true,
  placeholder = 'Select period',
  className,
  minYear = 2020,
  maxYear = new Date().getFullYear() + 1,
}: MonthRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(() => {
    const { start } = parseValue(value);
    return start?.year || new Date().getFullYear();
  });
  const [selecting, setSelecting] = React.useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = React.useState<MonthYear | null>(null);
  const [tempEnd, setTempEnd] = React.useState<MonthYear | null>(null);
  const [hoverMonth, setHoverMonth] = React.useState<MonthYear | null>(null);

  // Initialize temp values from current value when opening
  React.useEffect(() => {
    if (open) {
      const { start, end } = parseValue(value);
      setTempStart(start);
      setTempEnd(end);
      setSelecting('start');
      if (start) {
        setViewYear(start.year);
      }
    }
  }, [open, value]);

  const handleMonthClick = React.useCallback((month: string, year: number) => {
    const clicked: MonthYear = { month, year };

    if (!allowRange) {
      // Single selection mode
      onValueChange(formatMonthYear(clicked));
      setOpen(false);
      return;
    }

    // Range selection mode
    if (selecting === 'start') {
      setTempStart(clicked);
      setTempEnd(null);
      setSelecting('end');
    } else {
      // Selecting end
      if (tempStart && compareMonthYear(clicked, tempStart) < 0) {
        // Clicked before start, swap
        setTempEnd(tempStart);
        setTempStart(clicked);
      } else if (isMonthEqual(clicked, tempStart)) {
        // Same as start, single selection
        onValueChange(formatMonthYear(clicked));
        setOpen(false);
        return;
      } else {
        setTempEnd(clicked);
      }

      // Apply selection
      const finalStart = tempStart && compareMonthYear(clicked, tempStart) < 0 ? clicked : tempStart;
      const finalEnd = tempStart && compareMonthYear(clicked, tempStart) < 0 ? tempStart : clicked;

      if (finalStart && finalEnd && !isMonthEqual(finalStart, finalEnd)) {
        onValueChange(`${formatMonthYear(finalStart)} to ${formatMonthYear(finalEnd)}`);
      } else if (finalStart) {
        onValueChange(formatMonthYear(finalStart));
      }
      setOpen(false);
    }
  }, [allowRange, selecting, tempStart, onValueChange]);

  const handlePrevYear = React.useCallback(() => {
    setViewYear(y => Math.max(minYear, y - 1));
  }, [minYear]);

  const handleNextYear = React.useCallback(() => {
    setViewYear(y => Math.min(maxYear, y + 1));
  }, [maxYear]);

  const displayValue = formatDisplayValue(value);

  // Calculate preview range when hovering
  const previewEnd = selecting === 'end' && hoverMonth ? hoverMonth : tempEnd;
  const effectiveStart = tempStart;
  const effectiveEnd = previewEnd && effectiveStart && compareMonthYear(previewEnd, effectiveStart) >= 0
    ? previewEnd
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {displayValue || placeholder}
          </span>
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevYear}
              disabled={viewYear <= minYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{viewYear}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextYear}
              disabled={viewYear >= maxYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection hint */}
          {allowRange && (
            <p className="text-xs text-muted-foreground text-center mb-3">
              {selecting === 'start' ? 'Select start month' : 'Select end month'}
            </p>
          )}

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month) => {
              const monthYear: MonthYear = { month, year: viewYear };
              const isStart = isMonthEqual(monthYear, effectiveStart);
              const isEnd = isMonthEqual(monthYear, effectiveEnd);
              const isInRange = isMonthInRange(monthYear, effectiveStart, effectiveEnd);
              const isHovered = selecting === 'end' && hoverMonth &&
                isMonthInRange(monthYear, effectiveStart, hoverMonth);

              return (
                <Button
                  key={month}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-9',
                    (isStart || isEnd) && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                    isInRange && !isStart && !isEnd && 'bg-primary/20',
                    isHovered && !isStart && !isInRange && 'bg-primary/10'
                  )}
                  onClick={() => handleMonthClick(month, viewYear)}
                  onMouseEnter={() => setHoverMonth(monthYear)}
                  onMouseLeave={() => setHoverMonth(null)}
                >
                  {MONTH_LABELS[month]}
                </Button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-3 pt-3 border-t flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                setTempStart(null);
                setTempEnd(null);
                setSelecting('start');
              }}
            >
              Clear
            </Button>
            {tempStart && selecting === 'end' && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  if (tempStart) {
                    onValueChange(formatMonthYear(tempStart));
                    setOpen(false);
                  }
                }}
              >
                Single month
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
