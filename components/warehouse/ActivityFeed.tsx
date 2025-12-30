'use client';

import React, { useState } from 'react';

// Generic activity interface that works with both Delivery Issues and Fulfillment Orders
export interface GenericActivity {
  id: string;
  type: string;
  timestamp: string;
  createdBy: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  activities: GenericActivity[];
  onAddNote: (note: string) => void;
  getActivityIcon: (type: string) => React.ReactNode;
  getActivityTitle: (activity: GenericActivity) => string;
  formatDate: (dateString: string) => string;
  placeholder?: string;
}

export default function ActivityFeed({
  activities,
  onAddNote,
  getActivityIcon,
  getActivityTitle,
  formatDate,
  placeholder = 'Add a note...',
}: ActivityFeedProps) {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote('');
  };

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <h2 className="font-medium text-[var(--foreground)]">Activity Feed</h2>
      </div>
      <div className="p-4">
        {/* Add Note Input */}
        <div className="mb-4 pb-4 border-b border-[var(--border)]">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {sortedActivities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                {getActivityIcon(activity.type)}
                {index < sortedActivities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-[var(--border)] mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-[var(--foreground)]">
                    {getActivityTitle(activity)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  by {activity.createdBy}
                </div>
                {activity.content && (
                  <div className="mt-2 p-2 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)]">
                    {activity.content}
                  </div>
                )}
                {typeof activity.metadata?.creditAmount === 'number' && (
                  <div className="mt-1 text-sm text-green-600 font-medium">
                    Credit: ${activity.metadata.creditAmount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sortedActivities.length === 0 && (
            <div className="text-center py-6 text-[var(--muted-foreground)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-50">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="text-sm">No activity yet</p>
              <p className="text-xs mt-1">Add a note to start the activity feed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
