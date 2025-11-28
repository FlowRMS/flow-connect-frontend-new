/**
 * Custom Hook for Tasks State Management
 */

import { useState, useMemo } from 'react';
import type { 
  Task, 
  TaskViewMode, 
  TaskFilterState, 
  TaskEditState,
  TaskDropdownState,
  ExpandedTextState 
} from '../types';
import { MOCK_TASKS } from '../mockData';
import { applyTaskFilter, getUniqueValues } from '../utils';
import type { ActiveFilter } from '../../AdvancedFilters';

export function useTasksState() {
  // View mode
  const [viewMode, setViewMode] = useState<TaskViewMode>('grid');
  
  // Tasks data
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  
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
  const [taskDetailModal, setTaskDetailModal] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<ExpandedTextState | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TaskFilterState>({
    assignees: [],
    tags: [],
    taskTypes: [],
    priorities: []
  });
  
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

    // Apply category filter
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

    return filtered;
  }, [tasks, searchQuery, selectedCategory, filters]);

  // Task update function
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  // Toggle task completion
  const toggleTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'Completed' ? 'Upcoming' : 'Completed' }
          : task
      )
    );
  };

  // Inline editing
  const startEditing = (taskId: string, field: 'title' | 'description', currentValue: string) => {
    setEditState({ taskId, field, value: currentValue });
  };

  const saveEdit = () => {
    if (editState.taskId && editState.field && editState.value.trim()) {
      updateTask(editState.taskId, { [editState.field]: editState.value });
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditState({ taskId: null, field: null, value: '' });
  };

  // Tag management
  const addTag = (taskId: string, tag: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.tags.includes(tag)) {
      updateTask(taskId, { tags: [...task.tags, tag] });
    }
  };

  const removeTag = (taskId: string, tagToRemove: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { tags: task.tags.filter(t => t !== tagToRemove) });
    }
  };

  const toggleTag = (taskId: string, tag: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTags = task.tags.includes(tag)
      ? task.tags.filter(t => t !== tag)
      : [...task.tags, tag];

    updateTask(taskId, { tags: newTags });
  };

  // Dropdown management
  const setDropdown = (type: keyof TaskDropdownState, value: string | null) => {
    setDropdowns(prev => ({ ...prev, [type]: value }));
  };

  // Drag and drop
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDrop = (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = filteredTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = filteredTasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...tasks];
    const allDraggedIndex = newTasks.findIndex(t => t.id === draggedTaskId);
    const allTargetIndex = newTasks.findIndex(t => t.id === targetTaskId);

    const [draggedTask] = newTasks.splice(allDraggedIndex, 1);
    newTasks.splice(allTargetIndex, 0, draggedTask);

    setTasks(newTasks);
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
    // View state
    viewMode,
    setViewMode,
    
    // Task data
    tasks,
    setTasks,
    filteredTasks,
    
    // Search and category
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    
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
    
    // Task operations
    updateTask,
    toggleTaskComplete,
    addTag,
    removeTag,
    toggleTag,
    getTasksByStatus,
    
    // Unique values
    uniqueAssignees,
    uniqueTags,
    uniqueTaskTypes,
  };
}
