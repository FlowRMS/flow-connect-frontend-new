/**
 * Campaigns Content Component - Main Container
 * Production-ready implementation with real API integration
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCampaignState } from './hooks/useCampaignState';
import { useCampaignsListState } from './hooks/useCampaignsListState';
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
  useCampaign,
  useCampaignRecipients,
  useDeleteCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useStartCampaignSending,
  useEmailProviders,
  useCreateCampaign,
} from './api';
import CampaignStatusModal from './modals/CampaignStatusModal';
import { mapAPIToListType } from './types';
import { campaignToasts } from '../lib/toast';
import AdvancedFilters from '../AdvancedFilters';
import SortButton from '../SortButton';
import { getCampaignFilterOptions, getCampaignSortOptions } from './config/filterConfig';

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

  // Check if we should poll (when on campaigns tab and there are active campaigns)
  const shouldPoll = campaignState.activeTab === 'campaigns';

  // Campaigns list state with filtering and sorting
  // Fetch campaigns from API with background polling every 15 seconds when viewing list
  const campaignsListState = useCampaignsListState(shouldPoll ? 15000 : undefined);

  // Campaign mutations
  const deleteCampaignMutation = useDeleteCampaign();
  const pauseCampaignMutation = usePauseCampaign();
  const resumeCampaignMutation = useResumeCampaign();
  const startCampaignMutation = useStartCampaignSending();
  const createCampaignMutation = useCreateCampaign();

  // Status modal state
  const [statusModalCampaign, setStatusModalCampaign] = useState<{ id: string; name: string } | null>(null);

  // Check email providers
  const { data: emailProviders } = useEmailProviders();
  const hasEmailProvider = emailProviders?.o365ConnectionStatus?.isConnected || emailProviders?.gmailConnectionStatus?.isConnected;

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

  // Use campaigns from list state (already filtered and sorted by server)
  const campaigns: Campaign[] = campaignsListState.campaigns;

  // Handle campaign actions
  const handleDeleteCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaignMutation.mutateAsync(campaignId);
        campaignToasts.deleteSuccess(campaign?.name || 'Campaign');
      } catch (error) {
        console.error('Failed to delete campaign:', error);
        const errorMessage = error instanceof Error ? error.message : undefined;
        campaignToasts.deleteError(errorMessage);
      }
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    try {
      await pauseCampaignMutation.mutateAsync(campaignId);
      campaignToasts.pauseSuccess(campaign?.name || 'Campaign');
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      const errorMessage = error instanceof Error ? error.message : undefined;
      campaignToasts.pauseError(errorMessage);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    try {
      await resumeCampaignMutation.mutateAsync(campaignId);
      campaignToasts.resumeSuccess(campaign?.name || 'Campaign');
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      const errorMessage = error instanceof Error ? error.message : undefined;
      campaignToasts.resumeError(errorMessage);
    }
  };

  // Handle start campaign
  const handleStartCampaign = async (campaignId: string) => {
    if (!hasEmailProvider) {
      campaignToasts.noEmailProvider();
      return;
    }

    const campaign = campaigns.find(c => c.id === campaignId);
    try {
      await startCampaignMutation.mutateAsync(campaignId);
      campaignToasts.startSuccess(campaign?.name || 'Campaign');
      // Show status modal
      if (campaign) {
        setStatusModalCampaign({ id: campaignId, name: campaign.name });
      }
    } catch (error) {
      console.error('Failed to start campaign:', error);
      const errorMessage = error instanceof Error ? error.message : undefined;
      campaignToasts.startError(errorMessage);
    }
  };

  // Handle view status
  const handleViewStatus = (campaignId: string, campaignName: string) => {
    setStatusModalCampaign({ id: campaignId, name: campaignName });
  };

  // Handle status modal close
  const handleCloseStatusModal = () => {
    setStatusModalCampaign(null);
  };

  // Generate clone name with proper numbering (Clone 1, Clone 2, etc.)
  const generateCloneName = (originalName: string): string => {
    // Check if the name already has a clone pattern
    const clonePattern = /^(.+?)\s*-\s*Clone\s*(\d+)?$/i;
    const match = originalName.match(clonePattern);

    let baseName: string;
    if (match) {
      // If it's already a clone, use the base name
      baseName = match[1].trim();
    } else {
      baseName = originalName;
    }

    // Find existing clones of this campaign
    const existingClones = campaigns.filter(c => {
      const namePattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-\\s*Clone\\s*(\\d+)?$`, 'i');
      return namePattern.test(c.name) || c.name === `${baseName} - Clone`;
    });

    // Determine the next clone number
    let maxCloneNum = 0;
    existingClones.forEach(c => {
      const numMatch = c.name.match(/Clone\s*(\d+)$/i);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num > maxCloneNum) maxCloneNum = num;
      } else if (c.name.toLowerCase().endsWith('clone')) {
        // "Clone" without number counts as 1
        if (maxCloneNum < 1) maxCloneNum = 1;
      }
    });

    return `${baseName} - Clone ${maxCloneNum + 1}`;
  };

  // Transform criteria from backend format (snake_case) to API format (camelCase)
  const transformCriteriaForClone = (rawCriteria: any): import('./api').CampaignCriteria | undefined => {
    if (!rawCriteria) return undefined;

    // Map entity_type number to string (backend uses enum numbers)
    const entityTypeMap: Record<number, string> = {
      1: 'JOB',
      2: 'COMPANY',
      3: 'CONTACT',
      4: 'TASK',
    };

    const transformCondition = (cond: any): import('./api').CriteriaCondition => {
      // Get entity type - could be number or string
      const rawEntity = cond.entityType || cond.entity_type || cond.entity || '';
      const entityType = (typeof rawEntity === 'number'
        ? (entityTypeMap[rawEntity] || 'CONTACT')
        : String(rawEntity).toUpperCase()) as import('./api').CriteriaCondition['entityType'];

      // Get operator and ensure uppercase
      const rawOperator = cond.operator || cond.Operator || 'EQUALS';
      const operator = String(rawOperator).toUpperCase() as import('./api').CriteriaCondition['operator'];

      return {
        entityType,
        field: cond.field || cond.Field || '',
        operator,
        value: cond.value || cond.Value || '',
      };
    };

    const transformGroup = (group: any) => {
      // Get logic operator - handle both snake_case and camelCase
      const rawLogic = group.logicalOperator || group.logical_operator || group.LogicalOperator || 'AND';
      const logicalOperator = String(rawLogic).toUpperCase() as 'AND' | 'OR';

      return {
        logicalOperator,
        conditions: (group.conditions || []).map(transformCondition),
      };
    };

    // Handle groups array
    if (rawCriteria.groups && Array.isArray(rawCriteria.groups)) {
      const rawGroupOp = rawCriteria.groupOperator || rawCriteria.group_operator || 'AND';
      const groupOperator = String(rawGroupOp).toUpperCase() as 'AND' | 'OR';
      return {
        groups: rawCriteria.groups.map(transformGroup),
        groupOperator,
      };
    }

    // Handle flat conditions array (legacy format)
    if (rawCriteria.conditions && Array.isArray(rawCriteria.conditions)) {
      return {
        groups: [{
          logicalOperator: 'AND' as const,
          conditions: rawCriteria.conditions.map(transformCondition),
        }],
        groupOperator: 'AND' as const,
      };
    }

    return undefined;
  };

  // Handle clone campaign
  const handleCloneCampaign = async (campaignId: string) => {
    try {
      // Fetch the full campaign details
      const campaignToClone = await import('./api').then(api => api.fetchCampaign(campaignId));

      if (!campaignToClone) {
        campaignToasts.cloneError('Could not find campaign to clone');
        return;
      }

      // Fetch recipients if it's a static campaign
      let staticContactIds: string[] | undefined;
      if (campaignToClone.recipientListType === 'STATIC') {
        const recipients = await import('./api').then(api => api.fetchCampaignRecipients(campaignId));
        staticContactIds = recipients.map(r => r.contactId);
      }

      // Parse and transform criteria if available
      let criteria;
      if (campaignToClone.criteriaJson && campaignToClone.recipientListType !== 'STATIC') {
        try {
          const rawCriteria = JSON.parse(campaignToClone.criteriaJson);
          criteria = transformCriteriaForClone(rawCriteria);
        } catch (e) {
          console.error('Failed to parse criteria JSON for clone:', e);
        }
      }

      // Generate new name
      const cloneName = generateCloneName(campaignToClone.name);

      // Create the cloned campaign
      const input = {
        name: cloneName,
        recipientListType: campaignToClone.recipientListType,
        description: campaignToClone.description || '',
        emailSubject: campaignToClone.emailSubject,
        emailBody: campaignToClone.emailBody,
        aiPersonalizationEnabled: campaignToClone.aiPersonalizationEnabled,
        sendPace: campaignToClone.sendPace,
        maxEmailsPerDay: campaignToClone.maxEmailsPerDay,
        sendImmediately: false, // Always start clones as draft
        staticContactIds,
        criteria,
      };

      const newCampaign = await createCampaignMutation.mutateAsync(input);
      campaignToasts.cloneSuccess(cloneName);

      // Navigate to edit the new campaign
      handleEditCampaign(newCampaign.id);
    } catch (error) {
      console.error('Failed to clone campaign:', error);
      const errorMessage = error instanceof Error ? error.message : undefined;
      campaignToasts.cloneError(errorMessage);
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
            <SortButton
              sortOptions={getCampaignSortOptions()}
              onMultiSortChange={campaignsListState.handleMultiSortChange}
              activeSorts={campaignsListState.activeSorts}
            />
            <AdvancedFilters
              filterOptions={getCampaignFilterOptions(campaignsListState.uniqueStatuses, campaignsListState.uniqueNames)}
              activeFilters={campaignsListState.activeFilters}
              onFiltersChange={campaignsListState.handleFiltersChange}
            />
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
              label="View Campaign"
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
          {campaignsListState.isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
              <span className="ml-3 text-[var(--muted-foreground)]">Loading campaigns...</span>
            </div>
          )}
          {campaignsListState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Failed to load campaigns. Please try again.
            </div>
          )}
          {!campaignsListState.isLoading && !campaignsListState.error && (
            <CampaignsListView
              campaigns={campaigns}
              onDelete={handleDeleteCampaign}
              onPause={handlePauseCampaign}
              onResume={handleResumeCampaign}
              onEdit={handleEditCampaign}
              onStart={handleStartCampaign}
              onViewStatus={handleViewStatus}
              onClone={handleCloneCampaign}
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
              onClone={campaignState.editingCampaignId ? () => handleCloneCampaign(campaignState.editingCampaignId!) : undefined}
              editMode={true}
              campaignId={campaignState.editingCampaignId || undefined}
              campaignStatus={editingCampaignData ? mapCampaignStatus(editingCampaignData.status) : undefined}
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

      {/* Campaign Status Modal */}
      {statusModalCampaign && (
        <CampaignStatusModal
          campaignId={statusModalCampaign.id}
          campaignName={statusModalCampaign.name}
          isOpen={true}
          onClose={handleCloseStatusModal}
          onStatusChange={() => {
            // Refetch campaigns list when status changes
          }}
        />
      )}
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
