/**
 * Spreadsheet View Component for Tasks
 */

import React from 'react';
import type { Task, TaskStatusAPI, TaskPriorityAPI } from '../types';
import { AVAILABLE_ASSIGNEES, API_STATUS_OPTIONS, API_PRIORITY_OPTIONS } from '../constants';
import { convertAPIStatusToUI, convertAPIPriorityToUI } from '../utils';

interface SpreadsheetViewProps {
  tasks: Task[];
  selectedTasks: string[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
  onSelectTask: (taskId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

// Status display labels
const statusLabels: Record<TaskStatusAPI, string> = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled'
};

// Priority display labels
const priorityLabels: Record<TaskPriorityAPI, string> = {
  'LOW': 'Low',
  'NORMAL': 'Normal',
  'URGENT': 'Urgent',
  'CRITICAL': 'Critical'
};

export default function SpreadsheetView({
  tasks,
  selectedTasks,
  onUpdateTask,
  onToggleComplete,
  onSelectTask,
  onSelectAll
}: SpreadsheetViewProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-12">Done</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[300px]">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[375px]">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Entities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => onSelectTask(task.id, e.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
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
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-[var(--foreground)] line-clamp-2">{task.title}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-[var(--muted-foreground)] line-clamp-3">{task.description}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.apiStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as TaskStatusAPI;
                      onUpdateTask(task.id, { 
                        status: convertAPIStatusToUI(newStatus, task.dueDate),
                        apiStatus: newStatus
                      });
                    }}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  >
                    {API_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.apiPriority}
                    onChange={(e) => {
                      const newPriority = e.target.value as TaskPriorityAPI;
                      onUpdateTask(task.id, { 
                        priority: convertAPIPriorityToUI(newPriority),
                        apiPriority: newPriority
                      });
                    }}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  >
                    {API_PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{priorityLabels[p]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-[var(--muted-foreground)]">{task.assignedTo}</div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={task.dueDate}
                    onChange={(e) => onUpdateTask(task.id, { dueDate: e.target.value })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {task.entities?.jobs?.map((job) => (
                      <span key={job.id} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        {job.name}
                      </span>
                    ))}
                    {task.entities?.contacts?.map((contact) => (
                      <span key={contact.id} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        {contact.name}
                      </span>
                    ))}
                    {task.entities?.companies?.map((company) => (
                      <span key={company.id} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                        {company.name}
                      </span>
                    ))}
                    {!task.entities?.jobs?.length && !task.entities?.contacts?.length && !task.entities?.companies?.length && (
                      <span className="text-xs text-[var(--muted-foreground)]">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
