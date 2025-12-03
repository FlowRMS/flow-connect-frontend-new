/**
 * Edit Note Modal Component
 * Modal for editing existing notes with title, content, tags, mentions, and links
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUpdateNote, useDeleteNote, useNoteRelatedEntities, useCreateLink, useDeleteLinkByEntities, useContactSearch, type EntityType } from '../api/useNotesApi';
import { noteToasts } from '../../lib/toast';
import { MentionTextarea, MentionInput, type SelectedContact } from '../components/MentionTextarea';
import { LinkSelector, type SelectedLink } from '../components/LinkSelector';
import { type ParsedNote } from '../types';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  note: ParsedNote;
}

// Helper to create a unique key for a link
function getLinkKey(link: SelectedLink): string {
  return `${link.type}:${link.id}`;
}

export function EditNoteModal({ isOpen, onClose, onSuccess, note }: EditNoteModalProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags?.join(', ') || '');
  const [contentMentions, setContentMentions] = useState<SelectedContact[]>([]);
  const [fieldMentions, setFieldMentions] = useState<SelectedContact[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<SelectedLink[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Track original links to detect removals
  const originalLinksRef = useRef<Map<string, SelectedLink>>(new Map());
  const linksInitializedRef = useRef(false);

  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();
  const createLinkMutation = useCreateLink();
  const deleteLinkByEntitiesMutation = useDeleteLinkByEntities();

  // Fetch related entities for links
  const { data: relatedEntitiesData } = useNoteRelatedEntities(note.id);
  
  // Use contact search with empty string to get contacts for mention resolution
  const { data: contactsData } = useContactSearch('', true);

  // Parse related entities into selectedLinks format and store original links
  useEffect(() => {
    if (relatedEntitiesData && !linksInitializedRef.current) {
      const parsed: SelectedLink[] = [];
      const originalMap = new Map<string, SelectedLink>();
      
      // Parse companies
      if (relatedEntitiesData.companies) {
        relatedEntitiesData.companies.forEach((company) => {
          const link: SelectedLink = { type: 'COMPANY', id: company.id, name: company.name };
          parsed.push(link);
          originalMap.set(getLinkKey(link), link);
        });
      }
      
      // Parse contacts
      if (relatedEntitiesData.contacts) {
        relatedEntitiesData.contacts.forEach((contact) => {
          const link: SelectedLink = { type: 'CONTACT', id: contact.id, name: `${contact.firstName} ${contact.lastName}` };
          parsed.push(link);
          originalMap.set(getLinkKey(link), link);
        });
      }
      
      // Parse jobs
      if (relatedEntitiesData.jobs) {
        relatedEntitiesData.jobs.forEach((job) => {
          const link: SelectedLink = { type: 'JOB', id: job.id, name: job.jobName };
          parsed.push(link);
          originalMap.set(getLinkKey(link), link);
        });
      }
      
      // Parse tasks
      if (relatedEntitiesData.tasks) {
        relatedEntitiesData.tasks.forEach((task) => {
          const link: SelectedLink = { type: 'TASK', id: task.id, name: task.title };
          parsed.push(link);
          originalMap.set(getLinkKey(link), link);
        });
      }
      
      // Parse pre-opportunities
      if (relatedEntitiesData.preOpportunities) {
        relatedEntitiesData.preOpportunities.forEach((preOpp) => {
          const link: SelectedLink = { type: 'PRE_OPPORTUNITY', id: preOpp.id, name: preOpp.entityNumber || 'Unknown Pre-Opp' };
          parsed.push(link);
          originalMap.set(getLinkKey(link), link);
        });
      }
      
      setSelectedLinks(parsed);
      originalLinksRef.current = originalMap;
      linksInitializedRef.current = true;
    }
  }, [relatedEntitiesData]);

  // Parse mentions from note - resolve UUIDs to contact names using search results
  useEffect(() => {
    if (note.mentions && note.mentions.length > 0 && contactsData && contactsData.length > 0) {
      interface ContactRecord {
        id: string;
        firstName: string;
        lastName: string;
      }
      const contactMap = new Map<string, ContactRecord>(
        contactsData.map((c: ContactRecord) => [c.id, c])
      );
      const resolvedMentions = note.mentions.map((id: string) => {
        const contact = contactMap.get(id);
        if (contact) {
          return { id, name: `${contact.firstName} ${contact.lastName}` };
        }
        return { id, name: id };
      });
      setFieldMentions(resolvedMentions);
    }
  }, [note.mentions, contactsData]);

  // Sync content mentions to field mentions
  useEffect(() => {
    if (contentMentions.length > 0) {
      setFieldMentions(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMentions = contentMentions.filter(m => !existingIds.has(m.id));
        return newMentions.length > 0 ? [...prev, ...newMentions] : prev;
      });
    }
  }, [contentMentions]);

  // Reset state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(', ') || '');
    linksInitializedRef.current = false;
  }, [note.id, note.title, note.content, note.tags]);

  if (!isOpen) return null;

  // Get mention IDs - returns only the first one due to API limitation
  const getMentionsString = (): string => {
    if (fieldMentions.length === 0) return '';
    return fieldMentions[0].id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      // Update the note
      await updateMutation.mutateAsync({
        id: note.id,
        input: {
          title: title.trim(),
          content: content.trim(),
          tags: tags.trim(),
          mentions: getMentionsString(),
        },
      });

      // Find links that were added (in current but not in original)
      const currentLinkKeys = new Set(selectedLinks.map(getLinkKey));
      const addedLinks = selectedLinks.filter(
        link => !originalLinksRef.current.has(getLinkKey(link))
      );

      // Find links that were removed (in original but not in current)
      const removedLinks: SelectedLink[] = [];
      originalLinksRef.current.forEach((link, key) => {
        if (!currentLinkKeys.has(key)) {
          removedLinks.push(link);
        }
      });

      // Delete removed links using deleteLinkByEntities
      for (const link of removedLinks) {
        try {
          await deleteLinkByEntitiesMutation.mutateAsync({
            sourceEntityType: 'NOTE' as EntityType,
            sourceEntityId: note.id,
            targetEntityType: link.type as EntityType,
            targetEntityId: link.id,
          });
        } catch {
          // Link might not exist, ignore error
        }
      }

      // Create new links
      for (const link of addedLinks) {
        try {
          await createLinkMutation.mutateAsync({
            sourceEntityType: 'NOTE' as EntityType,
            sourceEntityId: note.id,
            targetEntityType: link.type as EntityType,
            targetEntityId: link.id,
          });
        } catch {
          // Link might already exist, ignore error
        }
      }

      noteToasts.updateSuccess();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating note:', error);
      noteToasts.updateError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(note.id);
      noteToasts.deleteSuccess();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting note:', error);
      noteToasts.deleteError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isSubmitting = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Note</h2>
                <p className="text-sm text-gray-500">Update your note details and linked entities</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Title Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Note Details
              </h3>

              {/* Title */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Enter note title..."
                />
              </div>

              {/* Content */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Content
                </label>
                <MentionTextarea
                  value={content}
                  onChange={setContent}
                  selectedMentions={contentMentions}
                  onMentionsChange={setContentMentions}
                  rows={6}
                  className={`${inputClass} resize-none`}
                  placeholder="Write your note content here... Type @ to mention contacts"
                />
              </div>
            </div>

            {/* Tags & Mentions Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Organization
              </h3>

              {/* Tags */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Meeting, Follow-up, Important (comma-separated)"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Add tags to categorize this note (comma-separated)
                </p>
              </div>

              {/* Mentions */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Mentions
                </label>
                <MentionInput
                  selectedMentions={fieldMentions}
                  onMentionsChange={setFieldMentions}
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Search and select contacts to mention
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Links
              </h3>

              {/* Link Selector */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link to Entities
                </label>
                <LinkSelector
                  selectedLinks={selectedLinks}
                  onLinksChange={setSelectedLinks}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Link this note to jobs, companies, contacts, tasks, or pre-opportunities
                </p>
              </div>
            </div>

            {/* Danger Zone - Delete Note */}
            <div className="bg-red-50 rounded-xl p-5 border border-red-200">
              <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Once you delete this note, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete this note
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete this note? All linked entities and comments will also be removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
