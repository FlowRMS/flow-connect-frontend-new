/**
 * List View Component for Tasks
 * Full implementation similar to GridView but in list format
 */

import React from 'react';
import type { Task } from '../types';
import { getInitials, getAvatarColor } from '../utils';

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onSelectTask: (task: Task) => void;
}

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
                <h3 className={`font-semibold text-[var(--foreground)] text-base mb-1 ${task.completed ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                  {task.description}
                </p>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
