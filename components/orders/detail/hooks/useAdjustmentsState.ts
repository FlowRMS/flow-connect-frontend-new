/**
 * useAdjustmentsState Hook
 * Manages adjustments state for the order detail page
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  type Adjustment,
  type AdjustmentLandingPage,
  type CreateAdjustmentInput,
  useAdjustmentsLandingPage,
  useCreateAdjustment,
  useUpdateAdjustment,
  useDeleteAdjustment,
  fetchAdjustmentById,
} from '../../api/adjustmentsApi';

export function useAdjustmentsState() {
  // Fetch adjustments from API (all adjustments, not order-specific)
  const {
    data: adjustments = [],
    isLoading: isLoadingAdjustments,
    error: adjustmentsError,
    refetch: refetchAdjustments,
  } = useAdjustmentsLandingPage();

  // Mutations
  const createAdjustmentMutation = useCreateAdjustment();
  const updateAdjustmentMutation = useUpdateAdjustment();
  const deleteAdjustmentMutation = useDeleteAdjustment();

  // Modal states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showAdjustmentDetailModal, setShowAdjustmentDetailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentLandingPage | null>(null);
  const [adjustmentToEdit, setAdjustmentToEdit] = useState<Adjustment | null>(null);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<AdjustmentLandingPage | null>(null);
  const [isLoadingAdjustmentDetails, setIsLoadingAdjustmentDetails] = useState(false);

  // Open create adjustment modal
  const openCreateAdjustmentModal = useCallback(() => {
    setAdjustmentToEdit(null);
    setShowAdjustmentModal(true);
  }, []);

  // Open edit adjustment modal - fetches full adjustment data with details
  const openEditAdjustmentModal = useCallback(async (adjustment: AdjustmentLandingPage) => {
    setIsLoadingAdjustmentDetails(true);
    setShowAdjustmentModal(true);

    try {
      // Fetch full adjustment data including split rates
      const fullAdjustment = await fetchAdjustmentById(adjustment.id);
      if (fullAdjustment) {
        setAdjustmentToEdit(fullAdjustment);
      }
    } catch (error) {
      console.error('Error fetching adjustment details:', error);
      // Fall back to just opening the modal without full details
    } finally {
      setIsLoadingAdjustmentDetails(false);
    }
  }, []);

  // Close adjustment modal
  const closeAdjustmentModal = useCallback(() => {
    setShowAdjustmentModal(false);
    setAdjustmentToEdit(null);
  }, []);

  // Open adjustment detail modal
  const openAdjustmentDetailModal = useCallback((adjustment: AdjustmentLandingPage) => {
    setSelectedAdjustment(adjustment);
    setShowAdjustmentDetailModal(true);
  }, []);

  // Close adjustment detail modal
  const closeAdjustmentDetailModal = useCallback(() => {
    setShowAdjustmentDetailModal(false);
    setSelectedAdjustment(null);
  }, []);

  // Helper to extract error message from GraphQL errors
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      // Check for specific error messages
      if (message.includes('Cannot modify a posted adjustment')) {
        return 'Cannot modify a posted adjustment. Please void the adjustment first.';
      }
      if (message.includes('Cannot delete a posted adjustment')) {
        return 'Cannot delete a posted adjustment. Please void the adjustment first.';
      }
      return message;
    }
    return 'An unexpected error occurred';
  };

  // Handle create/update adjustment
  const handleSaveAdjustment = useCallback(async (input: CreateAdjustmentInput) => {
    try {
      if (adjustmentToEdit) {
        // Update existing adjustment
        await updateAdjustmentMutation.mutateAsync({
          ...input,
          id: adjustmentToEdit.id,
        });
        toast.success('Adjustment updated successfully');
      } else {
        // Create new adjustment
        await createAdjustmentMutation.mutateAsync(input);
        toast.success('Adjustment created successfully');
      }
      closeAdjustmentModal();
      refetchAdjustments();
    } catch (error) {
      console.error('Error saving adjustment:', error);
      toast.error(getErrorMessage(error));
      throw error;
    }
  }, [adjustmentToEdit, createAdjustmentMutation, updateAdjustmentMutation, closeAdjustmentModal, refetchAdjustments]);

  // Open delete confirmation modal
  const openDeleteConfirmModal = useCallback((adjustment: AdjustmentLandingPage) => {
    setAdjustmentToDelete(adjustment);
    setShowDeleteConfirmModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteConfirmModal = useCallback(() => {
    setShowDeleteConfirmModal(false);
    setAdjustmentToDelete(null);
  }, []);

  // Handle delete adjustment (called from confirmation modal)
  const handleConfirmDelete = useCallback(async () => {
    if (!adjustmentToDelete) return;

    try {
      await deleteAdjustmentMutation.mutateAsync(adjustmentToDelete.id);
      toast.success('Adjustment deleted successfully');
      closeDeleteConfirmModal();
      closeAdjustmentDetailModal();
      refetchAdjustments();
    } catch (error) {
      console.error('Error deleting adjustment:', error);
      toast.error(getErrorMessage(error));
    }
  }, [adjustmentToDelete, deleteAdjustmentMutation, closeDeleteConfirmModal, closeAdjustmentDetailModal, refetchAdjustments]);

  // Handle delete adjustment request (opens confirmation modal)
  const handleDeleteAdjustment = useCallback((adjustment: AdjustmentLandingPage) => {
    openDeleteConfirmModal(adjustment);
  }, [openDeleteConfirmModal]);

  // View adjustment details
  const viewAdjustment = useCallback((adjustment: AdjustmentLandingPage) => {
    openAdjustmentDetailModal(adjustment);
  }, [openAdjustmentDetailModal]);

  // Edit adjustment from detail modal
  const editAdjustmentFromDetail = useCallback(() => {
    if (selectedAdjustment) {
      closeAdjustmentDetailModal();
      openEditAdjustmentModal(selectedAdjustment);
    }
  }, [selectedAdjustment, closeAdjustmentDetailModal, openEditAdjustmentModal]);

  // Delete adjustment from detail modal
  const deleteAdjustmentFromDetail = useCallback(async () => {
    if (selectedAdjustment) {
      await handleDeleteAdjustment(selectedAdjustment);
    }
  }, [selectedAdjustment, handleDeleteAdjustment]);

  return {
    // Data
    adjustments,
    isLoadingAdjustments,
    adjustmentsError,
    refetchAdjustments,

    // Modal states
    showAdjustmentModal,
    showAdjustmentDetailModal,
    showDeleteConfirmModal,
    selectedAdjustment,
    adjustmentToEdit,
    adjustmentToDelete,
    isLoadingAdjustmentDetails,

    // Modal actions
    openCreateAdjustmentModal,
    openEditAdjustmentModal,
    closeAdjustmentModal,
    openAdjustmentDetailModal,
    closeAdjustmentDetailModal,
    closeDeleteConfirmModal,

    // CRUD actions
    handleSaveAdjustment,
    handleDeleteAdjustment,
    handleConfirmDelete,
    viewAdjustment,
    editAdjustmentFromDetail,
    deleteAdjustmentFromDetail,

    // Mutation states
    isSavingAdjustment: createAdjustmentMutation.isPending || updateAdjustmentMutation.isPending,
    isDeletingAdjustment: deleteAdjustmentMutation.isPending,
  };
}
