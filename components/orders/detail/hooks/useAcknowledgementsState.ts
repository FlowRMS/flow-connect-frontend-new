/**
 * useAcknowledgementsState Hook
 * Manages acknowledgements state for the order detail page
 * Uses orderAcknowledgementsByOrder query (not findLandingPages)
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  type OrderAcknowledgement,
  type CreateAcknowledgementInput,
  useOrderAcknowledgements,
  useCreateAcknowledgement,
  useUpdateAcknowledgement,
  useDeleteAcknowledgement,
  fetchAcknowledgementById,
} from '../../api/acknowledgementsApi';

interface UseAcknowledgementsStateProps {
  orderId: string | null;
}

export function useAcknowledgementsState({ orderId }: UseAcknowledgementsStateProps) {
  // Fetch acknowledgements from API using orderAcknowledgementsByOrder query
  const {
    data: acknowledgements = [],
    isLoading: isLoadingAcknowledgements,
    error: acknowledgementsError,
    refetch: refetchAcknowledgements,
  } = useOrderAcknowledgements(orderId);

  // Mutations
  const createAcknowledgementMutation = useCreateAcknowledgement();
  const updateAcknowledgementMutation = useUpdateAcknowledgement();
  const deleteAcknowledgementMutation = useDeleteAcknowledgement();

  // Modal states
  const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
  const [showAcknowledgementDetailModal, setShowAcknowledgementDetailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAcknowledgement, setSelectedAcknowledgement] = useState<OrderAcknowledgement | null>(null);
  const [acknowledgementToEdit, setAcknowledgementToEdit] = useState<OrderAcknowledgement | null>(null);
  const [acknowledgementToDelete, setAcknowledgementToDelete] = useState<OrderAcknowledgement | null>(null);
  const [isLoadingAcknowledgementDetails, setIsLoadingAcknowledgementDetails] = useState(false);

  // Open create acknowledgement modal
  const openCreateAcknowledgementModal = useCallback(() => {
    setAcknowledgementToEdit(null);
    setShowAcknowledgementModal(true);
  }, []);

  // Open edit acknowledgement modal - fetches full acknowledgement data
  const openEditAcknowledgementModal = useCallback(async (acknowledgement: OrderAcknowledgement) => {
    setIsLoadingAcknowledgementDetails(true);
    setShowAcknowledgementModal(true);

    try {
      // Fetch full acknowledgement data
      const fullAcknowledgement = await fetchAcknowledgementById(acknowledgement.id);
      if (fullAcknowledgement) {
        setAcknowledgementToEdit(fullAcknowledgement);
      }
    } catch (error) {
      console.error('Error fetching acknowledgement details:', error);
      // Fall back to using the acknowledgement data we have
      setAcknowledgementToEdit(acknowledgement);
    } finally {
      setIsLoadingAcknowledgementDetails(false);
    }
  }, []);

  // Close acknowledgement modal
  const closeAcknowledgementModal = useCallback(() => {
    setShowAcknowledgementModal(false);
    setAcknowledgementToEdit(null);
  }, []);

  // Open acknowledgement detail modal
  const openAcknowledgementDetailModal = useCallback((acknowledgement: OrderAcknowledgement) => {
    setSelectedAcknowledgement(acknowledgement);
    setShowAcknowledgementDetailModal(true);
  }, []);

  // Close acknowledgement detail modal
  const closeAcknowledgementDetailModal = useCallback(() => {
    setShowAcknowledgementDetailModal(false);
    setSelectedAcknowledgement(null);
  }, []);

  // Helper to extract error message from GraphQL errors
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    return 'An unexpected error occurred';
  };

  // Handle create/update acknowledgement
  const handleSaveAcknowledgement = useCallback(async (input: CreateAcknowledgementInput) => {
    try {
      if (acknowledgementToEdit) {
        // Update existing acknowledgement
        await updateAcknowledgementMutation.mutateAsync({
          ...input,
          id: acknowledgementToEdit.id,
        });
        toast.success('Acknowledgement updated successfully');
      } else {
        // Create new acknowledgement
        await createAcknowledgementMutation.mutateAsync(input);
        toast.success('Acknowledgement created successfully');
      }
      closeAcknowledgementModal();
      refetchAcknowledgements();
    } catch (error) {
      console.error('Error saving acknowledgement:', error);
      toast.error(getErrorMessage(error));
      throw error;
    }
  }, [acknowledgementToEdit, createAcknowledgementMutation, updateAcknowledgementMutation, closeAcknowledgementModal, refetchAcknowledgements]);

  // Open delete confirmation modal
  const openDeleteConfirmModal = useCallback((acknowledgement: OrderAcknowledgement) => {
    setAcknowledgementToDelete(acknowledgement);
    setShowDeleteConfirmModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteConfirmModal = useCallback(() => {
    setShowDeleteConfirmModal(false);
    setAcknowledgementToDelete(null);
  }, []);

  // Handle delete acknowledgement (called from confirmation modal)
  const handleConfirmDelete = useCallback(async () => {
    if (!acknowledgementToDelete) return;

    try {
      await deleteAcknowledgementMutation.mutateAsync(acknowledgementToDelete.id);
      toast.success('Acknowledgement deleted successfully');
      closeDeleteConfirmModal();
      closeAcknowledgementDetailModal();
      refetchAcknowledgements();
    } catch (error) {
      console.error('Error deleting acknowledgement:', error);
      toast.error(getErrorMessage(error));
    }
  }, [acknowledgementToDelete, deleteAcknowledgementMutation, closeDeleteConfirmModal, closeAcknowledgementDetailModal, refetchAcknowledgements]);

  // Handle delete acknowledgement request (opens confirmation modal)
  const handleDeleteAcknowledgement = useCallback((acknowledgement: OrderAcknowledgement) => {
    openDeleteConfirmModal(acknowledgement);
  }, [openDeleteConfirmModal]);

  // View acknowledgement details
  const viewAcknowledgement = useCallback((acknowledgement: OrderAcknowledgement) => {
    openAcknowledgementDetailModal(acknowledgement);
  }, [openAcknowledgementDetailModal]);

  // Edit acknowledgement from detail modal
  const editAcknowledgementFromDetail = useCallback(() => {
    if (selectedAcknowledgement) {
      closeAcknowledgementDetailModal();
      openEditAcknowledgementModal(selectedAcknowledgement);
    }
  }, [selectedAcknowledgement, closeAcknowledgementDetailModal, openEditAcknowledgementModal]);

  // Delete acknowledgement from detail modal
  const deleteAcknowledgementFromDetail = useCallback(async () => {
    if (selectedAcknowledgement) {
      await handleDeleteAcknowledgement(selectedAcknowledgement);
    }
  }, [selectedAcknowledgement, handleDeleteAcknowledgement]);

  return {
    // Data
    acknowledgements,
    isLoadingAcknowledgements,
    acknowledgementsError,
    refetchAcknowledgements,

    // Modal states
    showAcknowledgementModal,
    showAcknowledgementDetailModal,
    showDeleteConfirmModal,
    selectedAcknowledgement,
    acknowledgementToEdit,
    acknowledgementToDelete,
    isLoadingAcknowledgementDetails,

    // Modal actions
    openCreateAcknowledgementModal,
    openEditAcknowledgementModal,
    closeAcknowledgementModal,
    openAcknowledgementDetailModal,
    closeAcknowledgementDetailModal,
    closeDeleteConfirmModal,

    // CRUD actions
    handleSaveAcknowledgement,
    handleDeleteAcknowledgement,
    handleConfirmDelete,
    viewAcknowledgement,
    editAcknowledgementFromDetail,
    deleteAcknowledgementFromDetail,

    // Mutation states
    isSavingAcknowledgement: createAcknowledgementMutation.isPending || updateAcknowledgementMutation.isPending,
    isDeletingAcknowledgement: deleteAcknowledgementMutation.isPending,
  };
}
