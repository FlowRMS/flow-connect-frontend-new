/**
 * Custom Hook for Tasks State Management
 * Integrated with Tasks API (following notes pattern)
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
import type { ActiveFilter, ActiveSort } from '../../AdvancedFilters';
import { applyFilter } from '../../lib/filter-utils';
import {
  useTasksInfinite,
  useUpdateTask,
  useDeleteTask,
  useContactsMap,
  tasksQueryKeys,
  type TaskLandingPageFilter,
  type TaskLandingPageOrderBy
} from '../api';
import { fetchTask as fetchTaskApi, type TaskLandingPage } from '../api/tasksApi';
import { convertTaskLandingPageToUI, convertUIStatusToAPI, convertUIPriorityToAPI, getUniqueValues, tagsToString } from '../utils';
import { useQueryClient } from '@tanstack/react-query';
import { taskToasts } from '../../lib/toast';

export function useTasksState() {
  const queryClient = useQueryClient();

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<TaskLandingPageFilter[]>([]);
  const [serverOrderBy, setServerOrderBy] = useState<TaskLandingPageOrderBy[]>([]);

  // API data fetching with infinite scroll - now with server-side filters
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasksInfinite(serverFilters, serverOrderBy);

  // Flatten paginated results with deduplication
  const apiTasks = useMemo(() => {
    if (!tasksData?.pages) return [];
    const allRecords = tasksData.pages.flatMap(page => page.records);
    // Deduplicate by ID
    const seen = new Set<string>();
    return allRecords.filter((record: TaskLandingPage) => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [tasksData]);
  
  // Extract unique assignedTo values that look like UUIDs (for contact lookup)
  const assignedToIds = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ids = apiTasks
      .map(task => task.assignedTo)
      .filter((id): id is string => !!id && uuidRegex.test(id));
    return [...new Set(ids)];
  }, [apiTasks]);
  
  // Fetch contact names for assigned IDs
  const { data: contactsMap = new Map<string, string>() } = useContactsMap(assignedToIds);
  
  // Mutations
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  
  // Convert API tasks to UI format, resolving assignedTo IDs to names
  // Using the new landing pages endpoint which returns TaskLandingPage type
  const tasks: Task[] = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return apiTasks.map((task) => {
      const uiTask = convertTaskLandingPageToUI(task);
      
      // If assignedTo is a UUID, look up the contact name
      if (task.assignedTo && uuidRegex.test(task.assignedTo)) {
        const contactName = contactsMap.get(task.assignedTo);
        if (contactName) {
          uiTask.assignedTo = contactName;
          uiTask.assignedToId = task.assignedTo;
        } else {
          // Keep it as "Unassigned" until the contact is loaded
          uiTask.assignedToId = task.assignedTo;
        }
      }
      
      return uiTask;
    });
  }, [apiTasks, contactsMap]);
  
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

  // Advanced filtering and sorting state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

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

    // Apply category filter (based on due date and status)
    if (selectedCategory !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (selectedCategory) {
        case 'Completed':
          filtered = filtered.filter(task => task.apiStatus === 'COMPLETED');
          break;
        case 'Today':
          filtered = filtered.filter(task => {
            if (task.apiStatus === 'COMPLETED') return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });
          break;
        case 'Overdue':
          filtered = filtered.filter(task => {
            if (task.apiStatus === 'COMPLETED') return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() < today.getTime();
          });
          break;
        case 'Upcoming':
          filtered = filtered.filter(task => {
            if (task.apiStatus === 'COMPLETED') return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            // Upcoming: tomorrow or within next 7 days
            return dueDate.getTime() >= tomorrow.getTime() && 
                   dueDate.getTime() <= today.getTime() + (7 * 24 * 60 * 60 * 1000);
          });
          break;
        case 'Waiting':
          filtered = filtered.filter(task => {
            if (task.apiStatus === 'COMPLETED') return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            // Waiting: more than 7 days in the future
            return dueDate.getTime() > today.getTime() + (7 * 24 * 60 * 60 * 1000);
          });
          break;
        default:
          filtered = filtered.filter(task => task.status === selectedCategory);
      }
    }

    // Apply additional filters (legacy)
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

    // Apply advanced filters (multi-select from AdvancedFilters component)
    if (activeFilters.length > 0) {
      filtered = filtered.filter((task) =>
        activeFilters.every((filter) => applyFilter(task as unknown as Record<string, unknown>, filter))
      );
    } else if (activeFilter) {
      // Backward compatibility for single filter
      filtered = filtered.filter((task) => applyFilter(task as unknown as Record<string, unknown>, activeFilter));
    }

    // Apply advanced sorting (multi-sort from SortButton component)
    if (clientSortColumns.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of clientSortColumns) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aVal = String((a as any)[sort.columnName] || '');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bVal = String((b as any)[sort.columnName] || '');
          const comparison = aVal.localeCompare(bVal);
          if (comparison !== 0) {
            return sort.direction === 'ASC' ? comparison : -comparison;
          }
        }
        return 0;
      });
    } else if (clientSortColumn) {
      // Single sort from SortButton
      filtered = [...filtered].sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aVal = String((a as any)[clientSortColumn] || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bVal = String((b as any)[clientSortColumn] || '');
        const comparison = aVal.localeCompare(bVal);
        return clientSortDirection === 'ASC' ? comparison : -comparison;
      });
    } else {
      // Apply legacy sorting (from custom sort dropdown)
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
    }

    return filtered;
  }, [tasks, searchQuery, selectedCategory, filters, sortField, sortDirection, activeFilters, activeFilter, clientSortColumns, clientSortColumn, clientSortDirection]);

  // Task update function with API - ALWAYS sends complete data to prevent field nullification
  // CRITICAL: We fetch the full task first to get assignedToId since landing pages only have assignedTo (name)
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Find the task to get its original data
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      // CRITICAL: Fetch the full task to get assignedToId (GetTask API has it, landing pages don't)
      const fullTask = await fetchTaskApi(taskId);
      
      // Determine the correct assignedToId
      // Priority: 1) explicit update, 2) fullTask.assignedToId from GetTask API
      let assignedToIdValue: string | undefined = undefined;
      if (updates.assignedToId !== undefined) {
        // Explicit update - use it if provided
        assignedToIdValue = updates.assignedToId || undefined;
      } else if (fullTask?.assignedToId) {
        // Use assignedToId from the full task (GetTask API)
        assignedToIdValue = fullTask.assignedToId;
      }
      
      // Build the COMPLETE API update payload - always include ALL fields
      const apiUpdates = {
        // Required fields - must always include these
        title: updates.title !== undefined ? updates.title : task.title,
        status: updates.status !== undefined 
          ? convertUIStatusToAPI(updates.status) 
          : task.apiStatus,
        priority: updates.priority !== undefined 
          ? convertUIPriorityToAPI(updates.priority) 
          : task.apiPriority,
        // ALWAYS include all optional fields to prevent them from being nulled
        description: updates.description !== undefined 
          ? updates.description 
          : (task.description || ''),
        dueDate: updates.dueDate !== undefined 
          ? updates.dueDate 
          : (task.dueDate || undefined),
        reminderDate: updates.reminderDate !== undefined 
          ? updates.reminderDate 
          : (task.reminderDate || undefined),
        // Always include tags - either updated or existing (use fullTask.tags for accuracy)
        tags: updates.tags !== undefined 
          ? tagsToString(updates.tags) 
          : (fullTask?.tags || tagsToString(task.tags) || ''),
        // Always include assignedToId from the fetched full task
        assignedToId: assignedToIdValue,
      };
      
      await updateTaskMutation.mutateAsync({
        id: taskId,
        input: apiUpdates
      });
      
      taskToasts.updateSuccess(task.title);
    } catch (error) {
      console.error('Failed to update task:', error);
      taskToasts.updateError();
    }
  }, [tasks, updateTaskMutation]);

  // Toggle task completion (using API status) - sends complete data
  // CRITICAL: We fetch the full task first to get assignedToId
  const toggleTaskComplete = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus: TaskStatusAPI = task.apiStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const isCompleting = newStatus === 'COMPLETED';
    
    try {
      // CRITICAL: Fetch the full task to get assignedToId (GetTask API has it)
      const fullTask = await fetchTaskApi(taskId);
      
      // Send COMPLETE data - including assignedToId from the fetched full task
      await updateTaskMutation.mutateAsync({
        id: taskId,
        input: { 
          title: task.title,
          status: newStatus,
          priority: task.apiPriority,
          description: task.description || '',
          dueDate: task.dueDate || undefined,
          reminderDate: task.reminderDate || undefined,
          tags: fullTask?.tags || tagsToString(task.tags) || '',
          assignedToId: fullTask?.assignedToId || undefined,
        }
      });
      
      if (isCompleting) {
        taskToasts.completedSuccess(task.title);
      } else {
        taskToasts.updateSuccess(task.title);
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      taskToasts.updateError();
    }
  }, [tasks, updateTaskMutation]);

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
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list() });
      taskToasts.deleteSuccess();
    } catch (error) {
      console.error('Failed to delete task:', error);
      taskToasts.deleteError();
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

  // Drag and drop with API update for Kanban - sends complete data
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleKanbanDrop = useCallback(async (targetStatus: TaskStatusAPI) => {
    if (!draggedTaskId) return;
    
    // Find the task to get all its data
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) {
      setDraggedTaskId(null);
      return;
    }
    
    const taskIdToUpdate = draggedTaskId;
    
    // Clear dragged state immediately
    setDraggedTaskId(null);
    
    // OPTIMISTIC UPDATE: Immediately update the cache for instant visual feedback
    // This is done BEFORE the API call, so the card moves immediately
    const previousTasks = queryClient.getQueryData<import('../api/tasksApi').TaskLandingPage[]>(tasksQueryKeys.list());
    
    if (previousTasks) {
      queryClient.setQueryData<import('../api/tasksApi').TaskLandingPage[]>(tasksQueryKeys.list(), (old) => {
        if (!old) return old;
        return old.map(t => {
          if (t.id === taskIdToUpdate) {
            return {
              ...t,
              status: targetStatus, // Update status immediately
            };
          }
          return t;
        });
      });
    }
    
    try {
      // Fetch full task to get assignedToId (GetTask API has it)
      const fullTask = await fetchTaskApi(taskIdToUpdate);
      
      // Send COMPLETE data - including assignedToId from the fetched full task
      await updateTaskMutation.mutateAsync({
        id: taskIdToUpdate,
        input: { 
          title: task.title,
          status: targetStatus,
          priority: task.apiPriority,
          description: task.description || '',
          dueDate: task.dueDate || undefined,
          reminderDate: task.reminderDate || undefined,
          tags: fullTask?.tags || tagsToString(task.tags) || '',
          assignedToId: fullTask?.assignedToId || undefined,
        }
      });
      
      // Show success toast after API update
      taskToasts.updateSuccess(task.title);
    } catch (error) {
      console.error('Failed to update task status via drag-drop:', error);
      // ROLLBACK: Restore previous state on error
      if (previousTasks) {
        queryClient.setQueryData(tasksQueryKeys.list(), previousTasks);
      }
      taskToasts.updateError();
    }
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

  // Calculate task counts by category (based on due date and status)
  const getTasksByStatus = useCallback((category: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (category) {
      case 'All':
        return tasks.length;
      case 'Completed':
        return tasks.filter(task => task.apiStatus === 'COMPLETED').length;
      case 'Today':
        return tasks.filter(task => {
          if (task.apiStatus === 'COMPLETED') return false;
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        }).length;
      case 'Overdue':
        return tasks.filter(task => {
          if (task.apiStatus === 'COMPLETED') return false;
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() < today.getTime();
        }).length;
      case 'Upcoming':
        return tasks.filter(task => {
          if (task.apiStatus === 'COMPLETED') return false;
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          // Upcoming: tomorrow or within next 7 days
          return dueDate.getTime() >= tomorrow.getTime() && 
                 dueDate.getTime() <= today.getTime() + (7 * 24 * 60 * 60 * 1000);
        }).length;
      case 'Waiting':
        return tasks.filter(task => {
          if (task.apiStatus === 'COMPLETED') return false;
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          // Waiting: more than 7 days in the future
          return dueDate.getTime() > today.getTime() + (7 * 24 * 60 * 60 * 1000);
        }).length;
      default:
        return tasks.filter(task => task.status === category).length;
    }
  }, [tasks]);

  // Get unique values for filters
  const uniqueAssignees = useMemo(() => getUniqueValues(tasks, 'assignedTo'), [tasks]);
  const uniqueTags = useMemo(() => {
    return Array.from(new Set(tasks.flatMap(t => t.tags))).sort();
  }, [tasks]);
  const uniqueTaskTypes = useMemo(() => getUniqueValues(tasks, 'taskType'), [tasks]);
  const uniqueTitles = useMemo(() => getUniqueValues(tasks, 'title'), [tasks]);
  const uniqueStatuses = useMemo(() => getUniqueValues(tasks, 'status'), [tasks]);
  const uniquePriorities = useMemo(() => getUniqueValues(tasks, 'priority'), [tasks]);

  // Convert ActiveFilter to TaskLandingPageFilter for server-side filtering
  const toServerFilters = useCallback((filters: ActiveFilter[]): TaskLandingPageFilter[] => {
    return filters.map(f => {
      // Only include value OR values, not both - check which one exists
      if (f.values && f.values.length > 0) {
        return {
          operator: f.operator,
          columnName: f.columnName,
          values: f.values,
        };
      }
      return {
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
      };
    });
  }, []);

  // Convert ActiveSort to TaskLandingPageOrderBy for server-side sorting
  const toServerOrderBy = useCallback((sorts: ActiveSort[]): TaskLandingPageOrderBy[] => {
    return sorts.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
  }, []);

  // Advanced filter handlers - now with server-side filtering
  const handleFilterChange = useCallback((filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
      setServerFilters(toServerFilters([filter])); // Server-side filter
    } else {
      setActiveFilters([]);
      setServerFilters([]); // Clear server-side filters
    }
  }, [toServerFilters]);

  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    setServerFilters(toServerFilters(filters)); // Server-side filters
  }, [toServerFilters]);

  // Advanced sort handlers - now with server-side sorting
  const handleSortChange = useCallback((sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
      setClientSortColumns([sort]);
      setServerOrderBy(toServerOrderBy([sort])); // Server-side sort
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
      setClientSortColumns([]);
      setServerOrderBy([]); // Clear server-side sort
    }
  }, [toServerOrderBy]);

  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
    if (sorts.length > 0) {
      setClientSortColumn(sorts[0].columnName);
      setClientSortDirection(sorts[0].direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
    setServerOrderBy(toServerOrderBy(sorts)); // Server-side sort
  }, [toServerOrderBy]);

  return {
    // Loading states
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

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
    
    // Unique values for filter options
    uniqueAssignees,
    uniqueTags,
    uniqueTaskTypes,
    uniqueTitles,
    uniqueStatuses,
    uniquePriorities,

    // Advanced filtering
    activeFilters,
    setActiveFilters,
    activeFilter,
    setActiveFilter,
    handleFilterChange,
    handleFiltersChange,

    // Advanced sorting
    clientSortColumns,
    setClientSortColumns,
    clientSortColumn,
    setClientSortColumn,
    clientSortDirection,
    setClientSortDirection,
    handleSortChange,
    handleMultiSortChange,
  };
}
