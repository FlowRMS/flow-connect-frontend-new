'use client';

import React, { useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  taskType: string;
  status: 'Today' | 'Overdue' | 'Upcoming' | 'Waiting' | 'Completed';
  tags: string[];
  entityType?: string;
  entityName?: string;
  priority: 'High' | 'Medium' | 'Low';
};

export default function TasksContent() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const initialTasks: Task[] = [
    {
      id: 'T-001',
      title: 'Follow up with Turner on lighting spec',
      description: 'Discuss updated lighting requirements for Downtown Plaza',
      dueDate: '2024-11-22',
      assignedTo: 'Sarah Johnson',
      taskType: 'Follow-up',
      status: 'Today',
      tags: ['Commercial', 'Lighting'],
      entityType: 'Job',
      entityName: 'Downtown Plaza Renovation',
      priority: 'High',
    },
    {
      id: 'T-002',
      title: 'Site visit - Riverside Medical Center',
      description: 'Walk through with PM and EC to review panel locations',
      dueDate: '2024-11-20',
      assignedTo: 'Sarah Johnson',
      taskType: 'Site Visit',
      status: 'Overdue',
      tags: ['Healthcare', 'Critical'],
      entityType: 'Job',
      entityName: 'Riverside Medical Center',
      priority: 'High',
    },
    {
      id: 'T-003',
      title: 'Send quote for TechCorp HQ HVAC controls',
      description: 'Prepare and send quote for HVAC control system',
      dueDate: '2024-11-25',
      assignedTo: 'Marcus Chen',
      taskType: 'General',
      status: 'Upcoming',
      tags: ['HVAC', 'Quote'],
      entityType: 'Pre-Opportunity',
      entityName: 'TechCorp HVAC Controls',
      priority: 'Medium',
    },
    {
      id: 'T-004',
      title: 'Call - Miller Electric purchasing',
      description: 'Discuss Q1 pricing and new product availability',
      dueDate: '2024-11-22',
      assignedTo: 'Marcus Chen',
      taskType: 'Call',
      status: 'Today',
      tags: ['EC', 'Pricing'],
      entityType: 'Contact',
      entityName: 'Jennifer Walsh',
      priority: 'Medium',
    },
    {
      id: 'T-005',
      title: 'Waiting on factory - University Lab specs',
      description: 'Need factory response on custom panel requirements',
      dueDate: '2024-11-28',
      assignedTo: 'David Torres',
      taskType: 'Waiting',
      status: 'Waiting',
      tags: ['Education', 'Specialty'],
      entityType: 'Job',
      entityName: 'University Lab Building',
      priority: 'Low',
    },
    {
      id: 'T-006',
      title: 'Lunch and learn - Skanska office',
      description: 'Present new LED product line to Skanska team',
      dueDate: '2024-11-27',
      assignedTo: 'Sarah Johnson',
      taskType: 'Lunch-and-Learn',
      status: 'Upcoming',
      tags: ['Education', 'GC'],
      entityType: 'Company',
      entityName: 'Skanska USA',
      priority: 'Medium',
    },
    {
      id: 'T-007',
      title: 'Trade show prep - LightFair 2025',
      description: 'Coordinate booth setup and meeting schedule',
      dueDate: '2024-12-01',
      assignedTo: 'Marcus Chen',
      taskType: 'Trade Show',
      status: 'Upcoming',
      tags: ['Events', 'Networking'],
      priority: 'High',
    },
    {
      id: 'T-008',
      title: 'Meeting - McCarthy Building quarterly review',
      description: 'Review Q4 activity and Q1 opportunities',
      dueDate: '2024-11-22',
      assignedTo: 'David Torres',
      taskType: 'Meeting',
      status: 'Today',
      tags: ['GC', 'Healthcare'],
      entityType: 'Company',
      entityName: 'McCarthy Building',
      priority: 'High',
    },
    {
      id: 'T-009',
      title: 'Submit bid - Harbor View Apartments electrical',
      description: 'Final bid review and submission for electrical package',
      dueDate: '2024-11-19',
      assignedTo: 'Marcus Chen',
      taskType: 'General',
      status: 'Overdue',
      tags: ['Residential', 'Bidding'],
      entityType: 'Job',
      entityName: 'Harbor View Apartments',
      priority: 'High',
    },
    {
      id: 'T-010',
      title: 'Update CRM notes - Prime Electric',
      description: 'Log recent conversation about upcoming projects',
      dueDate: '2024-11-23',
      assignedTo: 'David Torres',
      taskType: 'Note/Action',
      status: 'Upcoming',
      tags: ['EC', 'Follow-up'],
      entityType: 'Company',
      entityName: 'Prime Electric',
      priority: 'Low',
    },
  ];

  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const categories = ['All', 'Today', 'Overdue', 'Upcoming', 'Waiting', 'Completed'];
  const taskTypes = ['All Types', 'Call', 'Meeting', 'Follow-up', 'Site Visit', 'Lunch-and-Learn', 'Trade Show', 'General', 'Note/Action', 'Waiting'];

  const filteredTasks = selectedCategory === 'All'
    ? tasks
    : tasks.filter(task => task.status === selectedCategory);

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status).length;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'Call':
        return '📞';
      case 'Meeting':
        return '👥';
      case 'Site Visit':
        return '🏗️';
      case 'Lunch-and-Learn':
        return '🍽️';
      case 'Trade Show':
        return '🎪';
      case 'Follow-up':
        return '🔄';
      case 'Note/Action':
        return '📝';
      case 'Waiting':
        return '⏳';
      default:
        return '✓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'Completed' ? 'Upcoming' : 'Completed' }
          : task
      )
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Tasks</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage your activities, follow-ups, and action items
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{getTasksByStatus('Overdue')}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Overdue</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-[var(--primary)]">{getTasksByStatus('Today')}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Due Today</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{getTasksByStatus('Upcoming')}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Upcoming</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{getTasksByStatus('Waiting')}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Waiting</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{getTasksByStatus('Completed')}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Completed</div>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              viewMode === 'list'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              viewMode === 'calendar'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Calendar
          </button>
        </div>

        <div className="flex gap-2 pb-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
            </svg>
            Sort
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            {category}
            {category !== 'All' && (
              <span className="ml-2 text-xs opacity-75">
                ({getTasksByStatus(category)})
              </span>
            )}
            {category === 'All' && (
              <span className="ml-2 text-xs opacity-75">({tasks.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:shadow-md transition-all ${
                task.status === 'Completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  onChange={() => toggleTaskComplete(task.id)}
                  className="mt-1 w-4 h-4 accent-[var(--primary)]"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{getTaskTypeIcon(task.taskType)}</span>
                      <h3 className={`font-medium text-[var(--foreground)] ${
                        task.status === 'Completed' ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">{task.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="7" r="4"/>
                          <path d="M3 20c0-4 3-7 7-7s7 3 7 7" strokeLinecap="round"/>
                        </svg>
                        {task.assignedTo}
                      </div>
                      {task.entityType && task.entityName && (
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {task.entityType}
                          </span>
                          <span>{task.entityName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {task.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Calendar View Placeholder */
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-12 text-center">
          <svg className="mx-auto mb-4 w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Calendar View</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Calendar view coming soon</p>
        </div>
      )}
    </main>
  );
}
