/**
 * Grid View Component for Tasks
 */

import React from 'react';
import type { Task, TaskDropdownState } from '../types';
import { AVAILABLE_ASSIGNEES, AVAILABLE_TASK_TYPES, AVAILABLE_PRIORITIES, AVAILABLE_TAGS } from '../constants';
import { getInitials, getAvatarColor, formatTaskDate } from '../utils';

interface GridViewProps {
  tasks: Task[];
  editState: { taskId: string | null; field: 'title' | 'description' | null; value: string };
  dropdowns: TaskDropdownState;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onStartEditing: (taskId: string, field: 'title' | 'description', value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetDropdown: (type: keyof TaskDropdownState, value: string | null) => void;
  onAddTag: (taskId: string, tag: string) => void;
  onRemoveTag: (taskId: string, tag: string) => void;
  onSelectTask: (task: Task) => void;
  setEditValue: (value: string) => void;
}

export default function GridView({
  tasks,
  editState,
  dropdowns,
  onUpdateTask,
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
                  onUpdateTask(task.id, { completed: !task.completed });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 accent-[var(--primary)] rounded flex-shrink-0"
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
            ) : task.priority === 'Urgent' ? (
              <span
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium cursor-pointer hover:bg-red-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDropdown('priority', task.id);
                }}
              >
                Urgent
              </span>
            ) : (
              <span
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium cursor-pointer hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDropdown('priority', task.id);
                }}
              >
                No priority
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
              {dropdowns.taskType === task.id ? (
                <select
                  value={task.taskType}
                  onChange={(e) => {
                    onUpdateTask(task.id, { taskType: e.target.value });
                    onSetDropdown('taskType', null);
                  }}
                  onBlur={() => onSetDropdown('taskType', null)}
                  autoFocus
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium border border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {AVAILABLE_TASK_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              ) : (
                <span
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium cursor-pointer hover:bg-gray-200"
                  onClick={() => onSetDropdown('taskType', task.id)}
                >
                  {task.taskType}
                </span>
              )}
              <span>Due:</span>
              {dropdowns.dueDate === task.id ? (
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => {
                    onUpdateTask(task.id, { dueDate: e.target.value });
                    onSetDropdown('dueDate', null);
                  }}
                  onBlur={() => onSetDropdown('dueDate', null)}
                  autoFocus
                  className="px-2 py-1 border border-[var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              ) : (
                <span
                  className="cursor-pointer hover:bg-[var(--muted)] px-2 py-1 rounded"
                  onClick={() => onSetDropdown('dueDate', task.id)}
                >
                  {formatTaskDate(task.dueDate)}
                </span>
              )}
            </div>

            {/* Entity Links */}
            {task.entities && (
              <div className="flex gap-1.5 flex-wrap text-xs">
                {task.entities.jobs?.map((job, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    Job: {job}
                  </span>
                ))}
                {task.entities.contacts?.map((contact, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {contact}
                  </span>
                ))}
                {task.entities.companies?.map((company, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {company}
                  </span>
                ))}
              </div>
            )}
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
            {dropdowns.assignee === task.id ? (
              <select
                value={task.assignedTo}
                onChange={(e) => {
                  onUpdateTask(task.id, { assignedTo: e.target.value });
                  onSetDropdown('assignee', null);
                }}
                onBlur={() => onSetDropdown('assignee', null)}
                autoFocus
                className="flex items-center gap-2 px-2 py-1 border border-[var(--primary)] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {AVAILABLE_ASSIGNEES.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-[var(--muted)] px-2 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDropdown('assignee', task.id);
                }}
              >
                <div className={`w-6 h-6 rounded-full ${getAvatarColor(task.assignedTo)} flex items-center justify-center text-white text-xs font-semibold`}>
                  {getInitials(task.assignedTo)}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {task.assignedTo}
                </div>
              </div>
            )}
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
