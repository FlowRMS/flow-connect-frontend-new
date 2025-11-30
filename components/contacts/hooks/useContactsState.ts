/**
 * Contacts State Management Hook
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  useCRMContactLandingPages, 
  useCRMContact,
  useCreateCRMContact, 
  useUpdateCRMContact, 
  useDeleteCRMContact 
} from '../../hooks/useCRMApi';
import { hasCRMTokens } from '../../lib/crm-auth';
import { mapLandingPageToUIContact } from '../types';
import { contactToasts } from '../../lib/toast';
import type { Contact, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../AdvancedFilters';

export function useContactsState() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDedupeModal, setShowDedupeModal] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Filter and sort state (client-side)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // CRM API hooks
  const isConnected = hasCRMTokens();
  const { data: landingPageContacts, isLoading, error, refetch } = useCRMContactLandingPages();
  const { data: fullContactData } = useCRMContact(selectedContactId || '');
  const createContactMutation = useCreateCRMContact();
  const updateContactMutation = useUpdateCRMContact();
  const deleteContactMutation = useDeleteCRMContact();

  // Update selectedContact with full contact data (including companyId) when fetched
  useEffect(() => {
    if (fullContactData && selectedContact && selectedContactId === selectedContact.id) {
      // Update the selectedContact with companyId from the full contact data
      if (fullContactData.companyId && !selectedContact.companyId) {
        setSelectedContact(prev => prev ? {
          ...prev,
          companyId: fullContactData.companyId || '',
        } : null);
      }
    }
  }, [fullContactData, selectedContact, selectedContactId]);

  // Custom setSelectedContact that also triggers full contact fetch
  const handleSelectContact = useCallback((contact: Contact | null) => {
    setSelectedContact(contact);
    setSelectedContactId(contact?.id || null);
  }, []);

  // Map and filter contacts
  const contacts = useMemo(() => {
    if (!landingPageContacts) return [];
    let filtered = landingPageContacts.map(mapLandingPageToUIContact);

    // Apply client-side filter
    if (activeFilter) {
      filtered = filtered.filter((contact) => {
        const value = String((contact as any)[activeFilter.columnName] || '').toLowerCase();
        const filterValue = String(activeFilter.value || '').toLowerCase();

        if (activeFilter.operator === 'IN' && activeFilter.values) {
          return activeFilter.values.some(v => String(v).toLowerCase() === value);
        }

        switch (activeFilter.operator) {
          case 'EQ':
            return value === filterValue;
          case 'NE':
            return value !== filterValue;
          case 'ILIKE':
          case 'LIKE':
            return value.includes(filterValue);
          case 'BEGINS_WITH':
            return value.startsWith(filterValue);
          case 'ENDS_WITH':
            return value.endsWith(filterValue);
          case 'IS_NULL':
            return !value || value === '';
          case 'IS_NOT_NULL':
            return value && value !== '';
          default:
            return true;
        }
      });
    }

    // Apply client-side sorting
    if (clientSortColumn) {
      filtered.sort((a, b) => {
        const aVal = String((a as any)[clientSortColumn] || '');
        const bVal = String((b as any)[clientSortColumn] || '');
        const comparison = aVal.localeCompare(bVal);
        return clientSortDirection === 'ASC' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [landingPageContacts, activeFilter, clientSortColumn, clientSortDirection]);

  // Filtered contacts by type
  const filteredContacts = useMemo(() => {
    return selectedType === 'All'
      ? contacts
      : contacts.filter(contact => contact.contactType.includes(selectedType));
  }, [contacts, selectedType]);

  // Handle filter change
  const handleFilterChange = (filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
  };

  // Handle sort change
  const handleSortChange = (sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
  };

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
    
    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        input: {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone,
          role: editFormData.role,
        },
      });
      
      const fullName = `${editFormData.firstName || selectedContact.firstName} ${editFormData.lastName || selectedContact.lastName}`;
      contactToasts.updateSuccess(fullName);
      
      setSelectedContact({
        ...selectedContact,
        firstName: editFormData.firstName || selectedContact.firstName,
        lastName: editFormData.lastName || selectedContact.lastName,
        name: fullName,
        email: editFormData.email || selectedContact.email,
        phone: editFormData.phone || selectedContact.phone,
        role: editFormData.role || selectedContact.role,
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
    clientSortColumn,
    clientSortDirection,
    
    // Data
    isConnected,
    contacts,
    filteredContacts,
    isLoading,
    error,
    
    // Mutations
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,
    
    // Handlers
    handleFilterChange,
    handleSortChange,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteContact,
    refetch,
  };
}
