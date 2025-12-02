/**
 * List View Component for Tasks
 * Full implementation similar to GridView but in list format
 */

import React from 'react';
import type { Task, TaskPriority } from '../types';
import { getInitials, getAvatarColor, formatTaskDate, getStatusColor } from '../utils';
import { EntityBadges } from '../components';

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
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(task.assignedTo)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                {getInitials(task.assignedTo)}
              </div>
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
                <div className="flex items-center gap-4 mb-2 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round"/>
                    </svg>
                    {formatTaskDate(task.dueDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10" cy="6" r="3"/>
                      <path d="M3 18c0-3 3-5 7-5s7 2 7 5" strokeLinecap="round"/>
                    </svg>
                    {task.assignedTo}
                  </span>
                </div>

                {/* Entity Links - fetched via API */}
                <div className="mb-2">
                  <EntityBadges taskId={task.id} maxItems={4} />
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
