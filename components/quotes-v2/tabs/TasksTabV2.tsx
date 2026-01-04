'use client';

import React, { useState } from 'react';
import { useRelatedEntities } from '@/components/hooks/useCRMApi';
import type { RelatedEntityTask } from '@/components/lib/crm-graphql';

interface TasksTabV2Props {
  quoteId: string;
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

export function TasksTabV2({ quoteId }: TasksTabV2Props) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeName: '',
  });

  const { data: relatedEntities, isLoading, error } = useRelatedEntities(quoteId, 'QUOTES');

  const tasks = relatedEntities?.tasks || [];

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    // TODO: Implement adding task via API
    console.log('Adding task:', newTask);
    setNewTask({ title: '', description: '', dueDate: '', assigneeName: '' });
    setShowAddTask(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
            <p className="text-sm text-gray-500">Track action items and follow-ups for this quote</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round" />
            </svg>
            Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[60px] resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newTask.assigneeName}
                  onChange={(e) => setNewTask({ ...newTask, assigneeName: e.target.value })}
                  placeholder="Assignee name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowAddTask(false); setNewTask({ title: '', description: '', dueDate: '', assigneeName: '' }); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.title.trim()}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
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
                className={`p-4 bg-white border-l-4 ${statusStyle.border} border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${
                  isCompleted ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    readOnly
                    className="mt-1 rounded border-gray-300 accent-indigo-600"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Title and Status */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusStyle.badge}`}>
                        {statusStyle.label}
                      </span>
                      {priorityStyle && (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.badge}`}>
                          {priorityStyle.label}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="14" height="14" rx="2" />
                            <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round" />
                          </svg>
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.assignedToId && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="7" r="3" />
                            <path d="M3 18v-2a4 4 0 014-4h6a4 4 0 014 4v2" strokeLinecap="round" />
                          </svg>
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && !showAddTask && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-gray-500">No tasks yet</p>
              <button
                onClick={() => setShowAddTask(true)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Add the first task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TasksTabV2;
