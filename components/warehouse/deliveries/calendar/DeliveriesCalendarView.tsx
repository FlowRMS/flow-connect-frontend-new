'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RecurringShipment, IncomingShipment } from '@/lib/types/warehouse';

interface DeliveriesCalendarViewProps {
  deliveries: IncomingShipment[];
  recurringShipments: RecurringShipment[];
  onViewRecurring?: (recurring: RecurringShipment) => void;
}

export default function DeliveriesCalendarView({
  deliveries,
  recurringShipments,
  onViewRecurring,
}: DeliveriesCalendarViewProps) {
  const router = useRouter();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const monthData = useMemo(() => {
    const oneOff = deliveries
      .filter((shipment) => {
        if (!shipment.eta) return false;
        const date = new Date(shipment.eta);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .map((shipment) => ({
        date: new Date(shipment.eta).toISOString().split('T')[0],
        shipment,
      }));

    const recurring = recurringShipments
      .filter((shipment) => shipment.status === 'ACTIVE' || shipment.status === 'PAUSED')
      .filter((shipment) => shipment.nextExpectedDate)
      .filter((shipment) => {
        const date = new Date(shipment.nextExpectedDate as string);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .map((shipment) => ({
        date: shipment.nextExpectedDate as string,
        recurring: shipment,
      }));

    return { oneOff, recurring };
  }, [deliveries, recurringShipments, currentYear, currentMonth]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date | null; day: number | null }[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, day: null });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(currentYear, currentMonth, day),
        day,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const getDeliveriesForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const oneOff = monthData.oneOff.filter(d => d.date === dateStr);
    const recurring = monthData.recurring.filter(d => d.date === dateStr);
    return { oneOff, recurring };
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm font-medium hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-[var(--muted-foreground)]">Expected Deliveries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-[var(--muted-foreground)]">Recurring Schedules</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]/30">
          {dayNames.map(day => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dayInfo, index) => {
            const deliveries = dayInfo.date ? getDeliveriesForDay(dayInfo.date) : { oneOff: [], recurring: [] };
            const totalItems = deliveries.oneOff.length + deliveries.recurring.length;

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-[var(--border)] p-2 ${
                  !dayInfo.date ? 'bg-[var(--muted)]/20' : ''
                } ${isToday(dayInfo.date) ? 'ring-2 ring-inset ring-[var(--primary)]' : ''}`}
              >
                {dayInfo.day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(dayInfo.date) ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                    }`}>
                      {dayInfo.day}
                    </div>

                    <div className="space-y-1">
                      {/* One-off deliveries - Blue */}
                      {deliveries.oneOff.slice(0, 2).map(({ shipment }) => (
                        <button
                          key={shipment.id}
                          onClick={() => router.push(`/warehouse/deliveries/${shipment.id}`)}
                          className="w-full text-left text-xs p-1.5 bg-blue-50 border-l-2 border-blue-500 rounded cursor-pointer hover:bg-blue-100 transition-colors truncate"
                        >
                          <div className="font-medium text-blue-900 truncate">{shipment.poNumber}</div>
                          <div className="text-blue-700 truncate">{shipment.vendorName}</div>
                        </button>
                      ))}

                      {/* Recurring schedules - Green */}
                      {deliveries.recurring
                        .slice(0, 2 - Math.min(deliveries.oneOff.length, 2))
                        .map(({ recurring }, idx) => {
                          const isPaused = recurring.status === 'PAUSED';

                          return (
                            <button
                              key={`${recurring.id}-${idx}`}
                              onClick={() => onViewRecurring?.(recurring)}
                              className={`w-full text-left text-xs p-1.5 rounded cursor-pointer transition-colors truncate ${
                                isPaused
                                  ? 'bg-gray-50 border-l-2 border-gray-400 hover:bg-gray-100'
                                  : 'bg-green-50 border-l-2 border-green-500 hover:bg-green-100'
                              }`}
                            >
                              <div
                                className={`font-medium truncate flex items-center gap-1 ${
                                  isPaused ? 'text-gray-800' : 'text-green-900'
                                }`}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="flex-shrink-0"
                                >
                                  <path d="M17 1l4 4-4 4" />
                                  <path d="M3 11V9a4 4 0 014-4h14" />
                                  <path d="M7 23l-4-4 4-4" />
                                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                                </svg>
                                <span className="truncate">{recurring.name}</span>
                              </div>
                              <div className={`truncate ${isPaused ? 'text-gray-600' : 'text-green-700'}`}>
                                {recurring.vendorName}
                              </div>
                            </button>
                          );
                        })}

                      {/* Overflow indicator */}
                      {totalItems > 2 && (
                        <div className="text-xs text-[var(--muted-foreground)] pl-1">
                          +{totalItems - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
        <div>
          <span className="font-medium text-[var(--foreground)]">{monthData.oneOff.length}</span> expected deliveries this month
        </div>
        <div>
          <span className="font-medium text-[var(--foreground)]">{monthData.recurring.length}</span> recurring schedule dates
        </div>
      </div>
    </div>
  );
}
