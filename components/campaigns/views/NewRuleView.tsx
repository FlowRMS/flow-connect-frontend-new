/**
 * New Rule View Component
 */

import React from 'react';
import ConditionBuilder from '../components/ConditionBuilder';
import { SEND_PACE_OPTIONS } from '../constants';

interface NewRuleViewProps {
  ruleState: any;
  onOpenAIModal: () => void;
  onCancel: () => void;
}

export default function NewRuleView({ ruleState, onOpenAIModal, onCancel }: NewRuleViewProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Rule Configuration */}
      <div className="col-span-8 space-y-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Rule Configuration</h2>

          {/* Rule Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Rule Name
            </label>
            <input
              type="text"
              placeholder="e.g., New Contact Welcome Email"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>

          {/* Trigger Conditions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Trigger When
              </label>
              <button
                onClick={onOpenAIModal}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
              </button>
            </div>

            <ConditionBuilder
              conditionGroups={ruleState.ruleConditionGroups}
              onAddCondition={ruleState.addCondition}
              onRemoveCondition={ruleState.removeCondition}
              onUpdateCondition={ruleState.updateCondition}
              onAddConditionGroup={ruleState.addConditionGroup}
              onRemoveConditionGroup={ruleState.removeConditionGroup}
              onUpdateGroupLogic={ruleState.updateGroupLogic}
            />
          </div>

          {/* Communication Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Communication Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => ruleState.setCommunicationType('email')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  ruleState.communicationType === 'email'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => ruleState.setCommunicationType('notification')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  ruleState.communicationType === 'notification'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                }`}
              >
                Notification
              </button>
              <button
                onClick={() => ruleState.setCommunicationType('both')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  ruleState.communicationType === 'both'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Audience Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Audience
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => ruleState.setIsInternalCommunication(false)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  !ruleState.isInternalCommunication
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                }`}
              >
                External
              </button>
              <button
                onClick={() => ruleState.setIsInternalCommunication(true)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  ruleState.isInternalCommunication
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                }`}
              >
                Internal
              </button>
            </div>
          </div>

          {/* Email Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {ruleState.communicationType === 'notification' ? 'Notification Title' : 'Email Subject'}
            </label>
            <input
              type="text"
              placeholder={ruleState.communicationType === 'notification' ? 'Enter notification title' : 'Enter email subject'}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>

          {/* Email Body / Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {ruleState.communicationType === 'notification' ? 'Message' : 'Email Body'}
            </label>
            <textarea
              rows={10}
              placeholder={ruleState.communicationType === 'notification' ? 'Compose your notification message...' : 'Compose your email...'}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none bg-[var(--background)]"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Use variables: {'{name}'}, {'{company}'}, {'{email}'}, {'{phone}'}
            </p>
          </div>

          {/* AI Personalization */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={ruleState.useAIPersonalization}
              onChange={(e) => ruleState.setUseAIPersonalization(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)]"
            />
            <label className="text-sm text-[var(--foreground)]">
              Use AI to personalize each email
            </label>
          </div>

          {/* Send Pace */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Send Pace
            </label>
            <select
              value={ruleState.sendPace}
              onChange={(e) => ruleState.setSendPace(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[var(--background)] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
              style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
            >
              {SEND_PACE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Max Emails Per Day */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Max Emails Per Day
            </label>
            <input
              type="number"
              value={ruleState.maxPerDay}
              onChange={(e) => ruleState.setMaxPerDay(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              Activate Rule
            </button>
            <button className="px-4 py-2 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
              Save as Draft
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Rule Info */}
      <div className="col-span-4 space-y-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">About Rules</h3>
          <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <p>
              Rules automatically send emails when specific triggers occur, unlike campaigns which are one-time sends.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Examples:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Welcome new contacts</li>
              <li>Follow up on won/lost jobs</li>
              <li>Re-engage inactive contacts</li>
              <li>Send birthday wishes</li>
            </ul>
            <p>
              Rules can be paused or activated at any time from the Rules tab.
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Best Practices</h3>
          <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>✓ Test with a small group first</p>
            <p>✓ Use personalization variables</p>
            <p>✓ Set reasonable send limits</p>
            <p>✓ Monitor engagement metrics</p>
            <p>✓ Review and update regularly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
