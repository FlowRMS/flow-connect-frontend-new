/**
 * useAcknowledgementsListState Hook
 * Manages acknowledgements state for the standalone acknowledgements page
 * with infinite scroll pagination and search functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  type OrderAcknowledgement,
  type AcknowledgementLandingPage,
  type CreateAcknowledgementInput,
  useAcknowledgementsInfinite,
  useAcknowledgementSearch,
  useCreateAcknowledgement,
  useUpdateAcknowledgement,
  useDeleteAcknowledgement,
  fetchAcknowledgementById,
} from '@/components/orders/api/acknowledgementsApi';

export function useAcknowledgementsListState() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch acknowledgements from API with infinite scroll
  const {
    data: acknowledgementsData,
    isLoading: isLoadingAcknowledgements,
    error: acknowledgementsError,
    refetch: refetchAcknowledgements,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAcknowledgementsInfinite();

  // Search acknowledgements - only when search query has 2+ characters
  const { data: searchResults, isLoading: isSearching } = useAcknowledgementSearch(
    searchQuery,
    100
  );

  // Flatten paginated data
  const allAcknowledgementsData = useMemo(() => {
    if (!acknowledgementsData?.pages) return [];
    return acknowledgementsData.pages.flatMap(page => page.records);
  }, [acknowledgementsData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!acknowledgementsData?.pages || acknowledgementsData.pages.length === 0) return 0;
    return acknowledgementsData.pages[0].total;
  }, [acknowledgementsData]);

  // Use search results when searching, otherwise use paginated data
  const acknowledgements = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults) {
      return searchResults;
    }
    return allAcknowledgementsData;
  }, [allAcknowledgementsData, searchQuery, searchResults]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasNextPage && !isFetchingNextPage && !searchQuery) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // Mutations
  const createAcknowledgementMutation = useCreateAcknowledgement();
  const updateAcknowledgementMutation = useUpdateAcknowledgement();
  const deleteAcknowledgementMutation = useDeleteAcknowledgement();

  // Modal states
  const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
  const [showAcknowledgementDetailModal, setShowAcknowledgementDetailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAcknowledgement, setSelectedAcknowledgement] = useState<AcknowledgementLandingPage | null>(null);
  const [acknowledgementToEdit, setAcknowledgementToEdit] = useState<OrderAcknowledgement | null>(null);
  const [acknowledgementToDelete, setAcknowledgementToDelete] = useState<AcknowledgementLandingPage | null>(null);
  const [isLoadingAcknowledgementDetails, setIsLoadingAcknowledgementDetails] = useState(false);

  // Open create acknowledgement modal
  const openCreateAcknowledgementModal = useCallback(() => {
    setAcknowledgementToEdit(null);
    setShowAcknowledgementModal(true);
  }, []);

  // Open edit acknowledgement modal - fetches full acknowledgement data
  const openEditAcknowledgementModal = useCallback(async (acknowledgement: AcknowledgementLandingPage) => {
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
      // Fall back to using the landing page data
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
  const openAcknowledgementDetailModal = useCallback((acknowledgement: AcknowledgementLandingPage) => {
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
  const openDeleteConfirmModal = useCallback((acknowledgement: AcknowledgementLandingPage) => {
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
  const handleDeleteAcknowledgement = useCallback((acknowledgement: AcknowledgementLandingPage) => {
    openDeleteConfirmModal(acknowledgement);
  }, [openDeleteConfirmModal]);

  // View acknowledgement details
  const viewAcknowledgement = useCallback((acknowledgement: AcknowledgementLandingPage) => {
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

    // Pagination
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,

    // Search
    searchQuery,
    setSearchQuery,
    isSearching,

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
