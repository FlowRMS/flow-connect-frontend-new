/**
 * Pre-Opportunity Detail Page
 */

'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCRMPreOpportunity, useUpdateCRMPreOpportunity, useDeleteCRMPreOpportunity } from '@/components/hooks/useCRMApi';
import { PreOpportunityDetailView } from '@/components/pre-opportunities/detail';
import { DeleteConfirmModal } from '@/components/pre-opportunities/modals/DeleteConfirmModal';
import { preOpportunityToasts } from '@/components/lib/toast';
import type { EditFormData } from '@/components/pre-opportunities/detail/PreOpportunityDetailsForm';
import type { PreOpportunityDetailInput } from '@/components/pre-opportunities/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PreOpportunityDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: preOpp, isLoading, error, refetch } = useCRMPreOpportunity(id);
  const updateMutation = useUpdateCRMPreOpportunity();
  const deleteMutation = useDeleteCRMPreOpportunity();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    status: 'QUALIFIED',
    expDate: '',
    reviseDate: '',
    acceptDate: '',
    customerRef: '',
    paymentTerms: '',
    freightTerms: '',
    jobId: '',
    jobName: '',
  });
  
  // Track edited line items
  const [editedLineItems, setEditedLineItems] = useState<PreOpportunityDetailInput[] | null>(null);

  // Sync form data when preOpp loads
  useEffect(() => {
    if (preOpp) {
      setEditFormData({
        status: preOpp.status,
        expDate: preOpp.expDate || '',
        reviseDate: preOpp.reviseDate || '',
        acceptDate: preOpp.acceptDate || '',
        customerRef: preOpp.customerRef || '',
        paymentTerms: preOpp.paymentTerms || '',
        freightTerms: preOpp.freightTerms || '',
        jobId: preOpp.jobId || '',
        jobName: preOpp.job?.jobName || '',
      });
      // Reset edited line items when data loads
      setEditedLineItems(null);
    }
  }, [preOpp]);

  const handleBack = () => {
    router.push('/pre-opportunities');
  };

  const handleEditChange = (field: keyof EditFormData, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLineItemsChange = useCallback((items: PreOpportunityDetailInput[]) => {
    setEditedLineItems(items);
  }, []);

  const handleSave = async () => {
    if (!preOpp) return;

    // Use edited line items if available, otherwise use existing details
    const detailsToSave = editedLineItems || preOpp.details?.map(d => ({
      id: d.id,
      itemNumber: d.itemNumber,
      productId: d.productId,
      productCpnId: d.productCpnId,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      discountRate: d.discountRate,
      leadTime: d.leadTime,
      endUserId: d.endUserId || preOpp.soldToCustomerId,
    }));

    try {
      await updateMutation.mutateAsync({
        id: preOpp.id,
        // Required fields must be included
        entityNumber: preOpp.entityNumber,
        entityDate: preOpp.entityDate,
        soldToCustomerId: preOpp.soldToCustomerId,
        // Editable fields
        status: editFormData.status,
        expDate: editFormData.expDate || undefined,
        reviseDate: editFormData.reviseDate || undefined,
        acceptDate: editFormData.acceptDate || undefined,
        customerRef: editFormData.customerRef || undefined,
        paymentTerms: editFormData.paymentTerms || undefined,
        freightTerms: editFormData.freightTerms || undefined,
        jobId: editFormData.jobId || undefined,
        // Include line items
        details: detailsToSave,
      });
      preOpportunityToasts.updateSuccess(preOpp.entityNumber);
      setIsEditing(false);
      setEditedLineItems(null);
      refetch();
    } catch (error) {
      console.error('Failed to update:', error);
      preOpportunityToasts.updateError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLineItems(null);
    // Reset form data to original values
    if (preOpp) {
      setEditFormData({
        status: preOpp.status,
        expDate: preOpp.expDate || '',
        reviseDate: preOpp.reviseDate || '',
        acceptDate: preOpp.acceptDate || '',
        customerRef: preOpp.customerRef || '',
        paymentTerms: preOpp.paymentTerms || '',
        freightTerms: preOpp.freightTerms || '',
        jobId: preOpp.jobId || '',
        jobName: preOpp.job?.jobName || '',
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!preOpp) return;

    try {
      await deleteMutation.mutateAsync(preOpp.id);
      preOpportunityToasts.deleteSuccess(preOpp.entityNumber);
      router.push('/pre-opportunities');
    } catch (error) {
      console.error('Failed to delete:', error);
      preOpportunityToasts.deleteError(error instanceof Error ? error.message : undefined);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-gray-600">Loading pre-opportunity...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !preOpp) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto mt-12">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800">Error Loading Pre-Opportunity</h2>
          </div>
          <p className="text-red-700 mb-4">
            {error?.message || 'Pre-opportunity not found'}
          </p>
          <button
            onClick={() => router.push('/pre-opportunities')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Pre-Opportunities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PreOpportunityDetailView
        preOpp={preOpp}
        isEditing={isEditing}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        editFormData={editFormData}
        onBack={handleBack}
        onEditClick={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onEditChange={handleEditChange}
        onLineItemsChange={handleLineItemsChange}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && preOpp && (
        <DeleteConfirmModal
          entityNumber={preOpp.entityNumber}
          isPending={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
