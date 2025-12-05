/**
 * Note Modal Component
 * Displays note details with conversations, links, and allows adding/editing/deleting comments
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { ParsedNote, NoteConversation } from '../types';
import { formatTimestamp, formatTimeAgo, getInitials, getAvatarColor, parseNote } from '../utils';
import { 
  useNoteConversations, 
  useNoteRelatedEntities, 
  useAddNoteConversation, 
  useUpdateNoteConversation,
  useDeleteNoteConversation,
  useDeleteNote,
  useContactSearch,
  type EntityType 
} from '../api';
import { noteToasts, showSuccessToast, showErrorToast } from '../../lib/toast';

interface NoteModalProps {
  note: ParsedNote;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currentUserId?: string;
}

export function NoteModal({ note, onClose, onEdit, onDelete, currentUserId }: NoteModalProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  // Fetch contacts for mention resolution
  const { data: contacts = [] } = useContactSearch('');
  
  // Fetch related entities for this note
  const { data: relatedEntities } = useNoteRelatedEntities(note.id);
  
  // Resolve mention IDs to contact names for display
  const mentionNames = useMemo(() => {
    return note.mentions.map(mentionId => {
      const contact = contacts.find(c => c.id === mentionId);
      if (contact) {
        return `${contact.firstName} ${contact.lastName}`;
      }
      return mentionId; // Return the ID if contact not found
    });
  }, [note.mentions, contacts]);
  
  // Resolve related entities for display
  const resolvedLinks = useMemo(() => {
    if (!relatedEntities) return [];
    
    const links: Array<{ id: string; type: EntityType; name: string; entityId: string }> = [];
    
    relatedEntities.companies?.forEach(company => {
      links.push({
        id: company.id,
        type: 'COMPANY',
        name: company.name,
        entityId: company.id,
      });
    });
    
    relatedEntities.contacts?.forEach(contact => {
      links.push({
        id: contact.id,
        type: 'CONTACT',
        name: `${contact.firstName} ${contact.lastName}`,
        entityId: contact.id,
      });
    });
    
    relatedEntities.jobs?.forEach(job => {
      links.push({
        id: job.id,
        type: 'JOB',
        name: job.jobName,
        entityId: job.id,
      });
    });
    
    relatedEntities.tasks?.forEach(task => {
      links.push({
        id: task.id,
        type: 'TASK',
        name: task.title,
        entityId: task.id,
      });
    });

    relatedEntities.preOpportunities?.forEach(preOpp => {
      links.push({
        id: preOpp.id,
        type: 'PRE_OPPORTUNITY',
        name: preOpp.entityNumber || 'Unknown Pre-Opportunity',
        entityId: preOpp.id,
      });
    });

    relatedEntities.quotes?.forEach(quote => {
      links.push({
        id: quote.id,
        type: 'QUOTE',
        name: quote.quoteNumber || quote.jobName || 'Unknown Quote',
        entityId: quote.id,
      });
    });

    relatedEntities.orders?.forEach(order => {
      links.push({
        id: order.id,
        type: 'ORDER',
        name: order.orderNumber || order.jobName || 'Unknown Order',
        entityId: order.id,
      });
    });

    relatedEntities.invoices?.forEach(invoice => {
      links.push({
        id: invoice.id,
        type: 'INVOICE',
        name: invoice.invoiceNumber || 'Unknown Invoice',
        entityId: invoice.id,
      });
    });

    relatedEntities.checks?.forEach(check => {
      links.push({
        id: check.id,
        type: 'CHECK',
        name: check.checkNumber || 'Unknown Check',
        entityId: check.id,
      });
    });

    relatedEntities.factories?.forEach(factory => {
      links.push({
        id: factory.id,
        type: 'FACTORY',
        name: factory.title || 'Unknown Factory',
        entityId: factory.id,
      });
    });

    relatedEntities.customers?.forEach(customer => {
      links.push({
        id: customer.id,
        type: 'CUSTOMER',
        name: customer.companyName || 'Unknown Customer',
        entityId: customer.id,
      });
    });

    relatedEntities.products?.forEach(product => {
      links.push({
        id: product.id,
        type: 'PRODUCT',
        name: product.factoryPartNumber || 'Unknown Product',
        entityId: product.id,
      });
    });
    
    return links;
  }, [relatedEntities]);
  
  // Helper function to get link type color
  const getLinkTypeColor = (type: EntityType) => {
    switch (type) {
      case 'JOB':
        return 'bg-blue-100 text-blue-700';
      case 'COMPANY':
        return 'bg-purple-100 text-purple-700';
      case 'CONTACT':
        return 'bg-green-100 text-green-700';
      case 'TASK':
        return 'bg-orange-100 text-orange-700';
      case 'PRE_OPPORTUNITY':
        return 'bg-teal-100 text-teal-700';
      case 'QUOTE':
        return 'bg-cyan-100 text-cyan-700';
      case 'ORDER':
        return 'bg-indigo-100 text-indigo-700';
      case 'INVOICE':
        return 'bg-rose-100 text-rose-700';
      case 'CHECK':
        return 'bg-emerald-100 text-emerald-700';
      case 'FACTORY':
        return 'bg-slate-100 text-slate-700';
      case 'CUSTOMER':
        return 'bg-amber-100 text-amber-700';
      case 'PRODUCT':
        return 'bg-lime-100 text-lime-700';
      case 'NOTE':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Helper function to get link type icon
  const getLinkTypeIcon = (type: EntityType) => {
    switch (type) {
      case 'JOB':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'COMPANY':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'CONTACT':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'TASK':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'PRE_OPPORTUNITY':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'QUOTE':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'ORDER':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'INVOICE':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        );
      case 'CHECK':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'FACTORY':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'CUSTOMER':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'PRODUCT':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'NOTE':
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Fetch conversations for this note
  const { data: conversations = [], isLoading: isLoadingConversations } = useNoteConversations(note.id);
  
  const addConversationMutation = useAddNoteConversation();
  const updateConversationMutation = useUpdateNoteConversation();
  const deleteConversationMutation = useDeleteNoteConversation();
  const deleteNoteMutation = useDeleteNote();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addConversationMutation.mutateAsync({
        noteId: note.id,
        content: newComment.trim(),
      });
      showSuccessToast('Comment added', { description: 'Your comment has been posted' });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      showErrorToast('Failed to add comment', { 
        description: error instanceof Error ? error.message : 'Please try again' 
      });
    }
  };

  const handleEditComment = (conversation: NoteConversation) => {
    setEditingCommentId(conversation.id);
    setEditingCommentContent(conversation.content);
  };

  const handleSaveEditComment = async () => {
    if (!editingCommentId || !editingCommentContent.trim()) return;

    try {
      await updateConversationMutation.mutateAsync({
        id: editingCommentId,
        noteId: note.id,
        content: editingCommentContent.trim(),
      });
      showSuccessToast('Comment updated', { description: 'Your comment has been saved' });
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      showErrorToast('Failed to update comment', { 
        description: error instanceof Error ? error.message : 'Please try again' 
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleDeleteComment = async (conversationId: string) => {
    try {
      await deleteConversationMutation.mutateAsync({
        conversationId,
        noteId: note.id,
      });
      showSuccessToast('Comment deleted', { description: 'Your comment has been removed' });
      setCommentToDelete(null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showErrorToast('Failed to delete comment', { 
        description: error instanceof Error ? error.message : 'Please try again' 
      });
    }
  };

  const handleDeleteNote = async () => {
    try {
      await deleteNoteMutation.mutateAsync(note.id);
      noteToasts.deleteSuccess();
      onClose();
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Failed to delete note:', error);
      noteToasts.deleteError(error instanceof Error ? error.message : undefined);
    }
    setShowDeleteConfirm(false);
  };

  // Check if user can edit/delete a comment (simplified check)
  // Note: createdBy is not available from API, so allow editing for now
  const canEditComment = (_conversation: NoteConversation) => {
    // In a real app, compare with actual current user ID
    // Since createdBy is not available, allow all users to edit for now
    return true;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">{note.title}</h2>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <div className={`w-7 h-7 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-xs font-semibold`}>
                    {getInitials(note.createdBy)}
                  </div>
                  <span className="font-medium text-[var(--foreground)]">{note.createdBy}</span>
                  <span className="text-gray-300">·</span>
                  <span>{formatTimestamp(note.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit Button */}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                    title="Edit Note"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                {/* Delete Button */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                  title="Delete Note"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round"/>
                    <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Close Button */}
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Note Content */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                  Note Content
                </h3>
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                    {note.content || <span className="text-[var(--muted-foreground)] italic">No content</span>}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                    Tags
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentions */}
              {mentionNames.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                    Mentions
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {mentionNames.map((mentionName, idx) => (
                      <span key={idx} className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                        @{mentionName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Entities */}
              {resolvedLinks.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Linked Entities
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {resolvedLinks.map((link) => (
                      <span 
                        key={link.id} 
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getLinkTypeColor(link.type)}`}
                      >
                        {getLinkTypeIcon(link.type)}
                        <span className="max-w-[200px] truncate">{link.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations/Comments Section */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-3 uppercase tracking-wider flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Conversation ({isLoadingConversations ? '...' : conversations.length})
                </h3>
                
                <div className="space-y-4">
                  {isLoadingConversations ? (
                    <div className="text-center py-8 text-[var(--muted-foreground)]">
                      <svg className="animate-spin w-8 h-8 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      <p className="text-sm">Loading comments...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-[var(--muted-foreground)]">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm">No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div key={conversation.id} className="flex gap-3 group">
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor('User')} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                          {getInitials('User')}
                        </div>
                        <div className="flex-1">
                          {editingCommentId === conversation.id ? (
                            // Edit mode
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveEditComment}
                                  disabled={updateConversationMutation.isPending || !editingCommentContent.trim()}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {updateConversationMutation.isPending ? (
                                    <>
                                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                      </svg>
                                      Saving...
                                    </>
                                  ) : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="bg-[var(--muted)]/30 rounded-lg p-3 border border-[var(--border)]">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[var(--foreground)]">
                                    User
                                  </span>
                                  <span className="text-xs text-[var(--muted-foreground)]">
                                    {formatTimeAgo(conversation.createdAt)}
                                  </span>
                                </div>
                                {canEditComment(conversation) && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditComment(conversation)}
                                      className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                      title="Edit comment"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => setCommentToDelete(conversation.id)}
                                      className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                                      title="Delete comment"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round"/>
                                        <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round"/>
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{conversation.content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Comment */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                  Add Comment
                </h3>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    You
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={addConversationMutation.isPending || !newComment.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {addConversationMutation.isPending ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Posting...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                              <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Post Comment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Comment Confirmation Modal */}
      {commentToDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setCommentToDelete(null)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Comment</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this comment?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCommentToDelete(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteComment(commentToDelete)}
                  disabled={deleteConversationMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteConversationMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Deleting...
                    </>
                  ) : 'Delete Comment'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Note Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete &quot;{note.title}&quot;? All comments will also be deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteNote}
                  disabled={deleteNoteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteNoteMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Deleting...
                    </>
                  ) : 'Delete Note'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
