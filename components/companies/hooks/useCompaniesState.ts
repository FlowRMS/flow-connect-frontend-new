/**
 * Custom Hook for Companies State Management
 */

import { useState, useMemo } from 'react';
import type { Company, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../AdvancedFilters';
import type { CompanySourceType } from '../../lib/crm-graphql';
import { applyFilter, sortCompanies, getUniqueValues } from '../utils';
import { mapLandingPageToUICompany } from '../types';
import type { CompanyLandingPage } from '../../lib/crm-graphql';

export function useCompaniesState(
  landingPageCompanies: CompanyLandingPage[] | undefined
) {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Company selection and editing
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Company>>({});

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtering and sorting
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Process companies with filtering and sorting
  const companies: Company[] = useMemo(() => {
    if (!landingPageCompanies) return [];
    let filtered = landingPageCompanies.map(mapLandingPageToUICompany);

    // Apply client-side filter
    if (activeFilter) {
      filtered = filtered.filter((company) => applyFilter(company, activeFilter));
    }

    // Apply client-side sorting
    if (clientSortColumn) {
      filtered = sortCompanies(filtered, clientSortColumn, clientSortDirection);
    }

    return filtered;
  }, [landingPageCompanies, activeFilter, clientSortColumn, clientSortDirection]);

  // Filter by selected type
  const filteredCompanies = useMemo(() => {
    return selectedType === 'All'
      ? companies
      : companies.filter(company => company.type.includes(selectedType));
  }, [companies, selectedType]);

  // Calculate unique values for filters
  const uniqueCompanyNames = useMemo(() => getUniqueValues(companies, 'name'), [companies]);
  const uniqueCompanyTypes = useMemo(() => getUniqueValues(companies, 'type'), [companies]);
  const uniqueCreatedBy = useMemo(() => getUniqueValues(companies, 'createdBy'), [companies]);

  // Handle filter change from AdvancedFilters - client-side only
  const handleFilterChange = (filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
  };

  // Handle sort change - client-side only
  const handleSortChange = (sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
  };

  // Handle starting edit mode
  const handleStartEdit = () => {
    if (selectedCompany) {
      setEditFormData({
        name: selectedCompany.name,
        phone: selectedCompany.phone,
        website: selectedCompany.website,
        companySourceType: selectedCompany.companySourceType,
      });
      setIsEditing(true);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  return {
    // View state
    viewMode,
    setViewMode,
    selectedType,
    setSelectedType,

    // Company state
    companies,
    filteredCompanies,
    selectedCompany,
    setSelectedCompany,
    isEditing,
    setIsEditing,
    editFormData,
    setEditFormData,

    // Modals
    showCreateModal,
    setShowCreateModal,
    deleteConfirmId,
    setDeleteConfirmId,

    // Filtering and sorting
    activeFilter,
    setActiveFilter,
    clientSortColumn,
    setClientSortColumn,
    clientSortDirection,
    setClientSortDirection,

    // Unique values for filters
    uniqueCompanyNames,
    uniqueCompanyTypes,
    uniqueCreatedBy,

    // Handlers
    handleFilterChange,
    handleSortChange,
    handleStartEdit,
    handleCancelEdit,
  };
}
