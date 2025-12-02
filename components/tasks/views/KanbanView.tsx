/**
 * Kanban View Component for Tasks
 * Uses API status values for columns and drag-drop
 */

import React from 'react';
import type { Task, TaskStatusAPI, TaskStage } from '../types';
import { TASK_STAGES } from '../constants';
import { formatDate, getAPIPriorityColor } from '../utils';

interface KanbanViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
  draggedTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onKanbanDrop: (targetStatus: TaskStatusAPI) => void;
}

export default function KanbanView({
  tasks,
  onUpdateTask,
  onToggleComplete,
  draggedTaskId,
  onDragStart,
  onDragEnd,
  onKanbanDrop
}: KanbanViewProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: TaskStage) => {
    e.preventDefault();
    if (draggedTaskId) {
      onKanbanDrop(stage.name);
    }
  };

  // Filter tasks by API status
  const getTasksByAPIStatus = (status: TaskStatusAPI) => {
    return tasks.filter(t => t.apiStatus === status);
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {TASK_STAGES.map((stage) => (
        <div 
          key={stage.name} 
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage)}
        >
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center justify-between">
              {stage.label}
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                {getTasksByAPIStatus(stage.name).length}
              </span>
            </h3>
          </div>
          <div className="p-2 space-y-2 min-h-[500px]">
            {getTasksByAPIStatus(stage.name).map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => onDragStart(task.id)}
                onDragEnd={onDragEnd}
                className={`bg-white border border-[var(--border)] rounded-lg p-3 cursor-move hover:shadow-md transition-all ${
                  draggedTaskId === task.id ? 'opacity-50 scale-95' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-[var(--foreground)]">{task.title}</h4>
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ml-2 ${
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
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-2">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round"/>
                    </svg>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {task.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-xs text-[var(--muted-foreground)]">+{task.tags.length - 2}</span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">{task.assignedTo}</span>
                  {(task.apiPriority === 'URGENT' || task.apiPriority === 'CRITICAL') && (
                    <span className={`text-xs font-medium ${task.apiPriority === 'CRITICAL' ? 'text-purple-600' : 'text-red-500'}`}>
                      {task.apiPriority === 'CRITICAL' ? 'Critical' : 'Urgent'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
