/**
 * Tasks Content Component - Main Container
 * Refactored to use modular, clean architecture with API integration
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from './ui/HeaderIconAnimations';
import { iconMap } from './Sidebar';
import type { RefObject } from 'react';
import { useTasksState } from './tasks/hooks/useTasksState';
import { useCRMTask } from './hooks/useCRMApi';
import { convertCRMTaskToUI } from './tasks/utils';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { getTaskFilterOptions, getTaskSortOptions } from './tasks/config/filterConfig';
import { TASK_CATEGORIES, AVAILABLE_ASSIGNEES, AVAILABLE_PRIORITIES, AVAILABLE_TAGS } from './tasks/constants';
import GridView from './tasks/views/GridView';
import ListView from './tasks/views/ListView';
import KanbanView from './tasks/views/KanbanView';
import SpreadsheetView from './tasks/views/SpreadsheetView';
import CalendarView from './tasks/views/CalendarView';
import TaskModal from './tasks/modals/TaskModal';
import { CreateTaskModal } from './tasks/modals';
import AdvancedFilters from './advancedFilters/AdvancedFilters';
import SortButton from './SortButton';

export default function TasksContent() {
  // Track if component is mounted to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Animation key to re-trigger header animations on each navigation
  const [animationKey] = useState(() => Date.now());

  // Track intentional clear to prevent re-selection after back navigation
  const isIntentionalClearRef = useRef(false);

  // Get task ID from URL - this is the source of truth for navigation
  const taskIdFromUrl = searchParams.get('id');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    // Loading states
    isLoading,
    error,
    refetch,
    isUpdating,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

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
    handleFiltersChange,

    // Advanced sorting
    clientSortColumns,
    handleMultiSortChange,
  } = useTasksState();

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Get filter and sort options with dynamic data
  const taskFilterOptions = useMemo(() => getTaskFilterOptions(
    uniqueTitles,
    uniqueStatuses,
    uniqueTaskTypes,
    uniquePriorities,
    uniqueAssignees,
    uniqueTags
  ), [uniqueTitles, uniqueStatuses, uniqueTaskTypes, uniquePriorities, uniqueAssignees, uniqueTags]);

  const taskSortOptions = useMemo(() => getTaskSortOptions(), []);

  // Fetch task details when navigating via URL
  // This ensures we can display the task even if it's not in the loaded pagination
  const targetTaskId = (!isIntentionalClearRef.current && taskIdFromUrl) ? taskIdFromUrl : '';
  const { data: taskData, isLoading: taskDetailLoading } = useCRMTask(targetTaskId);

  // When we get task data from API (navigating via URL), set it as selected
  useEffect(() => {
    if (taskData && taskIdFromUrl && !isIntentionalClearRef.current) {
      const mappedTask = convertCRMTaskToUI(taskData);
      if (!selectedTask || selectedTask.id !== mappedTask.id) {
        setSelectedTask(mappedTask);
      }
    }
  }, [taskData, taskIdFromUrl, selectedTask, setSelectedTask]);

  // Handle back navigation - close modal and clear URL
  const handleBack = () => {
    isIntentionalClearRef.current = true;
    setSelectedTask(null);
    router.replace('/tasks', { scroll: false });
    // Reset the flag after navigation
    setTimeout(() => {
      isIntentionalClearRef.current = false;
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Navigation morph hooks - must be called before any early returns
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  // Register header target on mount
  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'tasks';

  // Show consistent loading state during SSR and initial client render
  // This prevents hydration mismatch caused by localStorage-dependent query enabling
  if (!isMounted || isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          <span className="ml-3 text-[var(--muted-foreground)]">Loading tasks...</span>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">Failed to load tasks</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header */}
      <div className="pb-0 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 overflow-visible">
          <div className="flex items-start gap-4 overflow-visible">
            {/* Morphing Icon Target - Bounce Check Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="bounce-check"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['tasks']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                key={`tasks-title-${animationKey}`}
                className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Tasks
              </motion.h1>
              <motion.p
                key={`tasks-subtitle-${animationKey}`}
                className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {isLoading ? 'Loading...' : `${filteredTasks.length} tasks • Organize and track your work`}
              </motion.p>
            </div>
          </div>
          <motion.div
            key={`tasks-actions-${animationKey}`}
            className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Kanban View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="10" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('spreadsheet')}
                className={`hidden sm:block p-1.5 sm:p-2 rounded ${viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Spreadsheet View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`hidden sm:block p-1.5 sm:p-2 rounded ${viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Calendar View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>

            {/* Sort Button */}
            <SortButton
              sortOptions={taskSortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />

            {/* Filters */}
            <AdvancedFilters
              filterOptions={taskFilterOptions}
              activeFilters={activeFilters}
              onFiltersChange={handleFiltersChange}
            />
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowBulkActionsDropdown(!showBulkActionsDropdown)}
                disabled={selectedTasks.length === 0}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-[var(--border)] rounded-md transition-colors ${
                  selectedTasks.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[var(--muted)]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                  <rect x="3" y="3" width="6" height="6" rx="1"/>
                  <rect x="11" y="3" width="6" height="6" rx="1"/>
                  <rect x="3" y="11" width="6" height="6" rx="1"/>
                  <rect x="11" y="11" width="6" height="6" rx="1"/>
                </svg>
                <span className="hidden md:inline">Bulk Actions</span>
                {selectedTasks.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--primary)] text-white text-xs rounded-full">
                    {selectedTasks.length}
                  </span>
                )}
              </button>
              {showBulkActionsDropdown && selectedTasks.length > 0 && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[250px]">
                  <div className="p-3 space-y-3">
                    {/* Bulk Change Assignee */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Change Assignee</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            selectedTasks.forEach(taskId => {
                              updateTask(taskId, { assignedTo: e.target.value });
                            });
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">Select assignee...</option>
                        {AVAILABLE_ASSIGNEES.map(assignee => (
                          <option key={assignee} value={assignee}>{assignee}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bulk Change Priority */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Change Priority</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            selectedTasks.forEach(taskId => {
                              updateTask(taskId, { priority: e.target.value as 'Low priority' | 'Normal' | 'Urgent' | 'Critical' });
                            });
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">Select priority...</option>
                        {AVAILABLE_PRIORITIES.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bulk Add Tags */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Add Tags</label>
                      <div className="space-y-1 max-h-[120px] overflow-y-auto border border-[var(--border)] rounded p-2">
                        {AVAILABLE_TAGS.map(tag => (
                          <label key={tag} className="flex items-center gap-2 px-2 py-1 hover:bg-[var(--muted)] rounded cursor-pointer">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                selectedTasks.forEach(taskId => {
                                  const task = tasks.find(t => t.id === taskId);
                                  if (task) {
                                    const newTags = e.target.checked
                                      ? [...new Set([...task.tags, tag])]
                                      : task.tags.filter(t => t !== tag);
                                    updateTask(taskId, { tags: newTags });
                                  }
                                });
                              }}
                              className="w-4 h-4 accent-[var(--primary)]"
                            />
                            <span className="text-xs">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Clear Selection Button */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          setSelectedTasks([]);
                          setShowBulkActionsDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Summarize with FlowChat button - hidden for now */}
            <button
              onClick={() => setShowSummarizeModal(true)}
              className="hidden items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Summarize with FlowChat
            </button>
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </button>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3 sm:mt-4 mb-4 sm:mb-6">
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] sm:w-5 sm:h-5"
          >
            <circle cx="8" cy="8" r="6"/>
            <path d="M12 12l5 5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Category Filters and Bulk Select */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 flex-1 -mx-1 px-1">
          {TASK_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {category}
              {category !== 'All' && (
                <span className="ml-1 sm:ml-2 text-xs opacity-75">
                  ({getTasksByStatus(category)})
                </span>
              )}
              {category === 'All' && (
                <span className="ml-1 sm:ml-2 text-xs opacity-75">({tasks.length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedTasks(filteredTasks.map(t => t.id));
                } else {
                  setSelectedTasks([]);
                }
              }}
              className="w-4 h-4 accent-[var(--primary)]"
            />
            Select All
          </label>
        </div>
      </div>

      {/* View Rendering */}
      {viewMode === 'grid' && (
        <GridView
          tasks={filteredTasks}
          editState={editState}
          dropdowns={dropdowns}
          onUpdateTask={updateTask}
          onToggleComplete={toggleTaskComplete}
          onStartEditing={startEditing}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          onSetDropdown={setDropdown}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onSelectTask={setSelectedTask}
          setEditValue={(value) => setEditState({ ...editState, value })}
        />
      )}
      
      {viewMode === 'list' && (
        <ListView
          tasks={filteredTasks}
          onUpdateTask={updateTask}
          onToggleComplete={toggleTaskComplete}
          onSelectTask={setSelectedTask}
        />
      )}
      
      {viewMode === 'kanban' && (
        <KanbanView
          tasks={filteredTasks}
          onUpdateTask={updateTask}
          onToggleComplete={toggleTaskComplete}
          draggedTaskId={draggedTaskId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onKanbanDrop={handleKanbanDrop}
        />
      )}
      
      {viewMode === 'spreadsheet' && (
        <SpreadsheetView
          tasks={filteredTasks}
          selectedTasks={selectedTasks}
          onUpdateTask={updateTask}
          onToggleComplete={toggleTaskComplete}
          onSelectTask={(taskId, selected) => {
            if (selected) {
              setSelectedTasks(prev => [...prev, taskId]);
            } else {
              setSelectedTasks(prev => prev.filter(id => id !== taskId));
            }
          }}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedTasks(filteredTasks.map(t => t.id));
            } else {
              setSelectedTasks([]);
            }
          }}
        />
      )}
      
      {viewMode === 'calendar' && (
        <CalendarView
          tasks={filteredTasks}
          onToggleComplete={toggleTaskComplete}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* Loading state for task detail from URL navigation */}
      {taskDetailLoading && taskIdFromUrl && !selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-[var(--muted-foreground)]">Loading task...</p>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleBack}
          onToggleComplete={toggleTaskComplete}
          onTaskUpdated={() => refetch()}
          onTaskDeleted={() => refetch()}
        />
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Loading more tasks...</span>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onSuccess={() => {
            setShowCreateTaskModal(false);
            refetch();
          }}
        />
      )}
    </main>
  );
}
