/**
 * Jobs Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlowChat } from '@/contexts/FlowChatContext';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import AdvancedFilters, { ActiveFilter, ActiveSort } from '../advancedFilters/AdvancedFilters';
import SortButton from '../SortButton';
import CreateJobModal from '../CreateJobModal';
import { useCRMJobLandingPagesInfinite, useCRMJobStatuses, useUpdateCRMJob, useCRMJob, useDeleteCRMJob } from '../hooks/useCRMApi';

import { jobToasts } from '../lib/toast';
import { parseApiError } from '../lib/error-utils';
import { useJobsState } from './hooks/useJobsState';
import { getJobFilterOptions, getJobSortOptions } from './config/filterConfig';
import { JobDetailView } from './detail/JobDetailView';
import { KanbanView } from './views/KanbanView';
import { ListView } from './views/ListView';
import type { Job } from './types';
import { mapAPIJobToUIJob } from './types';
import type { JobLandingPage, LandingPageFilter, LandingPageOrderBy, RelatedEntityCompany, RelatedEntityContact } from '../lib/crm-graphql';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export default function JobsContent() {
  // Router for navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFullEntityContext } = useFlowChat();

  // Hydration-safe mounted state
  const [isMounted, setIsMounted] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<LandingPageFilter[]>([]);
  const [serverOrderBy, setServerOrderBy] = useState<LandingPageOrderBy[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handler for server-side filter changes
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    // Convert ActiveFilter to LandingPageFilter
    // Only include value OR values, not both - check which one exists
    const apiFilters: LandingPageFilter[] = filters.map(f => {
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
    setServerFilters(apiFilters);
  }, []);

  // Handler for server-side sort changes
  const handleServerSortChange = useCallback((sorts: ActiveSort[]) => {
    const apiOrderBy: LandingPageOrderBy[] = sorts.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
    setServerOrderBy(apiOrderBy);
  }, []);

  // CRM API hooks with infinite scroll pagination - now with server-side filters
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCRMJobLandingPagesInfinite(serverFilters, serverOrderBy);
  const { data: apiStatuses, isLoading: statusesLoading } = useCRMJobStatuses();

  // Flatten paginated results into a single array with deduplication
  const landingPageJobs = useMemo(() => {
    if (!jobsData?.pages) return undefined;
    const allRecords = jobsData.pages.flatMap(page => page.records);
    // Deduplicate by ID to prevent duplicate key errors
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [jobsData]);

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });
  const updateJobMutation = useUpdateCRMJob();
  const deleteJobMutation = useDeleteCRMJob();

  // State management
  const {
    viewMode, setViewMode,
    jobs, stages,
    selectedJob, setSelectedJob,
    isEditing, setIsEditing,
    editFormData, setEditFormData,
    activeId, setActiveId,
    overId, setOverId,
    showCreateJobModal, setShowCreateJobModal,
    createJobDefaultStatus, setCreateJobDefaultStatus,
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

  // Get job ID from URL - this is the source of truth for navigation
  const jobIdFromUrl = searchParams.get('id');

  // Track intentional clear to prevent re-selecting after back navigation
  const isIntentionalClearRef = React.useRef(false);

  // Fetch full job details when navigating via URL OR when a job is selected
  // This fetches directly by ID, regardless of whether job is in local paginated data
  const targetJobId = (!isIntentionalClearRef.current && jobIdFromUrl) ? jobIdFromUrl : (selectedJob?.id || '');
  const { data: fullJobData, isLoading: jobDetailLoading } = useCRMJob(targetJobId);

  // Map the full job data to UI format when available
  const detailedJob = useMemo(() => {
    if (fullJobData) {
      return mapAPIJobToUIJob(fullJobData);
    }
    return selectedJob;
  }, [fullJobData, selectedJob]);

  // When we get job data from API (navigating via URL), set it as selected
  useEffect(() => {
    if (fullJobData && jobIdFromUrl && !isIntentionalClearRef.current) {
      const mappedJob = mapAPIJobToUIJob(fullJobData);
      // Only update if the selected job is different or not set
      if (!selectedJob || selectedJob.id !== mappedJob.id) {
        setSelectedJob(mappedJob);
      }
    }
  }, [fullJobData, jobIdFromUrl, selectedJob, setSelectedJob]);

  // Reset the intentional clear flag when URL has no ID
  useEffect(() => {
    if (!jobIdFromUrl) {
      isIntentionalClearRef.current = false;
    }
  }, [jobIdFromUrl]);

  // Handle back navigation - clear selection and update URL
  const handleBack = React.useCallback(() => {
    isIntentionalClearRef.current = true;
    setSelectedJob(null);
    router.replace('/jobs', { scroll: false });
  }, [setSelectedJob, router]);

  // Update URL when a job is selected (not when cleared - that's handled by handleBack)
  useEffect(() => {
    if (!isMounted) return;
    if (selectedJob?.id) {
      const currentId = searchParams.get('id');
      if (currentId !== selectedJob.id) {
        router.replace(`/jobs?id=${selectedJob.id}`, { scroll: false });
      }
    }
  }, [selectedJob?.id, isMounted, router, searchParams]);

  // Set full entity context for global chatbot (type, id, and job name)
  useEffect(() => {
    if (detailedJob?.name && detailedJob?.id) {
      setFullEntityContext('job', detailedJob.id, detailedJob.name);
    } else {
      setFullEntityContext(null, null, null);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [detailedJob?.name, detailedJob?.id, setFullEntityContext]);

  // Filter and sort configuration
  const jobFilterOptions = getJobFilterOptions(uniqueJobNames, uniqueStatuses, uniqueTypes, uniqueCreators);
  const jobSortOptions = getJobSortOptions();

  // Event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverId(over.id as string);
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    // If no drop target, cancel
    if (!over) return;
    
    // Extract the target status from the column ID (format: "stage-StatusName")
    const overId = over.id as string;
    if (!overId.startsWith('stage-')) return;
    
    const targetStatusName = overId.replace('stage-', '');
    const draggedJobId = active.id as string;
    
    // Find the dragged job
    const draggedJob = jobs.find(j => j.id === draggedJobId);
    if (!draggedJob) return;
    
    // If same status, no update needed
    if (draggedJob.status === targetStatusName) return;
    
    // Find the target status ID from apiStatuses
    const targetStatus = apiStatuses?.find(s => s.name === targetStatusName);
    if (!targetStatus) {
      console.error('Target status not found:', targetStatusName);
      jobToasts.updateError('Unable to find target status');
      return;
    }
    
    try {
      // Use optimistic update - UI updates immediately
      await updateJobMutation.mutateAsync({
        id: draggedJobId,
        input: {
          jobName: draggedJob.name,
          statusId: targetStatus.id,
          jobType: draggedJob.type,
          startDate: draggedJob.startDate !== '-' ? draggedJob.startDate : undefined,
          endDate: draggedJob.endDate !== '-' ? draggedJob.endDate : undefined,
          description: draggedJob.description,
        },
        optimisticStatusName: targetStatusName,
      });
      
      jobToasts.updateSuccess(`${draggedJob.name} moved to ${targetStatusName}`);
    } catch (err) {
      console.error('Failed to update job status:', err);
      jobToasts.updateError(err instanceof Error ? err.message : undefined);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Handle opening create job modal with optional default status
  const handleOpenCreateJobModal = (statusName?: string) => {
    setCreateJobDefaultStatus(statusName);
    setShowCreateJobModal(true);
  };

  // Handle closing create job modal
  const handleCloseCreateJobModal = () => {
    setShowCreateJobModal(false);
    setCreateJobDefaultStatus(undefined);
  };

  // Handle checkbox change to mark job as complete
  const handleJobCheckboxChange = async (jobId: string, checked: boolean) => {
    // Find the job
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Helper to find status by name variations (case-insensitive)
    const findStatus = (variations: string[]) => {
      return apiStatuses?.find(s => 
        variations.some(v => s.name.toLowerCase() === v.toLowerCase())
      );
    };

    // Determine target status based on checkbox state
    // Try multiple variations for "complete" statuses
    const targetStatus = checked 
      ? findStatus(['Complete', 'Completed', 'Won', 'Done', 'Closed'])
      : findStatus(['Active', 'In Progress', 'Open', 'Backlog']);
    
    const targetStatusName = targetStatus?.name || (checked ? 'Complete' : 'Active');
    
    if (!targetStatus) {
      console.warn(`No suitable status found. Available statuses:`, apiStatuses?.map(s => s.name));
      jobToasts.updateError(`Unable to find a suitable status. Please check available statuses.`);
      return;
    }

    try {
      // Use optimistic update - UI updates immediately
      await updateJobMutation.mutateAsync({
        id: jobId,
        input: {
          jobName: job.name,
          statusId: targetStatus.id,
          jobType: job.type,
          startDate: job.startDate !== '-' ? job.startDate : undefined,
          endDate: job.endDate !== '-' ? job.endDate : undefined,
          description: job.description,
        },
        optimisticStatusName: targetStatusName,
      });
      
      jobToasts.updateSuccess(checked ? `${job.name} marked as ${targetStatusName}` : `${job.name} moved to ${targetStatusName}`);
    } catch (err) {
      console.error('Failed to update job status:', err);
      jobToasts.updateError(parseApiError(err));
    }
  };

  const handleFilterChange = (filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    // Also update the multi-filter state
    if (filter) {
      setActiveFilters([filter]);
      handleServerFiltersChange([filter]); // Server-side filter
    } else {
      handleServerFiltersChange([]); // Clear server-side filters
      setActiveFilters([]);
    }
  };

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    // Also update the single filter for backward compatibility
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    // Update server-side filters
    handleServerFiltersChange(filters);
  };

  const handleSortChange = (sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
      setClientSortColumns([sort]);
      handleServerSortChange([sort]); // Server-side sort
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
      setClientSortColumns([]);
      handleServerSortChange([]); // Clear server-side sort
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
    // Update server-side sort
    handleServerSortChange(sorts);
  };

  const handleStartEdit = () => {
    // Use detailedJob (from GET_JOB endpoint) if available, otherwise fallback to selectedJob
    const jobToEdit = detailedJob || selectedJob;
    if (jobToEdit) {
      setEditFormData({
        name: jobToEdit.name,
        type: jobToEdit.type,
        startDate: jobToEdit.startDate,
        endDate: jobToEdit.endDate,
        description: jobToEdit.description,
        gc: jobToEdit.gc,
        ec: jobToEdit.ec,
        value: jobToEdit.value,
        additionalInformation: jobToEdit.additionalInformation,
        structuralInformation: jobToEdit.structuralInformation,
        structuralDetails: jobToEdit.structuralDetails,
        tags: jobToEdit.tags || [],
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    // Use detailedJob if available, otherwise fallback to selectedJob
    const currentJob = detailedJob || selectedJob;
    if (!currentJob) return;

    // Validate end date is not before start date
    const startDate = editFormData.startDate && editFormData.startDate !== '-' ? editFormData.startDate : null;
    const endDate = editFormData.endDate && editFormData.endDate !== '-' ? editFormData.endDate : null;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        jobToasts.updateError('End date cannot be before start date');
        return;
      }
    }

    try {
      // Find the statusId from the job's current status name
      const currentStatus = apiStatuses?.find(s => s.name === currentJob.status);
      if (!currentStatus) {
        throw new Error('Unable to find status ID for the current job status');
      }

      // Prepare tags as comma-separated string for the API
      const tagsString = editFormData.tags && Array.isArray(editFormData.tags) 
        ? editFormData.tags.join(',') 
        : undefined;

      await updateJobMutation.mutateAsync({
        id: currentJob.id,
        input: {
          jobName: editFormData.name,
          statusId: currentStatus.id, // Required field for JobInput
          jobType: editFormData.type,
          startDate: editFormData.startDate !== '-' ? editFormData.startDate : undefined,
          endDate: editFormData.endDate !== '-' ? editFormData.endDate : undefined,
          description: editFormData.description,
          additionalInformation: editFormData.additionalInformation,
          structuralInformation: editFormData.structuralInformation,
          structuralDetails: editFormData.structuralDetails,
          tags: tagsString,
        },
      });
      
      // Update local state
      const updatedName = editFormData.name || currentJob.name;
      const updatedTags = editFormData.tags || currentJob.tags;
      
      jobToasts.updateSuccess(updatedName);
      setSelectedJob({
        ...currentJob,
        name: updatedName,
        type: editFormData.type || currentJob.type,
        startDate: editFormData.startDate || currentJob.startDate,
        endDate: editFormData.endDate || currentJob.endDate,
        description: editFormData.description || currentJob.description,
        additionalInformation: editFormData.additionalInformation || currentJob.additionalInformation,
        structuralInformation: editFormData.structuralInformation || currentJob.structuralInformation,
        structuralDetails: editFormData.structuralDetails || currentJob.structuralDetails,
        tags: updatedTags,
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
    // Handle tags separately as they come as stringified array
    if (field === 'tags') {
      try {
        const tagsArray = JSON.parse(value);
        setEditFormData(prev => ({ ...prev, [field]: tagsArray }));
      } catch {
        // If parsing fails, treat as single tag
        setEditFormData(prev => ({ ...prev, [field]: [value] }));
      }
    } else {
      setEditFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle delete job
  const handleDeleteJob = async () => {
    const currentJob = detailedJob || selectedJob;
    if (!currentJob) return;
    
    try {
      await deleteJobMutation.mutateAsync(currentJob.id);
      jobToasts.deleteSuccess(currentJob.name);
      
      // Navigate back to jobs list after deletion
      isIntentionalClearRef.current = true;
      setSelectedJob(null);
      router.replace('/jobs', { scroll: false });
      
      refetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
      jobToasts.deleteError(parseApiError(err));
    }
  };

  // Show loading state until client is mounted (prevents hydration mismatch)
  if (!isMounted || jobsLoading || statusesLoading) {
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
            <span>Loading jobs...</span>
          </div>
        </div>
      </main>
    );
  }

  // Show error state with user-friendly message
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
              <p className="text-sm text-red-700 mt-1">{parseApiError(jobsError)}</p>
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

  // Job detail view
  if (selectedJob) {
    // Show loading state while fetching full job details
    if (jobDetailLoading) {
      return (
        <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 10H5M5 10l4-4M5 10l4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Jobs
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Loading Job Details...</h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Fetching job details...</span>
            </div>
          </div>
        </main>
      );
    }

    // Use the full job data if available, otherwise fallback to selectedJob
    const jobToDisplay = detailedJob || selectedJob;

    return (
      <JobDetailView
        job={jobToDisplay}
        isEditing={isEditing}
        isSaving={updateJobMutation.isPending}
        isDeleting={deleteJobMutation.isPending}
        editFormData={editFormData}
        repType={repType}
        showRepTypeModal={showRepTypeModal}
        onBack={handleBack}
        onEditChange={handleEditChange}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDelete={handleDeleteJob}
        onRepTypeChange={setRepType}
        onToggleRepTypeModal={setShowRepTypeModal}
        onCompanyClick={(company: RelatedEntityCompany) => router.push(`/companies?id=${company.id}`)}
        onContactClick={(contact: RelatedEntityContact) => router.push(`/contacts?id=${contact.id}`)}
      />
    );
  }

  // Main jobs list view
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              disabled
              className="hidden sm:flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-gray-400 text-white rounded-full cursor-not-allowed opacity-60 shadow-sm"
              title="Coming Soon"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-[18px] sm:h-[18px]">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden md:inline">Find Duplicates</span>
              <span className="md:hidden">Dedupe</span>
              <span className="text-[10px] sm:text-xs ml-1">(Coming Soon)</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
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
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">Add Job</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <CreateJobModal 
        isOpen={showCreateJobModal} 
        onClose={handleCloseCreateJobModal}
        onSuccess={() => refetchJobs()}
        defaultStatusName={createJobDefaultStatus}
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
              overId={overId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragCancel={handleDragCancel}
              onJobClick={setSelectedJob}
              onCreateJobClick={handleOpenCreateJobModal}
              onJobCheckboxChange={handleJobCheckboxChange}
            />
          ) : (
            <ListView
              jobs={jobs}
              onJobClick={setSelectedJob}
              onJobCheckboxChange={handleJobCheckboxChange}
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
                <span>Loading more jobs...</span>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
