'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdvancedFilters from './AdvancedFilters';

export default function DashboardContent() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const selectAll = () => {
    setActiveFilters(['call', 'email', 'note', 'meeting', 'task', 'job', 'pre-opportunity', 'contact']);
  };

  const toggleStatusFilter = (status: string) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter((s) => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const activityFilterOptions = [
    { id: 'activity-type', label: 'Activity Type', type: 'dropdown' as const },
    { id: 'assigned-to', label: 'Assigned To', type: 'dropdown' as const },
    { id: 'entity-type', label: 'Entity Type', type: 'dropdown' as const },
    { id: 'entity-name', label: 'Entity Name', type: 'text' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
    { id: 'date-range', label: 'Date Range', type: 'date' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
  ];

  const activities = [
    {
      type: 'job',
      title: 'New Job: Downtown Plaza Renovation',
      time: '15m ago',
      date: '11/21/2024',
      description: 'Large-scale commercial lighting project with Turner Construction',
      entity: 'Downtown Plaza Renovation',
      entityType: 'Job',
      tags: ['Lighting', 'Commercial'],
      assignedTo: 'Sarah Johnson',
      mentions: ['@Turner Construction', '@Miller Electric'],
      likes: 2,
      comments: 3,
      activityStatus: 'upcoming', // Future date (11/21 > 11/20)
      link: '/jobs',
    },
    {
      type: 'call',
      title: 'Call with Marcus Chen',
      time: '30m ago',
      date: '11/21/2024',
      description: 'Discussed lighting specs for Downtown Plaza project',
      entity: 'Downtown Plaza Renovation',
      entityType: 'Job',
      tags: ['Lighting', 'Follow-up'],
      assignedTo: 'Sarah Johnson',
      mentions: ['@Turner Construction', '@Miller Electric'],
      likes: 2,
      comments: 3,
      activityStatus: 'upcoming', // Future date (11/21 > 11/20)
      link: '/jobs',
    },
    {
      type: 'pre-opportunity',
      title: 'New Pre-Opportunity: TechCorp HQ Expansion',
      time: '1h ago',
      date: '11/21/2024',
      description: 'HVAC controls system upgrade for corporate headquarters',
      entity: 'TechCorp HQ Expansion',
      entityType: 'Pre-Opportunity',
      tags: ['Quote', 'HVAC'],
      assignedTo: 'Marcus Chen',
      mentions: [],
      likes: 1,
      comments: 0,
      activityStatus: 'upcoming', // Future date (11/21 > 11/20)
      link: '/pre-opportunities',
    },
    {
      type: 'email',
      title: 'Email sent to Sarah Johnson',
      time: '1.5h ago',
      date: '11/21/2024',
      description: 'Quote follow-up for HVAC controls',
      entity: 'TechCorp HQ Expansion',
      entityType: 'Pre-Opportunity',
      tags: ['Quote', 'HVAC'],
      assignedTo: 'Marcus Chen',
      mentions: [],
      likes: 1,
      comments: 0,
      activityStatus: 'upcoming', // Future date (11/21 > 11/20)
      link: '/pre-opportunities',
    },
    {
      type: 'note',
      title: 'Note added to Riverside Medical',
      time: '2h ago',
      date: '11/20/2024',
      description: 'Engineer prefers manufacturer spec over alternates',
      entity: 'Riverside Medical Center',
      entityType: 'Job',
      tags: ['Engineering', 'Specifications'],
      assignedTo: 'Sarah Johnson',
      mentions: ['@McCarthy Building'],
      likes: 3,
      comments: 2,
      activityStatus: 'completed', // Today or past (11/20 = 11/20)
      link: '/notes',
    },
    {
      type: 'meeting',
      title: 'Site visit scheduled',
      time: '3h ago',
      date: '11/20/2024',
      description: 'Meeting with GC and EC next Tuesday at 10am',
      entity: 'Harbor View Apartments',
      entityType: 'Job',
      tags: ['Site Visit', 'Coordination'],
      assignedTo: 'David Torres',
      mentions: [],
      likes: 0,
      comments: 1,
      activityStatus: 'completed', // Today or past (11/20 = 11/20)
      link: '/jobs',
    },
    {
      type: 'task',
      title: 'Task completed',
      time: '4h ago',
      date: '11/20/2024',
      description: 'Submitted bid package to distributor',
      entity: 'University Lab Building',
      entityType: 'Job',
      tags: ['Bidding', 'Completed'],
      assignedTo: 'Marcus Chen',
      mentions: [],
      likes: 2,
      comments: 1,
      activityStatus: 'completed', // Today or past (11/20 = 11/20)
      link: '/tasks',
    },
    {
      type: 'contact',
      title: 'New Contact: David Park',
      time: '5h ago',
      date: '11/19/2024',
      description: 'Facility manager at Green Valley Office Park',
      entity: 'David Park',
      entityType: 'Contact',
      tags: ['Facility Manager', 'New Lead'],
      assignedTo: 'Sarah Johnson',
      mentions: [],
      likes: 1,
      comments: 1,
      activityStatus: 'completed', // Past date (11/19 < 11/20)
      link: '/contacts',
    },
    {
      type: 'email',
      title: 'Email received from David Park',
      time: '5.5h ago',
      date: '11/19/2024',
      description: 'Request for pricing on additional zones',
      entity: 'Green Valley Office Park',
      entityType: 'Contact',
      tags: ['Pricing', 'Inquiry'],
      assignedTo: 'Sarah Johnson',
      mentions: [],
      likes: 0,
      comments: 0,
      activityStatus: 'completed', // Past date (11/19 < 11/20)
      link: '/contacts',
    },
    {
      type: 'note',
      title: 'Note added to Metro Transit Hub',
      time: '6h ago',
      date: '11/19/2024',
      description: 'Project timeline moved up by 2 weeks per client request',
      entity: 'Metro Transit Hub',
      entityType: 'Job',
      tags: ['Timeline', 'Urgent'],
      assignedTo: 'David Torres',
      mentions: [],
      likes: 4,
      comments: 5,
      activityStatus: 'completed', // Past date (11/19 < 11/20)
      link: '/notes',
    },
    {
      type: 'call',
      title: 'Call with Jennifer Wilson',
      time: '7h ago',
      date: '11/18/2024',
      description: 'Clarified installation schedule and crew requirements',
      entity: 'Westside Retail Center',
      entityType: 'Contact',
      tags: ['Installation', 'Coordination'],
      assignedTo: 'Marcus Chen',
      mentions: [],
      likes: 1,
      comments: 2,
      activityStatus: 'completed', // Past date (11/18 < 11/20)
      link: '/contacts',
    },
    {
      type: 'task',
      title: 'Task completed',
      time: '8h ago',
      date: '11/18/2024',
      description: 'Updated BOM with approved substitutions',
      entity: 'Oak Street Condos',
      entityType: 'Job',
      tags: ['BOM', 'Documentation'],
      assignedTo: 'Sarah Johnson',
      mentions: [],
      likes: 2,
      comments: 0,
      activityStatus: 'completed', // Past date (11/18 < 11/20)
      link: '/tasks',
    },
    {
      type: 'meeting',
      title: 'Project kickoff scheduled',
      time: '9h ago',
      date: '11/17/2024',
      description: 'Team meeting set for Monday 9am with all stakeholders',
      entity: 'Innovation Campus Phase 2',
      entityType: 'Job',
      tags: ['Kickoff', 'Planning'],
      assignedTo: 'Sarah Johnson',
      mentions: [],
      likes: 3,
      comments: 4,
      activityStatus: 'completed', // Past date (11/17 < 11/20)
      link: '/jobs',
    },
    {
      type: 'email',
      title: 'Email sent to Robert Martinez',
      time: '10h ago',
      date: '11/17/2024',
      description: 'Forwarded technical drawings for approval',
      entity: 'City Hall Renovation',
      entityType: 'Job',
      tags: ['Drawings', 'Approval'],
      assignedTo: 'David Torres',
      mentions: [],
      likes: 1,
      comments: 1,
      activityStatus: 'completed', // Past date (11/17 < 11/20)
      link: '/jobs',
    },
    {
      type: 'note',
      title: 'Note added to Lakefront Hotel',
      time: '11h ago',
      date: '11/16/2024',
      description: 'Client requested energy efficiency upgrade options',
      entity: 'Lakefront Hotel',
      entityType: 'Pre-Opportunity',
      tags: ['Energy', 'Opportunity'],
      assignedTo: 'Marcus Chen',
      mentions: ['@Green Energy Solutions'],
      likes: 2,
      comments: 3,
      activityStatus: 'completed', // Past date (11/16 < 11/20)
      link: '/notes',
    },
    {
      type: 'call',
      title: 'Call with Amanda Foster',
      time: '12h ago',
      date: '11/16/2024',
      description: 'Discussed warranty terms and service agreements',
      entity: 'Summit Medical Plaza',
      entityType: 'Contact',
      tags: ['Warranty', 'Service'],
      assignedTo: 'Sarah Johnson',
      mentions: [],
      likes: 0,
      comments: 1,
      activityStatus: 'completed', // Past date (11/16 < 11/20)
      link: '/contacts',
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Activity Feed</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your operational command center for manufacturing sales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStatusFilter('upcoming')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                statusFilters.includes('upcoming')
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                statusFilters.includes('upcoming') ? 'border-white bg-white' : 'border-[var(--border)]'
              }`}>
                {statusFilters.includes('upcoming') && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              Upcoming
            </button>
            <button
              onClick={() => toggleStatusFilter('completed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                statusFilters.includes('completed')
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                statusFilters.includes('completed') ? 'border-white bg-white' : 'border-[var(--border)]'
              }`}>
                {statusFilters.includes('completed') && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              Completed
            </button>
            <AdvancedFilters filterOptions={activityFilterOptions} />
          </div>
        </div>
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
          Create Pre-Opportunity
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10h10M3 6h14M7 14h6" strokeLinecap="round"/>
          </svg>
          Add Task
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create Note
        </button>
      </div>

      {/* Activity Feed */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 3v14M3 10h14" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="7"/>
          </svg>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-[var(--border)]">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-[var(--primary)] text-white hover:opacity-90"
          >
            Select All
          </button>
          <button
            onClick={() => toggleFilter('call')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('call')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('call') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('call') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Calls
          </button>
          <button
            onClick={() => toggleFilter('email')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('email')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('email') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('email') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Emails
          </button>
          <button
            onClick={() => toggleFilter('note')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('note')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('note') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('note') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Notes
          </button>
          <button
            onClick={() => toggleFilter('meeting')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('meeting')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('meeting') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('meeting') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Meetings
          </button>
          <button
            onClick={() => toggleFilter('task')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('task')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('task') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('task') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Tasks
          </button>
          <button
            onClick={() => toggleFilter('job')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('job')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('job') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('job') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Jobs
          </button>
          <button
            onClick={() => toggleFilter('pre-opportunity')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('pre-opportunity')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('pre-opportunity') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('pre-opportunity') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Pre-Opportunities
          </button>
          <button
            onClick={() => toggleFilter('contact')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.includes('contact')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              activeFilters.includes('contact') ? 'border-white bg-white' : 'border-[var(--border)]'
            }`}>
              {activeFilters.includes('contact') && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            Contacts
          </button>
        </div>

        <div className="space-y-4">
          {activities
            .filter((activity) => {
              const matchesType = activeFilters.length === 0 || activeFilters.includes(activity.type);
              const matchesStatus = statusFilters.length === 0 || statusFilters.includes(activity.activityStatus);
              return matchesType && matchesStatus;
            })
            .sort((a, b) => {
              // Convert dates to comparable format (MM/DD/YYYY to Date object)
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              // Sort descending (newest first, including future dates)
              return dateB.getTime() - dateA.getTime();
            })
            .map((activity, index) => (
            <Link
              key={index}
              href={activity.link}
              className="flex gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0 hover:bg-[var(--muted)]/30 -mx-2 px-2 py-3 rounded-lg transition-colors cursor-pointer"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(activity.assignedTo)} flex items-center justify-center text-white text-sm font-semibold`}>
                {getInitials(activity.assignedTo)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-[var(--foreground)]">{activity.title}</h4>
                      <span className="text-sm text-[var(--muted-foreground)]">{activity.time}</span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">{activity.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    activity.activityStatus === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.activityStatus.charAt(0).toUpperCase() + activity.activityStatus.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-2">
                  {activity.entityType && activity.entity && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                        {activity.entityType}
                      </span>
                      <span className="text-[var(--muted-foreground)]">{activity.entity}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {activity.tags && activity.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {activity.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {activity.assignedTo && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="7" r="3"/>
                        <path d="M4 18c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/>
                      </svg>
                      <span>{activity.assignedTo}</span>
                    </div>
                  )}
                </div>

                {/* Mentions and Footer */}
                {activity.mentions && activity.mentions.length > 0 && (
                  <div className="mb-2 text-xs">
                    {activity.mentions.map((mention, idx) => (
                      <span key={idx} className="text-[var(--primary)] mr-2">{mention}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
                  <span>{activity.assignedTo}</span>
                  <span>·</span>
                  <span>{activity.date}</span>
                  {activity.likes > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{activity.likes}</span>
                      </div>
                    </>
                  )}
                  {activity.comments > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                        </svg>
                        <span>{activity.comments}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
