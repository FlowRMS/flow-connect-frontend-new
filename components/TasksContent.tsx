/**
 * Tasks Content Component - Main Container
 * Refactored to use modular, clean architecture with API integration
 */

'use client';

import React, { useState } from 'react';
import { useTasksState } from './tasks/hooks/useTasksState';
import { getTaskFilterOptions } from './tasks/config/filterConfig';
import { TASK_CATEGORIES, AVAILABLE_ASSIGNEES, AVAILABLE_PRIORITIES, AVAILABLE_TAGS, API_STATUS_OPTIONS, API_PRIORITY_OPTIONS } from './tasks/constants';
import GridView from './tasks/views/GridView';
import ListView from './tasks/views/ListView';
import KanbanView from './tasks/views/KanbanView';
import SpreadsheetView from './tasks/views/SpreadsheetView';
import CalendarView from './tasks/views/CalendarView';
import TaskModal from './tasks/modals/TaskModal';
import { CreateTaskModal } from './tasks/modals';
import AdvancedFilters from './AdvancedFilters';
import type { TaskStatusAPI } from './tasks/types';

export default function TasksContent() {
  const {
    // Loading states
    isLoading,
    error,
    refetch,
    isUpdating,
    
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
  } = useTasksState();

  // Sort dropdown state
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const taskFilterOptions = getTaskFilterOptions();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Loading state
  if (isLoading) {
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
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Tasks</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Kanban View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="10" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('spreadsheet')}
                className={`p-2 rounded ${viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Spreadsheet View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Calendar View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>

            {/* Filters and Actions */}
            <AdvancedFilters filterOptions={taskFilterOptions} />
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
                </svg>
                Sort
                {sortField !== 'dueDate' && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {sortField}
                  </span>
                )}
              </button>
              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[180px]">
                  <div className="p-2 space-y-1">
                    {[
                      { field: 'dueDate', label: 'Due Date' },
                      { field: 'priority', label: 'Priority' },
                      { field: 'title', label: 'Title' },
                      { field: 'status', label: 'Status' }
                    ].map(option => (
                      <button
                        key={option.field}
                        onClick={() => {
                          if (sortField === option.field) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField(option.field);
                            setSortDirection('asc');
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-[var(--muted)] ${
                          sortField === option.field ? 'bg-[var(--muted)] font-medium' : ''
                        }`}
                      >
                        {option.label}
                        {sortField === option.field && (
                          <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 20 20" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className={sortDirection === 'desc' ? 'rotate-180' : ''}
                          >
                            <path d="M5 12l5-5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border)] p-2">
                    <button
                      onClick={() => {
                        setSortField('dueDate');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded"
                    >
                      Reset Sort
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowBulkActionsDropdown(!showBulkActionsDropdown)}
                disabled={selectedTasks.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md transition-colors ${
                  selectedTasks.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[var(--muted)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="6" height="6" rx="1"/>
                  <rect x="11" y="3" width="6" height="6" rx="1"/>
                  <rect x="3" y="11" width="6" height="6" rx="1"/>
                  <rect x="11" y="11" width="6" height="6" rx="1"/>
                </svg>
                Bulk Actions
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
                              updateTask(taskId, { priority: e.target.value as 'No priority' | 'Urgent' });
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
            <button
              onClick={() => setShowSummarizeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
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
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          >
            <circle cx="8" cy="8" r="6"/>
            <path d="M12 12l5 5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Category Filters and Bulk Select */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {TASK_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {category}
              {category !== 'All' && (
                <span className="ml-2 text-xs opacity-75">
                  ({getTasksByStatus(category)})
                </span>
              )}
              {category === 'All' && (
                <span className="ml-2 text-xs opacity-75">({tasks.length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
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
        />
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggleComplete={toggleTaskComplete}
        />
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
