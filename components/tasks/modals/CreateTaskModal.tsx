/**
 * Create Task Modal Component
 * Modal for creating new tasks with title, description, priority, status, and entity relations
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  useCreateTask,
  useCreateTaskLink,
  useUserSearch
} from '../api';
import { useTaskCategories, type TaskCategory } from '../../hooks/useCRMApi';
import { taskToasts } from '../../lib/toast';
import { AVAILABLE_TAGS, API_PRIORITY_OPTIONS, API_STATUS_OPTIONS } from '../constants';
import type { TaskPriorityAPI, TaskStatusAPI } from '../types';
import { StyledDatePicker, parseDateString, formatDateToString } from '../components';
import { CustomSelect } from '../components';
import { LinkSelector, type SelectedLink } from '../../notes/components/LinkSelector';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLinks?: SelectedLink[];
}

export function CreateTaskModal({ isOpen, onClose, onSuccess, initialLinks }: CreateTaskModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusAPI>('TODO');
  const [priority, setPriority] = useState<TaskPriorityAPI>('NORMAL');
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Fetch task categories
  const { data: categoriesData } = useTaskCategories();
  const categories: TaskCategory[] = categoriesData ?? [];
  
  // Assignee state - now supports multiple assignees
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [debouncedAssigneeSearch, setDebouncedAssigneeSearch] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeDropdownPosition, setAssigneeDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const assigneeInputRef = useRef<HTMLInputElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Entity links state - unified using LinkSelector
  const [selectedLinks, setSelectedLinks] = useState<SelectedLink[]>(initialLinks || []);

  const [isMounted, setIsMounted] = useState(false);

  // Debounce assignee search to prevent focus loss on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAssigneeSearch(assigneeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [assigneeSearch]);

  // User search for assignee selection - uses debounced value
  const { data: assigneeUsers = [], isLoading: isLoadingAssignees } = useUserSearch(debouncedAssigneeSearch, isOpen && showAssigneeDropdown);

  // Mutations
  const createMutation = useCreateTask();
  const createLinkMutation = useCreateTaskLink();

  // Mount check for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset selectedLinks when modal opens with new initialLinks
  useEffect(() => {
    if (isOpen && initialLinks) {
      setSelectedLinks(initialLinks);
    }
  }, [isOpen, initialLinks]);

  // Update dropdown position when showing
  const updateDropdownPosition = () => {
    if (assigneeInputRef.current) {
      const rect = assigneeInputRef.current.getBoundingClientRect();
      setAssigneeDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (showAssigneeDropdown) {
      updateDropdownPosition();
    }
  }, [showAssigneeDropdown]);

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (assigneeInputRef.current && !assigneeInputRef.current.contains(target) &&
          assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(target)) {
        setShowAssigneeDropdown(false);
      }
    };

    // Reposition dropdown on scroll instead of closing
    const handleScroll = () => {
      if (showAssigneeDropdown) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    // Add scroll listener to the form element (modal content)
    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (formElement) {
        formElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showAssigneeDropdown]);

  if (!isOpen) return null;

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSelectAssignee = (contact: { id: string; firstName?: string | null; lastName?: string | null }) => {
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
    // Check if already selected
    if (!selectedAssignees.some(a => a.id === contact.id)) {
      setSelectedAssignees([...selectedAssignees, { id: contact.id, name }]);
    }
    setAssigneeSearch('');
    setShowAssigneeDropdown(false);
  };

  const handleRemoveAssignee = (assigneeId: string) => {
    setSelectedAssignees(selectedAssignees.filter(a => a.id !== assigneeId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      // Create the task with all fields
      const task = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        reminderDate: reminderDate || undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        assigneeIds: selectedAssignees.length > 0 ? selectedAssignees.map(a => a.id) : undefined,
        categoryId: selectedCategoryId || undefined,
      });

      // Create links for all selected entities
      for (const link of selectedLinks) {
        await createLinkMutation.mutateAsync({
          sourceEntityType: 'TASK',
          sourceEntityId: task.id,
          targetEntityType: link.type,
          targetEntityId: link.id,
        });
      }

      taskToasts.createSuccess(title);
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      taskToasts.createError(error instanceof Error ? error.message : undefined);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setPriority('NORMAL');
    setDueDate('');
    setReminderDate('');
    setSelectedTags([]);
    setSelectedLinks(initialLinks || []);
    setSelectedAssignees([]);
    setSelectedCategoryId('');
    setCustomTag('');
    setAssigneeSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isPending = createMutation.isPending || createLinkMutation.isPending;

  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";

  // Priority display names
  const priorityLabels: Record<TaskPriorityAPI, string> = {
    'LOW': 'Low',
    'NORMAL': 'Normal',
    'URGENT': 'Urgent',
    'CRITICAL': 'Critical'
  };

  // Status display names
  const statusLabels: Record<TaskStatusAPI, string> = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Create New Task</h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Add a new task to track your work</p>
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

        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Task Details Section */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Task Details
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
                  placeholder="Enter task title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe the task..."
                />
              </div>

              {/* Status, Priority, and Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </label>
                  <CustomSelect
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={API_STATUS_OPTIONS.map(s => ({
                      value: s,
                      label: statusLabels[s],
                    }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Priority
                  </label>
                  <CustomSelect
                    value={priority}
                    onChange={(val) => setPriority(val)}
                    options={API_PRIORITY_OPTIONS.map(p => ({
                      value: p,
                      label: priorityLabels[p],
                      color: p === 'CRITICAL' ? '#9333ea' : p === 'URGENT' ? '#ef4444' : p === 'NORMAL' ? '#3b82f6' : '#9ca3af',
                    }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Category
                  </label>
                  <CustomSelect
                    value={selectedCategoryId}
                    onChange={(val) => setSelectedCategoryId(val)}
                    options={[
                      { value: '', label: 'No Category' },
                      ...categories.map(c => ({
                        value: c.id,
                        label: c.name,
                      }))
                    ]}
                  />
                </div>
              </div>

              {/* Due Date and Reminder Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due Date
                  </label>
                  <StyledDatePicker
                    selected={parseDateString(dueDate)}
                    onChange={(date) => setDueDate(formatDateToString(date))}
                    placeholderText="Select due date..."
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Reminder Date
                  </label>
                  <StyledDatePicker
                    selected={parseDateString(reminderDate)}
                    onChange={(date) => setReminderDate(formatDateToString(date))}
                    placeholderText="Select reminder date..."
                  />
                </div>
              </div>

              {/* Assigned To - Multiple Assignees */}
              <div className="relative">
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Assignees
                </label>
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAssignees.map((assignee) => (
                      <span key={assignee.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {assignee.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(assignee.id)}
                          className="hover:text-blue-900"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  ref={assigneeInputRef}
                  type="text"
                  value={assigneeSearch}
                  onChange={(e) => {
                    setAssigneeSearch(e.target.value);
                    setShowAssigneeDropdown(true);
                  }}
                  onFocus={() => setShowAssigneeDropdown(true)}
                  className={inputClass}
                  placeholder={isLoadingAssignees ? "Loading users..." : "Search users to assign..."}
                  disabled={isLoadingAssignees}
                />
                {showAssigneeDropdown && isMounted && createPortal(
                  <div
                    ref={assigneeDropdownRef}
                    style={{
                      position: 'fixed',
                      top: assigneeDropdownPosition.top,
                      left: assigneeDropdownPosition.left,
                      width: assigneeDropdownPosition.width || 'auto',
                      zIndex: 9999,
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingAssignees ? (
                      <div className="px-4 py-6 text-center">
                        <svg className="animate-spin w-5 h-5 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <p className="text-sm text-gray-500">Loading users...</p>
                      </div>
                    ) : assigneeUsers.length > 0 ? (
                      assigneeUsers
                        .filter(user => !selectedAssignees.some(a => a.id === user.id))
                        .slice(0, 10)
                        .map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectAssignee({ id: user.id, firstName: user.firstName, lastName: user.lastName })}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                              {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                            </div>
                          </button>
                        ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        {assigneeSearch ? 'No users found' : 'Type to search users'}
                      </div>
                    )}
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Relations Section */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link to Entities
              </h3>
              
              <LinkSelector
                selectedLinks={selectedLinks}
                onLinksChange={setSelectedLinks}
                disabled={isPending}
              />
            </div>

            {/* Tags Section */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
              </h3>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Available Tags */}
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.filter(tag => !selectedTags.includes(tag)).slice(0, 12).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Add custom tag..."
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
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
                disabled={isPending}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
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
                    <span className="hidden sm:inline">Create Task</span>
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
