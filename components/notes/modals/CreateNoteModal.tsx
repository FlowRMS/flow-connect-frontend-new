/**
 * Create Note Modal Component
 * Modal for creating new notes with title, content, tags, mentions, and links
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useCreateNote, useCreateLink, type EntityType } from '../api/useNotesApi';
import { noteToasts } from '../../lib/toast';
import { MentionTextarea, MentionInput, type SelectedContact } from '../components/MentionTextarea';
import { LinkSelector, type SelectedLink } from '../components/LinkSelector';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLinks?: SelectedLink[];
}

export function CreateNoteModal({ isOpen, onClose, onSuccess, initialLinks }: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [contentMentions, setContentMentions] = useState<SelectedContact[]>([]);
  const [fieldMentions, setFieldMentions] = useState<SelectedContact[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<SelectedLink[]>(initialLinks || []);

  const createMutation = useCreateNote();
  const createLinkMutation = useCreateLink();

  // Sync content mentions to field mentions so they appear in the Mentions section
  useEffect(() => {
    if (contentMentions.length > 0) {
      setFieldMentions(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMentions = contentMentions.filter(m => !existingIds.has(m.id));
        return newMentions.length > 0 ? [...prev, ...newMentions] : prev;
      });
    }
  }, [contentMentions]);

  // Reset selectedLinks when modal opens with new initialLinks
  useEffect(() => {
    if (isOpen && initialLinks) {
      setSelectedLinks(initialLinks);
    }
  }, [isOpen, initialLinks]);

  if (!isOpen) return null;

  // Get mention IDs as comma-separated string
  const getMentionsString = (): string => {
    if (fieldMentions.length === 0) return '';
    return fieldMentions.map(m => m.id).join(',');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      // Create the note first
      const createdNote = await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim(),
        mentions: getMentionsString(),
        isPublic,
      });

      // Create links for the note
      if (selectedLinks.length > 0 && createdNote?.id) {
        const linkPromises = selectedLinks.map(link =>
          createLinkMutation.mutateAsync({
            sourceEntityType: 'NOTE' as EntityType,
            sourceEntityId: createdNote.id,
            targetEntityType: link.type as EntityType,
            targetEntityId: link.id,
          })
        );
        
        try {
          await Promise.all(linkPromises);
        } catch (linkError) {
          console.error('Failed to create some links:', linkError);
          // Continue even if some links fail - the note was created successfully
        }
      }

      noteToasts.createSuccess();
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
      noteToasts.createError(error instanceof Error ? error.message : undefined);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags('');
    setIsPublic(false);
    setContentMentions([]);
    setFieldMentions([]);
    setSelectedLinks(initialLinks || []);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Create New Note</h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Add a new note with your observations and insights</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Title Section */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  placeholder="Write your note content here... Type @ to mention users"
                />
              </div>
            </div>

            {/* Tags & Mentions Section */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  Search and select users to mention
                </p>
              </div>

              {/* Public Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Make this note public</span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1.5 ml-7">
                  Public notes can be viewed by anyone with access to linked entities
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !title.trim()}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Create Note</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
