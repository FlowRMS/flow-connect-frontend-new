/**
 * Jobs Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import AdvancedFilters, { ActiveFilter, ActiveSort } from '../AdvancedFilters';
import SortButton from '../SortButton';
import CreateJobModal from '../CreateJobModal';
import { useCRMJobLandingPages, useCRMJobStatuses, useUpdateCRMJob } from '../hooks/useCRMApi';
import { hasCRMTokens } from '../lib/crm-auth';
import { jobToasts } from '../lib/toast';
import { useJobsState } from './hooks/useJobsState';
import { getJobFilterOptions, getJobSortOptions } from './config/filterConfig';
import { JobDetailView } from './detail/JobDetailView';
import { CompanyDetailView } from './detail/CompanyDetailView';
import { KanbanView } from './views/KanbanView';
import { ListView } from './views/ListView';
import { getCompanyDetails } from './mockData';
import type { Job } from './types';
import type { Company, Contact } from '../lib/crm-graphql';

export default function JobsContent() {
  // Router for navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // CRM API hooks
  const isConnected = hasCRMTokens();
  const { data: landingPageJobs, isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useCRMJobLandingPages();
  const { data: apiStatuses, isLoading: statusesLoading } = useCRMJobStatuses();
  const updateJobMutation = useUpdateCRMJob();

  // State management
  const {
    viewMode, setViewMode,
    jobs, stages,
    selectedJob, setSelectedJob,
    isEditing, setIsEditing,
    editFormData, setEditFormData,
    selectedCompany, setSelectedCompany,
    activeId, setActiveId,
    showCreateJobModal, setShowCreateJobModal,
    showDedupeModal, setShowDedupeModal,
    showRepTypeModal, setShowRepTypeModal,
    mergeStrategy, setMergeStrategy,
    duplicateGroups,
    selectedDuplicateGroup, setSelectedDuplicateGroup,
    primaryJob, setPrimaryJob,
    visibleCategories, setVisibleCategories,
    repType, setRepType,
    activeFilters, setActiveFilters,
    activeFilter, setActiveFilter,
    clientSortColumns, setClientSortColumns,
    clientSortColumn, setClientSortColumn,
    clientSortDirection, setClientSortDirection,
    uniqueJobNames, uniqueStatuses, uniqueTypes, uniqueCreators,
  } = useJobsState(landingPageJobs, apiStatuses);

  // Check for ID in query params to auto-select a job
  useEffect(() => {
    const jobId = searchParams.get('id');
    if (jobId && jobs.length > 0 && !selectedJob) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        // Clear the query param after selecting
        router.replace('/jobs', { scroll: false });
      }
    }
  }, [searchParams, jobs, selectedJob, setSelectedJob, router]);

  // Filter and sort configuration
  const jobFilterOptions = getJobFilterOptions(uniqueJobNames, uniqueStatuses, uniqueTypes, uniqueCreators);
  const jobSortOptions = getJobSortOptions();

  // Event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Drag-drop status change would require updateJob API mutation
    // For now, just cancel the drag operation
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleFilterChange = (filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    // Also update the multi-filter state
    if (filter) {
      setActiveFilters([filter]);
    } else {
      setActiveFilters([]);
    }
  };

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    // Also update the single filter for backward compatibility
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
  };

  const handleSortChange = (sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
      setClientSortColumns([sort]);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
      setClientSortColumns([]);
    }
  };

  const handleMultiSortChange = (sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
    // Also update single sort for backward compatibility
    if (sorts.length > 0) {
      setClientSortColumn(sorts[0].columnName);
      setClientSortDirection(sorts[0].direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
  };

  const handleStartEdit = () => {
    if (selectedJob) {
      setEditFormData({
        name: selectedJob.name,
        type: selectedJob.type,
        startDate: selectedJob.startDate,
        endDate: selectedJob.endDate,
        description: selectedJob.description,
        gc: selectedJob.gc,
        ec: selectedJob.ec,
        value: selectedJob.value,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedJob) return;
    
    try {
      await updateJobMutation.mutateAsync({
        id: selectedJob.id,
        input: {
          jobName: editFormData.name,
          jobType: editFormData.type,
          startDate: editFormData.startDate !== '-' ? editFormData.startDate : undefined,
          endDate: editFormData.endDate !== '-' ? editFormData.endDate : undefined,
          description: editFormData.description,
        },
      });
      
      // Update local state
      const updatedName = editFormData.name || selectedJob.name;
      jobToasts.updateSuccess(updatedName);
      setSelectedJob({
        ...selectedJob,
        name: updatedName,
        type: editFormData.type || selectedJob.type,
        startDate: editFormData.startDate || selectedJob.startDate,
        endDate: editFormData.endDate || selectedJob.endDate,
        description: editFormData.description || selectedJob.description,
        tags: editFormData.type && editFormData.type !== 'General' ? [editFormData.type] : [],
      });
      
      setIsEditing(false);
      refetchJobs();
    } catch (err) {
      console.error('Failed to update job:', err);
      jobToasts.updateError(err instanceof Error ? err.message : undefined);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditChange = (field: keyof Job, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show connection required message if not connected
  if (!isConnected) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-yellow-800">CRM Not Connected</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please configure your CRM API tokens to view and manage jobs.
              </p>
              <a
                href="/dashboard/apps/flow-crm/auth"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Go to Auth Settings
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show loading state
  if (jobsLoading || statusesLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Loading jobs from CRM...</span>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (jobsError) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Failed to Load Jobs</h3>
              <p className="text-sm text-red-700 mt-1">{jobsError.message}</p>
              <button
                onClick={() => refetchJobs()}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h5M16 16v-5h-5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.05 11A7 7 0 0114.95 9M14.95 9L16 4M5.05 11L4 16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Company detail view
  if (selectedCompany) {
    const companyDetails = getCompanyDetails(selectedCompany.id);
    if (!companyDetails) return null;
    
    return (
      <CompanyDetailView
        company={companyDetails}
        onBack={() => setSelectedCompany(null)}
      />
    );
  }

  // Job detail view
  if (selectedJob) {
    return (
      <JobDetailView
        job={selectedJob}
        isEditing={isEditing}
        isSaving={updateJobMutation.isPending}
        editFormData={editFormData}
        repType={repType}
        showRepTypeModal={showRepTypeModal}
        onBack={() => setSelectedJob(null)}
        onEditChange={handleEditChange}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onRepTypeChange={setRepType}
        onToggleRepTypeModal={setShowRepTypeModal}
        onCompanyClick={(company: Company) => setSelectedCompany(company)}
        onContactClick={(contact: Contact) => router.push(`/contacts?id=${contact.id}`)}
      />
    );
  }

  // Main jobs list view
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDedupeModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Find Duplicates ({duplicateGroups.length})
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
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
            </div>

            <SortButton 
              sortOptions={jobSortOptions}
              onSortChange={handleSortChange}
              activeSort={clientSortColumn ? { columnName: clientSortColumn, direction: clientSortDirection } : undefined}
            />

            <AdvancedFilters 
              filterOptions={jobFilterOptions}
              onFilterChange={handleFilterChange}
              onFiltersChange={handleFiltersChange}
              activeFilter={activeFilter}
              activeFilters={activeFilters}
            />
            
            <button 
              onClick={() => setShowCreateJobModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Job
            </button>
          </div>
        </div>
      </div>

      <CreateJobModal 
        isOpen={showCreateJobModal} 
        onClose={() => setShowCreateJobModal(false)}
        onSuccess={() => refetchJobs()}
      />

      {/* Empty State */}
      {jobs.length === 0 && !jobsLoading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Jobs Yet</h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Start by creating your first job. Jobs you create will appear here in the kanban board.
          </p>
          <button
            onClick={() => setShowCreateJobModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Create Your First Job
          </button>
        </div>
      ) : (
        <>
          {/* Kanban or List View */}
          {viewMode === 'kanban' ? (
            <KanbanView
              jobs={jobs}
              stages={stages}
              activeId={activeId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              onJobClick={setSelectedJob}
              onCreateJobClick={() => setShowCreateJobModal(true)}
            />
          ) : (
            <ListView
              jobs={jobs}
              onJobClick={setSelectedJob}
            />
          )}
        </>
      )}
    </main>
  );
}
