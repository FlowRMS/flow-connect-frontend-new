/**
 * Custom Hook for Tasks State Management
 * Integrated with CRM API
 */

import { useState, useMemo, useCallback } from 'react';
import type { 
  Task, 
  TaskViewMode, 
  TaskFilterState, 
  TaskEditState,
  TaskDropdownState,
  ExpandedTextState,
  TaskStatusAPI,
  TaskStatus,
  TaskPriority
} from '../types';
import { 
  useCRMTasks, 
  useUpdateCRMTask, 
  useDeleteCRMTask,
  crmQueryKeys
} from '../../hooks/useCRMApi';
import { convertTaskLandingPageToUI, convertUIStatusToAPI, convertUIPriorityToAPI, getUniqueValues, tagsToString } from '../utils';
import { useQueryClient } from '@tanstack/react-query';

export function useTasksState() {
  const queryClient = useQueryClient();
  
  // API data fetching - only fetch tasks, related entities are fetched lazily in modals
  const { data: apiTasks = [], isLoading: isLoadingTasks, error: tasksError, refetch: refetchTasks } = useCRMTasks();
  
  // Mutations
  const updateTaskMutation = useUpdateCRMTask();
  const deleteTaskMutation = useDeleteCRMTask();
  
  // Convert API tasks to UI format
  // Using the new landing pages endpoint which returns TaskLandingPage type
  const tasks: Task[] = useMemo(() => {
    return apiTasks.map(task => convertTaskLandingPageToUI(task));
  }, [apiTasks]);
  
  // View mode
  const [viewMode, setViewMode] = useState<TaskViewMode>('grid');
  
  // Search and category
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing state
  const [editState, setEditState] = useState<TaskEditState>({
    taskId: null,
    field: null,
    value: ''
  });
  
  // Dropdown states
  const [dropdowns, setDropdowns] = useState<TaskDropdownState>({
    assignee: null,
    tags: null,
    entity: null,
    taskType: null,
    priority: null,
    dueDate: null,
    reminderDate: null
  });
  
  // Task selection
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // Modals
  const [showBulkActionsDropdown, setShowBulkActionsDropdown] = useState(false);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskDetailModal, setTaskDetailModal] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<ExpandedTextState | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TaskFilterState>({
    assignees: [],
    tags: [],
    taskTypes: [],
    priorities: [] as TaskPriority[],
    statuses: [] as TaskStatus[]
  });
  
  // Sorting
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Drag and drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  
  // Process tasks with filtering and sorting
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter (using API status)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(task => task.status === selectedCategory);
    }

    // Apply additional filters
    if (filters.assignees.length > 0) {
      filtered = filtered.filter(task => filters.assignees.includes(task.assignedTo));
    }
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task => task.tags.some(tag => filters.tags.includes(tag)));
    }
    if (filters.taskTypes.length > 0) {
      filtered = filtered.filter(task => filters.taskTypes.includes(task.taskType));
    }
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(task => filters.priorities.includes(task.priority));
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'Urgent': 3, 'Normal': 2, 'Low': 1, 'No priority': 0 };
          comparison = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, searchQuery, selectedCategory, filters, sortField, sortDirection]);

  // Task update function with API
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Find the task to get its original data
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Build the API update payload - ALWAYS include required field 'title'
    const apiUpdates: Record<string, unknown> = {
      // Required field - must always include title
      title: updates.title !== undefined ? updates.title : task.title,
      // Status and priority - use updated values or current values
      status: updates.status !== undefined 
        ? convertUIStatusToAPI(updates.status) 
        : task.apiStatus,
      priority: updates.priority !== undefined 
        ? convertUIPriorityToAPI(updates.priority) 
        : task.apiPriority,
    };
    
    // Optional fields - include if provided or keep existing value
    if (updates.description !== undefined) {
      apiUpdates.description = updates.description;
    } else if (task.description) {
      apiUpdates.description = task.description;
    }
    
    if (updates.dueDate !== undefined) {
      apiUpdates.dueDate = updates.dueDate;
    } else if (task.dueDate) {
      apiUpdates.dueDate = task.dueDate;
    }
    
    if (updates.tags !== undefined) {
      apiUpdates.tags = tagsToString(updates.tags);
    }
    
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        input: apiUpdates
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, [tasks, updateTaskMutation, queryClient]);

  // Toggle task completion (using API status)
  const toggleTaskComplete = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus: TaskStatusAPI = task.apiStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        input: { 
          title: task.title, // Required field
          status: newStatus,
          priority: task.apiPriority
        }
      });
      
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  }, [tasks, updateTaskMutation, queryClient]);

  // Inline editing
  const startEditing = (taskId: string, field: 'title' | 'description', currentValue: string) => {
    setEditState({ taskId, field, value: currentValue });
  };

  const saveEdit = useCallback(async () => {
    if (editState.taskId && editState.field && editState.value.trim()) {
      await updateTask(editState.taskId, { [editState.field]: editState.value });
    }
    cancelEdit();
  }, [editState, updateTask]);

  const cancelEdit = () => {
    setEditState({ taskId: null, field: null, value: '' });
  };

  // Tag management with API
  const addTag = useCallback(async (taskId: string, tag: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.tags.includes(tag)) {
      await updateTask(taskId, { tags: [...task.tags, tag] });
    }
  }, [tasks, updateTask]);

  const removeTag = useCallback(async (taskId: string, tagToRemove: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { tags: task.tags.filter(t => t !== tagToRemove) });
    }
  }, [tasks, updateTask]);

  const toggleTag = useCallback(async (taskId: string, tag: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTags = task.tags.includes(tag)
      ? task.tags.filter(t => t !== tag)
      : [...task.tags, tag];

    await updateTask(taskId, { tags: newTags });
  }, [tasks, updateTask]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [deleteTaskMutation, queryClient]);

  // Bulk update tasks
  const bulkUpdateTasks = useCallback(async (taskIds: string[], updates: Partial<Task>) => {
    const promises = taskIds.map(taskId => updateTask(taskId, updates));
    await Promise.all(promises);
  }, [updateTask]);

  // Bulk delete tasks
  const bulkDeleteTasks = useCallback(async (taskIds: string[]) => {
    const promises = taskIds.map(taskId => deleteTask(taskId));
    await Promise.all(promises);
    setSelectedTasks([]);
  }, [deleteTask]);

  // Dropdown management
  const setDropdown = (type: keyof TaskDropdownState, value: string | null) => {
    setDropdowns(prev => ({ ...prev, [type]: value }));
  };

  // Drag and drop with API update for Kanban
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleKanbanDrop = useCallback(async (targetStatus: TaskStatusAPI) => {
    if (!draggedTaskId) return;
    
    // Find the task to get its priority and title
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) {
      setDraggedTaskId(null);
      return;
    }
    
    try {
      await updateTaskMutation.mutateAsync({
        id: draggedTaskId,
        input: { 
          title: task.title, // Required field
          status: targetStatus,
          priority: task.apiPriority
        }
      });
      
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
    } catch (error) {
      console.error('Failed to update task status via drag-drop:', error);
    }
    
    setDraggedTaskId(null);
  }, [draggedTaskId, tasks, updateTaskMutation, queryClient]);

  const handleDrop = (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = filteredTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = filteredTasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // For now, just update the UI order - actual API ordering can be added later
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // Calculate task counts by status
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status).length;
  };

  // Get unique values for filters
  const uniqueAssignees = useMemo(() => getUniqueValues(tasks, 'assignedTo'), [tasks]);
  const uniqueTags = useMemo(() => {
    return Array.from(new Set(tasks.flatMap(t => t.tags))).sort();
  }, [tasks]);
  const uniqueTaskTypes = useMemo(() => getUniqueValues(tasks, 'taskType'), [tasks]);

  return {
    // Loading states
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
    
    // Mutation states
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    
    // View state
    viewMode,
    setViewMode,
    
    // Task data
    tasks,
    filteredTasks,
    
    // Search and category
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    
    // Sorting
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    
    // Editing
    editState,
    setEditState,
    startEditing,
    saveEdit,
    cancelEdit,
    
    // Dropdowns
    dropdowns,
    setDropdown,
    
    // Selection
    selectedTask,
    setSelectedTask,
    selectedTasks,
    setSelectedTasks,
    
    // Modals
    showBulkActionsDropdown,
    setShowBulkActionsDropdown,
    showSummarizeModal,
    setShowSummarizeModal,
    showCreateTaskModal,
    setShowCreateTaskModal,
    taskDetailModal,
    setTaskDetailModal,
    expandedText,
    setExpandedText,
    
    // Filters
    filters,
    setFilters,
    
    // Drag and drop
    draggedTaskId,
    handleDragStart,
    handleDrop,
    handleDragEnd,
    handleKanbanDrop,
    
    // Task operations
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addTag,
    removeTag,
    toggleTag,
    bulkUpdateTasks,
    bulkDeleteTasks,
    getTasksByStatus,
    
    // Unique values
    uniqueAssignees,
    uniqueTags,
    uniqueTaskTypes,
  };
}
