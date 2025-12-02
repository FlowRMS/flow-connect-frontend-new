/**
 * Campaigns Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React from 'react';
import { useCampaignState } from './hooks/useCampaignState';
import { useRuleState } from './hooks/useRuleState';
import { campaigns as mockCampaigns, rules as mockRules, availableContacts } from './mockData';
import CampaignsListView from './views/CampaignsListView';
import RulesListView from './views/RulesListView';
import NewCampaignView from './views/NewCampaignView';
import NewRuleView from './views/NewRuleView';
import AIModal from './modals/AIModal';
import type { TabType } from './types';

export default function CampaignsContent() {
  // Campaign state management
  const campaignState = useCampaignState();
  
  // Rule state management
  const ruleState = useRuleState();

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
              onClick={() => campaignState.setActiveTab('new-campaign')}
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
            onClick={() => campaignState.setActiveTab('new-campaign')}
            label="New Campaign"
          />
          <TabButton 
            active={campaignState.activeTab === 'rules'}
            onClick={() => campaignState.setActiveTab('rules')}
            label="Rules"
          />
          <TabButton 
            active={campaignState.activeTab === 'new-rule'}
            onClick={() => campaignState.setActiveTab('new-rule')}
            label="New Rule"
          />
        </div>
      </div>

      {/* Content Area */}
      {campaignState.activeTab === 'campaigns' && (
        <CampaignsListView campaigns={mockCampaigns} />
      )}

      {campaignState.activeTab === 'new-campaign' && (
        <NewCampaignView
          campaignState={campaignState}
          availableContacts={availableContacts}
        />
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
