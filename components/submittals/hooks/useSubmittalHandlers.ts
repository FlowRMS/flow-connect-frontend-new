/**
 * Submittal Action Handlers
 * Contains mutation handlers for submittal operations
 */

import { useCallback } from 'react';
import {
  type SubmittalStatusGQL,
  type UpdateSubmittalItemInput,
  type SubmittalItemInput,
  type SubmittalStakeholderInput,
  type SubmittalStakeholderRoleGQL,
} from '../api/useSubmittalsApi';
import type { Submittal } from '../../../lib/types/submittals';
import { submittalToasts } from '../../lib/toast';
import { statusFrontendToApi } from '../types/submittal-transforms';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationHook = { mutateAsync: (params: any) => Promise<any> };

interface UseSubmittalHandlersParams {
  selectedSubmittalId: string | null;
  selectedSubmittalFull: Submittal | null;
  updateSubmittalMutation: MutationHook;
  deleteSubmittalMutation: MutationHook;
  updateSubmittalItemMutation: MutationHook;
  createSubmittalMutation: MutationHook;
  addSubmittalItemMutation: MutationHook;
  removeSubmittalItemMutation: MutationHook;
  addSubmittalStakeholderMutation: MutationHook;
  removeSubmittalStakeholderMutation: MutationHook;
  refetch: () => void;
  setShowCreateModal: (show: boolean) => void;
  setIsEditingItem: (editing: boolean) => void;
  setSelectedSubmittalId: (id: string | null) => void;
}

