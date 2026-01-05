/**
 * TasksTab Component
 * Displays tasks for the check from relatedEntities API
 */

'use client';

import React from 'react';
import { useRelatedEntities } from '@/components/hooks/useCRMApi';
import type { RelatedEntityTask } from '@/components/lib/crm-graphql';

interface TasksTabProps {
  checkId: string;
}

// Get status styling based on task status
function getStatusStyle(status?: string): { border: string; badge: string; label: string } {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return {
        border: 'border-l-green-500',
        badge: 'bg-green-100 text-green-700',
        label: 'Completed',
      };
    case 'IN_PROGRESS':
      return {
        border: 'border-l-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        label: 'In Progress',
      };
    case 'PENDING':
      return {
        border: 'border-l-gray-400',
        badge: 'bg-gray-100 text-gray-700',
        label: 'Pending',
      };
    default:
      return {
        border: 'border-l-gray-400',
        badge: 'bg-gray-100 text-gray-700',
        label: status?.replace(/_/g, ' ') || 'Pending',
      };
  }
}

// Check if a task is overdue
function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status?.toUpperCase() === 'COMPLETED') return false;
  return new Date(dueDate) < new Date();
}

// Check if due soon (within 3 days)
function isDueSoon(dueDate?: string, status?: string): boolean {
  if (!dueDate || status?.toUpperCase() === 'COMPLETED') return false;
  const due = new Date(dueDate);
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  return due > now && due <= threeDaysFromNow;
}

// Get priority styling
function getPriorityStyle(priority?: string): { badge: string; label: string } | null {
  switch (priority?.toUpperCase()) {
    case 'URGENT':
    case 'CRITICAL':
      return {
        badge: 'bg-red-100 text-red-700',
        label: priority,
      };
    case 'HIGH':
      return {
        badge: 'bg-orange-100 text-orange-700',
        label: 'High',
      };
    case 'NORMAL':
    case 'MEDIUM':
      return {
        badge: 'bg-yellow-100 text-yellow-700',
        label: priority,
      };
    case 'LOW':
      return {
        badge: 'bg-gray-100 text-gray-600',
        label: 'Low',
      };
    default:
      return null;
  }
}

export function TasksTab({ checkId }: TasksTabProps) {
  const { data: relatedEntities, isLoading, error } = useRelatedEntities(checkId, 'CHECKS');

  const tasks = relatedEntities?.tasks || [];

  // Format date for display
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load tasks</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Tasks</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Track action items and follow-ups for this check</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
            </svg>
            Add Task
          </button>
        </div>

        {/* Tasks List */}
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task: RelatedEntityTask) => {
              const overdue = isOverdue(task.dueDate, task.status);
              const dueSoon = isDueSoon(task.dueDate, task.status);
              const isCompleted = task.status?.toUpperCase() === 'COMPLETED';

              let statusStyle = getStatusStyle(task.status);
              if (overdue) {
                statusStyle = {
                  border: 'border-l-red-500',
                  badge: 'bg-red-100 text-red-700',
                  label: 'Overdue',
                };
              } else if (dueSoon) {
                statusStyle = {
                  border: 'border-l-yellow-500',
                  badge: 'bg-yellow-100 text-yellow-700',
                  label: 'Due Soon',
                };
              }

              const priorityStyle = getPriorityStyle(task.priority);

              return (
                <div
                  key={task.id}
                  className={`bg-[var(--card)] border-l-4 ${statusStyle.border} border border-[var(--border)] rounded-lg p-4 ${isCompleted ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      readOnly
                      className="mt-1 w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm text-[var(--foreground)] ${isCompleted ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.badge}`}>
                          {statusStyle.label}
                        </span>
                        {priorityStyle && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.badge}`}>
                            {priorityStyle.label}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className={`text-sm text-[var(--muted-foreground)] mt-1 ${isCompleted ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                        {task.dueDate && (
                          <span>Due: {formatDate(task.dueDate)}</span>
                        )}
                        {task.assignedToId && (
                          <span>Assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[var(--muted-foreground)]">No tasks yet</p>
            <button className="mt-2 text-sm text-[var(--primary)] hover:underline">
              Add the first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
