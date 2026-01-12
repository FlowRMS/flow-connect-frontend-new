/**
 * Spreadsheet View Component for Tasks
 */

import React from 'react';
import type { Task, TaskStatusAPI, TaskPriorityAPI } from '../types';
import { AVAILABLE_ASSIGNEES, API_STATUS_OPTIONS, API_PRIORITY_OPTIONS } from '../constants';
import { convertAPIStatusToUI, convertAPIPriorityToUI, getReminderStatus, getReminderStatusColor, formatReminderDate, getInitials, getAvatarColor } from '../utils';
import { CustomSelect, LinkedTitleBadges } from '../components';
import { StyledDatePicker, parseDateString, formatDateToString } from '../components';

interface SpreadsheetViewProps {
  tasks: Task[];
  selectedTasks: string[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
  onSelectTask: (taskId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

// Status display labels
const statusLabels: Record<TaskStatusAPI, string> = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled'
};

// Priority display labels
const priorityLabels: Record<TaskPriorityAPI, string> = {
  'LOW': 'Low',
  'NORMAL': 'Normal',
  'URGENT': 'Urgent',
  'CRITICAL': 'Critical'
};

// Status options for CustomSelect
const statusOptions = API_STATUS_OPTIONS.map(s => ({
  value: s,
  label: statusLabels[s],
}));

// Priority options for CustomSelect  
const priorityOptions = API_PRIORITY_OPTIONS.map(p => ({
  value: p,
  label: priorityLabels[p],
  color: p === 'CRITICAL' ? '#9333ea' : p === 'URGENT' ? '#ef4444' : p === 'NORMAL' ? '#3b82f6' : '#9ca3af',
}));

export default function SpreadsheetView({
  tasks,
  selectedTasks,
  onUpdateTask,
  onToggleComplete,
  onSelectTask,
  onSelectAll
}: SpreadsheetViewProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-12">Done</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[300px]">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[375px]">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Reminder</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Entities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => onSelectTask(task.id, e.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.apiStatus === 'COMPLETED'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.apiStatus === 'COMPLETED' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="3">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-[var(--foreground)] line-clamp-2">{task.title}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-[var(--muted-foreground)] line-clamp-3">{task.description}</div>
                </td>
                <td className="px-4 py-3">
                  <CustomSelect
                    value={task.apiStatus}
                    options={statusOptions}
                    onChange={(newStatus) => {
                      onUpdateTask(task.id, { 
                        status: convertAPIStatusToUI(newStatus, task.dueDate),
                        apiStatus: newStatus
                      });
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <CustomSelect
                    value={task.apiPriority}
                    options={priorityOptions}
                    onChange={(newPriority) => {
                      onUpdateTask(task.id, { 
                        priority: convertAPIPriorityToUI(newPriority),
                        apiPriority: newPriority
                      });
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  {task.assigneeNames && task.assigneeNames.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {task.assigneeNames.slice(0, 2).map((name, idx) => {
                          const displayName = name.trim() || 'Unknown';
                          return (
                            <div
                              key={`${task.id}-assignee-${idx}`}
                              className={`w-6 h-6 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center text-white text-[10px] font-semibold border border-white`}
                              title={displayName}
                            >
                              {getInitials(displayName)}
                            </div>
                          );
                        })}
                        {task.assigneeNames.length > 2 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-semibold border border-white">
                            +{task.assigneeNames.length - 2}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {task.assigneeNames.length === 1
                          ? task.assigneeNames[0].trim() || 'Unknown'
                          : `${task.assigneeNames.length} assignees`}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--muted-foreground)]">{task.assignedTo}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StyledDatePicker
                    selected={parseDateString(task.dueDate)}
                    onChange={(date) => onUpdateTask(task.id, { dueDate: formatDateToString(date) })}
                    placeholderText="Select date..."
                  />
                </td>
                <td className="px-4 py-3">
                  {task.reminderDate ? (() => {
                    const status = getReminderStatus(task.reminderDate);
                    return (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${status ? getReminderStatusColor(status) : 'bg-gray-50 text-gray-600'}`}>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 2a6 6 0 016 6v4l2 2H2l2-2V8a6 6 0 016-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z" strokeLinecap="round"/>
                        </svg>
                        <span className="font-medium">{formatReminderDate(task.reminderDate)}</span>
                        {status && <span className="opacity-75">({status})</span>}
                      </span>
                    );
                  })() : <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <LinkedTitleBadges linkedTitles={task.linkedTitles} compact maxItems={3} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
