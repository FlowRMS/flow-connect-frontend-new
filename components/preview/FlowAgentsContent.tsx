'use client';

import React, { useState } from 'react';
import AgentConfigModal from './AgentConfigModal';

// Agent data
const agents = [
  {
    id: 'order-status',
    name: 'Order Status Concierge',
    category: 'Customer Service',
    color: 'blue',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13" rx="2"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    headline: 'Proactive order updates without lifting a finger',
    description: 'Monitors shipments across all manufacturers and automatically drafts customer updates before they ask "where\'s my order?"',
    benefits: [
      { label: 'Monitors all carriers', color: 'blue' },
      { label: 'Drafts email updates', color: 'purple' },
      { label: 'Flags delays early', color: 'orange' },
    ],
  },
  {
    id: 'commission-recovery',
    name: 'Commission Recovery Agent',
    category: 'Revenue',
    color: 'green',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    headline: 'Find commissions you didn\'t know you were owed',
    description: 'Continuously scans statements for missing or incorrect payments and prepares claim documentation with supporting evidence.',
    benefits: [
      { label: 'Scans all statements', color: 'emerald' },
      { label: 'Builds claim packages', color: 'green' },
      { label: 'Tracks resolution', color: 'orange' },
    ],
  },
  {
    id: 'quote-cross-reference',
    name: 'Quote & Cross-Reference',
    category: 'Quoting',
    color: 'purple',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M8 13h8M8 17h5"/>
      </svg>
    ),
    headline: 'Extract and cross-reference from any document',
    description: 'Pulls line items from specs, submittals, and PDFs. Suggests approved equivalents and flags pricing discrepancies.',
    benefits: [
      { label: 'Reads PDFs & specs', color: 'purple' },
      { label: 'Suggests equivalents', color: 'blue' },
      { label: 'Validates pricing', color: 'emerald' },
    ],
  },
  {
    id: 'account-brief',
    name: 'Account Brief & Call Prep',
    category: 'Sales',
    color: 'orange',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/>
        <path d="M12 17v4"/>
        <path d="M6 8h4M6 11h8"/>
      </svg>
    ),
    headline: 'One-page account brief before every call',
    description: 'Generates a summary with recent orders, open issues, pricing history, and key contacts—ready before your call starts.',
    benefits: [
      { label: 'Auto-generated', color: 'orange' },
      { label: 'Recent activity', color: 'blue' },
      { label: 'Open issues', color: 'red' },
    ],
  },
  {
    id: 'inside-sales-followup',
    name: 'Inside Sales Follow-Up',
    category: 'Sales',
    color: 'cyan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M22 7l-10 7L2 7"/>
      </svg>
    ),
    headline: 'Surface stalled deals and draft follow-ups',
    description: 'Identifies requests that have gone quiet, unanswered emails, and overdue follow-ups. Drafts responses ready for review.',
    benefits: [
      { label: 'Finds stalled deals', color: 'cyan' },
      { label: 'Drafts responses', color: 'purple' },
      { label: 'Priority queue', color: 'orange' },
    ],
  },
  {
    id: 'data-intake',
    name: 'Data Intake & Cleanup',
    category: 'Operations',
    color: 'slate',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
        <path d="M14 13l2 2-2 2"/>
        <path d="M18 15h-4"/>
      </svg>
    ),
    headline: 'Normalize messy data from any source',
    description: 'Takes manufacturer spreadsheets, PDFs, and POS files in any format and normalizes them. Flags anomalies and duplicates.',
    benefits: [
      { label: 'Any format', color: 'slate' },
      { label: 'Auto-normalize', color: 'blue' },
      { label: 'Flags issues', color: 'orange' },
    ],
  },
  {
    id: 'territory-credit',
    name: 'Territory & Credit Logic',
    category: 'Commissions',
    color: 'red',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a8 8 0 018 8c0 5.25-8 12-8 12S4 15.25 4 10a8 8 0 018-8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    headline: 'Explain and defend credit decisions',
    description: 'Applies your territory rules to flag potential disputes and generates documentation explaining credit logic.',
    benefits: [
      { label: 'Applies your rules', color: 'red' },
      { label: 'Flags disputes', color: 'orange' },
      { label: 'Auto documentation', color: 'emerald' },
    ],
  },
];

const iconBgColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  slate: 'bg-slate-200 text-slate-600',
  red: 'bg-rose-100 text-rose-600',
};

const chipColors: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  red: 'bg-rose-100 text-rose-700 border-rose-200',
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function FlowAgentsContent() {
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[0] | null>(null);

  return (
    <div className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Preview Banner - Top */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="px-8 py-2.5 flex items-center gap-3 text-sm">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">!</span>
          <p className="text-amber-800">
            <strong>Preview:</strong> Flow Agents are in development. This page shows planned functionality.
          </p>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Flow Agents
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
              Preview
            </span>
          </div>
          <p className="text-[var(--muted-foreground)] max-w-2xl">
            AI assistants that work around the clock—monitoring your data, surfacing issues, and preparing the information you need before you ask.
          </p>
        </div>

        {/* Value Props Row */}
        <div className="flex items-center gap-8 mb-8 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span className="text-sm text-[var(--foreground)]">24/7 monitoring across all manufacturers</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span className="text-sm text-[var(--foreground)]">Proactive alerts before problems escalate</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span className="text-sm text-[var(--foreground)]">Draft emails and documents ready for review</span>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="text-left bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Card Content */}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${iconBgColors[agent.color]}`}>
                    {agent.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      {agent.category}
                    </p>
                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-tight">
                      {agent.name}
                    </h3>
                  </div>
                </div>

                {/* Headline */}
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  {agent.headline}
                </p>

                {/* Description */}
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  {agent.description}
                </p>

                {/* Benefits Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {agent.benefits.map((benefit, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded border ${chipColors[benefit.color]}`}
                    >
                      {benefit.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)] flex items-center justify-end">
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] group-hover:text-[var(--primary)]">
                  <span>Configure</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedAgent && (
        <AgentConfigModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
