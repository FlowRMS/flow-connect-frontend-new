/**
 * RelatedTasksSection Component - CENTRALIZED
 * Displays linked tasks for any entity with ability to link/unlink and mark complete
 */

'use client';

import React, { useState } from 'react';
import { useRelatedEntities, useDeleteCRMLinkByEntities, useUpdateCRMTask } from '../hooks/useCRMApi';
import type { RelatedEntityTask, RelatedEntitiesSourceType } from '../lib/crm-graphql';
import type { TaskPriorityAPI as TaskPriority } from '../lib/graphql';
import { AddLinkModal } from './AddLinkModal';
import { linkToasts } from '../lib/toast';

interface RelatedTasksSectionProps {
  entityId: string;
  sourceType: RelatedEntitiesSourceType;
  sourceEntityType: 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK';
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
    case 'TODO':
      return {
        border: 'border-l-gray-400',
        badge: 'bg-gray-100 text-gray-700',
        label: 'To Do',
      };
    case 'CANCELLED':
      return {
        border: 'border-l-red-300',
        badge: 'bg-red-50 text-red-600',
        label: 'Cancelled',
      };
    default:
      return {
        border: 'border-l-gray-400',
        badge: 'bg-gray-100 text-gray-700',
        label: status?.replace(/_/g, ' ') || 'To Do',
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

export function RelatedTasksSection({ entityId, sourceType, sourceEntityType }: RelatedTasksSectionProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkingTaskId, setUnlinkingTaskId] = useState<string | null>(null);

  const { data: relatedEntities, isLoading, error, refetch } = useRelatedEntities(entityId, sourceType);
  const deleteLinkMutation = useDeleteCRMLinkByEntities();
  const updateTaskMutation = useUpdateCRMTask();

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

  // Handle toggle task complete
  const handleToggleTaskComplete = async (task: RelatedEntityTask) => {
    try {
      const newStatus = task.status?.toUpperCase() === 'COMPLETED' ? 'TODO' : 'COMPLETED';

      await updateTaskMutation.mutateAsync({
        id: task.id,
        input: {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: newStatus,
          priority: (task.priority as TaskPriority) || 'NORMAL',
          assigneeIds: task.assignees || [],
          reminderDate: task.reminderDate,
          tags: task.tags,
        },
      });

      // Refetch related entities to update the UI
      refetch();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Handle unlink
  const handleUnlink = async (taskId: string) => {
    if (!confirm('Are you sure you want to unlink this task?')) return;

    setUnlinkingTaskId(taskId);
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: sourceEntityType,
        sourceEntityId: entityId,
        targetEntityType: 'TASK',
        targetEntityId: taskId,
      });
      linkToasts.deleteSuccess('Task');
      refetch();
    } catch (error) {
      console.error('Failed to unlink task:', error);
      linkToasts.deleteError('Task');
    } finally {
      setUnlinkingTaskId(null);
    }
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
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Tasks</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Linked tasks for this record</p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Link Task
          </button>
        </div>

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
                className={`bg-[var(--card)] border-l-4 ${statusStyle.border} border border-[var(--border)] rounded-lg p-4 ${isCompleted ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleTaskComplete(task)}
                    disabled={updateTaskMutation.isPending}
                    className="mt-1 w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer disabled:cursor-not-allowed"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Title and Badges */}
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

                    {/* Description */}
                    {task.description && (
                      <p className={`text-sm text-[var(--muted-foreground)] mt-1 ${isCompleted ? 'line-through' : ''}`}>
                        {task.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                      {task.dueDate && (
                        <span>Due: {formatDate(task.dueDate)}</span>
                      )}
                      {/* Display assignees if available */}
                      {task.assignees && task.assignees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="6" r="3"/>
                            <path d="M3 18c0-3 3-5 7-5s7 2 7 5" strokeLinecap="round"/>
                          </svg>
                          {task.assignees.length === 1
                            ? '1 assignee'
                            : `${task.assignees.length} assignees`}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {(() => {
                      // Handle both string and array formats for tags, filter out empty strings
                      let allTags: string[] = [];

                      if (typeof task.tags === 'string' && task.tags.trim()) {
                        allTags = task.tags.split(',').map(t => t.trim()).filter(Boolean);
                      } else if (Array.isArray(task.tags)) {
                        allTags = task.tags
                          .flatMap(tagString => (typeof tagString === 'string' ? tagString.split(',') : []))
                          .map(t => t.trim())
                          .filter(Boolean);
                      }

                      if (allTags.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {allTags.map((tag, idx) => (
                              <span
                                key={`tag-${idx}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Unlink Button */}
                  <button
                    onClick={() => handleUnlink(task.id)}
                    disabled={unlinkingTaskId === task.id}
                    className="p-1 hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0 text-[var(--muted-foreground)] hover:text-red-500"
                    title="Unlink task"
                  >
                    {unlinkingTaskId === task.id ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 6l8 8" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[var(--muted-foreground)] mb-2">No tasks linked</p>
              <button
                onClick={() => setShowLinkModal(true)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Link your first task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      <AddLinkModal
        isOpen={showLinkModal}
        sourceEntityId={entityId}
        sourceEntityType={sourceEntityType}
        initialEntityType="TASK"
        onClose={() => setShowLinkModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default RelatedTasksSection;
