/**
 * Contacts State Management Hook
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useCRMContactLandingPagesInfinite,
  useCRMContact,
  useCreateCRMContact,
  useUpdateCRMContact,
  useDeleteCRMContact
} from '../../hooks/useCRMApi';

import { mapLandingPageToUIContact } from '../types';
import { contactToasts } from '../../lib/toast';
import { applyFilter } from '../../lib/filter-utils';
import type { Contact, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../advancedFilters/AdvancedFilters';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/crm-graphql';

export function useContactsState() {
  // Hydration-safe mounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDedupeModal, setShowDedupeModal] = useState(false);

  // Edit state - always editable by default
  const [isEditing, setIsEditing] = useState(true);
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Initialize editFormData when a contact is selected
  useEffect(() => {
    if (selectedContact && isEditing) {
      setEditFormData({
        firstName: selectedContact.firstName,
        lastName: selectedContact.lastName,
        email: selectedContact.email,
        phone: selectedContact.phone,
        role: selectedContact.role,
        company: selectedContact.company,
        companyId: selectedContact.companyId,
        territory: selectedContact.territory,
        tags: selectedContact.tags,
        notes: selectedContact.notes,
      });
    }
  }, [selectedContact?.id, isEditing]); // Re-initialize when contact changes or edit mode changes

  // Filter and sort state (client-side for backward compatibility)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

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

  // Map and filter contacts
  const contacts = useMemo(() => {
    if (!landingPageContacts) return [];
    let filtered = landingPageContacts.map(mapLandingPageToUIContact);

    // Apply advanced filters (multi-select)
    if (activeFilters.length > 0) {
      filtered = filtered.filter((contact) =>
        activeFilters.every((filter) => applyFilter(contact as unknown as Record<string, unknown>, filter))
      );
    } else if (activeFilter) {
      // Backward compatibility for single filter
      filtered = filtered.filter((contact) => applyFilter(contact as unknown as Record<string, unknown>, activeFilter));
    }

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
      filtered = [...filtered].sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aVal = String((a as any)[clientSortColumn] || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bVal = String((b as any)[clientSortColumn] || '');
        const comparison = aVal.localeCompare(bVal);
        return clientSortDirection === 'ASC' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [landingPageContacts, activeFilter, activeFilters, clientSortColumn, clientSortDirection, clientSortColumns]);

  // Filtered contacts by type
  const filteredContacts = useMemo(() => {
    return selectedType === 'All'
      ? contacts
      : contacts.filter(contact => contact.contactType.includes(selectedType));
  }, [contacts, selectedType]);

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

  // Handle multi-filter change
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    setServerFilters(toServerFilters(filters)); // Server-side filters
  }, [toServerFilters]);

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
        tags: updatedTags,
      });
      
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error('Failed to update contact:', err);
      contactToasts.updateError(err instanceof Error ? err.message : undefined);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

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
    selectedType,
    setSelectedType,
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
    deleteConfirmId,
    setDeleteConfirmId,
    activeFilter,
    activeFilters,
    clientSortColumn,
    clientSortDirection,
    clientSortColumns,

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
    handleSortChange,
    handleMultiSortChange,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteContact,
    refetch,
  };
}
