import React from 'react';

export default function DashboardContent() {
  const metrics = [
    {
      title: 'Active Jobs',
      value: '47',
      detail: '$2.3M in pipeline',
      change: '+12%',
    },
    {
      title: 'Tasks Due Today',
      value: '8',
      detail: '3 overdue',
      change: '',
    },
    {
      title: 'Pre-Opportunities',
      value: '23',
      detail: '15 in negotiation',
      change: '+5',
    },
    {
      title: 'Active Contacts',
      value: '342',
      detail: '28 new this month',
      change: '',
    },
  ];

  const activities = [
    {
      type: 'call',
      icon: '📞',
      title: 'Call with Marcus Chen',
      time: '15m ago',
      description: 'Discussed lighting specs for Downtown Plaza project',
      entity: 'Downtown Plaza Renovation',
    },
    {
      type: 'email',
      icon: '✉️',
      title: 'Email sent to Sarah Johnson',
      time: '1h ago',
      description: 'Quote follow-up for HVAC controls',
      entity: 'TechCorp HQ Expansion',
    },
    {
      type: 'note',
      icon: '📝',
      title: 'Note added to Riverside Medical',
      time: '2h ago',
      description: 'Engineer prefers manufacturer spec over alternates',
      entity: 'Riverside Medical Center',
    },
    {
      type: 'meeting',
      icon: '👥',
      title: 'Site visit scheduled',
      time: '3h ago',
      description: 'Meeting with GC and EC next Tuesday at 10am',
      entity: 'Harbor View Apartments',
    },
    {
      type: 'task',
      icon: '✓',
      title: 'Task completed',
      time: '4h ago',
      description: 'Submitted bid package to distributor',
      entity: 'University Lab Building',
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Flow CRM Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Your operational command center for manufacturing sales
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7"/>
            <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
          </svg>
          Add Job
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--info)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 10h4M10 8v4M17 10A7 7 0 103 10a7 7 0 0014 0z" strokeLinecap="round"/>
          </svg>
          Create Contact
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10h10M3 6h14M7 14h6" strokeLinecap="round"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5 hover:shadow-[var(--shadow-md)] transition-shadow"
          >
            <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">{metric.title}</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <div className="text-3xl font-semibold text-[var(--foreground)]">{metric.value}</div>
              {metric.change && (
                <span className="text-sm font-medium text-[var(--success)]">{metric.change}</span>
              )}
            </div>
            {metric.detail && (
              <p className="text-sm text-[var(--muted-foreground)]">{metric.detail}</p>
            )}
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3v14M3 10h14" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7"/>
            </svg>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
          </div>
          <button className="text-sm text-[var(--primary)] hover:underline font-medium">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-xl">
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-[var(--foreground)]">{activity.title}</h4>
                  <span className="text-sm text-[var(--muted-foreground)]">{activity.time}</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-1">{activity.description}</p>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16z"/>
                  </svg>
                  {activity.entity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
