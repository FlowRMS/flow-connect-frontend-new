/**
 * Stakeholder Action Handlers
 * Contains mutation handlers for stakeholder operations
 */

import { useCallback } from 'react';
import type {
  SubmittalStakeholderInput,
  SubmittalStakeholderRoleGQL,
} from '../api/useSubmittalsApi';
import type { Submittal } from '../../../lib/types/submittals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationHook = { mutateAsync: (params: any) => Promise<any> };

interface UseStakeholderHandlersParams {
  selectedSubmittalId: string | null;
  selectedSubmittalFull: Submittal | null;
  addSubmittalStakeholderMutation: MutationHook;
  removeSubmittalStakeholderMutation: MutationHook;
  refetch: () => void;
}

export function useStakeholderHandlers({
  selectedSubmittalId,
  selectedSubmittalFull,
  addSubmittalStakeholderMutation,
  removeSubmittalStakeholderMutation,
  refetch,
}: UseStakeholderHandlersParams) {
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

  // Handle add stakeholder from the Stakeholders tab form
  const handleAddStakeholder = useCallback(async (
    role: 'customer' | 'engineer' | 'architect',
    data: { contactName: string; companyName: string; email: string }
  ) => {
    if (!selectedSubmittalId || !data.contactName.trim()) return;

    const roleMap: Record<string, SubmittalStakeholderRoleGQL> = {
      customer: 'CUSTOMER',
      engineer: 'ENGINEER',
      architect: 'ARCHITECT',
    };

    try {
      const stakeholderInput: SubmittalStakeholderInput = {
        role: roleMap[role],
        contactName: data.contactName.trim(),
        companyName: data.companyName.trim() || undefined,
        contactEmail: data.email.trim() || undefined,
      };
      await addSubmittalStakeholderMutation.mutateAsync({
        submittalId: selectedSubmittalId,
        input: stakeholderInput,
      });
      refetch();
    } catch (err) {
      console.error('Error adding stakeholder:', err);
    }
  }, [selectedSubmittalId, addSubmittalStakeholderMutation, refetch]);

  // Handle remove stakeholder
  const handleRemoveStakeholder = useCallback(async (stakeholderId: string) => {
    if (!selectedSubmittalId) return;
    try {
      await removeSubmittalStakeholderMutation.mutateAsync({
        id: stakeholderId,
        submittalId: selectedSubmittalId,
      });
      refetch();
    } catch (err) {
      console.error('Error removing stakeholder:', err);
    }
  }, [selectedSubmittalId, removeSubmittalStakeholderMutation, refetch]);

  return {
    handleUpdateArchitect,
    handleUpdateEngineer,
    handleAddContact,
    handleAddStakeholder,
    handleRemoveStakeholder,
  };
}
