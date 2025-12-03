/**
 * Kanban View Component for Tasks
 * Uses API status values for columns and drag-drop
 */

import React from 'react';
import type { Task, TaskStatusAPI, TaskStage } from '../types';
import { TASK_STAGES } from '../constants';
import { formatDate, getAPIPriorityColor, getReminderStatus, getReminderStatusColor, formatReminderDate } from '../utils';

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
                <div className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)] mb-2">
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400 text-[10px] font-medium">Due:</span>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round"/>
                    </svg>
                    {formatDate(task.dueDate)}
                  </span>
                  
                  {/* Reminder Date */}
                  {task.reminderDate && (() => {
                    const status = getReminderStatus(task.reminderDate);
                    return (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded w-fit ${status ? getReminderStatusColor(status) : 'bg-blue-50 text-blue-600'}`}>
                        <span className="text-[10px] font-medium">Reminder:</span>
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 2a6 6 0 016 6v4l2 2H2l2-2V8a6 6 0 016-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z" strokeLinecap="round"/>
                        </svg>
                        <span className="font-medium">{formatReminderDate(task.reminderDate)}</span>
                        {status && <span className="text-[10px] opacity-75">({status})</span>}
                      </span>
                    );
                  })()}
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
                {/* Linked Entities */}
                {(task.entities?.jobs?.length || task.entities?.contacts?.length || task.entities?.companies?.length) ? (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {task.entities?.jobs?.slice(0, 1).map((job) => (
                      <span key={job.id} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {job.name}
                      </span>
                    ))}
                    {task.entities?.contacts?.slice(0, 1).map((contact) => (
                      <span key={contact.id} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {contact.name}
                      </span>
                    ))}
                    {task.entities?.companies?.slice(0, 1).map((company) => (
                      <span key={company.id} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {company.name}
                      </span>
                    ))}
                    {((task.entities?.jobs?.length ?? 0) + (task.entities?.contacts?.length ?? 0) + (task.entities?.companies?.length ?? 0)) > 3 && (
                      <span className="text-xs text-[var(--muted-foreground)]">+more</span>
                    )}
                  </div>
                ) : null}
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
