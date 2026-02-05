/**
 * Custom Hook for Companies State Management
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Company, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../advancedFilters/AdvancedFilters';
import { applyFilter as applyFilterUtil } from '../../lib/filter-utils';
import { sortCompanies, getUniqueValues } from '../utils';
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
  // Always editable - no need to click Edit
  const [isEditing, setIsEditing] = useState(true);
  const [editFormData, setEditFormData] = useState<Partial<Company>>({});
  // Track if user has made actual edits (not just entered edit mode)
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  // Auto-initialize editFormData when selectedCompany changes
  // This fixes the "can't edit until refresh" bug by ensuring form data is populated on navigation
  useEffect(() => {
    if (selectedCompany) {
      setEditFormData({
        name: selectedCompany.name,
        phone: selectedCompany.phone,
        website: selectedCompany.website,
        companyTypeId: selectedCompany.companyTypeId,
        companyTypeName: selectedCompany.companyTypeName,
        tags: selectedCompany.tags,
        parentCompanyId: selectedCompany.parentCompanyId,
        parentCompanyName: selectedCompany.parentCompanyName,
        grandparentCompanyId: selectedCompany.grandparentCompanyId,
        grandparentCompanyName: selectedCompany.grandparentCompanyName,
        hierarchyRole: selectedCompany.hierarchyRole,
        addresses: selectedCompany.addresses,
        manufacturerInfo: selectedCompany.manufacturerInfo,
        salesReps: selectedCompany.salesReps,
        standardCommissionRate: selectedCompany.standardCommissionRate,
        warehouseCommissionRate: selectedCompany.warehouseCommissionRate,
      });
      // Always enable editing when a company is selected
      setIsEditing(true);
      // Reset hasLocalEdits when switching companies
      setHasLocalEdits(false);
    } else {
      setEditFormData({});
    }
  }, [selectedCompany]);

  // Modals
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtering and sorting
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

  // Process companies with filtering and sorting
  const companies: Company[] = useMemo(() => {
    if (!landingPageCompanies) return [];
    let filtered = landingPageCompanies.map(mapLandingPageToUICompany);

    // Apply advanced sorting (multi-sort)
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
      // Single sort fallback
      filtered = sortCompanies(filtered, clientSortColumn, clientSortDirection);
    }

    return filtered;
  }, [landingPageCompanies, activeFilter, activeFilters, clientSortColumn, clientSortDirection, clientSortColumns]);

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

  // Handle filter change (single - backward compatibility)
  const handleFilterChange = useCallback((filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
    } else {
      setActiveFilters([]);
    }
  }, []);

  // Handle multi-filter change
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
  }, []);

  // Handle sort change (single - backward compatibility)
  const handleSortChange = useCallback((sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
      setClientSortColumns([sort]);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
      setClientSortColumns([]);
    }
  }, []);

  // Handle multi-sort change
  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
    if (sorts.length > 0) {
      setClientSortColumn(sorts[0].columnName);
      setClientSortDirection(sorts[0].direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
  }, []);

  // Handle starting edit mode
  const handleStartEdit = () => {
    if (selectedCompany) {
      setEditFormData({
        name: selectedCompany.name,
        phone: selectedCompany.phone,
        website: selectedCompany.website,
        companyTypeId: selectedCompany.companyTypeId,
        companyTypeName: selectedCompany.companyTypeName,
        tags: selectedCompany.tags,
        parentCompanyId: selectedCompany.parentCompanyId,
        parentCompanyName: selectedCompany.parentCompanyName,
        grandparentCompanyId: selectedCompany.grandparentCompanyId,
        grandparentCompanyName: selectedCompany.grandparentCompanyName,
        hierarchyRole: selectedCompany.hierarchyRole,
        addresses: selectedCompany.addresses,
        manufacturerInfo: selectedCompany.manufacturerInfo,
        salesReps: selectedCompany.salesReps,
        standardCommissionRate: selectedCompany.standardCommissionRate,
        warehouseCommissionRate: selectedCompany.warehouseCommissionRate,
      });
      setIsEditing(true);
    }
  };

  // Handle canceling edit - revert form data but stay editable
  const handleCancelEdit = () => {
    if (selectedCompany) {
      setEditFormData({
        name: selectedCompany.name,
        phone: selectedCompany.phone,
        website: selectedCompany.website,
        companyTypeId: selectedCompany.companyTypeId,
        companyTypeName: selectedCompany.companyTypeName,
        tags: selectedCompany.tags,
        parentCompanyId: selectedCompany.parentCompanyId,
        parentCompanyName: selectedCompany.parentCompanyName,
        grandparentCompanyId: selectedCompany.grandparentCompanyId,
        grandparentCompanyName: selectedCompany.grandparentCompanyName,
        hierarchyRole: selectedCompany.hierarchyRole,
        addresses: selectedCompany.addresses,
        manufacturerInfo: selectedCompany.manufacturerInfo,
        salesReps: selectedCompany.salesReps,
        standardCommissionRate: selectedCompany.standardCommissionRate,
        warehouseCommissionRate: selectedCompany.warehouseCommissionRate,
      });
    } else {
      setEditFormData({});
    }
    setHasLocalEdits(false);
  };

  // Wrapper for setEditFormData that tracks changes
  const handleEditFormChange = useCallback((updater: Partial<Company> | ((prev: Partial<Company>) => Partial<Company>)) => {
    setHasLocalEdits(true);
    if (typeof updater === 'function') {
      setEditFormData(updater);
    } else {
      setEditFormData(prev => ({ ...prev, ...updater }));
    }
  }, []);

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
    handleEditFormChange,
    hasLocalEdits,
    setHasLocalEdits,

    // Modals
    deleteConfirmId,
    setDeleteConfirmId,

    // Filtering and sorting
    activeFilter,
    setActiveFilter,
    activeFilters,
    setActiveFilters,
    clientSortColumn,
    setClientSortColumn,
    clientSortDirection,
    setClientSortDirection,
    clientSortColumns,
    setClientSortColumns,

    // Unique values for filters
    uniqueCompanyNames,
    uniqueCompanyTypes,
    uniqueCreatedBy,

    // Handlers
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleMultiSortChange,
    handleStartEdit,
    handleCancelEdit,
  };
}
