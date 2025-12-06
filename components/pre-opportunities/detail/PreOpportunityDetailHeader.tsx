/**
 * Pre-Opportunity Detail Header Component
 * Enhanced with Jobs-style styling and visual hierarchy
 */

import React from 'react';
import type { PreOpportunity, PreOpportunityStatus } from '../types';
import { formatDate, formatCurrency } from '../utils';

// Status color mapping
const STATUS_COLORS: Record<PreOpportunityStatus, { bg: string; text: string; dot: string }> = {
  'QUALIFIED': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'NEGOTIATION': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'FOLLOW_UP': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'WAITING_ON_FACTORY': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'LOST': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'WON': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

const STATUS_LABELS: Record<PreOpportunityStatus, string> = {
  'QUALIFIED': 'Qualified',
  'NEGOTIATION': 'Negotiation',
  'FOLLOW_UP': 'Follow Up',
  'WAITING_ON_FACTORY': 'Waiting on Factory',
  'LOST': 'Lost',
  'WON': 'Won',
};

interface PreOpportunityDetailHeaderProps {
  preOpp: PreOpportunity;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onBack: () => void;
  onEditClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function PreOpportunityDetailHeader({
  preOpp,
  isEditing,
  isSaving,
  isDeleting,
  onBack,
  onEditClick,
  onSave,
  onCancel,
  onDelete,
}: PreOpportunityDetailHeaderProps) {
  const statusColors = STATUS_COLORS[preOpp.status] || STATUS_COLORS.QUALIFIED;

  // Get owner initials and color
  const getOwnerInitials = (owner: string) => {
    if (!owner) return '?';
    const parts = owner.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return owner.substring(0, 2).toUpperCase();
  };

  const getOwnerColor = (id: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const ownerInitials = getOwnerInitials(preOpp.createdBy);
  const ownerColor = getOwnerColor(preOpp.id);

  return (
    <div className="mb-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors group"
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 20 20" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="group-hover:-translate-x-1 transition-transform"
        >
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-medium">Back to Pre-Opportunities</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          {/* Left Side - Pre-Opp Info */}
          <div className="flex items-start gap-4">
            {/* Pre-Opp Icon */}
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Pre-Opp Details */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[var(--foreground)]">{preOpp.entityNumber}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                  <span className={`w-2 h-2 rounded-full ${statusColors.dot}`}></span>
                  {STATUS_LABELS[preOpp.status]}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-blue-600 text-lg">
                  {formatCurrency(preOpp.balance?.total || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(preOpp.entityDate)}
                </span>
                <span className="flex items-center gap-2">
                  <div 
                    className={`w-6 h-6 rounded-full ${ownerColor} flex items-center justify-center text-white text-xs font-semibold`}
                  >
                    {ownerInitials}
                  </div>
                  {preOpp.createdBy}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={onCancel}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                  Cancel
                </button>
                <button 
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onEditClick}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button 
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
