/**
 * Custom Hook for Jobs State Management
 */

import { useState, useMemo } from 'react';
import type { Job, RepType, DuplicateGroup, ViewMode, MergeStrategy } from '../types';
import type { ActiveFilter, ActiveSort } from '../../AdvancedFilters';
import { applyFilter, sortJobs, getUniqueValues } from '../utils';
import { DEFAULT_VISIBLE_CATEGORIES, DEFAULT_STAGES } from '../constants';
import type { JobLandingPage, JobStatus } from '../../lib/crm-graphql';
import { mapLandingPageToUIJob } from '../types';

export function useJobsState(
  landingPageJobs: JobLandingPage[] | undefined,
  apiStatuses: JobStatus[] | undefined
) {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Job selection and editing
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Job>>({});

  // Company selection
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);

  // Modals
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showDedupeModal, setShowDedupeModal] = useState(false);
  const [showRepTypeModal, setShowRepTypeModal] = useState(false);

  // Deduplication
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('keep');
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<DuplicateGroup | null>(null);
  const [primaryJob, setPrimaryJob] = useState<string | null>(null);

  // Connected entities
  const [visibleCategories, setVisibleCategories] = useState<string[]>(DEFAULT_VISIBLE_CATEGORIES as unknown as string[]);
  const [repType, setRepType] = useState<RepType>('electrical');

  // Filtering and sorting
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumns, setClientSortColumns] = useState<{ columnName: string; direction: 'ASC' | 'DESC' }[]>([]);
  // Keep single filter for backward compatibility
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Process jobs with filtering and sorting
  const jobs: Job[] = useMemo(() => {
    if (!landingPageJobs) return [];
    let filtered = landingPageJobs.map(mapLandingPageToUIJob);

    // Apply client-side filters (support multiple)
    if (activeFilters.length > 0) {
      filtered = filtered.filter((job) => 
        activeFilters.every(filter => applyFilter(job, filter))
      );
    } else if (activeFilter) {
      // Backward compatibility for single filter
      filtered = filtered.filter((job) => applyFilter(job, activeFilter));
    }

    // Apply client-side sorting (support multiple)
    if (clientSortColumns.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of clientSortColumns) {
          const aVal = String((a as any)[sort.columnName] || '');
          const bVal = String((b as any)[sort.columnName] || '');
          const comparison = aVal.localeCompare(bVal);
          if (comparison !== 0) {
            return sort.direction === 'ASC' ? comparison : -comparison;
          }
        }
        return 0;
      });
    } else if (clientSortColumn) {
      filtered = sortJobs(filtered, clientSortColumn, clientSortDirection);
    }

    return filtered;
  }, [landingPageJobs, activeFilters, activeFilter, clientSortColumns, clientSortColumn, clientSortDirection]);

  // Get stages from API or use defaults
  const stages = useMemo(() => {
    if (apiStatuses && apiStatuses.length > 0) {
      return apiStatuses.map((s: JobStatus) => ({ name: s.name }));
    }
    return DEFAULT_STAGES as any;
  }, [apiStatuses]);

  // Calculate unique values for filters
  const uniqueJobNames = useMemo(() => getUniqueValues(jobs, 'name'), [jobs]);
  const uniqueStatuses = useMemo(() => getUniqueValues(jobs, 'status'), [jobs]);
  const uniqueTypes = useMemo(() => getUniqueValues(jobs, 'type'), [jobs]);
  const uniqueCreators = useMemo(() => getUniqueValues(jobs, 'createdBy'), [jobs]);

  // Duplicate groups (would come from API in the future)
  const duplicateGroups: DuplicateGroup[] = [];

  return {
    // View state
    viewMode,
    setViewMode,
    
    // Job state
    jobs,
    stages,
    selectedJob,
    setSelectedJob,
    isEditing,
    setIsEditing,
    editFormData,
    setEditFormData,
    
    // Company state
    selectedCompany,
    setSelectedCompany,
    
    // Drag and drop
    activeId,
    setActiveId,
    
    // Modals
    showCreateJobModal,
    setShowCreateJobModal,
    showDedupeModal,
    setShowDedupeModal,
    showRepTypeModal,
    setShowRepTypeModal,
    
    // Deduplication
    mergeStrategy,
    setMergeStrategy,
    duplicateGroups,
    selectedDuplicateGroup,
    setSelectedDuplicateGroup,
    primaryJob,
    setPrimaryJob,
    
    // Connected entities
    visibleCategories,
    setVisibleCategories,
    repType,
    setRepType,
    
    // Filtering and sorting
    activeFilters,
    setActiveFilters,
    activeFilter,
    setActiveFilter,
    clientSortColumns,
    setClientSortColumns,
    clientSortColumn,
    setClientSortColumn,
    clientSortDirection,
    setClientSortDirection,
    
    // Unique values for filters
    uniqueJobNames,
    uniqueStatuses,
    uniqueTypes,
    uniqueCreators,
  };
}
