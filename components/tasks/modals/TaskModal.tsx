/**
 * Task Modal Component
 * Displays task details with edit, delete, and comment functionality
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Task, TaskComment, TaskStatusAPI, TaskPriorityAPI } from '../types';
import { getInitials, getAvatarColor, getStatusColor, getPriorityColor, formatDate, parseTagsString, convertRelatedEntitiesToUI } from '../utils';
import { 
  useTaskConversations, 
  useAddTaskConversation,
  useTask,
  useUpdateTask,
  useDeleteTask,
  useTaskRelatedEntities,
  useDeleteTaskLinkByEntities,
  useCreateTaskLink,
  useJobSearch,
  useContactSearch,
  useCompanySearch,
  useNoteSearch,
  usePreOpportunitySearch,
  useUserSearch,
  useQuoteSearch,
  useOrderSearch,
  useInvoiceSearch,
  useCheckSearch,
  useFactorySearch,
  useCustomerSearch,
  useProductSearch,
  tasksQueryKeys
} from '../api';
import { useQueryClient } from '@tanstack/react-query';
import { taskToasts } from '../../lib/toast';
import { API_STATUS_OPTIONS, API_PRIORITY_OPTIONS, AVAILABLE_TAGS } from '../constants';
import { StyledDatePicker, parseDateString, formatDateToString, CustomSelect } from '../components';

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
  const [editReminderDate, setEditReminderDate] = useState(task.reminderDate || '');
  const [editTags, setEditTags] = useState<string[]>(task.tags || []);
  const [customTag, setCustomTag] = useState('');
  
  // Assignee editing state
  const [editAssigneeName, setEditAssigneeName] = useState(task.assignedTo || 'Unassigned');
  const [editAssigneeId, setEditAssigneeId] = useState(task.assignedToId || '');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeInputRef = useRef<HTMLInputElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Entity linking state
  const [showAddEntityDropdown, setShowAddEntityDropdown] = useState(false);
  const [addEntityType, setAddEntityType] = useState<'JOB' | 'CONTACT' | 'COMPANY' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT' | null>(null);
  const [entitySearch, setEntitySearch] = useState('');
  const entitySearchRef = useRef<HTMLInputElement>(null);
  const entityDropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Dropdown position state for proper portal positioning
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [assigneeDropdownPosition, setAssigneeDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // New comment state
  const [newComment, setNewComment] = useState('');
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Fetch full task details (includes tags and assignedToId)
  const { data: fullTask } = useTask(task.id);
  
  // Fetch conversations from API
  const { data: apiConversations = [], isLoading: isLoadingConversations } = useTaskConversations(task.id);
  
  // Fetch task related entities
  const { data: relatedEntities } = useTaskRelatedEntities(task.id);
  
  // Entity search queries
  const { data: searchedJobs = [], isLoading: isLoadingJobs } = useJobSearch(entitySearch, isEditMode && addEntityType === 'JOB');
  const { data: searchedContacts = [], isLoading: isLoadingContacts } = useContactSearch(entitySearch, isEditMode && addEntityType === 'CONTACT');
  const { data: searchedCompanies = [], isLoading: isLoadingCompanies } = useCompanySearch(entitySearch, isEditMode && addEntityType === 'COMPANY');
  const { data: searchedNotes = [], isLoading: isLoadingNotes } = useNoteSearch(entitySearch, isEditMode && addEntityType === 'NOTE');
  const { data: searchedPreOpportunities = [], isLoading: isLoadingPreOpportunities } = usePreOpportunitySearch(entitySearch, isEditMode && addEntityType === 'PRE_OPPORTUNITY');
  const { data: searchedQuotes = [], isLoading: isLoadingQuotes } = useQuoteSearch(entitySearch, isEditMode && addEntityType === 'QUOTE');
  const { data: searchedOrders = [], isLoading: isLoadingOrders } = useOrderSearch(entitySearch, isEditMode && addEntityType === 'ORDER');
  const { data: searchedInvoices = [], isLoading: isLoadingInvoices } = useInvoiceSearch(entitySearch, isEditMode && addEntityType === 'INVOICE');
  const { data: searchedChecks = [], isLoading: isLoadingChecks } = useCheckSearch(entitySearch, isEditMode && addEntityType === 'CHECK');
  const { data: searchedFactories = [], isLoading: isLoadingFactories } = useFactorySearch(entitySearch, isEditMode && addEntityType === 'FACTORY');
  const { data: searchedCustomers = [], isLoading: isLoadingCustomers } = useCustomerSearch(entitySearch, isEditMode && addEntityType === 'CUSTOMER');
  const { data: searchedProducts = [], isLoading: isLoadingProducts } = useProductSearch(entitySearch, isEditMode && addEntityType === 'PRODUCT');
  
  // Assignee search (uses userSearch for better results)
  const { data: assigneeUsers = [], isLoading: isLoadingAssignees } = useUserSearch(assigneeSearch, isEditMode && showAssigneeDropdown);
  
  // Mutations
  const addConversationMutation = useAddTaskConversation();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const deleteLinkMutation = useDeleteTaskLinkByEntities();
  const createLinkMutation = useCreateTaskLink();

  // Mount check for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update edit state when full task loads (for tags, reminderDate, and assignedToId)
  // CRITICAL: fullTask from useTask has assignedToId (UUID), while the landing page task
  // only has assignedTo (name string). We must use fullTask.assignedToId for API updates.
  useEffect(() => {
    if (fullTask) {
      if (fullTask.tags) {
        setEditTags(parseTagsString(fullTask.tags));
      }
      if (fullTask.reminderDate) {
        setEditReminderDate(fullTask.reminderDate);
      }
      // CRITICAL: Update assignedToId from fullTask - this is the actual UUID
      if (fullTask.assignedToId) {
        setEditAssigneeId(fullTask.assignedToId);
      }
    }
  }, [fullTask]);

  // Update dropdown positions when showing dropdowns
  const updateDropdownPosition = useCallback(() => {
    if (entitySearchRef.current && addEntityType) {
      const rect = entitySearchRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [addEntityType]);

  const updateAssigneeDropdownPosition = useCallback(() => {
    if (assigneeInputRef.current && showAssigneeDropdown) {
      const rect = assigneeInputRef.current.getBoundingClientRect();
      setAssigneeDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showAssigneeDropdown]);

  // Update positions when dropdown is shown
  useEffect(() => {
    updateDropdownPosition();
  }, [addEntityType, updateDropdownPosition]);

  useEffect(() => {
    updateAssigneeDropdownPosition();
  }, [showAssigneeDropdown, updateAssigneeDropdownPosition]);

  // Close entity dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (entitySearchRef.current && !entitySearchRef.current.contains(target) && 
          entityDropdownRef.current && !entityDropdownRef.current.contains(target)) {
        setAddEntityType(null);
        setEntitySearch('');
        setDropdownPosition(null);
      }
      // Also handle assignee dropdown
      if (assigneeInputRef.current && !assigneeInputRef.current.contains(target) && 
          assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(target)) {
        setShowAssigneeDropdown(false);
        setAssigneeDropdownPosition(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      // CRITICAL: Determine the correct assignedToId to send
      // Priority: 1) User's edited value if they changed it, 2) fullTask.assignedToId from GetTask API
      // We MUST send assignedToId to preserve the assignment, otherwise it gets unassigned
      let finalAssignedToId: string | undefined = undefined;
      
      if (editAssigneeId && editAssigneeId.trim() !== '') {
        // User has set/edited an assignee
        finalAssignedToId = editAssigneeId;
      } else if (fullTask?.assignedToId) {
        // Preserve existing assignment from the full task data (GetTask API has assignedToId)
        finalAssignedToId = fullTask.assignedToId;
      }
      // If both are empty, finalAssignedToId stays undefined (truly unassigned)
      
      await updateTaskMutation.mutateAsync({
        id: task.id,
        input: {
          title: editTitle,
          description: editDescription,
          status: editStatus,
          priority: editPriority,
          dueDate: editDueDate || undefined,
          reminderDate: editReminderDate || undefined,
          tags: editTags.join(','),
          assignedToId: finalAssignedToId,
        }
      });
      
      // Note: useUpdateTask already handles cache invalidation in onSettled
      // No need to manually invalidate or refetch here - it causes duplicate API calls
      
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
    setEditReminderDate(fullTask?.reminderDate || task.reminderDate || '');
    setEditTags(fullTask?.tags ? parseTagsString(fullTask.tags) : task.tags);
    setEditAssigneeName(task.assignedTo || 'Unassigned');
    // CRITICAL: Use fullTask.assignedToId (UUID) when available, fallback to task.assignedToId
    setEditAssigneeId(fullTask?.assignedToId || task.assignedToId || '');
    setIsEditMode(false);
    setAddEntityType(null);
    setEntitySearch('');
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      // Note: useDeleteTask already handles cache invalidation in onSuccess
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

  const handleDeleteRelation = async (entityType: 'JOB' | 'CONTACT' | 'COMPANY' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT', entityId: string) => {
    try {
      await deleteLinkMutation.mutateAsync({ 
        sourceEntityType: 'TASK',
        sourceEntityId: task.id,
        targetEntityType: entityType,
        targetEntityId: entityId
      });
      // Invalidate related entities cache
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.relatedEntities(task.id) });
    } catch (error) {
      console.error('Failed to delete relation:', error);
    }
  };

  const handleAddEntity = async (entityType: 'JOB' | 'CONTACT' | 'COMPANY' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT', entityId: string) => {
    try {
      await createLinkMutation.mutateAsync({
        sourceEntityType: 'TASK',
        sourceEntityId: task.id,
        targetEntityType: entityType,
        targetEntityId: entityId
      });
      // Invalidate related entities cache
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.relatedEntities(task.id) });
      setAddEntityType(null);
      setEntitySearch('');
      setDropdownPosition(null);
    } catch (error) {
      console.error('Failed to add relation:', error);
    }
  };

  // Convert related entities to UI format
  const linkedEntities = relatedEntities ? convertRelatedEntitiesToUI(relatedEntities) : null;
  const hasLinkedEntities = linkedEntities && (
    linkedEntities.jobs.length > 0 || 
    linkedEntities.contacts.length > 0 || 
    linkedEntities.companies.length > 0 ||
    linkedEntities.notes.length > 0 ||
    linkedEntities.preOpportunities.length > 0 ||
    linkedEntities.quotes.length > 0 ||
    linkedEntities.orders.length > 0 ||
    linkedEntities.invoices.length > 0 ||
    linkedEntities.checks.length > 0 ||
    linkedEntities.factories.length > 0 ||
    linkedEntities.customers.length > 0 ||
    linkedEntities.products.length > 0
  );

  // Get current entity search results based on type
  const getEntitySearchResults = () => {
    switch (addEntityType) {
      case 'JOB':
        return { 
          data: searchedJobs.filter(j => !linkedEntities?.jobs.some(lj => lj.id === j.id)), 
          isLoading: isLoadingJobs,
          getName: (item: typeof searchedJobs[0]) => item.jobName || 'Unnamed Job'
        };
      case 'CONTACT':
        return { 
          data: searchedContacts.filter(c => !linkedEntities?.contacts.some(lc => lc.id === c.id)), 
          isLoading: isLoadingContacts,
          getName: (item: typeof searchedContacts[0]) => `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unnamed Contact'
        };
      case 'COMPANY':
        return { 
          data: searchedCompanies.filter(c => !linkedEntities?.companies.some(lc => lc.id === c.id)), 
          isLoading: isLoadingCompanies,
          getName: (item: typeof searchedCompanies[0]) => item.name || 'Unnamed Company'
        };
      case 'NOTE':
        return { 
          data: searchedNotes.filter(n => !linkedEntities?.notes.some(ln => ln.id === n.id)), 
          isLoading: isLoadingNotes,
          getName: (item: typeof searchedNotes[0]) => item.title || 'Untitled Note'
        };
      case 'PRE_OPPORTUNITY':
        return { 
          data: searchedPreOpportunities.filter(p => !linkedEntities?.preOpportunities.some(lp => lp.id === p.id)), 
          isLoading: isLoadingPreOpportunities,
          getName: (item: typeof searchedPreOpportunities[0]) => item.entityNumber || 'Unknown Pre-Opportunity'
        };
      case 'QUOTE':
        return { 
          data: searchedQuotes.filter(q => !linkedEntities?.quotes.some(lq => lq.id === q.id)), 
          isLoading: isLoadingQuotes,
          getName: (item: typeof searchedQuotes[0]) => item.quoteNumber || item.jobName || 'Unknown Quote'
        };
      case 'ORDER':
        return { 
          data: searchedOrders.filter(o => !linkedEntities?.orders.some(lo => lo.id === o.id)), 
          isLoading: isLoadingOrders,
          getName: (item: typeof searchedOrders[0]) => item.orderNumber || item.jobName || 'Unknown Order'
        };
      case 'INVOICE':
        return { 
          data: searchedInvoices.filter(i => !linkedEntities?.invoices.some(li => li.id === i.id)), 
          isLoading: isLoadingInvoices,
          getName: (item: typeof searchedInvoices[0]) => item.invoiceNumber || 'Unknown Invoice'
        };
      case 'CHECK':
        return { 
          data: searchedChecks.filter(c => !linkedEntities?.checks.some(lc => lc.id === c.id)), 
          isLoading: isLoadingChecks,
          getName: (item: typeof searchedChecks[0]) => item.checkNumber || 'Unknown Check'
        };
      case 'FACTORY':
        return { 
          data: searchedFactories.filter(f => !linkedEntities?.factories.some(lf => lf.id === f.id)), 
          isLoading: isLoadingFactories,
          getName: (item: typeof searchedFactories[0]) => item.title || 'Unknown Factory'
        };
      case 'CUSTOMER':
        return { 
          data: searchedCustomers.filter(c => !linkedEntities?.customers.some(lc => lc.id === c.id)), 
          isLoading: isLoadingCustomers,
          getName: (item: typeof searchedCustomers[0]) => item.companyName || 'Unknown Customer'
        };
      case 'PRODUCT':
        return { 
          data: searchedProducts.filter(p => !linkedEntities?.products.some(lp => lp.id === p.id)), 
          isLoading: isLoadingProducts,
          getName: (item: typeof searchedProducts[0]) => item.factoryPartNumber || 'Unknown Product'
        };
      default:
        return { data: [], isLoading: false, getName: () => '' };
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
  
  // CustomSelect options for status
  const statusOptions = API_STATUS_OPTIONS.map(s => ({
    value: s,
    label: statusLabels[s],
  }));
  
  // CustomSelect options for priority
  const priorityOptions = API_PRIORITY_OPTIONS.map(p => ({
    value: p,
    label: priorityLabels[p],
    color: p === 'CRITICAL' ? '#9333ea' : p === 'URGENT' ? '#ef4444' : p === 'NORMAL' ? '#3b82f6' : '#9ca3af',
  }));

  const inputClass = "w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const selectClass = "px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                    <CustomSelect
                      value={editStatus}
                      options={statusOptions}
                      onChange={(val) => setEditStatus(val as TaskStatusAPI)}
                    />
                    <CustomSelect
                      value={editPriority}
                      options={priorityOptions}
                      onChange={(val) => setEditPriority(val as TaskPriorityAPI)}
                    />
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
                  {isEditMode ? (
                    <div className="relative">
                      <input
                        ref={assigneeInputRef}
                        type="text"
                        value={assigneeSearch || editAssigneeName}
                        onChange={(e) => {
                          setAssigneeSearch(e.target.value);
                          setShowAssigneeDropdown(true);
                        }}
                        onFocus={() => {
                          setShowAssigneeDropdown(true);
                          // Update position when focused
                          setTimeout(() => {
                            if (assigneeInputRef.current) {
                              const rect = assigneeInputRef.current.getBoundingClientRect();
                              setAssigneeDropdownPosition({
                                top: rect.bottom + 4,
                                left: rect.left,
                                width: rect.width,
                              });
                            }
                          }, 0);
                        }}
                        placeholder="Search users..."
                        className={inputClass}
                      />
                      {showAssigneeDropdown && isMounted && assigneeDropdownPosition && createPortal(
                        <div
                          ref={assigneeDropdownRef}
                          style={{
                            position: 'fixed',
                            top: assigneeDropdownPosition.top,
                            left: assigneeDropdownPosition.left,
                            width: assigneeDropdownPosition.width,
                            zIndex: 9999,
                          }}
                          className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {isLoadingAssignees ? (
                            <div className="px-4 py-3 text-center text-sm text-gray-500">Loading...</div>
                          ) : assigneeUsers.length === 0 ? (
                            <div className="px-4 py-3 text-center text-sm text-gray-500">
                              {assigneeSearch ? 'No users found' : 'Type to search users'}
                            </div>
                          ) : (
                            assigneeUsers.slice(0, 10).map((user) => {
                              const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    setEditAssigneeName(userName);
                                    setEditAssigneeId(user.id);
                                    setAssigneeSearch('');
                                    setShowAssigneeDropdown(false);
                                    setAssigneeDropdownPosition(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <div className={`w-6 h-6 rounded-full ${getAvatarColor(userName)} flex items-center justify-center text-white text-xs font-semibold`}>
                                    {getInitials(userName)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span>{userName}</span>
                                    {user.email && <span className="text-xs text-gray-400">{user.email}</span>}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>,
                        document.body
                      )}
                      {editAssigneeName && editAssigneeName !== 'Unassigned' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAssigneeName('Unassigned');
                            setEditAssigneeId('');
                            setAssigneeSearch('');
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${getAvatarColor(editAssigneeName)} flex items-center justify-center text-white text-xs font-semibold`}>
                        {getInitials(editAssigneeName)}
                      </div>
                      <span className="text-sm text-[var(--foreground)]">{editAssigneeName}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Due Date
                  </h3>
                  {isEditMode ? (
                    <StyledDatePicker
                      selected={parseDateString(editDueDate)}
                      onChange={(date) => setEditDueDate(formatDateToString(date))}
                      placeholderText="Select due date..."
                    />
                  ) : (
                    <p className="text-sm text-[var(--foreground)]">{formatDate(task.dueDate)}</p>
                  )}
                </div>
              </div>

              {/* Reminder Date */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                    Reminder Date
                  </h3>
                  {isEditMode ? (
                    <StyledDatePicker
                      selected={parseDateString(editReminderDate)}
                      onChange={(date) => setEditReminderDate(formatDateToString(date))}
                      placeholderText="Select reminder date..."
                    />
                  ) : (
                    <p className="text-sm text-[var(--foreground)]">{task.reminderDate ? formatDate(task.reminderDate) : 'Not set'}</p>
                  )}
                </div>
                <div />
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
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                  Linked Entities
                </h3>
                <div className="space-y-2">
                  {linkedEntities?.jobs && linkedEntities.jobs.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Jobs:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.jobs.map((job) => (
                          <span
                            key={job.id}
                            className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {job.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('JOB', job.id)}
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
                  {linkedEntities?.contacts && linkedEntities.contacts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Contacts:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.contacts.map((contact) => (
                          <span
                            key={contact.id}
                            className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {contact.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('CONTACT', contact.id)}
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
                  {linkedEntities?.companies && linkedEntities.companies.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Companies:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.companies.map((company) => (
                          <span
                            key={company.id}
                            className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {company.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('COMPANY', company.id)}
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
                  {linkedEntities?.notes && linkedEntities.notes.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Notes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.notes.map((note) => (
                          <span
                            key={note.id}
                            className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {note.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('NOTE', note.id)}
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
                  {linkedEntities?.preOpportunities && linkedEntities.preOpportunities.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Pre-Opps:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.preOpportunities.map((preOpp) => (
                          <span
                            key={preOpp.id}
                            className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {preOpp.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('PRE_OPPORTUNITY', preOpp.id)}
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
                  {linkedEntities?.quotes && linkedEntities.quotes.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Quotes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.quotes.map((quote) => (
                          <span
                            key={quote.id}
                            className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            {quote.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('QUOTE', quote.id)}
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
                  {linkedEntities?.orders && linkedEntities.orders.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Orders:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.orders.map((order) => (
                          <span
                            key={order.id}
                            className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {order.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('ORDER', order.id)}
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
                  {linkedEntities?.invoices && linkedEntities.invoices.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Invoices:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.invoices.map((invoice) => (
                          <span
                            key={invoice.id}
                            className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                            </svg>
                            {invoice.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('INVOICE', invoice.id)}
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
                  {linkedEntities?.checks && linkedEntities.checks.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Checks:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.checks.map((check) => (
                          <span
                            key={check.id}
                            className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            {check.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('CHECK', check.id)}
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
                  {linkedEntities?.factories && linkedEntities.factories.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Factories:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.factories.map((factory) => (
                          <span
                            key={factory.id}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {factory.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('FACTORY', factory.id)}
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
                  {linkedEntities?.customers && linkedEntities.customers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Customers:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.customers.map((customer) => (
                          <span
                            key={customer.id}
                            className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {customer.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('CUSTOMER', customer.id)}
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
                  {linkedEntities?.products && linkedEntities.products.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[80px]">Products:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedEntities.products.map((product) => (
                          <span
                            key={product.id}
                            className="px-2.5 py-1 bg-lime-100 text-lime-700 rounded text-xs font-medium flex items-center gap-1 group"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {product.name}
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteRelation('PRODUCT', product.id)}
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
                  
                  {/* Add entity button - only in edit mode */}
                  {isEditMode && (
                    <div className="relative mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setAddEntityType('JOB')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'JOB' 
                              ? 'bg-green-100 border-green-300 text-green-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Job
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('CONTACT')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'CONTACT' 
                              ? 'bg-orange-100 border-orange-300 text-orange-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Contact
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('COMPANY')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'COMPANY' 
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Company
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('NOTE')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'NOTE' 
                              ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Note
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('PRE_OPPORTUNITY')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'PRE_OPPORTUNITY' 
                              ? 'bg-purple-100 border-purple-300 text-purple-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Pre-Opp
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('QUOTE')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'QUOTE' 
                              ? 'bg-cyan-100 border-cyan-300 text-cyan-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('ORDER')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'ORDER' 
                              ? 'bg-teal-100 border-teal-300 text-teal-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Order
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('INVOICE')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'INVOICE' 
                              ? 'bg-rose-100 border-rose-300 text-rose-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('CHECK')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'CHECK' 
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Check
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('FACTORY')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'FACTORY' 
                              ? 'bg-slate-100 border-slate-300 text-slate-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Factory
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('CUSTOMER')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'CUSTOMER' 
                              ? 'bg-amber-100 border-amber-300 text-amber-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddEntityType('PRODUCT')}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            addEntityType === 'PRODUCT' 
                              ? 'bg-lime-100 border-lime-300 text-lime-700' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          + Product
                        </button>
                      </div>
                      
                      {/* Entity search dropdown */}
                      {addEntityType && (
                        <div className="mt-2">
                          <input
                            ref={entitySearchRef}
                            type="text"
                            value={entitySearch}
                            onChange={(e) => setEntitySearch(e.target.value)}
                            placeholder={`Search ${addEntityType.toLowerCase()}s...`}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            autoFocus
                          />
                          {isMounted && createPortal(
                            <div 
                              ref={entityDropdownRef}
                              style={{
                                position: 'fixed',
                                top: entitySearchRef.current ? entitySearchRef.current.getBoundingClientRect().bottom + 4 : 0,
                                left: entitySearchRef.current ? entitySearchRef.current.getBoundingClientRect().left : 0,
                                width: entitySearchRef.current ? entitySearchRef.current.offsetWidth : 'auto',
                                zIndex: 9999,
                              }}
                              className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                            >
                              {(() => {
                                const { data, isLoading, getName } = getEntitySearchResults();
                                if (isLoading) {
                                  return (
                                    <div className="px-4 py-6 text-center">
                                      <svg className="animate-spin w-5 h-5 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                      </svg>
                                      <p className="text-sm text-gray-500">Loading...</p>
                                    </div>
                                  );
                                }
                                if (data.length === 0) {
                                  return (
                                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                                      {entitySearch ? 'No results found' : 'Type to search'}
                                    </div>
                                  );
                                }
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return data.slice(0, 10).map((item: any) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleAddEntity(addEntityType, item.id)}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                                  >
                                    {getName(item)}
                                  </button>
                                ));
                              })()}
                            </div>,
                            document.body
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!hasLinkedEntities && !isEditMode && (
                    <p className="text-sm text-[var(--muted-foreground)]">No linked entities</p>
                  )}
                </div>
              </div>

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
