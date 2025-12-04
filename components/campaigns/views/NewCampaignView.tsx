/**
 * New Campaign View Component
 */

import React from 'react';
import type { Contact } from '../types';
import ConditionBuilder from '../components/ConditionBuilder';
import StaticListBuilder from '../components/StaticListBuilder';
import { SEND_PACE_OPTIONS } from '../constants';

interface NewCampaignViewProps {
  campaignState: any;
  availableContacts: Contact[];
}

export default function NewCampaignView({ campaignState, availableContacts }: NewCampaignViewProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Campaign Configuration */}
      <div className="col-span-8 space-y-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Campaign Configuration</h2>

          {/* Campaign Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              placeholder="e.g., Q1 Product Launch"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>

          {/* List Type Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Recipient List Type
              </label>
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
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => campaignState.setListType('static')}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  campaignState.listType === 'static'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                }`}
              >
                <div className="font-medium mb-1">Static List</div>
                <div className="text-xs opacity-75">Manually select recipients</div>
              </button>
              <button
                onClick={() => campaignState.setListType('criteria')}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  campaignState.listType === 'criteria'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                }`}
              >
                <div className="font-medium mb-1">Criteria-Based</div>
                <div className="text-xs opacity-75">Filter by conditions</div>
              </button>
              <button
                onClick={() => campaignState.setListType('dynamic')}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  campaignState.listType === 'dynamic'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                }`}
              >
                <div className="font-medium mb-1">Dynamic Rules</div>
                <div className="text-xs opacity-75">Auto-updating list</div>
              </button>
            </div>

            {/* Static List */}
            {campaignState.listType === 'static' && (
              <StaticListBuilder
                availableContacts={availableContacts}
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={campaignState.emailSubject}
              onChange={(e) => campaignState.setEmailSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>

          {/* Email Body */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Email Body
            </label>
            <textarea
              value={campaignState.emailBody}
              onChange={(e) => campaignState.setEmailBody(e.target.value)}
              placeholder="Enter base email content... AI will personalize for each recipient."
              rows={12}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none bg-[var(--background)]"
            />
          </div>

          {/* AI Personalization */}
          <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <input
              type="checkbox"
              id="campaign-ai-personalization"
              checked={campaignState.useAIPersonalization}
              onChange={(e) => campaignState.setUseAIPersonalization(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)]"
            />
            <label htmlFor="campaign-ai-personalization" className="text-sm text-blue-900">
              Enable AI personalization per recipient
            </label>
          </div>

          {/* Send Pace */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Send Pace
            </label>
            <select
              value={campaignState.sendPace}
              onChange={(e) => campaignState.setSendPace(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[var(--background)] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
              style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
            >
              {SEND_PACE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Max Per Day */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Max Emails Per Day
            </label>
            <input
              type="number"
              value={campaignState.maxPerDay}
              onChange={(e) => campaignState.setMaxPerDay(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>

          {/* Schedule Section */}
          <div className="mb-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
              When to Send
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                className="px-4 py-2.5 text-sm rounded-lg border-2 border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium transition-all"
              >
                Send Immediately
              </button>
              <button
                className="px-4 py-2.5 text-sm rounded-lg border-2 border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-all"
              >
                Schedule for Later
              </button>
            </div>
            {/* Schedule inputs - shown when "Schedule for Later" is selected */}
            <div className="grid grid-cols-2 gap-3 opacity-50">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Date</label>
                <input
                  type="date"
                  disabled
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--background)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Time</label>
                <input
                  type="time"
                  disabled
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--background)]"
                />
              </div>
            </div>
          </div>

          {/* Preview & Test Section */}
          <div className="mb-6 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview Email
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Send Test Email
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              Create Campaign
            </button>
            <button className="px-4 py-2 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
              Save as Draft
            </button>
            <button
              onClick={() => campaignState.setActiveTab('campaigns')}
              className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
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
                  <button
                    onClick={() => campaignState.removeFromRecipientList(contact.id)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(campaignState.listType === 'criteria' || campaignState.listType === 'dynamic') && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Estimated Recipients</h3>
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-[var(--foreground)] mb-2">~45</div>
              <div className="text-sm text-[var(--muted-foreground)]">recipients match your criteria</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
