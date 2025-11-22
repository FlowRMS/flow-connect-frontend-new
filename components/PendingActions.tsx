'use client';

import React, { useState } from 'react';

export default function PendingActions() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tasks = [
    {
      title: 'Follow up: Downtown Plaza',
      type: 'Call',
      dueTime: 'Today, 2:00 PM',
      contact: 'Marcus Chen',
      priority: 'high',
    },
    {
      title: 'Submit bid package',
      type: 'Task',
      dueTime: 'Today, 4:00 PM',
      contact: 'University Lab',
      priority: 'high',
    },
    {
      title: 'Lunch meeting prep',
      type: 'Meeting',
      dueTime: 'Tomorrow, 11:30 AM',
      contact: 'Sarah Johnson',
      priority: 'medium',
    },
  ];

  const overdueTasks = [
    {
      title: 'Quote revision needed',
      type: 'Follow-up',
      dueTime: '2 days ago',
      contact: 'Harbor View Apts',
      priority: 'overdue',
    },
  ];

  const notifications = [
    {
      type: 'warning',
      message: 'Quote expires in 3 days',
      entity: 'TechCorp HQ',
    },
    {
      type: 'info',
      message: 'New note from team',
      entity: 'Riverside Medical',
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-12 bg-[var(--card)] border-l border-[var(--border)] flex flex-col">
        {/* Collapsed Toggle Button */}
        <div className="p-3 border-b border-[var(--border)]">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            aria-label="Expand tasks panel"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4l-8 6 8 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Collapsed Task Count Badge */}
        <div className="p-3">
          <div className="w-6 h-6 rounded-full bg-[var(--error)] text-white text-xs font-semibold flex items-center justify-center">
            {overdueTasks.length + tasks.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[var(--card)] border-l border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" strokeLinecap="round"/>
          </svg>
          <h2 className="text-base font-semibold text-[var(--foreground)]">My Tasks</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
          aria-label="Collapse tasks panel"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 4l8 6-8 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-[var(--error)]/10 border-b border-[var(--error)]/20">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--error)" stroke="var(--error)" strokeWidth="1.5">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
            </svg>
            <h3 className="text-sm font-semibold text-[var(--error)]">{overdueTasks.length} Overdue</h3>
          </div>
          {overdueTasks.map((task, index) => (
            <div key={index} className="bg-[var(--card)] rounded-lg border border-[var(--error)]/30 p-3">
              <h4 className="font-medium text-sm text-[var(--foreground)] mb-1">{task.title}</h4>
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-2">
                <span>{task.type}</span>
                <span>•</span>
                <span className="text-[var(--error)]">{task.dueTime}</span>
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">{task.contact}</div>
            </div>
          ))}
        </div>
      )}

      {/* Today's Tasks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
          Today
        </h3>
        {tasks.map((task, index) => (
          <div
            key={index}
            className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 hover:shadow-[var(--shadow-sm)] transition-shadow"
          >
            <div className="flex items-start gap-2 mb-2">
              <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" />
              <div className="flex-1">
                <h4 className="font-medium text-sm text-[var(--foreground)] mb-1">{task.title}</h4>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-1">
                  <span className="inline-flex items-center gap-1">
                    {task.type === 'Call' && '📞'}
                    {task.type === 'Task' && '✓'}
                    {task.type === 'Meeting' && '👥'}
                    {task.type}
                  </span>
                  <span>•</span>
                  <span>{task.dueTime}</span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{task.contact}</div>
              </div>
              {task.priority === 'high' && (
                <div className="w-2 h-2 rounded-full bg-[var(--error)] flex-shrink-0 mt-1"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="border-t border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Notifications</h3>
        <div className="space-y-2">
          {notifications.map((notif, index) => (
            <div
              key={index}
              className={`p-2.5 rounded-lg text-xs ${
                notif.type === 'warning'
                  ? 'bg-[var(--warning)]/10 border border-[var(--warning)]/20'
                  : 'bg-[var(--info)]/10 border border-[var(--info)]/20'
              }`}
            >
              <div className="font-medium text-[var(--foreground)] mb-1">{notif.message}</div>
              <div className="text-[var(--muted-foreground)]">{notif.entity}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
