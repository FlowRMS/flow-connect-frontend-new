/**
 * Spreadsheet View Component for Tasks
 */

import React from 'react';
import type { Task } from '../types';
import { AVAILABLE_ASSIGNEES, AVAILABLE_PRIORITIES, AVAILABLE_TASK_TYPES } from '../constants';

interface SpreadsheetViewProps {
  tasks: Task[];
  selectedTasks: string[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
  onSelectTask: (taskId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

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
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tags</th>
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
                      task.status === 'Completed'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.status === 'Completed' && (
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
                    value={task.status}
                    onChange={(e) => onUpdateTask(task.id, { status: e.target.value as Task['status'] })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="Today">Today</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.priority}
                    onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as Task['priority'] })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  >
                    {AVAILABLE_PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.assignedTo}
                    onChange={(e) => onUpdateTask(task.id, { assignedTo: e.target.value })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  >
                    {AVAILABLE_ASSIGNEES.map(assignee => (
                      <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                  </select>
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
                  <select
                    value={task.taskType}
                    onChange={(e) => onUpdateTask(task.id, { taskType: e.target.value })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)]"
                  >
                    {AVAILABLE_TASK_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
