/**
 * Task Modal Component
 * Displays task details with edit, delete, and comment functionality
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskComment, TaskStatusAPI, TaskPriorityAPI } from '../types';
import { getInitials, getAvatarColor, getStatusColor, getPriorityColor, formatDate, parseTagsString } from '../utils';
import { 
  useCRMTaskConversations, 
  useAddCRMTaskConversation,
  useCRMTask,
  useUpdateCRMTask,
  useDeleteCRMTask,
  useCRMTaskRelations,
  useDeleteCRMTaskRelation,
  crmQueryKeys
} from '../../hooks/useCRMApi';
import { useQueryClient } from '@tanstack/react-query';
import { taskToasts } from '../../lib/toast';
import { API_STATUS_OPTIONS, API_PRIORITY_OPTIONS, AVAILABLE_TAGS } from '../constants';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onToggleComplete?: (id: string) => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

export default function TaskModal({ 
  task, 
  onClose, 
  onToggleComplete,
  onTaskUpdated,
  onTaskDeleted 
}: TaskModalProps) {
  const queryClient = useQueryClient();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editStatus, setEditStatus] = useState<TaskStatusAPI>(task.apiStatus);
  const [editPriority, setEditPriority] = useState<TaskPriorityAPI>(task.apiPriority);
  const [editDueDate, setEditDueDate] = useState(task.dueDate);
  const [editTags, setEditTags] = useState<string[]>(task.tags || []);
  const [customTag, setCustomTag] = useState('');
  
  // New comment state
  const [newComment, setNewComment] = useState('');
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Fetch full task details (includes tags)
  const { data: fullTask } = useCRMTask(task.id);
  
  // Fetch conversations from API
  const { data: apiConversations = [], isLoading: isLoadingConversations } = useCRMTaskConversations(task.id);
  
  // Fetch task relations
  const { data: taskRelations = [] } = useCRMTaskRelations(task.id);
  
  // Mutations
  const addConversationMutation = useAddCRMTaskConversation();
  const updateTaskMutation = useUpdateCRMTask();
  const deleteTaskMutation = useDeleteCRMTask();
  const deleteRelationMutation = useDeleteCRMTaskRelation();

  // Update edit state when full task loads (for tags)
  useEffect(() => {
    if (fullTask?.tags) {
      setEditTags(parseTagsString(fullTask.tags));
    }
  }, [fullTask]);

  // Convert API conversations to TaskComment format
  const conversation: TaskComment[] = apiConversations.map(conv => ({
    id: conv.id,
    author: conv.createdBy || 'Unknown',
    content: conv.content,
    timestamp: conv.createdAt,
  }));

  // Get tags from full task or fallback to landing page task
  const displayTags = fullTask?.tags ? parseTagsString(fullTask.tags) : task.tags;

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

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        await addConversationMutation.mutateAsync({
          taskId: task.id,
          content: newComment.trim(),
        });
        setNewComment('');
        taskToasts.commentAdded();
      } catch (error) {
        console.error('Failed to add comment:', error);
        taskToasts.commentError();
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        input: {
          title: editTitle,
          description: editDescription,
          status: editStatus,
          priority: editPriority,
          dueDate: editDueDate || undefined,
          tags: editTags.join(','),
        }
      });
      
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.task(task.id) });
      
      setIsEditMode(false);
      taskToasts.updateSuccess(editTitle);
      onTaskUpdated?.();
    } catch (error) {
      console.error('Failed to update task:', error);
      taskToasts.updateError();
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.apiStatus);
    setEditPriority(task.apiPriority);
    setEditDueDate(task.dueDate);
    setEditTags(fullTask?.tags ? parseTagsString(fullTask.tags) : task.tags);
    setIsEditMode(false);
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
      taskToasts.deleteSuccess();
      onTaskDeleted?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      taskToasts.deleteError();
    }
  };

  const handleAddTag = (tag: string) => {
    if (!editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !editTags.includes(customTag.trim())) {
      setEditTags([...editTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      await deleteRelationMutation.mutateAsync({ id: relationId, taskId: task.id });
    } catch (error) {
      console.error('Failed to delete relation:', error);
    }
  };

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

  const inputClass = "w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const selectClass = "px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

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
                {isEditMode ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`${inputClass} text-xl font-semibold mb-2`}
                    placeholder="Task title..."
                  />
                ) : (
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
                )}
                
                {isEditMode ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as TaskStatusAPI)}
                      className={selectClass}
                    >
                      {API_STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriorityAPI)}
                      className={selectClass}
                    >
                      {API_PRIORITY_OPTIONS.map(p => (
                        <option key={p} value={p}>{priorityLabels[p]}</option>
                      ))}
                    </select>
                  </div>
                ) : (
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
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Edit Task"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                      title="Delete Task"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round"/>
                        <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </>
                )}
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
                  {isEditMode ? (
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-sm text-[var(--foreground)]">{formatDate(task.dueDate)}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                  Description
                </h3>
                {isEditMode ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Task description..."
                  />
                ) : (
                  <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                      {task.description || 'No description'}
                    </p>
                  </div>
                )}
              </div>

              {/* Related Entities from API */}
              {taskRelations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Linked Entities
                  </h3>
                  <div className="space-y-2">
                    {taskRelations.filter(r => r.relatedType === 'JOB').length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Jobs:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {taskRelations.filter(r => r.relatedType === 'JOB').map((rel) => (
                            <span
                              key={rel.id}
                              className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1 group"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Job
                              {isEditMode && (
                                <button
                                  onClick={() => handleDeleteRelation(rel.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {taskRelations.filter(r => r.relatedType === 'CONTACT').length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Contacts:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {taskRelations.filter(r => r.relatedType === 'CONTACT').map((rel) => (
                            <span
                              key={rel.id}
                              className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center gap-1 group"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Contact
                              {isEditMode && (
                                <button
                                  onClick={() => handleDeleteRelation(rel.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {taskRelations.filter(r => r.relatedType === 'COMPANY').length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Companies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {taskRelations.filter(r => r.relatedType === 'COMPANY').map((rel) => (
                            <span
                              key={rel.id}
                              className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1 group"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Company
                              {isEditMode && (
                                <button
                                  onClick={() => handleDeleteRelation(rel.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legacy Related Entities (from landing page) */}
              {!taskRelations.length && task.entities && (task.entities.jobs?.length || task.entities.contacts?.length || task.entities.companies?.length) && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Related To
                  </h3>
                  <div className="space-y-2">
                    {task.entities.jobs && task.entities.jobs.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Jobs:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.entities.jobs.map((job) => (
                            <span
                              key={job.id}
                              className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              {job.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.entities.contacts && task.entities.contacts.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Contacts:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.entities.contacts.map((contact) => (
                            <span
                              key={contact.id}
                              className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                            >
                              {contact.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.entities.companies && task.entities.companies.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Companies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.entities.companies.map((company) => (
                            <span
                              key={company.id}
                              className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                            >
                              {company.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                  Tags
                </h3>
                {isEditMode ? (
                  <div className="space-y-3">
                    {/* Selected Tags */}
                    {editTags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {editTags.map((tag, idx) => (
                          <span
                            key={idx}
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
                      {AVAILABLE_TAGS.filter(tag => !editTags.includes(tag)).slice(0, 8).map(tag => (
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
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {displayTags && displayTags.length > 0 ? (
                      displayTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)]">No tags</p>
                    )}
                  </div>
                )}
              </div>

              {/* Conversation */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wider">
                  Comments ({isLoadingConversations ? '...' : conversation.length})
                </h3>
                <div className="space-y-4">
                  {isLoadingConversations ? (
                    <div className="flex justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    </div>
                  ) : conversation.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No comments yet</p>
                  ) : (
                    conversation.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(comment.author)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                          {getInitials(comment.author)}
                        </div>
                        <div className="flex-1">
                          <div className="bg-[var(--muted)]/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--foreground)]">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {formatTimestamp(comment.timestamp)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-[var(--foreground)]">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                    disabled={addConversationMutation.isPending}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={addConversationMutation.isPending || !newComment.trim()}
                    className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addConversationMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add Comment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border)] flex justify-between">
            <div>
              {isEditMode && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {isEditMode ? (
                <button
                  onClick={handleSaveEdit}
                  disabled={updateTaskMutation.isPending || !editTitle.trim()}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateTaskMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Task</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-6">
                Are you sure you want to delete &quot;{task.title}&quot;? All associated comments and links will also be deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={deleteTaskMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteTaskMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
