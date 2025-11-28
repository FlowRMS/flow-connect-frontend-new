/**
 * Kanban View for Pre-Opportunities
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { getPreOppsByStatus, formatCurrency, formatDate, getStageColor, getStatusLabel } from '../utils';
import type { PreOpportunityLandingPage, PreOppStage, PreOpportunityStatus } from '../types';
import { useUpdateCRMPreOpportunity, useDeleteCRMPreOpportunity } from '../../hooks/useCRMApi';
import { CreatePreOpportunityModal } from '../modals/CreatePreOpportunityModal';

interface KanbanViewProps {
  preOpps: PreOpportunityLandingPage[];
  stages: PreOppStage[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  onRefresh: () => void;
}

export function KanbanView({
  preOpps,
  stages,
  activeId,
  setActiveId,
  onRefresh,
}: KanbanViewProps) {
  const updateMutation = useUpdateCRMPreOpportunity();
  const deleteMutation = useDeleteCRMPreOpportunity();
  
  // Modal state for creating new pre-opportunities from column
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialStatus, setCreateModalInitialStatus] = useState<PreOpportunityStatus>('DRAFT');

  const handleStatusChange = async (preOppId: string, newStatus: PreOpportunityStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: preOppId,
        status: newStatus,
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (preOppId: string) => {
    if (!confirm('Are you sure you want to delete this pre-opportunity?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(preOppId);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete pre-opportunity');
    }
  };

  const handleNewClick = (status: PreOpportunityStatus) => {
    setCreateModalInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stagePreOpps = getPreOppsByStatus(preOpps, stage.name);

          return (
            <div key={stage.name} className="flex flex-col">
              {/* Column Header - styled like other Kanbans */}
              <div className="flex items-center justify-between px-3 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    {stage.displayName}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {stagePreOpps.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleNewClick(stage.name)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={`Add new ${stage.displayName}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[500px]">
                {stagePreOpps.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    No {stage.displayName.toLowerCase()} opportunities
                  </div>
                ) : (
                  stagePreOpps.map((preOpp) => (
                    <div
                      key={preOpp.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <Link href={`/pre-opportunities/${preOpp.id}`}>
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">
                                {preOpp.entityNumber}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(preOpp.entityDate)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(preOpp.id);
                                }}
                                className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                                title="Delete"
                              >
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Value */}
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(preOpp.total)}
                          </div>

                          {/* Expiration */}
                          {preOpp.expDate && (
                            <div className="text-xs text-gray-600">
                              Exp: {formatDate(preOpp.expDate)}
                            </div>
                          )}

                          {/* Created By */}
                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                            By: {preOpp.createdBy}
                          </div>
                        </div>
                      </Link>

                      {/* Status Change Dropdown */}
                      <div className="mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={preOpp.status}
                          onChange={(e) => handleStatusChange(preOpp.id, e.target.value as PreOpportunityStatus)}
                          disabled={updateMutation.isPending}
                          className="w-full text-xs px-2 py-1 bg-white text-gray-900 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="CONVERTED">Converted</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Card Button */}
              <button 
                onClick={() => handleNewClick(stage.name)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-2 border-2 border-dashed border-gray-200"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                New
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreatePreOpportunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            onRefresh();
          }}
          initialStatus={createModalInitialStatus}
        />
      )}
    </>
  );
}

