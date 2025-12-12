'use client';

import React, { useState } from 'react';

type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdDate: string;
  tags: string[];
  entityType?: string;
  entityName?: string;
  mentions: string[];
  attachments: number;
  comments: number;
};

interface NoteModalProps {
  note: Note;
  onClose: () => void;
}

export default function NoteModal({ note, onClose }: NoteModalProps) {
  const [newComment, setNewComment] = useState('');
  const [conversation, setConversation] = useState<Comment[]>([
    {
      id: 'C-001',
      author: 'Sarah Johnson',
      content: 'Great notes from the meeting. I think we should prioritize the wireless controls option.',
      timestamp: '2024-11-22T14:30:00',
    },
    {
      id: 'C-002',
      author: 'Marcus Chen',
      content: 'Agreed. I\'ll reach out to the Lutron rep to get pricing on the wireless system.',
      timestamp: '2024-11-22T15:45:00',
    },
    {
      id: 'C-003',
      author: 'David Torres',
      content: 'Don\'t forget to include the integration costs with their existing BMS.',
      timestamp: '2024-11-22T16:20:00',
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
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
                <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">{note.title}</h2>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <div className={`w-6 h-6 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-xs font-semibold`}>
                    {getInitials(note.createdBy)}
                  </div>
                  <span>{note.createdBy}</span>
                  <span>·</span>
                  <span>{formatTimestamp(note.createdDate)}</span>
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
              {/* Note Content */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                  Note Content
                </h3>
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              </div>

              {/* Entity Link */}
              {note.entityType && note.entityName && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Related To
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {note.entityType}
                    </span>
                    <span className="text-sm text-[var(--foreground)]">{note.entityName}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                  Tags
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mentions */}
              {note.mentions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Mentions
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {note.mentions.map((mention, idx) => (
                      <span key={idx} className="text-sm text-[var(--primary)] font-medium">
                        {mention}
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
