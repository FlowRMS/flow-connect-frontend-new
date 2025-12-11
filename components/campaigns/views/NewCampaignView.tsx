/**
 * New Campaign View Component
 * Fully integrated with Campaign API
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Contact, RuleConditionGroup } from '../types';
import { mapListTypeToAPI, mapSendPaceToAPI } from '../types';
import ConditionBuilder from '../components/ConditionBuilder';
import StaticListBuilder from '../components/StaticListBuilder';
import { SEND_PACE_OPTIONS } from '../constants';
import {
  useCreateCampaign,
  useUpdateCampaign,
  useEstimateRecipients,
  useSendTestEmail,
  useEmailProviders,
  type CampaignCriteria,
  type CriteriaCondition,
  type EstimateSampleContact,
} from '../api';
import { campaignToasts } from '../../lib/toast';

// Dynamically import RichTextEditor to avoid SSR issues with Tiptap
const RichTextEditor = dynamic(() => import('../components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[280px] border border-[var(--border)] rounded-md bg-[var(--background)] animate-pulse" />
  ),
});

interface NewCampaignViewProps {
  campaignState: any;
  onCancel?: () => void;
  onSuccess?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  editMode?: boolean;
  campaignId?: string;
  campaignStatus?: 'Draft' | 'Scheduled' | 'Sending' | 'Completed' | 'Paused';
}

export default function NewCampaignView({
  campaignState,
  onCancel,
  onSuccess,
  onDelete,
  onClone,
  editMode = false,
  campaignId,
  campaignStatus,
}: NewCampaignViewProps) {
  // Determine if campaign is read-only (Sending, Completed, or Paused status)
  const isReadOnly = campaignStatus === 'Sending' || campaignStatus === 'Completed' || campaignStatus === 'Paused';
  // For Sending, allow name/description edits only
  const isSending = campaignStatus === 'Sending';
  // For Paused, also allow name/description edits
  const isPaused = campaignStatus === 'Paused';
  // Can clone if Sending, Completed, or Paused
  const canClone = isReadOnly;
  // Local state for form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailError, setTestEmailError] = useState<string | null>(null);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);

  // API hooks
  const createCampaignMutation = useCreateCampaign();
  const updateCampaignMutation = useUpdateCampaign();
  const sendTestEmailMutation = useSendTestEmail();

  // Check email providers
  const { data: emailProviders, isLoading: emailProvidersLoading } = useEmailProviders();
  const hasEmailProvider = emailProviders?.o365ConnectionStatus?.isConnected || emailProviders?.gmailConnectionStatus?.isConnected;
  const connectedEmail = emailProviders?.o365ConnectionStatus?.isConnected
    ? emailProviders.o365ConnectionStatus.microsoftEmail
    : emailProviders?.gmailConnectionStatus?.googleEmail;

  // Build criteria from condition groups for API
  const buildCriteriaFromGroups = useCallback((groups: RuleConditionGroup[]): CampaignCriteria | null => {
    const validGroups = groups.filter(group =>
      group.conditions.some(c => c.entity && c.field && c.operator)
    );

    if (validGroups.length === 0) return null;

    return {
      groups: validGroups.map(group => ({
        logicalOperator: group.logic,
        conditions: group.conditions
          .filter(c => c.entity && c.field && c.operator)
          .map(c => ({
            entityType: c.entity as CriteriaCondition['entityType'],
            field: c.field,
            operator: c.operator as CriteriaCondition['operator'],
            value: c.value,
          })),
      })),
      // Multiple groups are combined with OR (each group is an alternative set of conditions)
      // When you click "Add OR condition group", groups should be OR'd together
      groupOperator: validGroups.length > 1 ? 'OR' as const : 'AND' as const,
    };
  }, []);

  // Get criteria for estimate
  const criteria = useMemo(() => {
    if (campaignState.listType === 'static') return null;
    return buildCriteriaFromGroups(campaignState.campaignConditionGroups);
  }, [campaignState.listType, campaignState.campaignConditionGroups, buildCriteriaFromGroups]);

  // Estimate recipients for criteria-based/dynamic campaigns
  const { data: estimateData, isLoading: estimateLoading } = useEstimateRecipients(criteria);

  // Convert sampleContacts from API to Contact type for display
  const estimatedRecipients: Contact[] = useMemo(() => {
    if (!estimateData?.sampleContacts) return [];
    return estimateData.sampleContacts.map((contact: EstimateSampleContact) => ({
      id: contact.id,
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone,
      role: contact.role,
      territory: contact.territory,
      tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tags,
    }));
  }, [estimateData?.sampleContacts]);

  // Sample recipients for display - simply use estimatedRecipients from the API
  const sampleRecipients = estimatedRecipients;

  // Handle form submission
  const handleCreateCampaign = async (saveAsDraft = false) => {
    if (!campaignState.campaignName.trim()) {
      campaignToasts.validationError('Please enter a campaign name');
      return;
    }

    // Check email provider for non-draft campaigns
    if (!saveAsDraft && !hasEmailProvider) {
      campaignToasts.noEmailProvider();
      return;
    }

    // Only require these fields for non-draft campaigns
    if (!saveAsDraft) {
      if (!campaignState.emailSubject.trim()) {
        campaignToasts.validationError('Please enter an email subject');
        return;
      }

      if (!campaignState.emailBody.trim()) {
        campaignToasts.validationError('Please enter email body content');
        return;
      }

      // Validate recipients based on list type
      if (campaignState.listType === 'static') {
        if (campaignState.recipientList.length === 0) {
          campaignToasts.validationError('Please select at least one recipient');
          return;
        }
      } else {
        if (!criteria || criteria.groups.length === 0) {
          campaignToasts.validationError('Please define at least one condition');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const input = {
        name: campaignState.campaignName,
        recipientListType: mapListTypeToAPI(campaignState.listType),
        description: campaignState.campaignDescription || '',
        emailSubject: campaignState.emailSubject || '',
        emailBody: campaignState.emailBody || '',
        aiPersonalizationEnabled: campaignState.useAIPersonalization,
        sendPace: mapSendPaceToAPI(campaignState.sendPace),
        maxEmailsPerDay: campaignState.maxPerDay,
        sendImmediately: saveAsDraft ? false : campaignState.sendImmediately,
        scheduledAt: !saveAsDraft && !campaignState.sendImmediately && campaignState.scheduledDate
          ? new Date(`${campaignState.scheduledDate}T${campaignState.scheduledTime || '09:00'}`).toISOString()
          : undefined,
        staticContactIds: campaignState.listType === 'static'
          ? campaignState.recipientList.map((c: Contact) => c.id)
          : undefined,
        criteria: campaignState.listType !== 'static' ? criteria || undefined : undefined,
      };

      if (editMode && campaignId) {
        await updateCampaignMutation.mutateAsync({ id: campaignId, input });
        campaignToasts.updateSuccess(campaignState.campaignName);
      } else {
        await createCampaignMutation.mutateAsync(input);
        if (saveAsDraft) {
          campaignToasts.savedAsDraft(campaignState.campaignName);
        } else {
          campaignToasts.createSuccess(campaignState.campaignName);
        }
      }
      onSuccess?.();
    } catch (error) {
      console.error(`Failed to ${editMode ? 'update' : 'create'} campaign:`, error);
      const errorMessage = error instanceof Error ? error.message : undefined;
      if (editMode) {
        campaignToasts.updateError(errorMessage);
      } else {
        campaignToasts.createError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle test email
  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setTestEmailError('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail.trim())) {
      setTestEmailError('Please enter a valid email address');
      return;
    }

    setTestEmailError(null);
    setTestEmailSuccess(false);
    setIsSendingTestEmail(true);

    try {
      // If we're in edit mode and have a campaign ID, send test email directly
      if (editMode && campaignId) {
        await sendTestEmailMutation.mutateAsync({
          campaignId,
          testEmail: testEmail.trim(),
        });
        setTestEmailSuccess(true);
        campaignToasts.testEmailSuccess(testEmail.trim());
        setTimeout(() => {
          setShowTestEmailModal(false);
          setTestEmail('');
          setTestEmailSuccess(false);
        }, 2000);
      } else {
        // In create mode, we need to save as draft first to get a campaign ID
        if (!campaignState.campaignName.trim()) {
          setTestEmailError('Please enter a campaign name before sending a test email');
          setIsSendingTestEmail(false);
          return;
        }

        // Build input for draft creation
        const input = {
          name: campaignState.campaignName,
          recipientListType: mapListTypeToAPI(campaignState.listType),
          description: campaignState.campaignDescription || '',
          emailSubject: campaignState.emailSubject || '',
          emailBody: campaignState.emailBody || '',
          aiPersonalizationEnabled: campaignState.useAIPersonalization,
          sendPace: mapSendPaceToAPI(campaignState.sendPace),
          maxEmailsPerDay: campaignState.maxPerDay,
          sendImmediately: false,
          staticContactIds: campaignState.listType === 'static'
            ? campaignState.recipientList.map((c: Contact) => c.id)
            : undefined,
          criteria: campaignState.listType !== 'static' ? criteria || undefined : undefined,
        };

        // Create campaign as draft first
        const newCampaign = await createCampaignMutation.mutateAsync(input);
        campaignToasts.savedAsDraft(campaignState.campaignName);

        // Now send the test email
        await sendTestEmailMutation.mutateAsync({
          campaignId: newCampaign.id,
          testEmail: testEmail.trim(),
        });

        setTestEmailSuccess(true);
        campaignToasts.testEmailSuccess(testEmail.trim());
        setTimeout(() => {
          setShowTestEmailModal(false);
          setTestEmail('');
          setTestEmailSuccess(false);
          // Redirect to edit mode with the new campaign
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send test email. Please try again.';
      setTestEmailError(errorMessage);
      setTestEmailSuccess(false);
      campaignToasts.testEmailError(errorMessage);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleCancel = () => {
    onCancel?.() ?? campaignState.setActiveTab('campaigns');
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Campaign Configuration */}
      <div className="col-span-8 space-y-6">
        {/* Email Provider Warning */}
        {!emailProvidersLoading && !hasEmailProvider && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">Email Provider Required</h4>
              <p className="text-sm text-amber-700 mt-1">
                Please connect O365 or Gmail before creating a campaign. Go to <strong>Settings &gt; Integrations</strong> to connect your email provider.
              </p>
            </div>
          </div>
        )}

        {/* Connected Email Info */}
        {!emailProvidersLoading && hasEmailProvider && connectedEmail && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800">
              Emails will be sent from: <strong>{connectedEmail}</strong>
            </span>
          </div>
        )}

        {/* Read-Only Banner for Sending/Completed/Paused */}
        {isReadOnly && (
          <div className={`rounded-lg p-4 flex items-start gap-3 ${
            campaignStatus === 'Sending'
              ? 'bg-blue-50 border border-blue-200'
              : campaignStatus === 'Paused'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              campaignStatus === 'Sending' ? 'text-blue-600' : campaignStatus === 'Paused' ? 'text-amber-600' : 'text-gray-600'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {campaignStatus === 'Sending' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : campaignStatus === 'Paused' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
            <div className="flex-1">
              <h4 className={`font-medium ${
                campaignStatus === 'Sending' ? 'text-blue-800' : campaignStatus === 'Paused' ? 'text-amber-800' : 'text-gray-800'
              }`}>
                {campaignStatus === 'Sending' ? 'Campaign is Currently Sending' : campaignStatus === 'Paused' ? 'Campaign is Paused' : 'Campaign Completed'}
              </h4>
              <p className={`text-sm mt-1 ${
                campaignStatus === 'Sending' ? 'text-blue-700' : campaignStatus === 'Paused' ? 'text-amber-700' : 'text-gray-700'
              }`}>
                {campaignStatus === 'Sending'
                  ? 'You can only edit the campaign name and description while the campaign is sending. All other fields are locked.'
                  : campaignStatus === 'Paused'
                    ? 'You can only edit the campaign name and description while the campaign is paused. All other fields are locked.'
                    : 'This campaign has completed. You can view the details but cannot make changes. Use the Clone button to create a copy.'
                }
              </p>
            </div>
            {canClone && onClone && (
              <button
                type="button"
                onClick={onClone}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Clone Campaign
              </button>
            )}
          </div>
        )}

        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            {editMode ? 'View Campaign' : 'Campaign Configuration'}
          </h2>

          {/* Campaign Name - Always editable except when Completed */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={campaignState.campaignName}
              onChange={(e) => campaignState.setCampaignName(e.target.value)}
              placeholder="e.g., Q1 Product Launch"
              disabled={campaignStatus === 'Completed'}
              className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] ${
                campaignStatus === 'Completed' ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
              }`}
            />
          </div>

          {/* Campaign Description - Always editable except when Completed */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Description
            </label>
            <input
              type="text"
              value={campaignState.campaignDescription}
              onChange={(e) => campaignState.setCampaignDescription(e.target.value)}
              placeholder="Brief description of the campaign..."
              disabled={campaignStatus === 'Completed'}
              className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] ${
                campaignStatus === 'Completed' ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
              }`}
            />
          </div>

          {/* List Type Selection */}
          <div className={`mb-6 ${isReadOnly ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Recipient List Type
              </label>
              {!isReadOnly && (
                <button
                  onClick={() => {
                    campaignState.setAIContext('campaign');
                    campaignState.setShowAIModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate with AI
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => !isReadOnly && campaignState.setListType('static')}
                disabled={isReadOnly}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  campaignState.listType === 'static'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
              >
                <div className="font-medium mb-1">Static List</div>
                <div className="text-xs opacity-75">Manually select recipients</div>
              </button>
              <button
                onClick={() => !isReadOnly && campaignState.setListType('criteria')}
                disabled={isReadOnly}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  campaignState.listType === 'criteria'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
              >
                <div className="font-medium mb-1">Criteria-Based</div>
                <div className="text-xs opacity-75">Filter by conditions</div>
              </button>
              <button
                onClick={() => !isReadOnly && campaignState.setListType('dynamic')}
                disabled={isReadOnly}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  campaignState.listType === 'dynamic'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
              >
                <div className="font-medium mb-1">Dynamic Rules</div>
                <div className="text-xs opacity-75">Auto-updating list</div>
              </button>
            </div>

            {/* Static List */}
            {campaignState.listType === 'static' && (
              <StaticListBuilder
                searchQuery={campaignState.searchQuery}
                setSearchQuery={campaignState.setSearchQuery}
                selectedCompanies={campaignState.selectedCompanies}
                setSelectedCompanies={campaignState.setSelectedCompanies}
                selectedTypes={campaignState.selectedTypes}
                setSelectedTypes={campaignState.setSelectedTypes}
                selectedTags={campaignState.selectedTags}
                setSelectedTags={campaignState.setSelectedTags}
                selectedContactIds={campaignState.selectedContactIds}
                setSelectedContactIds={campaignState.setSelectedContactIds}
                openDropdown={campaignState.openDropdown}
                setOpenDropdown={campaignState.setOpenDropdown}
                recipientList={campaignState.recipientList}
                addToRecipientList={campaignState.addToRecipientList}
                addMultipleToRecipientList={campaignState.addMultipleToRecipientList}
                clearRecipientList={campaignState.clearRecipientList}
                clearAllFilters={campaignState.clearAllFilters}
              />
            )}

            {/* Criteria or Dynamic */}
            {(campaignState.listType === 'criteria' || campaignState.listType === 'dynamic') && (
              <div className="border border-[var(--border)] rounded-lg p-4">
                {campaignState.listType === 'dynamic' && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-green-900">
                        <strong>Dynamic rules enabled:</strong> This list is automatically evaluated daily and recipients are added/removed based on the rules below.
                      </div>
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Define {campaignState.listType === 'criteria' ? 'Criteria' : 'Rules'}
                  </label>
                </div>
                <ConditionBuilder
                  conditionGroups={campaignState.campaignConditionGroups}
                  onAddCondition={campaignState.addCampaignCondition}
                  onRemoveCondition={campaignState.removeCampaignCondition}
                  onUpdateCondition={campaignState.updateCampaignCondition}
                  onAddConditionGroup={campaignState.addCampaignConditionGroup}
                  onRemoveConditionGroup={campaignState.removeCampaignConditionGroup}
                  onUpdateGroupLogic={campaignState.updateCampaignGroupLogic}
                />
              </div>
            )}
          </div>

          {/* Email Subject */}
          <div className={`mb-4 ${isReadOnly ? 'opacity-60' : ''}`}>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={campaignState.emailSubject}
              onChange={(e) => campaignState.setEmailSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] ${
                isReadOnly ? 'cursor-not-allowed bg-gray-50' : ''
              }`}
            />
          </div>

          {/* Email Body - Rich Text Editor */}
          <div className={`mb-4 ${isReadOnly ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Email Body <span className="text-red-500">*</span>
              </label>
              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHtmlMode(!isHtmlMode)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      isHtmlMode
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                    }`}
                  >
                    {isHtmlMode ? 'HTML Mode' : 'Visual Mode'}
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mb-2">
              Use {'{{first_name}}'}, {'{{last_name}}'}, {'{{email}}'} for personalization
            </div>

            {/* Editor / Textarea */}
            {isHtmlMode ? (
              <textarea
                value={campaignState.emailBody}
                onChange={(e) => campaignState.setEmailBody(e.target.value)}
                placeholder="<html>&#10;<body>&#10;  <p>Hello {{first_name}},</p>&#10;  <p>Your email content here...</p>&#10;</body>&#10;</html>"
                rows={12}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none bg-[var(--background)] font-mono ${
                  isReadOnly ? 'cursor-not-allowed bg-gray-50' : ''
                }`}
              />
            ) : (
              <div className={isReadOnly ? 'pointer-events-none' : ''}>
                <RichTextEditor
                  content={campaignState.emailBody}
                  onChange={campaignState.setEmailBody}
                  placeholder="Hello {{first_name}}, write your email content here..."
                />
              </div>
            )}
          </div>

          {/* AI Personalization */}
          <div className={`mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md ${isReadOnly ? 'opacity-60' : ''}`}>
            <input
              type="checkbox"
              id="campaign-ai-personalization"
              checked={campaignState.useAIPersonalization}
              onChange={(e) => campaignState.setUseAIPersonalization(e.target.checked)}
              disabled={isReadOnly}
              className={`w-4 h-4 accent-[var(--primary)] ${isReadOnly ? 'cursor-not-allowed' : ''}`}
            />
            <label htmlFor="campaign-ai-personalization" className={`text-sm text-blue-900 ${isReadOnly ? 'cursor-not-allowed' : ''}`}>
              Enable AI personalization per recipient
            </label>
          </div>

          {/* Send Pace */}
          <div className={`mb-4 ${isReadOnly ? 'opacity-60' : ''}`}>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Send Pace
            </label>
            <select
              value={campaignState.sendPace}
              onChange={(e) => campaignState.setSendPace(e.target.value)}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors appearance-none bg-[var(--background)] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat ${
                isReadOnly ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer'
              }`}
              style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
            >
              {SEND_PACE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Max Per Day */}
          <div className={`mb-6 ${isReadOnly ? 'opacity-60' : ''}`}>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Max Emails Per Day
            </label>
            <input
              type="number"
              value={campaignState.maxPerDay}
              onChange={(e) => campaignState.setMaxPerDay(parseInt(e.target.value) || 50)}
              min={1}
              max={1000}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] ${
                isReadOnly ? 'cursor-not-allowed bg-gray-50' : ''
              }`}
            />
          </div>

          {/* Schedule Section */}
          <div className={`mb-6 p-5 border border-[var(--border)] rounded-xl bg-gradient-to-br from-[var(--muted)]/30 to-[var(--muted)]/10 ${isReadOnly ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                When to Send
              </label>
            </div>
            <div className={`grid grid-cols-2 gap-3 mb-4 ${isReadOnly ? 'pointer-events-none' : ''}`}>
              <button
                type="button"
                onClick={() => !isReadOnly && campaignState.setSendImmediately(true)}
                disabled={isReadOnly}
                className={`relative px-4 py-3 text-sm rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  campaignState.sendImmediately
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium shadow-sm'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Send Immediately
                {campaignState.sendImmediately && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--primary)] rounded-full border-2 border-white"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => !isReadOnly && campaignState.setSendImmediately(false)}
                disabled={isReadOnly}
                className={`relative px-4 py-3 text-sm rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  !campaignState.sendImmediately
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium shadow-sm'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule for Later
                {!campaignState.sendImmediately && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--primary)] rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>

            {/* Enhanced Schedule inputs - shown when "Schedule for Later" is selected */}
            <div className={`transition-all duration-300 ${campaignState.sendImmediately ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="bg-[var(--background)] rounded-xl p-4 border border-[var(--border)]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)] mb-2">
                      <svg className="w-3.5 h-3.5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={campaignState.scheduledDate}
                        onChange={(e) => campaignState.setScheduledDate(e.target.value)}
                        disabled={campaignState.sendImmediately}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all cursor-pointer hover:border-[var(--primary)]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)] mb-2">
                      <svg className="w-3.5 h-3.5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Schedule Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={campaignState.scheduledTime}
                        onChange={(e) => campaignState.setScheduledTime(e.target.value)}
                        disabled={campaignState.sendImmediately}
                        className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all cursor-pointer hover:border-[var(--primary)]/50"
                      />
                    </div>
                  </div>
                </div>
                {!campaignState.sendImmediately && campaignState.scheduledDate && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Campaign will be sent on{' '}
                      <span className="font-medium text-[var(--foreground)]">
                        {new Date(`${campaignState.scheduledDate}T${campaignState.scheduledTime || '09:00'}`).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview & Test Section - Hide Send Test when read-only */}
          <div className="mb-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowEmailPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview Email
            </button>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setShowTestEmailModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                Send Test Email
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-center">
            {/* Show different buttons based on read-only state */}
            {isReadOnly ? (
              <>
                {/* For Sending/Paused campaigns - allow saving name/description changes */}
                {(isSending || isPaused) && (
                  <button
                    type="button"
                    onClick={() => handleCreateCampaign(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
                {/* Clone button for Sending, Completed, and Paused */}
                {canClone && onClone && (
                  <button
                    type="button"
                    onClick={onClone}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Clone Campaign
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Back to Campaigns
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCreateCampaign(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Campaign' : 'Create Campaign')}
                </button>
                {/* Save as Draft - only for new campaigns or Draft/Scheduled/Paused status */}
                {(!editMode || (campaignStatus && ['Draft', 'Scheduled', 'Paused'].includes(campaignStatus))) && (
                  <button
                    type="button"
                    onClick={() => handleCreateCampaign(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
                {/* Delete button - only show in edit mode and not read-only */}
                {editMode && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isSubmitting}
                    className="ml-auto px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete Campaign
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Info & Recipients */}
      <div className="col-span-4 space-y-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">About List Types</h3>
          <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <div>
              <strong className="text-[var(--foreground)]">Static List:</strong>
              <p className="mt-1">Manually select specific recipients. The list remains fixed once created.</p>
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Criteria-Based:</strong>
              <p className="mt-1">Define conditions to filter recipients. List is generated once at campaign creation.</p>
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Dynamic Rules:</strong>
              <p className="mt-1">Automatically evaluates rules daily. Recipients are added/removed based on current data.</p>
            </div>
          </div>
        </div>

        {campaignState.listType === 'static' && campaignState.recipientList.length > 0 && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Selected Recipients ({campaignState.recipientList.length})
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {campaignState.recipientList.map((contact: Contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-2 border border-[var(--border)] rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => campaignState.removeFromRecipientList(contact.id)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(campaignState.listType === 'criteria' || campaignState.listType === 'dynamic') && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Matching Recipients
              {estimateData?.count ? ` (${estimateData.count})` : ''}
            </h3>
            {estimateLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-2"></div>
                <div className="text-sm text-[var(--muted-foreground)]">Finding matching contacts...</div>
              </div>
            ) : !criteria ? (
              <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
                Define criteria to see matching recipients
              </div>
            ) : sampleRecipients.length === 0 && (estimateData?.count || 0) === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
                No contacts match your criteria
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {sampleRecipients.map((contact: Contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center p-2 border border-[var(--border)] rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                          {contact.role && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                              {contact.role}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {(estimateData?.count || 0) > sampleRecipients.length && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
                    +{(estimateData?.count || 0) - sampleRecipients.length} more recipients
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Test Email Modal */}
      {showTestEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Send Test Email</h3>

            {/* Success message */}
            {testEmailSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-800">Test email sent successfully!</span>
              </div>
            )}

            {/* Error message */}
            {testEmailError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800">{testEmailError}</span>
              </div>
            )}

            {/* Info message for create mode */}
            {!editMode && !campaignId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-blue-800">
                  Sending a test email will automatically save this campaign as a draft first.
                </span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => {
                  setTestEmail(e.target.value);
                  setTestEmailError(null);
                }}
                placeholder="Enter email address..."
                disabled={isSendingTestEmail || testEmailSuccess}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] disabled:opacity-50"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowTestEmailModal(false);
                  setTestEmailError(null);
                  setTestEmailSuccess(false);
                }}
                disabled={isSendingTestEmail}
                className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail || testEmailSuccess}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSendingTestEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  'Send Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Email Preview</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">See how your email will appear to recipients</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-auto p-4">
              {/* Email Header Info */}
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-[var(--muted-foreground)] w-16 flex-shrink-0">From:</span>
                    <span className="text-sm text-[var(--foreground)]">Your Campaign &lt;noreply@yourcompany.com&gt;</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-[var(--muted-foreground)] w-16 flex-shrink-0">To:</span>
                    <span className="text-sm text-[var(--foreground)]">
                      {campaignState.listType === 'static' && campaignState.recipientList.length > 0
                        ? `${campaignState.recipientList[0]?.name || 'John Doe'} <${campaignState.recipientList[0]?.email || 'john@example.com'}>`
                        : 'John Doe <john@example.com>'
                      }
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-[var(--muted-foreground)] w-16 flex-shrink-0">Subject:</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {campaignState.emailSubject || '(No subject)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="border border-[var(--border)] rounded-lg bg-white min-h-[300px]">
                <div className="p-6">
                  {campaignState.emailBody ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: campaignState.emailBody
                          .replace(/\{\{first_name\}\}/g, campaignState.listType === 'static' && campaignState.recipientList[0]?.firstName ? campaignState.recipientList[0].firstName : 'John')
                          .replace(/\{\{last_name\}\}/g, campaignState.listType === 'static' && campaignState.recipientList[0]?.lastName ? campaignState.recipientList[0].lastName : 'Doe')
                          .replace(/\{\{email\}\}/g, campaignState.listType === 'static' && campaignState.recipientList[0]?.email ? campaignState.recipientList[0].email : 'john@example.com')
                      }}
                    />
                  ) : (
                    <div className="text-center py-12 text-[var(--muted-foreground)]">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No email content yet</p>
                      <p className="text-sm mt-1">Add content to the email body to see a preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personalization Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <strong>Personalization Preview:</strong> Variables like {'{{first_name}}'}, {'{{last_name}}'}, and {'{{email}}'}
                    {campaignState.listType === 'static' && campaignState.recipientList.length > 0
                      ? ` are shown with data from the first recipient (${campaignState.recipientList[0]?.name}).`
                      : ' are shown with sample data (John Doe).'}
                    {campaignState.useAIPersonalization && ' AI personalization will further customize content for each recipient.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
              <div className="text-xs text-[var(--muted-foreground)]">
                {campaignState.listType === 'static'
                  ? `${campaignState.recipientList.length} recipients selected`
                  : estimateData?.count
                    ? `~${estimateData.count} matching recipients`
                    : 'Recipients based on criteria'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailPreview(false);
                    setShowTestEmailModal(true);
                  }}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(false)}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
