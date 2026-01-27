/**
 * Pre-Opportunity Detail View Component
 * Combines all detail components into a single view
 * Now uses factory-grouped line items for better organization
 */

import { useState } from 'react';
import { PreOpportunityDetailHeader } from './PreOpportunityDetailHeader';
import { PreOpportunityDetailsForm, type EditFormData } from './PreOpportunityDetailsForm';
import { FactoryGroupedLineItemsView } from './FactoryGroupedLineItemsView';
import { PreOpportunitySummary } from './PreOpportunitySummary';
import { ConnectedEntitiesSection } from '../../shared/ConnectedEntitiesSection';
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
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);

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
          <FactoryGroupedLineItemsView
            preOpp={preOpp}
            isEditing={isEditing}
            onLineItemsChange={onLineItemsChange}
          />

          {/* Connected Entities - All entities except pre-opportunities */}
          <ConnectedEntitiesSection
            entityId={preOpp.id}
            sourceEntityType="PRE_OPPORTUNITY"
            enabledCategories={['contacts', 'companies', 'customers', 'jobs', 'tasks', 'notes', 'quotes', 'orders', 'invoices', 'checks', 'files']}
            title="Connected Entities"
            showAddLinkButton={true}
          />
        </div>

        {/* Sidebar - 1 column, appears first on mobile for summary visibility */}
        <div className="order-1 lg:order-2">
          <PreOpportunitySummary 
            preOpp={preOpp}
            isEditing={isEditing}
            editFormData={editFormData}
            onChange={onEditChange}
          />
        </div>
      </div>

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
