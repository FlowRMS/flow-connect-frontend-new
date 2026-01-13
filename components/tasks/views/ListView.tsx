/**
 * List View Component for Tasks
 * Full implementation similar to GridView but in list format
 */

import React from 'react';
import type { Task, TaskPriority } from '../types';
import { getInitials, getAvatarColor, formatTaskDate, getStatusColor, getReminderStatus, getReminderStatusColor, formatReminderDate } from '../utils';
import { LinkedTitleBadges } from '../components';

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
}

// Priority display helper
const getPriorityBadgeClass = (priority: TaskPriority): string => {
  switch (priority) {
    case 'Critical':
      return 'bg-purple-100 text-purple-700';
    case 'Urgent':
      return 'bg-red-100 text-red-700';
    case 'Normal':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function ListView({ tasks, onUpdateTask, onToggleComplete, onSelectTask }: ListViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onSelectTask(task)}
            className="p-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 accent-[var(--primary)] rounded mt-1 flex-shrink-0 cursor-pointer"
              />
              {/* Assignees display */}
              {task.assigneeNames && task.assigneeNames.length > 0 ? (
                <div className="flex -space-x-2 flex-shrink-0">
                  {task.assigneeNames.slice(0, 3).map((name, idx) => {
                    const displayName = name.trim() || 'Unknown';
                    return (
                      <div
                        key={`${task.id}-assignee-${idx}`}
                        className={`w-10 h-10 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center text-white text-sm font-semibold border-2 border-white`}
                        style={{ zIndex: 3 - idx }}
                        title={displayName}
                      >
                        {getInitials(displayName)}
                      </div>
                    );
                  })}
                  {task.assigneeNames.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold border-2 border-white">
                      +{task.assigneeNames.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(task.assignedTo)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                  {getInitials(task.assignedTo)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={`font-semibold text-[var(--foreground)] text-base ${task.completed ? 'line-through opacity-60' : ''}`}>
                    {task.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-sm text-[var(--muted-foreground)] mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                {/* Due date and assignee */}
                <div className="flex items-center gap-4 mb-2 text-xs text-[var(--muted-foreground)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400 text-[10px] font-medium">Due:</span>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round"/>
                    </svg>
                    {formatTaskDate(task.dueDate)}
                  </span>
                  
                  {/* Reminder Date */}
                  {task.reminderDate && (() => {
                    const status = getReminderStatus(task.reminderDate);
                    return status ? (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${getReminderStatusColor(status)}`}>
                        <span className="text-[10px] font-medium">Reminder:</span>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 2a6 6 0 016 6v4l2 2H2l2-2V8a6 6 0 016-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z" strokeLinecap="round"/>
                        </svg>
                        <span className="font-medium">{status}</span>
                        <span className="opacity-75">({formatReminderDate(task.reminderDate)})</span>
                      </span>
                    ) : null;
                  })()}
                  
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10" cy="6" r="3"/>
                      <path d="M3 18c0-3 3-5 7-5s7 2 7 5" strokeLinecap="round"/>
                    </svg>
                    {task.assigneeNames && task.assigneeNames.length > 0
                      ? (task.assigneeNames.length === 1
                          ? task.assigneeNames[0].trim() || 'Unknown'
                          : `${task.assigneeNames.length} assignees`)
                      : task.assignedTo}
                  </span>
                </div>

                {/* Entity Links - from linkedTitles */}
                <div className="mb-2">
                  <LinkedTitleBadges linkedTitles={task.linkedTitles} maxItems={4} />
                </div>
                
                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
