/**
 * Preview Content - Renders preview data for different report types
 */

import React from 'react';
import type { ReportType } from '../types';
import {
  mockNotesData,
  mockTasksData,
  mockJobsData,
  mockPreOpportunitiesData,
} from '../mockData';

interface PreviewContentProps {
  types: ReportType[];
}

export function PreviewContent({ types }: PreviewContentProps) {
  return (
    <>
      {types.map((type, typeIndex) => (
        <div key={type} className={typeIndex > 0 ? 'mt-12' : ''}>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]">
            {type}
          </h3>
          <div className="space-y-6">
            {type === 'Notes' && <NotesPreview />}
            {type === 'Tasks' && <TasksPreview />}
            {type === 'Jobs' && <JobsPreview />}
            {type === 'Pre-Opportunities' && <PreOpportunitiesPreview />}
          </div>
        </div>
      ))}
    </>
  );
}

// Notes Preview Component
function NotesPreview() {
  return (
    <>
      {mockNotesData.map((note) => (
        <div
          key={note.id}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-10 h-10 rounded-full ${note.color} flex items-center justify-center text-white font-semibold flex-shrink-0`}
            >
              {note.initials}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-[var(--foreground)] mb-1">
                {note.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-3">
                <span>{note.author}</span>
                <span>·</span>
                <span>{note.date}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded text-sm mb-4">
                <span className="text-blue-700 font-medium">
                  {note.linkedTo.type}
                </span>
                <span className="text-[var(--muted-foreground)]">
                  {note.linkedTo.name}
                </span>
              </div>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              {note.id}
            </span>
          </div>
          <p className="text-[var(--foreground)] leading-relaxed mb-4">
            {note.content}
          </p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {note.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {note.mentions.length > 0 && (
            <div className="text-sm text-[var(--muted-foreground)]">
              <span className="font-medium">MENTIONED:</span>{' '}
              {note.mentions.map((mention, idx) => (
                <span key={idx} className="text-blue-600">
                  {mention}
                  {idx < note.mentions.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// Tasks Preview Component
function TasksPreview() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Urgent':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {mockTasksData.map((task) => (
        <div
          key={task.id}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-base font-semibold text-[var(--foreground)]">
              {task.title}
            </h4>
            <span className="text-xs text-[var(--muted-foreground)]">
              {task.id}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-2.5 py-1 rounded text-sm font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {task.status}
            </span>
            <span
              className={`px-2.5 py-1 rounded text-sm font-medium ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>
          <p className="text-[var(--foreground)] leading-relaxed mb-4">
            {task.description}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">Assigned To:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {task.assignedTo}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Due Date:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {task.dueDate}
              </span>
            </div>
            {task.relatedTo && (
              <div>
                <span className="text-[var(--muted-foreground)]">Related To:</span>{' '}
                <span className="text-[var(--foreground)]">{task.relatedTo}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// Jobs Preview Component
function JobsPreview() {
  return (
    <>
      {mockJobsData.map((job) => (
        <div
          key={job.id}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-base font-semibold text-[var(--foreground)]">
              {job.name}
            </h4>
            <span className="text-xs text-[var(--muted-foreground)]">
              {job.id}
            </span>
          </div>
          <div className="mb-4">
            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
              {job.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">Value:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {job.value}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">GC:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {job.gc}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Start Date:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {job.startDate}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Territory:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {job.territory}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// Pre-Opportunities Preview Component
function PreOpportunitiesPreview() {
  return (
    <>
      {mockPreOpportunitiesData.map((po) => (
        <div
          key={po.id}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-base font-semibold text-[var(--foreground)]">
              {po.name}
            </h4>
            <span className="text-xs text-[var(--muted-foreground)]">
              {po.id}
            </span>
          </div>
          <div className="mb-4">
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
              {po.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">
                Estimated Value:
              </span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {po.estimatedValue}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Sold To:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {po.soldTo}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Created:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {po.created}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Manufacturer:</span>{' '}
              <span className="font-medium text-[var(--foreground)]">
                {po.manufacturer}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
