'use client';

import React, { useState } from 'react';
import { Task, TaskComment } from '../types';
import { getInitials, getAvatarColor, getStatusColor, getPriorityColor, formatDate } from '../utils';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onToggleComplete?: (id: string) => void;
}

export default function TaskModal({ task, onClose, onToggleComplete }: TaskModalProps) {
  const [newComment, setNewComment] = useState('');
  const [conversation, setConversation] = useState<TaskComment[]>([
    {
      id: 'C-001',
      author: 'Sarah Johnson',
      content: 'I\'ve started working on this. Should have the quote ready by tomorrow afternoon.',
      timestamp: '2024-11-22T10:30:00',
    },
    {
      id: 'C-002',
      author: 'Marcus Chen',
      content: 'Perfect! Make sure to include the LED upgrade options we discussed.',
      timestamp: '2024-11-22T11:15:00',
    },
  ]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: TaskComment = {
        id: `C-${Date.now()}`,
        author: 'Current User',
        content: newComment,
        timestamp: new Date().toISOString(),
      };
      setConversation([...conversation, comment]);
      setNewComment('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {onToggleComplete && (
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleComplete(task.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  )}
                  <h2 className={`text-2xl font-semibold ${task.completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                    {task.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium">
                    {task.taskType}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M15 5l-10 10" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Task Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Assigned To
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(task.assignedTo)} flex items-center justify-center text-white text-xs font-semibold`}>
                      {getInitials(task.assignedTo)}
                    </div>
                    <span className="text-sm text-[var(--foreground)]">{task.assignedTo}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Due Date
                  </h3>
                  <p className="text-sm text-[var(--foreground)]">{formatDate(task.dueDate)}</p>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Description
                  </h3>
                  <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Reminder */}
              {task.reminderDate && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Reminder
                  </h3>
                  <p className="text-sm text-[var(--foreground)]">{formatDate(task.reminderDate)}</p>
                </div>
              )}

              {/* Related Entities */}
              {task.entities && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Related To
                  </h3>
                  <div className="space-y-2">
                    {task.entities.jobs && task.entities.jobs.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Jobs:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.entities.jobs.map((job, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              {job}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.entities.contacts && task.entities.contacts.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Contacts:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.entities.contacts.map((contact, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                            >
                              {contact}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.entities.companies && task.entities.companies.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Companies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.entities.companies.map((company, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Tags
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wider">
                  Conversation ({conversation.length})
                </h3>
                <div className="space-y-4">
                  {conversation.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full ${getAvatarColor(comment.author)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {getInitials(comment.author)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-[var(--muted)]/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[var(--foreground)]">
                              {comment.author}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--foreground)]">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Comment */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                  Add Comment
                </h3>
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
