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
import { fetchOrderById, type Order as ApiOrder, type OrderDetail } from '@/components/orders/api/ordersApi';
import type { Order, OrderLineItem } from '@/lib/types/rms';

/**
 * Transform API Order to UI Order format for AcknowledgementModal
 */
function transformApiOrderToUiOrder(apiOrder: ApiOrder): Order {
  // Map line items from API format to UI format
  const lineItems: OrderLineItem[] = (apiOrder.details || []).map((detail: OrderDetail, index: number) => ({
    id: detail.id,
    lineNumber: detail.itemNumber || index + 1,
    productId: detail.productId || '',
    partNumber: detail.product?.factoryPartNumber || detail.productNameAdhoc || '',
    custPartNumber: '',
    description: detail.product?.description || detail.productDescriptionAdhoc || '',
    uom: detail.uom?.title || null,
    uomId: detail.uom?.id || null,
    divisor: detail.uom?.divisionFactor || parseFloat(detail.divisionFactor || '1'),
    quantity: parseFloat(detail.quantity || '0'),
    unitPrice: parseFloat(detail.unitPrice || '0'),
    extendedPrice: detail.subtotal || 0,
    commissionRate: parseFloat(detail.commissionRate || '0') / 100,
    commissionAmount: detail.commission || 0,
    quantityShipped: detail.shippingBalance || 0,
    quantityInvoiced: 0,
    quantityCredited: detail.cancelledBalance || 0,
    isCancelled: detail.status === 'CANCELLED',
    isConsignment: false,
    status: detail.status === 'CANCELLED' ? 'cancelled' : detail.status === 'SHIPPED' ? 'shipped' : 'open',
  }));

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    factorySoNumber: apiOrder.factSoNumber,
    manufacturerId: apiOrder.factoryId || '',
    manufacturerName: apiOrder.factory?.title || '',
    customerId: apiOrder.soldToCustomerId || '',
    customerName: apiOrder.soldToCustomer?.companyName || '',
    status: 'OPEN',
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: apiOrder.entityDate || '',
    entryDate: apiOrder.entityDate,
    shipDate: apiOrder.shipDate,
    dueDate: apiOrder.dueDate,
    lineItems,
    subtotal: apiOrder.balance?.subtotal || 0,
    freight: apiOrder.balance?.freightChargeBalance || 0,
    total: apiOrder.balance?.total || 0,
    totalCommission: apiOrder.balance?.commission || 0,
    splitRates: [],
    createdAt: apiOrder.createdAt || '',
    createdBy: apiOrder.createdBy?.fullName || '',
    updatedAt: apiOrder.createdAt || '',
  };
}

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
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [selectedAcknowledgement, setSelectedAcknowledgement] = useState<AcknowledgementLandingPage | null>(null);
  const [acknowledgementToEdit, setAcknowledgementToEdit] = useState<OrderAcknowledgement | null>(null);
  const [acknowledgementToDelete, setAcknowledgementToDelete] = useState<AcknowledgementLandingPage | null>(null);
  const [isLoadingAcknowledgementDetails, setIsLoadingAcknowledgementDetails] = useState(false);

  // Order state for create/edit modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // Open order select modal for creating new acknowledgement
  const openCreateAcknowledgementModal = useCallback(() => {
    setAcknowledgementToEdit(null);
    setSelectedOrder(null);
    setShowOrderSelectModal(true);
  }, []);

  // Close order select modal
  const closeOrderSelectModal = useCallback(() => {
    setShowOrderSelectModal(false);
  }, []);

  // Handle order selection - fetch full order and open acknowledgement modal
  const handleOrderSelect = useCallback(async (orderId: string) => {
    setIsLoadingOrder(true);
    try {
      const apiOrder = await fetchOrderById(orderId);
      if (apiOrder) {
        const uiOrder = transformApiOrderToUiOrder(apiOrder);
        setSelectedOrder(uiOrder);
        setShowOrderSelectModal(false);
        setShowAcknowledgementModal(true);
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoadingOrder(false);
    }
  }, []);

  // Open edit acknowledgement modal - fetches full acknowledgement data and order
  const openEditAcknowledgementModal = useCallback(async (acknowledgement: AcknowledgementLandingPage) => {
    setIsLoadingAcknowledgementDetails(true);
    setIsLoadingOrder(true);
    setShowAcknowledgementModal(true);

    try {
      // Fetch full acknowledgement data
      const fullAcknowledgement = await fetchAcknowledgementById(acknowledgement.id);
      if (fullAcknowledgement) {
        setAcknowledgementToEdit(fullAcknowledgement);

        // Fetch the order for this acknowledgement
        if (fullAcknowledgement.orderId) {
          const apiOrder = await fetchOrderById(fullAcknowledgement.orderId);
          if (apiOrder) {
            const uiOrder = transformApiOrderToUiOrder(apiOrder);
            setSelectedOrder(uiOrder);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching acknowledgement details:', error);
      toast.error('Failed to load acknowledgement details');
      setShowAcknowledgementModal(false);
    } finally {
      setIsLoadingAcknowledgementDetails(false);
      setIsLoadingOrder(false);
    }
  }, []);

  // Close acknowledgement modal
  const closeAcknowledgementModal = useCallback(() => {
    setShowAcknowledgementModal(false);
    setAcknowledgementToEdit(null);
    setSelectedOrder(null);
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
    showOrderSelectModal,
    selectedAcknowledgement,
    acknowledgementToEdit,
    acknowledgementToDelete,
    isLoadingAcknowledgementDetails,

    // Order state for create/edit
    selectedOrder,
    isLoadingOrder,

    // Modal actions
    openCreateAcknowledgementModal,
    openEditAcknowledgementModal,
    closeAcknowledgementModal,
    openAcknowledgementDetailModal,
    closeAcknowledgementDetailModal,
    closeDeleteConfirmModal,
    closeOrderSelectModal,
    handleOrderSelect,

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
