/**
 * Grid View Component for Tasks
 */

import React from 'react';
import type { Task, TaskDropdownState, TaskPriority } from '../types';
import { AVAILABLE_TASK_TYPES, AVAILABLE_PRIORITIES, AVAILABLE_TAGS, API_STATUS_OPTIONS, API_PRIORITY_OPTIONS } from '../constants';
import { getInitials, getAvatarColor, formatTaskDate, getStatusColor, getPriorityColor, getReminderStatus, getReminderStatusColor, formatReminderDate } from '../utils';
import { LinkedTitleBadges } from '../components';
import type { TaskStatusAPI, TaskPriorityAPI } from '../types';

interface GridViewProps {
  tasks: Task[];
  editState: { taskId: string | null; field: 'title' | 'description' | null; value: string };
  dropdowns: TaskDropdownState;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
  onStartEditing: (taskId: string, field: 'title' | 'description', value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetDropdown: (type: keyof TaskDropdownState, value: string | null) => void;
  onAddTag: (taskId: string, tag: string) => void;
  onRemoveTag: (taskId: string, tag: string) => void;
  onSelectTask: (task: Task) => void;
  setEditValue: (value: string) => void;
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

export default function GridView({
  tasks,
  editState,
  dropdowns,
  onUpdateTask,
  onToggleComplete,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onSetDropdown,
  onAddTag,
  onRemoveTag,
  onSelectTask,
  setEditValue
}: GridViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onSelectTask(task)}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer"
        >
          {/* Task Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 accent-[var(--primary)] rounded flex-shrink-0 cursor-pointer"
              />
              {editState.taskId === task.id && editState.field === 'title' ? (
                <input
                  type="text"
                  value={editState.value}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={onSaveEdit}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  autoFocus
                  className="flex-1 font-semibold text-[var(--foreground)] text-base px-2 py-1 border border-[var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              ) : (
                <h3
                  className={`font-semibold text-[var(--foreground)] text-base cursor-pointer hover:bg-[var(--muted)] px-2 py-1 rounded ${task.completed ? 'line-through opacity-60' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditing(task.id, 'title', task.title);
                  }}
                >
                  {task.title}
                </h3>
              )}
            </div>
            {dropdowns.priority === task.id ? (
              <select
                value={task.priority}
                onChange={(e) => {
                  onUpdateTask(task.id, { priority: e.target.value as Task['priority'] });
                  onSetDropdown('priority', null);
                }}
                onBlur={() => onSetDropdown('priority', null)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="px-2 py-1 border border-[var(--primary)] rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {AVAILABLE_PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <span
                className={`px-2 py-1 ${getPriorityBadgeClass(task.priority)} rounded text-xs font-medium cursor-pointer hover:opacity-80`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDropdown('priority', task.id);
                }}
              >
                {task.priority}
              </span>
            )}
          </div>

          {/* Task Description */}
          {editState.taskId === task.id && editState.field === 'description' ? (
            <textarea
              value={editState.value}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={onSaveEdit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              autoFocus
              rows={3}
              className="w-full text-sm text-[var(--muted-foreground)] mb-4 px-2 py-1 border border-[var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
          ) : (
            <p
              className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2 cursor-pointer hover:bg-[var(--muted)] px-2 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing(task.id, 'description', task.description);
              }}
            >
              {task.description}
            </p>
          )}

          {/* Task Metadata */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-2 flex-wrap">
              {/* Status Badge */}
              <span className={`px-2 py-1 rounded font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              
              {/* Due Date */}
              <span className="flex items-center gap-1">
                <span className="text-gray-400 text-[10px] font-medium">Due:</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="14" height="14" rx="2"/>
                  <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round"/>
                </svg>
                {dropdowns.dueDate === task.id ? (
                  <input
                    type="date"
                    value={task.dueDate}
                    onChange={(e) => {
                      onUpdateTask(task.id, { dueDate: e.target.value });
                      onSetDropdown('dueDate', null);
                    }}
                    onBlur={() => onSetDropdown('dueDate', null)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="px-2 py-1 border border-[var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-xs"
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDropdown('dueDate', task.id);
                    }}
                  >
                    {formatTaskDate(task.dueDate)}
                  </span>
                )}
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
            </div>

            {/* Entity Links - from linkedTitles */}
            <div className="mb-2">
              <LinkedTitleBadges linkedTitles={task.linkedTitles} compact maxItems={3} />
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {task.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium flex items-center gap-1 group cursor-pointer"
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTag(task.id, tag);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                  title="Remove tag"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5l10 10M15 5l-10 10" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            ))}
            {dropdowns.tags === task.id ? (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAddTag(task.id, e.target.value);
                    onSetDropdown('tags', null);
                  }
                }}
                onBlur={() => onSetDropdown('tags', null)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                autoFocus
                className="px-2 py-1 border border-[var(--primary)] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select tag...</option>
                {AVAILABLE_TAGS.filter(t => !task.tags.includes(t)).map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDropdown('tags', task.id);
                }}
                className="px-2 py-1 border border-dashed border-[var(--border)] text-[var(--muted-foreground)] rounded text-xs hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              >
                + Add tag
              </button>
            )}
          </div>

          {/* Task Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            {/* Assignee display - click on task card to edit in modal */}
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-[var(--muted)] px-2 py-1 rounded"
              title="Click task to edit assignee"
            >
              <div className={`w-6 h-6 rounded-full ${getAvatarColor(task.assignedTo)} flex items-center justify-center text-white text-xs font-semibold`}>
                {getInitials(task.assignedTo)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {task.assignedTo}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              {(task.comments ?? 0) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTask(task);
                  }}
                  className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                  </svg>
                  {task.comments}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
