/**
 * Contacts State Management Hook
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  useCRMContactLandingPagesInfinite,
  useCRMContact,
  useCreateCRMContact,
  useUpdateCRMContact,
  useDeleteCRMContact
} from '../../hooks/useCRMApi';
import { useQuery } from '@tanstack/react-query';
import { searchContacts, type ContactSearchResult } from '../../lib/api/search';

import { mapLandingPageToUIContact } from '../types';
import { contactToasts } from '../../lib/toast';
import type { Contact, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../advancedFilters/types';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/crm-graphql';
import { useFilterSync } from '../../advancedFilters/hooks/useFilterSync';
import { getContactFilterOptions } from '../config/filterConfig';

export function useContactsState() {
  // Hydration-safe mounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // API search for contacts
  const { data: searchResults, isLoading: isSearching } = useQuery<ContactSearchResult[], Error>({
    queryKey: ['contactSearch', debouncedSearchQuery],
    queryFn: () => searchContacts(debouncedSearchQuery, 50),
    enabled: debouncedSearchQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDedupeModal, setShowDedupeModal] = useState(false);

  // Edit state - always editable by default
  const [isEditing, setIsEditing] = useState(true);
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Track if user has made actual edits (not just entered edit mode)
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  // Initialize editFormData when a contact is selected
  useEffect(() => {
    if (selectedContact && isEditing) {
      setEditFormData({
        firstName: selectedContact.firstName,
        lastName: selectedContact.lastName,
        email: selectedContact.email,
        phone: selectedContact.phone,
        role: selectedContact.role,
        roleDetail: selectedContact.roleDetail,
        company: selectedContact.company,
        companyId: selectedContact.companyId,
        territory: selectedContact.territory,
        tags: selectedContact.tags,
        notes: selectedContact.notes,
      });
      // Reset hasLocalEdits when switching contacts
      setHasLocalEdits(false);
    }
  }, [selectedContact?.id, isEditing]); // Re-initialize when contact changes or edit mode changes

  // Filter and sort state (client-side for backward compatibility)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<LandingPageFilter[]>([]);
  const [serverOrderBy, setServerOrderBy] = useState<LandingPageOrderBy[]>([]);

  // CRM API hooks with infinite scroll - now with server-side filters
  const isConnected = isMounted ? true : false;
  const {
    data: contactsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCRMContactLandingPagesInfinite(serverFilters, serverOrderBy);
  const { data: fullContactData } = useCRMContact(selectedContactId || '');
  const createContactMutation = useCreateCRMContact();
  const updateContactMutation = useUpdateCRMContact();
  const deleteContactMutation = useDeleteCRMContact();

  // Flatten paginated results with deduplication
  const landingPageContacts = useMemo(() => {
    if (!contactsData?.pages) return undefined;
    const allRecords = contactsData.pages.flatMap(page => page.records);
    // Deduplicate by ID
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [contactsData]);

  // Note: Full contact data is fetched but not used to update selectedContact
  // as we now use contactRelatedEntities for associated data

  // Custom setSelectedContact that also triggers full contact fetch
  const handleSelectContact = useCallback((contact: Contact | null) => {
    setSelectedContact(contact);
    setSelectedContactId(contact?.id || null);
  }, []);

  // Map contacts from API (filtering and sorting now done server-side)
  const contacts = useMemo(() => {
    if (!landingPageContacts) return [];
    return landingPageContacts.map(mapLandingPageToUIContact);
  }, [landingPageContacts]);

  // Transform search results to Contact format
  const transformSearchResultToContact = useCallback((result: ContactSearchResult): Contact => ({
    id: result.id,
    firstName: result.firstName,
    lastName: result.lastName,
    name: `${result.firstName} ${result.lastName}`.trim(),
    email: result.email || '',
    phone: result.phone || '',
    role: result.role || '',
    territory: result.territory || '',
    tags: result.tags ? (typeof result.tags === 'string' ? result.tags.split(',').map(t => t.trim()).filter(Boolean) : result.tags) : [],
    notes: result.notes || '',
    createdAt: result.createdAt || '',
    company: '',
    companyId: undefined,
    contactType: [],
    lists: [],
    lastActivity: '',
    createdBy: '',
  }), []);

  // Filtered contacts - use search results when searching, otherwise use paginated data
  const filteredContacts = useMemo(() => {
    if (debouncedSearchQuery.length >= 2 && searchResults) {
      return searchResults.map(transformSearchResultToContact);
    }
    return contacts;
  }, [contacts, debouncedSearchQuery, searchResults, transformSearchResultToContact]);

  // Get total count from first page
  const totalCount = useMemo(() => {
    if (!contactsData?.pages || contactsData.pages.length === 0) return 0;
    return contactsData.pages[0].total;
  }, [contactsData]);

  // Convert ActiveFilter to LandingPageFilter for server-side filtering
  const toServerFilters = useCallback((filters: ActiveFilter[]): LandingPageFilter[] => {
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

  // Convert ActiveSort to LandingPageOrderBy for server-side sorting
  const toServerOrderBy = useCallback((sorts: ActiveSort[]): LandingPageOrderBy[] => {
    return sorts.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
  }, []);

  // Handle filter change (single - backward compatibility)
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

  // Filter options for sync (static, no dependencies)
  const contactFilterOptionsForSync = useMemo(() => {
    return getContactFilterOptions();
  }, []);

  // Map from UI column keys to filter option IDs (for sync)
  // Note: 'name' column uses 'first-name' filter which maps to 'firstName' columnName
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    name: 'first-name', // Name column filters by firstName
    company: 'company',
    role: 'role',
    createdAt: 'created-at',
    createdBy: 'created-by',
  }), []);

  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: contactFilterOptionsForSync,
    columnKeyToFilterId,
  });

  // Handle multi-filter change (from AdvancedFilters)
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    
    // Convert ActiveFilter to LandingPageFilter for server-side filtering
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

    // Sync to ColumnFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from column filters to avoid infinite loop
    if (!isSyncingFromColumn.current) {
      isSyncingFromAdvanced.current = true;
      const syncedColumnFilters = syncAdvancedToColumn(filters);
      
      setColumnFilters((prev) => {
        // If filters array is empty, clear all column filters
        // Otherwise, merge: new filters from AdvancedFilters replace old ones for same columns
        if (filters.length === 0) {
          return {};
        }
        return { ...prev, ...syncedColumnFilters };
      });
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromAdvanced.current = false;
      }, 0);
    }
  }, [syncAdvancedToColumn]);

  // Handler for column filter changes (from ColumnFilters)
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);

    // Sync to AdvancedFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from advanced filters to avoid infinite loop
    if (!isSyncingFromAdvanced.current) {
      isSyncingFromColumn.current = true;
      const syncedActiveFilters = syncColumnToAdvanced(filters);
      setActiveFilters(syncedActiveFilters);
      
      // Also update serverFilters to trigger API call
      const apiFilters: LandingPageFilter[] = syncedActiveFilters.map(f => {
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
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, [syncColumnToAdvanced]);

  // Handle sort change (single - backward compatibility)
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
    setServerOrderBy(toServerOrderBy(sorts)); // Server-side sort
  }, [toServerOrderBy]);

  // Handle edit
  const handleStartEdit = () => {
    if (selectedContact) {
      setEditFormData({
        firstName: selectedContact.firstName,
        lastName: selectedContact.lastName,
        email: selectedContact.email,
        phone: selectedContact.phone,
        role: selectedContact.role,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedContact) return;
    
    // Parse tags - handle both string and array formats
    let tagsToSend: string | undefined;
    if (editFormData.tags) {
      if (typeof editFormData.tags === 'string') {
        tagsToSend = editFormData.tags;
      } else if (Array.isArray(editFormData.tags)) {
        tagsToSend = editFormData.tags.join(',');
      }
    }
    
    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        input: {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone,
          role: editFormData.role,
          roleDetail: editFormData.roleDetail,
          tags: tagsToSend,
        },
      });
      
      const fullName = `${editFormData.firstName || selectedContact.firstName} ${editFormData.lastName || selectedContact.lastName}`;
      contactToasts.updateSuccess(fullName);
      
      // Parse tags for local state update
      const updatedTags = tagsToSend ? tagsToSend.split(',').map(t => t.trim()).filter(Boolean) : selectedContact.tags;
      
      setSelectedContact({
        ...selectedContact,
        firstName: editFormData.firstName || selectedContact.firstName,
        lastName: editFormData.lastName || selectedContact.lastName,
        name: fullName,
        email: editFormData.email || selectedContact.email,
        phone: editFormData.phone || selectedContact.phone,
        role: editFormData.role || selectedContact.role,
        roleDetail: editFormData.roleDetail || selectedContact.roleDetail,
        tags: updatedTags,
      });

      setIsEditing(false);
      setHasLocalEdits(false);
      refetch();
    } catch (err) {
      console.error('Failed to update contact:', err);
      contactToasts.updateError(err instanceof Error ? err.message : undefined);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
    setHasLocalEdits(false);
  };

  // Wrapper for setEditFormData that tracks changes
  const handleEditFormChange = useCallback((updater: Partial<Contact> | ((prev: Partial<Contact>) => Partial<Contact>)) => {
    setHasLocalEdits(true);
    if (typeof updater === 'function') {
      setEditFormData(updater);
    } else {
      setEditFormData(prev => ({ ...prev, ...updater }));
    }
  }, []);

  // Handle delete
  const handleDeleteContact = async (id: string) => {
    const contact = contacts.find(c => c.id === id);
    try {
      await deleteContactMutation.mutateAsync(id);
      contactToasts.deleteSuccess(contact?.name || 'Contact');
      setDeleteConfirmId(null);
      if (selectedContact?.id === id) {
        handleSelectContact(null);
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
      contactToasts.deleteError(err instanceof Error ? err.message : undefined);
    }
  };

  return {
    // State
    viewMode,
    setViewMode,
    selectedContact,
    setSelectedContact: handleSelectContact,
    showCreateModal,
    setShowCreateModal,
    showDedupeModal,
    setShowDedupeModal,
    isEditing,
    setIsEditing,
    editFormData,
    setEditFormData,
    handleEditFormChange,
    hasLocalEdits,
    setHasLocalEdits,
    deleteConfirmId,
    setDeleteConfirmId,
    activeFilter,
    activeFilters,
    columnFilters,
    clientSortColumn,
    clientSortDirection,
    clientSortColumns,

    // Search state
    searchQuery,
    setSearchQuery,
    isSearching,

    // Data
    isConnected,
    isMounted,
    contacts,
    filteredContacts,
    isLoading,
    error,
    totalCount,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    // Mutations
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,

    // Handlers
    handleFilterChange,
    handleFiltersChange,
    handleColumnFiltersChange,
    handleSortChange,
    handleMultiSortChange,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteContact,
    refetch,
  };
}
