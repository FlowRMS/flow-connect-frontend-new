/**
 * List View Component for Tasks
 * Full implementation similar to GridView but in list format
 */

import React from 'react';
import type { Task, TaskPriority } from '../types';
import { getInitials, getAvatarColor, formatTaskDate, getStatusColor } from '../utils';

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
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

export default function ListView({ tasks, onUpdateTask, onSelectTask }: ListViewProps) {
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
                  onUpdateTask(task.id, { completed: !task.completed });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 accent-[var(--primary)] rounded mt-1 flex-shrink-0"
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

                {/* Entity Links */}
                {task.entities && (task.entities.jobs?.length || task.entities.contacts?.length || task.entities.companies?.length) ? (
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {task.entities.jobs?.map((job) => (
                      <span key={job.id} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {job.name}
                      </span>
                    ))}
                    {task.entities.contacts?.map((contact) => (
                      <span key={contact.id} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {contact.name}
                      </span>
                    ))}
                    {task.entities.companies?.map((company) => (
                      <span key={company.id} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {company.name}
                      </span>
                    ))}
                  </div>
                ) : null}
                
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
