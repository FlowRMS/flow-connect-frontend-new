/**
 * Pre-Opportunity Detail View Component
 * Combines all detail components into a single view
 */

import React, { useState } from 'react';
import { PreOpportunityDetailHeader } from './PreOpportunityDetailHeader';
import { PreOpportunityDetailsForm, type EditFormData } from './PreOpportunityDetailsForm';
import { PreOpportunityLineItems } from './PreOpportunityLineItems';
import { PreOpportunitySummary } from './PreOpportunitySummary';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import { AddLinkModal } from '../modals/AddLinkModal';
import { CreateQuoteFromPreOppModal } from '../modals/CreateQuoteFromPreOppModal';
import type { PreOpportunity, PreOpportunityDetailInput } from '../types';

interface PreOpportunityDetailViewProps {
  preOpp: PreOpportunity;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  editFormData: EditFormData;
  onBack: () => void;
  onEditClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEditChange: (field: keyof EditFormData, value: string) => void;
  onLineItemsChange?: (items: PreOpportunityDetailInput[]) => void;
}

export function PreOpportunityDetailView({
  preOpp,
  isEditing,
  isSaving,
  isDeleting,
  editFormData,
  onBack,
  onEditClick,
  onSave,
  onCancel,
  onDelete,
  onEditChange,
  onLineItemsChange,
}: PreOpportunityDetailViewProps) {
  // Modal states
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<'TASK' | 'NOTE'>('TASK');
  const [tasksSectionKey, setTasksSectionKey] = useState(0);
  const [notesSectionKey, setNotesSectionKey] = useState(0);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);

  // Handle link success - trigger refetch via key change
  const handleLinkSuccess = () => {
    if (addLinkEntityType === 'TASK') {
      setTasksSectionKey(prev => prev + 1);
    } else {
      setNotesSectionKey(prev => prev + 1);
    }
  };

  // Open add link modal for specific entity type
  const openAddLinkModal = (entityType: 'TASK' | 'NOTE') => {
    setAddLinkEntityType(entityType);
    setShowAddLinkModal(true);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-3 md:p-6">
      <PreOpportunityDetailHeader
        preOpp={preOpp}
        isEditing={isEditing}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onBack={onBack}
        onEditClick={onEditClick}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        onCreateQuote={() => setShowCreateQuoteModal(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
          <PreOpportunityDetailsForm
            preOpp={preOpp}
            isEditing={isEditing}
            editFormData={editFormData}
            onChange={onEditChange}
          />
          <PreOpportunityLineItems
            preOpp={preOpp}
            isEditing={isEditing}
            onLineItemsChange={onLineItemsChange}
          />

          {/* Connected Tasks */}
          <ConnectedTasksSection
            key={`tasks-${tasksSectionKey}`}
            entityId={preOpp.id}
            entityType="PRE_OPPORTUNITY"
            title="Connected Tasks"
            onAddClick={() => openAddLinkModal('TASK')}
            onUnlinkSuccess={() => setTasksSectionKey(prev => prev + 1)}
          />

          {/* Connected Notes */}
          <ConnectedNotesSection
            key={`notes-${notesSectionKey}`}
            entityId={preOpp.id}
            entityType="PRE_OPPORTUNITY"
            title="Connected Notes"
            onAddClick={() => openAddLinkModal('NOTE')}
            onUnlinkSuccess={() => setNotesSectionKey(prev => prev + 1)}
          />
        </div>

        {/* Sidebar - 1 column, appears first on mobile for summary visibility */}
        <div className="order-1 lg:order-2">
          <PreOpportunitySummary preOpp={preOpp} />
        </div>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        preOpportunityId={preOpp.id}
        initialEntityType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      {/* Create Quote Modal */}
      <CreateQuoteFromPreOppModal
        isOpen={showCreateQuoteModal}
        preOpportunityId={preOpp.id}
        preOpportunityNumber={preOpp.entityNumber}
        lineItems={preOpp.details}
        onClose={() => setShowCreateQuoteModal(false)}
      />
    </main>
  );
}
