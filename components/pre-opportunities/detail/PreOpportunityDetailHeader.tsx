/**
 * Pre-Opportunity Detail Header Component
 */

import React from 'react';
import Link from 'next/link';
import type { PreOpportunity, PreOpportunityStatus } from '../types';
import { getStageColor, getStatusLabel, formatDate } from '../utils';

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
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l5-5M5 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Pre-Opportunities
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {preOpp.entityNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(preOpp.status)}`}>
              {getStatusLabel(preOpp.status)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created by {preOpp.createdBy} on {formatDate(preOpp.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEditClick}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5l4 4M4 16l1-4 9-9 4 4-9 9-4 1z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
