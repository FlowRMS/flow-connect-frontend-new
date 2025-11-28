/**
 * Pre-Opportunity Detail View Component
 * Combines all detail components into a single view
 */

import React from 'react';
import { PreOpportunityDetailHeader } from './PreOpportunityDetailHeader';
import { PreOpportunityDetailsForm, type EditFormData } from './PreOpportunityDetailsForm';
import { PreOpportunityLineItems } from './PreOpportunityLineItems';
import { PreOpportunitySummary } from './PreOpportunitySummary';
import type { PreOpportunity } from '../types';

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
}: PreOpportunityDetailViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
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
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <PreOpportunityDetailsForm
            preOpp={preOpp}
            isEditing={isEditing}
            editFormData={editFormData}
            onChange={onEditChange}
          />
          <PreOpportunityLineItems preOpp={preOpp} />
        </div>

        {/* Sidebar - 1 column */}
        <div>
          <PreOpportunitySummary preOpp={preOpp} />
        </div>
      </div>
    </main>
  );
}
