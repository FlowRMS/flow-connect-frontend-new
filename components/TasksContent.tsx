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
  entities?: {
    jobs?: string[];
    contacts?: string[];
    companies?: string[];
  };
  priority: 'No priority' | 'Urgent' | 'High' | 'Medium' | 'Low';
};

function CalendarView({ tasks, onToggleComplete }: { tasks: Task[], onToggleComplete: (id: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Month names
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate === dateStr);
  };

  // Generate calendar days
  const calendarDays = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonth, day),
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, day),
    });
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'border-l-red-500';
      case 'Medium':
        return 'border-l-yellow-500';
      case 'Low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-[var(--muted-foreground)] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((calDay, idx) => {
            const dayTasks = getTasksForDate(calDay.date);
            const isTodayDate = isToday(calDay.date);

            return (
              <div
                key={idx}
                className={`min-h-[120px] border border-[var(--border)] rounded-lg p-2 ${
                  calDay.isCurrentMonth ? 'bg-[var(--background)]' : 'bg-[var(--muted)]/20'
                } ${isTodayDate ? 'ring-2 ring-[var(--primary)]' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  calDay.isCurrentMonth ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                } ${isTodayDate ? 'text-[var(--primary)]' : ''}`}>
                  {calDay.day}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1.5 bg-white border-l-2 ${getPriorityColor(task.priority)} rounded cursor-pointer hover:shadow-sm transition-shadow ${
                        task.status === 'Completed' ? 'opacity-50 line-through' : ''
                      }`}
                      onClick={() => onToggleComplete(task.id)}
                      title={task.title}
                    >
                      <div className="font-medium text-[var(--foreground)] truncate">{task.title}</div>
                      <div className="text-[var(--muted-foreground)] truncate">{task.assignedTo}</div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-[var(--muted-foreground)] pl-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TasksContent() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState<string | null>(null);
  const [showTagsDropdown, setShowTagsDropdown] = useState<string | null>(null);
  const [showEntityDropdown, setShowEntityDropdown] = useState<string | null>(null);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState<string | null>(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState<string | null>(null);

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
      entities: {
        jobs: ['Downtown Plaza Renovation'],
        contacts: ['Michael Rodriguez'],
        companies: ['Turner Construction']
      },
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
      entities: {
        jobs: ['Riverside Medical Center'],
        companies: ['McCarthy Building', 'Johnson Controls']
      },
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
      entities: {
        jobs: ['TechCorp HQ Expansion'],
        contacts: ['David Chen']
      },
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
      entities: {
        contacts: ['Jennifer Walsh'],
        companies: ['Miller Electric']
      },
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
      entities: {
        jobs: ['University Lab Building']
      },
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
      entities: {
        companies: ['Skanska USA']
      },
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
      entities: {
        companies: ['McCarthy Building'],
        contacts: ['Robert Jackson']
      },
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
      entities: {
        jobs: ['Harbor View Apartments'],
        companies: ['Bay Area Electric']
      },
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
      entities: {
        companies: ['Prime Electric'],
        contacts: ['Rachel Kim']
      },
      priority: 'Low',
    },
  ];

  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Available options for dropdowns
  const availableAssignees = ['Sarah Johnson', 'Marcus Chen', 'David Torres', 'Emily Roberts'];
  const availableTags = ['Commercial', 'Healthcare', 'HVAC', 'Lighting', 'Controls', 'EC', 'GC', 'Pricing', 'Education', 'Specialty', 'Quote', 'Bidding', 'Residential', 'Follow-up', 'Events', 'Networking'];
  const availableEntityTypes = ['Job', 'Contact', 'Company', 'Pre-Opportunity'];
  const allEntities = {
    Job: ['Downtown Plaza Renovation', 'Riverside Medical Center', 'TechCorp HQ Expansion', 'Harbor View Apartments', 'University Lab Building'],
    Contact: ['Jennifer Walsh', 'Michael Rodriguez', 'David Chen', 'Rachel Kim'],
    Company: ['Turner Construction', 'Miller Electric', 'McCarthy Building', 'Skanska USA', 'Prime Electric'],
    'Pre-Opportunity': ['TechCorp HVAC Controls', 'LED Retrofit - Hospital', 'Controls Upgrade']
  };

  const categories = ['All', 'Today', 'Overdue', 'Upcoming', 'Waiting', 'Completed'];
  const availableTaskTypes = ['Call', 'Meeting', 'Follow-up', 'Site Visit', 'Lunch-and-Learn', 'Trade Show', 'General', 'Note/Action', 'Waiting'];

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const toggleTag = (taskId: string, tag: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTags = task.tags.includes(tag)
      ? task.tags.filter(t => t !== tag)
      : [...task.tags, tag];

    updateTask(taskId, { tags: newTags });
  };

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-red-500">
            <circle cx="8" cy="12" r="1" fill="currentColor"/>
            <path d="M8 2v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'High':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-600">
            <rect x="2" y="4" width="3" height="10" rx="1"/>
            <rect x="6.5" y="6" width="3" height="8" rx="1"/>
            <rect x="11" y="8" width="3" height="6" rx="1"/>
          </svg>
        );
      case 'Medium':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
            <rect x="3" y="6" width="4" height="8" rx="1"/>
            <rect x="9" y="9" width="4" height="5" rx="1"/>
          </svg>
        );
      case 'Low':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
            <rect x="6" y="9" width="4" height="5" rx="1"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
          </svg>
        );
    }
  };

  const availablePriorities: Array<'No priority' | 'Urgent' | 'High' | 'Medium' | 'Low'> = [
    'No priority',
    'Urgent',
    'High',
    'Medium',
    'Low'
  ];

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

  const getDaysUntilDue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return '1 day overdue';
    if (diffDays === 1) return '1 day';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days`;
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
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Tasks</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              Calendar
            </button>
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
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Task
            </button>
          </div>
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
                <div className="flex-1 flex gap-4">
                  {/* Left Column: Title, Description, Bottom Controls */}
                  <div className="flex-1">
                    {/* Title Row */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTaskTypeIcon(task.taskType)}</span>
                      <h3
                        className={`font-medium text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] ${
                          task.status === 'Completed' ? 'line-through' : ''
                        }`}
                        onClick={() => {
                          setEditingTask(task.id);
                          setEditingField('title');
                        }}
                      >
                        {editingTask === task.id && editingField === 'title' ? (
                          <input
                            type="text"
                            defaultValue={task.title}
                            autoFocus
                            onBlur={(e) => {
                              updateTask(task.id, { title: e.target.value });
                              setEditingTask(null);
                              setEditingField(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateTask(task.id, { title: e.currentTarget.value });
                                setEditingTask(null);
                                setEditingField(null);
                              }
                            }}
                            className="px-2 py-1 border border-[var(--primary)] rounded focus:outline-none"
                          />
                        ) : (
                          task.title
                        )}
                      </h3>
                    </div>

                    {/* Description */}
                    <p
                      className="text-sm text-[var(--muted-foreground)] mb-2 cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => {
                        setEditingTask(task.id);
                        setEditingField('description');
                      }}
                    >
                      {editingTask === task.id && editingField === 'description' ? (
                        <textarea
                          defaultValue={task.description}
                          autoFocus
                          rows={2}
                          onBlur={(e) => {
                            updateTask(task.id, { description: e.target.value });
                            setEditingTask(null);
                            setEditingField(null);
                          }}
                          className="w-full px-2 py-1 border border-[var(--primary)] rounded focus:outline-none"
                        />
                      ) : (
                        task.description
                      )}
                    </p>

                    {/* Bottom Row: Priority, Assignee, and Tags */}
                    <div className="flex items-center gap-3 text-xs">
                      {/* Priority Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowPriorityDropdown(showPriorityDropdown === task.id ? null : task.id)}
                          className="flex items-center gap-1.5 px-2 py-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm"
                        >
                          {getPriorityIcon(task.priority)}
                          <span>{task.priority}</span>
                        </button>
                        {showPriorityDropdown === task.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[180px]">
                            <div className="py-1">
                              {availablePriorities.map((priority, idx) => (
                                <button
                                  key={priority}
                                  onClick={() => {
                                    updateTask(task.id, { priority });
                                    setShowPriorityDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    {getPriorityIcon(priority)}
                                    <span>{priority}</span>
                                  </div>
                                  <span className="text-xs text-[var(--muted-foreground)]">{idx + 1}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assignee Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowAssigneeDropdown(showAssigneeDropdown === task.id ? null : task.id)}
                          className="flex items-center gap-1 px-2 py-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="7" r="4"/>
                            <path d="M3 20c0-4 3-7 7-7s7 3 7 7" strokeLinecap="round"/>
                          </svg>
                          {task.assignedTo}
                        </button>
                        {showAssigneeDropdown === task.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[200px]">
                            <input
                              type="text"
                              placeholder="Search..."
                              className="w-full px-3 py-2 border-b border-[var(--border)] text-sm focus:outline-none"
                            />
                            <div className="max-h-[200px] overflow-y-auto">
                              {availableAssignees.map((assignee) => (
                                <button
                                  key={assignee}
                                  onClick={() => {
                                    updateTask(task.id, { assignedTo: assignee });
                                    setShowAssigneeDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                                >
                                  {assignee}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tags Dropdown */}
                      <div className="relative flex items-center gap-1">
                        {task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs cursor-pointer hover:bg-blue-200"
                            onClick={() => setShowTagsDropdown(showTagsDropdown === task.id ? null : task.id)}
                          >
                            {tag}
                          </span>
                        ))}
                        <button
                          onClick={() => setShowTagsDropdown(showTagsDropdown === task.id ? null : task.id)}
                          className="px-2 py-0.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                        >
                          + Tag
                        </button>
                        {showTagsDropdown === task.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[200px]">
                            <input
                              type="text"
                              placeholder="Search tags..."
                              className="w-full px-3 py-2 border-b border-[var(--border)] text-sm focus:outline-none"
                            />
                            <div className="max-h-[200px] overflow-y-auto p-2">
                              {availableTags.map((tag) => (
                                <label
                                  key={tag}
                                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={task.tags.includes(tag)}
                                    onChange={() => toggleTag(task.id, tag)}
                                    className="w-4 h-4 accent-[var(--primary)]"
                                  />
                                  <span className="text-sm">{tag}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Type, Entity Links and Due Date */}
                  <div className="flex flex-col gap-1 text-xs min-w-[280px]">
                    {/* Type Row */}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-foreground)] min-w-[100px]">Type:</span>
                      <button
                        onClick={() => setShowTaskTypeDropdown(showTaskTypeDropdown === task.id ? null : task.id)}
                        className="text-[var(--foreground)] hover:text-[var(--primary)] hover:underline text-left flex items-center gap-1"
                      >
                        <span>{getTaskTypeIcon(task.taskType)}</span>
                        <span>{task.taskType}</span>
                      </button>
                    </div>

                    {/* Days Until Due Row */}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-foreground)] min-w-[100px]">Days until due:</span>
                      <span className="text-[var(--foreground)]">{getDaysUntilDue(task.dueDate)}</span>
                    </div>

                    {/* Jobs Row */}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-foreground)] min-w-[100px]">Job:</span>
                      <button
                        onClick={() => setShowEntityDropdown(showEntityDropdown === task.id ? null : task.id)}
                        className="text-[var(--foreground)] hover:text-[var(--primary)] hover:underline text-left"
                      >
                        {task.entities?.jobs && task.entities.jobs.length > 0
                          ? task.entities.jobs.join(', ')
                          : <span className="text-[var(--muted-foreground)] italic">None</span>
                        }
                      </button>
                    </div>

                    {/* Contacts Row */}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-foreground)] min-w-[100px]">Contact:</span>
                      <button
                        onClick={() => setShowEntityDropdown(showEntityDropdown === task.id ? null : task.id)}
                        className="text-[var(--foreground)] hover:text-[var(--primary)] hover:underline text-left"
                      >
                        {task.entities?.contacts && task.entities.contacts.length > 0
                          ? task.entities.contacts.join(', ')
                          : <span className="text-[var(--muted-foreground)] italic">None</span>
                        }
                      </button>
                    </div>

                    {/* Companies Row */}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-foreground)] min-w-[100px]">Company:</span>
                      <button
                        onClick={() => setShowEntityDropdown(showEntityDropdown === task.id ? null : task.id)}
                        className="text-[var(--foreground)] hover:text-[var(--primary)] hover:underline text-left"
                      >
                        {task.entities?.companies && task.entities.companies.length > 0
                          ? task.entities.companies.join(', ')
                          : <span className="text-[var(--muted-foreground)] italic">None</span>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Type Dropdown */}
              {showTaskTypeDropdown === task.id && (
                <div className="fixed inset-0 z-40" onClick={() => setShowTaskTypeDropdown(null)}>
                  <div
                    className="absolute top-1/2 right-1/4 -translate-y-1/2 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="max-h-[200px] overflow-y-auto">
                      {availableTaskTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            updateTask(task.id, { taskType: type });
                            setShowTaskTypeDropdown(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                        >
                          <span>{getTaskTypeIcon(type)}</span>
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Entity Modal */}
              {showEntityDropdown === task.id && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowEntityDropdown(null)}
                  />

                  {/* Modal */}
                  <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">Manage Entity Associations</h3>
                        <button
                          onClick={() => setShowEntityDropdown(null)}
                          className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                        {/* Jobs Section */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Jobs</h4>
                          <div className="space-y-2">
                            {allEntities.Job.map((job) => (
                              <label key={job} className="flex items-center gap-2 p-2 hover:bg-[var(--muted)] rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={task.entities?.jobs?.includes(job) || false}
                                  onChange={(e) => {
                                    const currentJobs = task.entities?.jobs || [];
                                    const newJobs = e.target.checked
                                      ? [...currentJobs, job]
                                      : currentJobs.filter(j => j !== job);
                                    updateTask(task.id, {
                                      entities: { ...task.entities, jobs: newJobs }
                                    });
                                  }}
                                  className="w-4 h-4 accent-[var(--primary)]"
                                />
                                <span className="text-sm">{job}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Contacts Section */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Contacts</h4>
                          <div className="space-y-2">
                            {allEntities.Contact.map((contact) => (
                              <label key={contact} className="flex items-center gap-2 p-2 hover:bg-[var(--muted)] rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={task.entities?.contacts?.includes(contact) || false}
                                  onChange={(e) => {
                                    const currentContacts = task.entities?.contacts || [];
                                    const newContacts = e.target.checked
                                      ? [...currentContacts, contact]
                                      : currentContacts.filter(c => c !== contact);
                                    updateTask(task.id, {
                                      entities: { ...task.entities, contacts: newContacts }
                                    });
                                  }}
                                  className="w-4 h-4 accent-[var(--primary)]"
                                />
                                <span className="text-sm">{contact}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Companies Section */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Companies</h4>
                          <div className="space-y-2">
                            {allEntities.Company.map((company) => (
                              <label key={company} className="flex items-center gap-2 p-2 hover:bg-[var(--muted)] rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={task.entities?.companies?.includes(company) || false}
                                  onChange={(e) => {
                                    const currentCompanies = task.entities?.companies || [];
                                    const newCompanies = e.target.checked
                                      ? [...currentCompanies, company]
                                      : currentCompanies.filter(c => c !== company);
                                    updateTask(task.id, {
                                      entities: { ...task.entities, companies: newCompanies }
                                    });
                                  }}
                                  className="w-4 h-4 accent-[var(--primary)]"
                                />
                                <span className="text-sm">{company}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border)]">
                        <button
                          onClick={() => setShowEntityDropdown(null)}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Calendar View */
        <CalendarView tasks={filteredTasks} onToggleComplete={toggleTaskComplete} />
      )}
    </main>
  );
}
