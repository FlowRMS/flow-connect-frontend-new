/**
 * Campaigns Content Component - Main Container
 * Production-ready implementation with real API integration
 */

'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCampaignState } from './hooks/useCampaignState';
import { useRuleState } from './hooks/useRuleState';
import { rules as mockRules } from './mockData';
import CampaignsListView from './views/CampaignsListView';
import RulesListView from './views/RulesListView';
import NewCampaignView from './views/NewCampaignView';
import NewRuleView from './views/NewRuleView';
import AIModal from './modals/AIModal';
import type { Campaign } from './types';
import { mapCampaignStatus } from './types';
import {
  useCampaigns,
  useCampaign,
  useCampaignRecipients,
  useDeleteCampaign,
  usePauseCampaign,
  useResumeCampaign,
} from './api';
import { mapAPIToListType } from './types';

export default function CampaignsContent() {
  // URL routing
  const searchParams = useSearchParams();
  const router = useRouter();

  // Track last populated campaign ID to avoid re-populating
  const lastPopulatedCampaignId = useRef<string | null>(null);

  // Campaign state management
  const campaignState = useCampaignState();

  // Rule state management
  const ruleState = useRuleState();

  // Get edit campaign ID from URL
  const editCampaignIdFromUrl = searchParams.get('edit');

  // Sync URL param with state on mount
  useEffect(() => {
    if (editCampaignIdFromUrl && editCampaignIdFromUrl !== campaignState.editingCampaignId) {
      // Reset form first before setting new campaign ID
      resetFormState();
      campaignState.setEditingCampaignId(editCampaignIdFromUrl);
      campaignState.setActiveTab('edit-campaign');
    } else if (!editCampaignIdFromUrl && campaignState.activeTab === 'edit-campaign') {
      // URL cleared but we're still in edit mode - go back to campaigns
      campaignState.setEditingCampaignId(null);
      campaignState.setActiveTab('campaigns');
    }
  }, [editCampaignIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to reset form state
  const resetFormState = () => {
    campaignState.setCampaignName('');
    campaignState.setCampaignDescription('');
    campaignState.setEmailSubject('');
    campaignState.setEmailBody('');
    campaignState.setListType('static');
    campaignState.setRecipientList([]);
    campaignState.setUseAIPersonalization(true);
    campaignState.setSendImmediately(true);
    campaignState.setScheduledDate('');
    campaignState.setScheduledTime('');
    campaignState.setCampaignConditionGroups([
      { id: '1', logic: 'AND', conditions: [{ id: '1-1', entity: '', field: '', operator: '', value: '' }] }
    ]);
    campaignState.clearAllFilters();
    lastPopulatedCampaignId.current = null;
  };

  // Fetch campaigns from API
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useCampaigns();

  // Campaign mutations
  const deleteCampaignMutation = useDeleteCampaign();
  const pauseCampaignMutation = usePauseCampaign();
  const resumeCampaignMutation = useResumeCampaign();

  // Fetch single campaign for editing
  const { data: editingCampaignData, isLoading: editingCampaignLoading } = useCampaign(
    campaignState.editingCampaignId || ''
  );

  // Fetch recipients for the campaign being edited (for static lists)
  const { data: editingCampaignRecipients } = useCampaignRecipients(
    campaignState.editingCampaignId || ''
  );

  // Populate form when editing a campaign - only once per campaign ID
  useEffect(() => {
    if (
      editingCampaignData &&
      campaignState.activeTab === 'edit-campaign' &&
      editingCampaignData.id !== lastPopulatedCampaignId.current
    ) {
      // Mark this campaign as populated
      lastPopulatedCampaignId.current = editingCampaignData.id;

      // Populate basic fields
      campaignState.setCampaignName(editingCampaignData.name);
      campaignState.setCampaignDescription(editingCampaignData.description || '');
      campaignState.setEmailSubject(editingCampaignData.emailSubject);
      campaignState.setEmailBody(editingCampaignData.emailBody);
      campaignState.setListType(mapAPIToListType(editingCampaignData.recipientListType));
      campaignState.setUseAIPersonalization(editingCampaignData.aiPersonalizationEnabled);
      campaignState.setMaxPerDay(editingCampaignData.maxEmailsPerDay);
      campaignState.setSendImmediately(!editingCampaignData.scheduledAt);

      if (editingCampaignData.scheduledAt) {
        const date = new Date(editingCampaignData.scheduledAt);
        campaignState.setScheduledDate(date.toISOString().split('T')[0]);
        campaignState.setScheduledTime(date.toTimeString().slice(0, 5));
      } else {
        campaignState.setScheduledDate('');
        campaignState.setScheduledTime('');
      }

      // Set criteria if available (stored as JSON string) - for criteria-based/dynamic lists
      if (editingCampaignData.criteriaJson && editingCampaignData.recipientListType !== 'STATIC') {
        try {
          const criteria = JSON.parse(editingCampaignData.criteriaJson);

          // Map entity_type number to string (backend uses enum numbers)
          const entityTypeMap: Record<number, string> = {
            1: 'JOB',
            2: 'COMPANY',
            3: 'CONTACT',
            4: 'TASK',
          };

          // Helper to extract condition values (handles multiple naming conventions)
          const extractCondition = (cond: any, cidx: number, groupIdx: number) => {
            // Get raw entity value - could be number (from API) or string
            const rawEntity = cond.entityType || cond.entity_type || cond.entity || '';
            // Convert number to string if needed
            const entityValue = typeof rawEntity === 'number'
              ? (entityTypeMap[rawEntity] || '')
              : String(rawEntity).toUpperCase();

            const fieldValue = cond.field || cond.Field || cond.fieldName || cond.field_name || '';
            // Convert operator to uppercase (API returns lowercase like "equals")
            const rawOperator = cond.operator || cond.Operator || cond.op || '';
            const operatorValue = String(rawOperator).toUpperCase();
            const valueValue = cond.value || cond.Value || cond.val || '';

            return {
              id: `${groupIdx + 1}-${cidx + 1}`,
              entity: entityValue,
              field: fieldValue,
              operator: operatorValue,
              value: valueValue,
            };
          };

          if (criteria.groups && Array.isArray(criteria.groups) && criteria.groups.length > 0) {
            const groups = criteria.groups.map((group: any, idx: number) => {
              // Get logic operator and convert to uppercase
              const rawLogic = group.logicalOperator || group.logical_operator || group.LogicalOperator || 'AND';
              const logic = String(rawLogic).toUpperCase() as 'AND' | 'OR';
              return {
                id: String(idx + 1),
                logic,
                conditions: group.conditions && group.conditions.length > 0
                  ? group.conditions.map((cond: any, cidx: number) => extractCondition(cond, cidx, idx))
                  : [{ id: `${idx + 1}-1`, entity: '', field: '', operator: '', value: '' }],
              };
            });
            campaignState.setCampaignConditionGroups(groups);
          } else if (criteria.conditions && Array.isArray(criteria.conditions)) {
            // Handle flat structure (conditions at root level without groups)
            const groups = [{
              id: '1',
              logic: 'AND' as const,
              conditions: criteria.conditions.map((cond: any, cidx: number) => extractCondition(cond, cidx, 0)),
            }];
            campaignState.setCampaignConditionGroups(groups);
          } else {
            // Reset to empty condition if no valid criteria
            campaignState.setCampaignConditionGroups([
              { id: '1', logic: 'AND', conditions: [{ id: '1-1', entity: '', field: '', operator: '', value: '' }] }
            ]);
          }
        } catch (e) {
          console.error('Failed to parse criteria JSON:', e, 'Raw value:', editingCampaignData.criteriaJson);
          campaignState.setCampaignConditionGroups([
            { id: '1', logic: 'AND', conditions: [{ id: '1-1', entity: '', field: '', operator: '', value: '' }] }
          ]);
        }
      } else if (editingCampaignData.recipientListType === 'STATIC') {
        // For static lists, reset criteria to default empty state
        campaignState.setCampaignConditionGroups([
          { id: '1', logic: 'AND', conditions: [{ id: '1-1', entity: '', field: '', operator: '', value: '' }] }
        ]);
      }
    }
  }, [editingCampaignData, campaignState.activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate recipients list when editing a static campaign
  useEffect(() => {
    if (
      editingCampaignRecipients &&
      editingCampaignData?.recipientListType === 'STATIC' &&
      campaignState.activeTab === 'edit-campaign' &&
      editingCampaignData.id === lastPopulatedCampaignId.current
    ) {
      const contacts = editingCampaignRecipients.map((recipient) => ({
        id: recipient.contact.id,
        name: `${recipient.contact.firstName || ''} ${recipient.contact.lastName || ''}`.trim(),
        firstName: recipient.contact.firstName,
        lastName: recipient.contact.lastName,
        email: recipient.contact.email,
        phone: recipient.contact.phone,
        role: recipient.contact.role,
      }));
      campaignState.setRecipientList(contacts);
    }
  }, [editingCampaignRecipients, editingCampaignData?.recipientListType, editingCampaignData?.id, campaignState.activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form when switching to new campaign
  const handleNewCampaign = () => {
    // Clear URL edit param if present
    if (editCampaignIdFromUrl) {
      router.push('/email-helper');
    }
    resetFormState();
    campaignState.setEditingCampaignId(null);
    campaignState.setActiveTab('new-campaign');
  };

  // Handle editing a campaign - updates URL
  const handleEditCampaign = (campaignId: string) => {
    // Reset form before navigating
    resetFormState();
    // Update URL with edit parameter
    router.push(`/email-helper?edit=${campaignId}`);
    campaignState.setEditingCampaignId(campaignId);
    campaignState.setActiveTab('edit-campaign');
  };

  // Transform API campaigns to UI format
  const campaigns: Campaign[] = useMemo(() => {
    if (!campaignsData?.records) return [];
    return campaignsData.records.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      subject: '', // Subject is not returned in landing page query
      recipients: campaign.recipientsCount,
      status: mapCampaignStatus(campaign.status),
      sentCount: campaign.sentCount,
      createdDate: campaign.createdAt,
      recipientListType: campaign.recipientListType,
      progress: campaign.progress,
    }));
  }, [campaignsData]);

  // Handle campaign actions
  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaignMutation.mutateAsync(campaignId);
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await pauseCampaignMutation.mutateAsync(campaignId);
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await resumeCampaignMutation.mutateAsync(campaignId);
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
  };

  // Handle AI modal
  const handleGenerateWithAI = () => {
    console.log('Generating with AI:', {
      context: campaignState.aiContext,
      prompt: campaignState.aiPrompt
    });
    campaignState.setShowAIModal(false);
    campaignState.setAIPrompt('');
  };

  const handleCloseAIModal = () => {
    campaignState.setShowAIModal(false);
    campaignState.setAIPrompt('');
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6 relative">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Email Flow</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button className="p-2 rounded bg-white shadow-sm" title="List View">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button
              onClick={handleNewCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-[var(--border)]">
        <div className="flex gap-2">
          <TabButton
            active={campaignState.activeTab === 'campaigns'}
            onClick={() => campaignState.setActiveTab('campaigns')}
            label="Campaigns"
          />
          <TabButton
            active={campaignState.activeTab === 'new-campaign'}
            onClick={handleNewCampaign}
            label="New Campaign"
          />
          {campaignState.activeTab === 'edit-campaign' && (
            <TabButton
              active={true}
              onClick={() => {}}
              label="Edit Campaign"
            />
          )}
          {/* <TabButton
            active={campaignState.activeTab === 'rules'}
            onClick={() => campaignState.setActiveTab('rules')}
            label="Rules"
          />
          <TabButton
            active={campaignState.activeTab === 'new-rule'}
            onClick={() => campaignState.setActiveTab('new-rule')}
            label="New Rule"
          /> */}
        </div>
      </div>

      {/* Content Area */}
      {campaignState.activeTab === 'campaigns' && (
        <>
          {campaignsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
              <span className="ml-3 text-[var(--muted-foreground)]">Loading campaigns...</span>
            </div>
          )}
          {campaignsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Failed to load campaigns. Please try again.
            </div>
          )}
          {!campaignsLoading && !campaignsError && (
            <CampaignsListView
              campaigns={campaigns}
              onDelete={handleDeleteCampaign}
              onPause={handlePauseCampaign}
              onResume={handleResumeCampaign}
              onEdit={handleEditCampaign}
            />
          )}
        </>
      )}

      {campaignState.activeTab === 'new-campaign' && (
        <NewCampaignView
          campaignState={campaignState}
          onCancel={() => campaignState.setActiveTab('campaigns')}
          onSuccess={() => campaignState.setActiveTab('campaigns')}
        />
      )}

      {campaignState.activeTab === 'edit-campaign' && (
        <>
          {editingCampaignLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
              <span className="ml-3 text-[var(--muted-foreground)]">Loading campaign...</span>
            </div>
          ) : (
            <NewCampaignView
              campaignState={campaignState}
              onCancel={() => {
                router.push('/email-helper');
                resetFormState();
                campaignState.setEditingCampaignId(null);
                campaignState.setActiveTab('campaigns');
              }}
              onSuccess={() => {
                router.push('/email-helper');
                resetFormState();
                campaignState.setEditingCampaignId(null);
                campaignState.setActiveTab('campaigns');
              }}
              onDelete={campaignState.editingCampaignId ? async () => {
                if (confirm('Are you sure you want to delete this campaign?')) {
                  try {
                    await deleteCampaignMutation.mutateAsync(campaignState.editingCampaignId!);
                    router.push('/email-helper');
                    resetFormState();
                    campaignState.setEditingCampaignId(null);
                    campaignState.setActiveTab('campaigns');
                  } catch (error) {
                    console.error('Failed to delete campaign:', error);
                    alert('Failed to delete campaign. Please try again.');
                  }
                }
              } : undefined}
              editMode={true}
              campaignId={campaignState.editingCampaignId || undefined}
            />
          )}
        </>
      )}

      {campaignState.activeTab === 'rules' && (
        <RulesListView rules={mockRules} />
      )}

      {campaignState.activeTab === 'new-rule' && (
        <NewRuleView
          ruleState={ruleState}
          onOpenAIModal={() => {
            campaignState.setAIContext('rule');
            campaignState.setShowAIModal(true);
          }}
          onCancel={() => campaignState.setActiveTab('rules')}
        />
      )}

      {/* AI Generation Modal */}
      <AIModal
        show={campaignState.showAIModal}
        context={campaignState.aiContext}
        prompt={campaignState.aiPrompt}
        onPromptChange={campaignState.setAIPrompt}
        onGenerate={handleGenerateWithAI}
        onClose={handleCloseAIModal}
      />
    </main>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'border-[var(--primary)] text-[var(--primary)]'
          : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
      }`}
    >
      {label}
    </button>
  );
}