export function useSubmittalHandlers({
  selectedSubmittalId,
  selectedSubmittalFull,
  updateSubmittalMutation,
  deleteSubmittalMutation,
  updateSubmittalItemMutation,
  createSubmittalMutation,
  addSubmittalItemMutation,
  removeSubmittalItemMutation,
  addSubmittalStakeholderMutation,
  removeSubmittalStakeholderMutation,
  refetch,
  setShowCreateModal,
  setIsEditingItem,
  setSelectedSubmittalId,
}: UseSubmittalHandlersParams) {
  // Handle submittal update from detail panel
  const handleSubmittalUpdate = useCallback(async (updates: Partial<Submittal>) => {
    if (!selectedSubmittalId) return;

    // Handle item updates (spec sheet attachments, etc.)
    if (updates.items && selectedSubmittalFull) {
      for (const updatedItem of updates.items) {
        const originalItem = selectedSubmittalFull.items.find(i => i.id === updatedItem.id);
        if (!originalItem) continue;

        const hasChanges =
          originalItem.specSheetId !== updatedItem.specSheetId ||
          originalItem.highlightDefinitionId !== updatedItem.highlightDefinitionId;

        if (hasChanges) {
          try {
            const itemUpdate: UpdateSubmittalItemInput = {};
            if (originalItem.specSheetId !== updatedItem.specSheetId) {
              itemUpdate.specSheetId = updatedItem.specSheetId || undefined;
            }
            if (originalItem.highlightDefinitionId !== updatedItem.highlightDefinitionId) {
              itemUpdate.highlightVersionId = updatedItem.highlightDefinitionId || undefined;
            }
            await updateSubmittalItemMutation.mutateAsync({
              id: updatedItem.id,
              input: itemUpdate,
              submittalId: selectedSubmittalId,
            });
          } catch (err) {
            console.error('Error updating submittal item:', err);
          }
        }
      }
    }

    // Map frontend status to API status if needed
    const apiUpdates: {
      status?: SubmittalStatusGQL;
      description?: string;
      jobLocation?: string;
      bidDate?: string;
      tags?: string[];
      config?: {
        includeLamps?: boolean;
        includeAccessories?: boolean;
        includeCq?: boolean;
        includeFromOrders?: boolean;
        rollUpKits?: boolean;
        rollUpAccessories?: boolean;
        includeZeroQuantityItems?: boolean;
        dropDescriptions?: boolean;
        dropLineNotes?: boolean;
      };
    } = {};

    if (updates.status) {
      apiUpdates.status = statusFrontendToApi[updates.status] as SubmittalStatusGQL;
    }
    if (updates.jobName) {
      apiUpdates.description = updates.jobName;
    }
    if (updates.jobLocation !== undefined) {
      apiUpdates.jobLocation = updates.jobLocation || undefined;
    }
    if (updates.bidDate !== undefined) {
      apiUpdates.bidDate = updates.bidDate || undefined;
    }
    if (updates.tags !== undefined) {
      apiUpdates.tags = updates.tags || [];
    }
    if (updates.config) {
      apiUpdates.config = {
        includeLamps: updates.config.includeLamps,
        includeAccessories: updates.config.includeAccessories,
        includeCq: updates.config.includeCQ,
        includeFromOrders: updates.config.includeFromOrders,
        rollUpKits: updates.config.rollUpKits,
        rollUpAccessories: updates.config.rollUpAccessories,
        includeZeroQuantityItems: updates.config.includeZeroQuantityItems,
        dropDescriptions: updates.config.dropDescriptions,
        dropLineNotes: updates.config.dropLineNotes,
      };
    }

    if (Object.keys(apiUpdates).length > 0) {
      try {
        await updateSubmittalMutation.mutateAsync({
          id: selectedSubmittalId,
          input: apiUpdates,
        });
        refetch();
      } catch (err) {
        console.error('Error updating submittal:', err);
      }
    }
  }, [selectedSubmittalId, selectedSubmittalFull, updateSubmittalMutation, updateSubmittalItemMutation, refetch]);

  // Handle create submittal from modal
  const handleCreateSubmittal = useCallback(async (newSubmittal: Partial<Submittal>) => {
    try {
      const createdSubmittal = await createSubmittalMutation.mutateAsync({
        submittalNumber: `SUB-${Date.now()}`,
        description: newSubmittal.jobName || 'New Submittal',
        status: 'DRAFT',
        quoteId: newSubmittal.quoteIds?.[0],
      });

      const submittalId = createdSubmittal.id;

      // Add items
      if (newSubmittal.items && newSubmittal.items.length > 0) {
        for (let i = 0; i < newSubmittal.items.length; i++) {
          const item = newSubmittal.items[i];
          const itemInput: SubmittalItemInput = {
            itemNumber: i + 1,
            partNumber: item.catalogNumber || item.fixtureType,
            description: item.description,
            quantity: item.quantity,
            matchStatus: 'NO_MATCH',
          };
          await addSubmittalItemMutation.mutateAsync({ submittalId, input: itemInput });
        }
      }

      // Add stakeholders
      const mapRoleToGQL = (role: string): SubmittalStakeholderRoleGQL => {
        switch (role) {
          case 'customer': return 'CUSTOMER';
          case 'engineer': return 'ENGINEER';
          case 'architect': return 'ARCHITECT';
          case 'gc': return 'GENERAL_CONTRACTOR';
          default: return 'OTHER';
        }
      };

      const allStakeholders = [
        ...(newSubmittal.customers || []),
        ...(newSubmittal.engineers || []),
        ...(newSubmittal.architects || []),
      ];

      for (const stakeholder of allStakeholders) {
        const stakeholderInput: SubmittalStakeholderInput = {
          role: mapRoleToGQL(stakeholder.role),
          contactName: stakeholder.contactName,
          contactEmail: stakeholder.email,
          companyName: stakeholder.companyName,
        };
        await addSubmittalStakeholderMutation.mutateAsync({ submittalId, input: stakeholderInput });
      }

      setShowCreateModal(false);
      submittalToasts.createSuccess(createdSubmittal.submittalNumber);
      refetch();
    } catch (err) {
      console.error('Error creating submittal:', err);
      submittalToasts.createError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [createSubmittalMutation, addSubmittalItemMutation, addSubmittalStakeholderMutation, refetch, setShowCreateModal]);

  // Handle add item to current submittal
  const handleAddItem = useCallback(async () => {
    if (!selectedSubmittalId || !selectedSubmittalFull) return;
    try {
      const nextItemNumber = selectedSubmittalFull.items.length + 1;
      const itemInput: SubmittalItemInput = {
        itemNumber: nextItemNumber,
        partNumber: `Item ${nextItemNumber}`,
        description: 'New item',
        matchStatus: 'NO_MATCH',
      };
      await addSubmittalItemMutation.mutateAsync({
        submittalId: selectedSubmittalId,
        input: itemInput,
      });
      refetch();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  }, [selectedSubmittalId, selectedSubmittalFull, addSubmittalItemMutation, refetch]);

  // Handle delete item from current submittal
  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!selectedSubmittalId) return;
    try {
      await removeSubmittalItemMutation.mutateAsync({
        id: itemId,
        submittalId: selectedSubmittalId,
      });
      refetch();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  }, [selectedSubmittalId, removeSubmittalItemMutation, refetch]);

  // Handle edit item (inline editing)
  const handleEditItem = useCallback(async (itemId: string, values: { description?: string; quantity?: number }) => {
    if (!selectedSubmittalId) return;
    setIsEditingItem(true);
    try {
      await updateSubmittalItemMutation.mutateAsync({
        id: itemId,
        input: {
          description: values.description,
          quantity: values.quantity,
        },
        submittalId: selectedSubmittalId,
      });
      await refetch();
    } catch (err) {
      console.error('Error editing item:', err);
    } finally {
      setIsEditingItem(false);
    }
  }, [selectedSubmittalId, updateSubmittalItemMutation, refetch, setIsEditingItem]);

  // Helper function to update stakeholder by role
  const updateStakeholderByRole = useCallback(async (
    role: SubmittalStakeholderRoleGQL,
    name: string,
    existingStakeholder?: { contactId: string }
  ) => {
    if (!selectedSubmittalId || !name.trim()) return;
    try {
      if (existingStakeholder) {
        await removeSubmittalStakeholderMutation.mutateAsync({
          id: existingStakeholder.contactId,
          submittalId: selectedSubmittalId,
        });
      }
      await addSubmittalStakeholderMutation.mutateAsync({
        submittalId: selectedSubmittalId,
        input: { role, contactName: name.trim() },
      });
      refetch();
    } catch (err) {
      console.error(`Error updating ${role.toLowerCase()}:`, err);
    }
  }, [selectedSubmittalId, addSubmittalStakeholderMutation, removeSubmittalStakeholderMutation, refetch]);

  // Handle update architect
  const handleUpdateArchitect = useCallback(async (name: string) => {
    if (!selectedSubmittalFull) return;
    await updateStakeholderByRole('ARCHITECT', name, selectedSubmittalFull.architects[0]);
  }, [selectedSubmittalFull, updateStakeholderByRole]);

  // Handle update engineer
  const handleUpdateEngineer = useCallback(async (name: string) => {
    if (!selectedSubmittalFull) return;
    await updateStakeholderByRole('ENGINEER', name, selectedSubmittalFull.engineers[0]);
  }, [selectedSubmittalFull, updateStakeholderByRole]);

  // Handle update bid date from header
  const handleUpdateBidDate = useCallback(async (date: string) => {
    if (!selectedSubmittalId) return;
    try {
      await updateSubmittalMutation.mutateAsync({
        id: selectedSubmittalId,
        input: { bidDate: date || undefined },
      });
      refetch();
    } catch (err) {
      console.error('Error updating bid date:', err);
    }
  }, [selectedSubmittalId, updateSubmittalMutation, refetch]);

  // Handle add contact (for Print Dialog Addressed To tab)
  const handleAddContact = useCallback(async () => {
    if (!selectedSubmittalId) return;
    const name = window.prompt('Enter contact name:');
    if (!name?.trim()) return;
    try {
      await addSubmittalStakeholderMutation.mutateAsync({
        submittalId: selectedSubmittalId,
        input: { role: 'OTHER', contactName: name.trim() },
      });
      refetch();
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  }, [selectedSubmittalId, addSubmittalStakeholderMutation, refetch]);

  // Handle delete submittal
  const handleDeleteSubmittal = useCallback(async () => {
    if (!selectedSubmittalId || !selectedSubmittalFull) return;
    const submittalNumber = selectedSubmittalFull.jobName || selectedSubmittalId;
    try {
      await deleteSubmittalMutation.mutateAsync(selectedSubmittalId);
      setSelectedSubmittalId(null);
      submittalToasts.deleteSuccess(submittalNumber);
      refetch();
    } catch (err) {
      console.error('Error deleting submittal:', err);
      submittalToasts.deleteError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [selectedSubmittalId, selectedSubmittalFull, deleteSubmittalMutation, setSelectedSubmittalId, refetch]);

  return {
    handleSubmittalUpdate,
    handleCreateSubmittal,
    handleAddItem,
    handleDeleteItem,
    handleEditItem,
    handleUpdateArchitect,
    handleUpdateEngineer,
    handleUpdateBidDate,
    handleAddContact,
    handleDeleteSubmittal,
  };
}
