/**
 * Calendar View Component for Tasks
 */

import React, { useState } from 'react';
import type { Task } from '../types';
import { DAYS_OF_WEEK, MONTH_NAMES } from '../constants';
import { generateCalendarDays, getTasksForDate, isToday, getPriorityBorderColor } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
}

export default function CalendarView({ tasks, onToggleComplete }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const calendarDays = generateCalendarDays(currentYear, currentMonth);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-[var(--muted-foreground)] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((calDay, idx) => {
            const dayTasks = getTasksForDate(tasks, calDay.date);
            const isTodayDate = isToday(calDay.date);

            return (
              <div
                key={idx}
                className={`min-h-[120px] border border-[var(--border)] rounded-lg p-2 ${
                  calDay.isCurrentMonth ? 'bg-[var(--background)]' : 'bg-[var(--muted)]/20'
                } ${isTodayDate ? 'ring-2 ring-[var(--primary)]' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  calDay.isCurrentMonth ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                } ${isTodayDate ? 'text-[var(--primary)]' : ''}`}>
                  {calDay.day}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1.5 bg-white border-l-2 ${getPriorityBorderColor(task.priority)} rounded cursor-pointer hover:shadow-sm transition-shadow ${
                        task.status === 'Completed' ? 'opacity-50 line-through' : ''
                      }`}
                      onClick={() => onToggleComplete(task.id)}
                      title={task.title}
                    >
                      <div className="font-medium text-[var(--foreground)] truncate">{task.title}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--muted-foreground)] truncate">{task.assignedTo}</span>
                        {(task.entities?.jobs?.length || task.entities?.contacts?.length || task.entities?.companies?.length) ? (
                          <span className="flex items-center gap-0.5 ml-auto">
                            {task.entities?.jobs?.length ? (
                              <span className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center" title={`${task.entities.jobs.length} job(s)`}>
                                <span className="text-[8px] text-green-600">{task.entities.jobs.length}</span>
                              </span>
                            ) : null}
                            {task.entities?.contacts?.length ? (
                              <span className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center" title={`${task.entities.contacts.length} contact(s)`}>
                                <span className="text-[8px] text-orange-600">{task.entities.contacts.length}</span>
                              </span>
                            ) : null}
                            {task.entities?.companies?.length ? (
                              <span className="w-3 h-3 bg-indigo-100 rounded-full flex items-center justify-center" title={`${task.entities.companies.length} company(ies)`}>
                                <span className="text-[8px] text-indigo-600">{task.entities.companies.length}</span>
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-[var(--muted-foreground)] pl-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
