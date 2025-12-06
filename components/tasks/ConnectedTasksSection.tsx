/**
 * Connected Tasks Section Component
 * Displays tasks linked to any entity (Job, Contact, Company, Pre-Opportunity)
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRMTasksByEntity } from '../hooks/useCRMApi';
import type { TaskByEntity, TaskEntityType } from '../lib/crm-graphql';

interface ConnectedTasksSectionProps {
  entityId: string;
  entityType: TaskEntityType;
  title?: string;
  onTaskClick?: (task: TaskByEntity) => void;
  onAddClick?: () => void;
}

/**
 * Get priority color classes
 */
function getPriorityColor(priority: string): string {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-700';
    case 'URGENT':
      return 'bg-orange-100 text-orange-700';
    case 'NORMAL':
      return 'bg-blue-100 text-blue-700';
    case 'LOW':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Get status color classes
 */
function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700';
    case 'TODO':
      return 'bg-yellow-100 text-yellow-700';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'TODO':
      return 'To Do';
    default:
      return status?.charAt(0) + status?.slice(1).toLowerCase();
  }
}

/**
 * Task Card Component
 */
function TaskCard({ task, onClick }: { task: TaskByEntity; onClick?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div 
      className={`p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors ${onClick ? 'cursor-pointer' : ''} ${isCompleted ? 'opacity-70' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Checkbox/status indicator */}
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
            isCompleted 
              ? 'bg-green-500 border-green-500' 
              : 'border-[var(--border)]'
          }`}>
            {isCompleted && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h4 className={`font-medium text-[var(--foreground)] truncate ${isCompleted ? 'line-through text-[var(--muted-foreground)]' : ''}`}>
            {task.title || 'Untitled Task'}
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
            {formatStatus(task.status)}
          </span>
          {onClick && (
            <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
      
      {/* Description */}
      {task.description && (
        <div className="text-sm text-[var(--muted-foreground)] ml-7 mb-3">
          <p className="whitespace-pre-wrap">
            {isExpanded ? task.description : truncateContent(task.description)}
          </p>
          {task.description.length > 150 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[var(--primary)] hover:underline text-xs mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Meta info row */}
      <div className="flex items-center gap-4 ml-7 flex-wrap">
        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-[var(--muted-foreground)]'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(task.dueDate)}</span>
          </div>
        )}

        {/* Priority */}
        {task.priority && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
          </span>
        )}

        {/* Reminder */}
        {task.reminderDate && (
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Reminder: {formatDate(task.reminderDate)}</span>
          </div>
        )}
      </div>
      
      {/* Tags */}
      {task.tags && typeof task.tags === 'string' && task.tags.trim().length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 ml-7">
          {task.tags.split(',').map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Created by */}
      {task.createdBy && (
        <div className="flex items-center gap-1 mt-3 ml-7 text-xs text-[var(--muted-foreground)]">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Created by {task.createdBy}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ConnectedTasksSection({
  entityId,
  entityType,
  title = 'Connected Tasks',
  onTaskClick,
  onAddClick,
}: ConnectedTasksSectionProps) {
  const router = useRouter();
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useCRMTasksByEntity(entityId, entityType);

  const handleTaskClick = (task: TaskByEntity) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      // Default behavior: navigate to tasks page with the task ID
      router.push(`/tasks?id=${task.id}`);
    }
  };

  // Sort tasks: incomplete first (by due date), then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks go to the end
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
    
    // Sort by due date for non-completed tasks
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });

  // Count stats
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
  ).length;

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mt-6">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
          {!isLoading && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                {tasks.length}
              </span>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  {overdueCount} overdue
                </span>
              )}
              {completedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  {completedCount} done
                </span>
              )}
            </div>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              title="Link task"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
              Link Task
            </button>
          )}
          {/* <button
            onClick={() => refetch()}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="Refresh tasks"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button> */}
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p className="text-sm">Failed to load tasks</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-[var(--primary)] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--muted)] rounded-full mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm font-medium">No tasks found</p>
            <p className="text-xs mt-1">Tasks linked to this entity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
