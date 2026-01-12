'use client';

import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: React.ReactNode;
  headline: string;
  description: string;
  benefits: { label: string; color: string }[];
}

interface AgentConfigModalProps {
  agent: Agent;
  onClose: () => void;
}

const colorClasses: Record<string, { text: string; light: string; bg: string }> = {
  blue: { text: 'text-blue-600', light: 'bg-blue-50', bg: 'bg-blue-500' },
  green: { text: 'text-emerald-600', light: 'bg-emerald-50', bg: 'bg-emerald-500' },
  purple: { text: 'text-purple-600', light: 'bg-purple-50', bg: 'bg-purple-500' },
  orange: { text: 'text-orange-600', light: 'bg-orange-50', bg: 'bg-orange-500' },
  cyan: { text: 'text-cyan-600', light: 'bg-cyan-50', bg: 'bg-cyan-500' },
  slate: { text: 'text-slate-600', light: 'bg-slate-100', bg: 'bg-slate-500' },
  red: { text: 'text-rose-600', light: 'bg-rose-50', bg: 'bg-rose-500' },
};

// Agent-specific configuration options
const agentConfigs: Record<string, {
  triggers: { id: string; label: string; description: string }[];
  actions: { id: string; label: string; description: string }[];
  settings: { id: string; label: string; type: 'toggle' | 'select' | 'number'; options?: string[]; default?: string | number | boolean }[];
  directives: {
    instructions: { placeholder: string; default: string };
    examples: string[];
    contextFields: { id: string; label: string; placeholder: string }[];
  };
}> = {
  'order-status': {
    triggers: [
      { id: 'shipment-update', label: 'Shipment status changes', description: 'When tracking info updates from any carrier' },
      { id: 'delay-detected', label: 'Delay detected', description: 'When estimated delivery exceeds original date' },
      { id: 'delivery-confirmed', label: 'Delivery confirmed', description: 'When package is marked as delivered' },
    ],
    actions: [
      { id: 'draft-email', label: 'Draft customer email', description: 'Prepare an email update for your review' },
      { id: 'update-order', label: 'Update order notes', description: 'Add tracking info to order record' },
      { id: 'notify-rep', label: 'Notify assigned rep', description: 'Send alert to the rep on the order' },
    ],
    settings: [
      { id: 'auto-send', label: 'Auto-send after review', type: 'toggle', default: false },
      { id: 'delay-threshold', label: 'Delay threshold (days)', type: 'number', default: 2 },
      { id: 'email-tone', label: 'Email tone', type: 'select', options: ['Professional', 'Friendly', 'Brief'], default: 'Professional' },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for how the agent should communicate and prioritize...',
        default: 'When drafting emails, always include the order number and expected delivery date. For delays over 3 days, offer to escalate or provide alternatives.',
      },
      examples: [
        'Prioritize updates for orders over $10,000',
        'Always CC the sales rep on delay notifications',
        'Use customer\'s first name in email greetings',
      ],
      contextFields: [
        { id: 'signature', label: 'Email signature', placeholder: 'Best regards,\n[Your Name]\n[Company]' },
        { id: 'escalation-contact', label: 'Escalation contact', placeholder: 'Name or email for escalations' },
      ],
    },
  },
  'commission-recovery': {
    triggers: [
      { id: 'statement-received', label: 'New statement received', description: 'When a commission statement is uploaded' },
      { id: 'discrepancy-found', label: 'Discrepancy detected', description: 'When expected vs actual commission differs' },
      { id: 'claim-status', label: 'Claim status change', description: 'When manufacturer responds to a claim' },
    ],
    actions: [
      { id: 'flag-discrepancy', label: 'Flag for review', description: 'Add to discrepancy queue with details' },
      { id: 'generate-claim', label: 'Generate claim package', description: 'Prepare documentation for manufacturer' },
      { id: 'track-claim', label: 'Track open claims', description: 'Monitor and remind on pending claims' },
    ],
    settings: [
      { id: 'variance-threshold', label: 'Variance threshold (%)', type: 'number', default: 5 },
      { id: 'auto-flag', label: 'Auto-flag discrepancies', type: 'toggle', default: true },
      { id: 'claim-template', label: 'Claim template', type: 'select', options: ['Standard', 'Detailed', 'Summary'], default: 'Standard' },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for how the agent should analyze statements and build claims...',
        default: 'Focus on high-value discrepancies first. When building claim packages, always include the original PO, invoice, and commission rate documentation.',
      },
      examples: [
        'Ignore variances under $50 for small orders',
        'Flag split-ship situations for manual review',
        'Include customer payment history in dispute context',
      ],
      contextFields: [
        { id: 'claim-contact', label: 'Manufacturer claim contacts', placeholder: 'List manufacturer contacts for claims' },
        { id: 'rate-exceptions', label: 'Rate exceptions', placeholder: 'Note any special commission rate agreements' },
      ],
    },
  },
  'quote-cross-reference': {
    triggers: [
      { id: 'document-uploaded', label: 'Document uploaded', description: 'When a spec, submittal, or PDF is added' },
      { id: 'quote-created', label: 'Quote created', description: 'When a new quote is started' },
      { id: 'cross-ref-needed', label: 'Cross-reference requested', description: 'When user requests alternatives' },
    ],
    actions: [
      { id: 'extract-items', label: 'Extract line items', description: 'Pull product info from documents' },
      { id: 'suggest-crosses', label: 'Suggest cross-references', description: 'Find approved equivalents' },
      { id: 'validate-pricing', label: 'Validate pricing', description: 'Check against current price lists' },
    ],
    settings: [
      { id: 'auto-extract', label: 'Auto-extract on upload', type: 'toggle', default: true },
      { id: 'cross-ref-sources', label: 'Cross-reference sources', type: 'select', options: ['All manufacturers', 'Preferred only', 'Same manufacturer'], default: 'Preferred only' },
      { id: 'price-tolerance', label: 'Price variance alert (%)', type: 'number', default: 10 },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for how the agent should extract and cross-reference products...',
        default: 'When extracting line items, preserve the original spec language. Prefer equivalents from our top 3 manufacturers unless the customer has a stated preference.',
      },
      examples: [
        'Always flag items marked "no substitution"',
        'Include competitor pricing when available',
        'Note lead time differences in cross-reference suggestions',
      ],
      contextFields: [
        { id: 'preferred-manufacturers', label: 'Preferred manufacturers', placeholder: 'List manufacturers to prioritize for cross-references' },
        { id: 'excluded-products', label: 'Excluded products', placeholder: 'Products or lines to never suggest' },
      ],
    },
  },
  'account-brief': {
    triggers: [
      { id: 'calendar-event', label: 'Upcoming meeting', description: 'When a customer meeting is scheduled' },
      { id: 'manual-request', label: 'Manual request', description: 'When user requests a brief' },
      { id: 'daily-schedule', label: 'Daily briefings', description: 'Generate briefs each morning' },
    ],
    actions: [
      { id: 'generate-brief', label: 'Generate account brief', description: 'Create one-page summary' },
      { id: 'highlight-issues', label: 'Highlight open issues', description: 'Surface unresolved items' },
      { id: 'send-to-rep', label: 'Send to rep', description: 'Email brief to assigned rep' },
    ],
    settings: [
      { id: 'brief-depth', label: 'History depth', type: 'select', options: ['30 days', '60 days', '90 days', '1 year'], default: '90 days' },
      { id: 'include-financials', label: 'Include financials', type: 'toggle', default: true },
      { id: 'lead-time', label: 'Generate before meeting (hours)', type: 'number', default: 24 },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for what the agent should emphasize in account briefs...',
        default: 'Lead with the most important open issue or opportunity. Include decision-maker contact info and any recent communications. Note competitor activity if known.',
      },
      examples: [
        'Always mention payment status for accounts with AR issues',
        'Include project pipeline for construction accounts',
        'Highlight relationship tenure for long-term accounts',
      ],
      contextFields: [
        { id: 'key-talking-points', label: 'Standing talking points', placeholder: 'Topics to always include (e.g., new product lines, promotions)' },
        { id: 'sensitive-topics', label: 'Sensitive topics', placeholder: 'Issues to handle carefully or flag for attention' },
      ],
    },
  },
  'inside-sales-followup': {
    triggers: [
      { id: 'no-response', label: 'No response received', description: 'When email goes unanswered' },
      { id: 'stalled-quote', label: 'Quote goes stale', description: 'When quote has no activity' },
      { id: 'task-overdue', label: 'Task overdue', description: 'When follow-up task passes due date' },
    ],
    actions: [
      { id: 'draft-followup', label: 'Draft follow-up email', description: 'Prepare reminder for review' },
      { id: 'add-to-queue', label: 'Add to priority queue', description: 'Surface in daily task list' },
      { id: 'escalate', label: 'Escalate to manager', description: 'Alert manager of stalled item' },
    ],
    settings: [
      { id: 'followup-days', label: 'Days before follow-up', type: 'number', default: 3 },
      { id: 'max-attempts', label: 'Max follow-up attempts', type: 'number', default: 3 },
      { id: 'escalation-days', label: 'Days before escalation', type: 'number', default: 7 },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for how the agent should prioritize and draft follow-ups...',
        default: 'Prioritize quotes by value, then by age. Draft follow-ups that reference the original request specifically. Vary messaging on subsequent attempts.',
      },
      examples: [
        'For quotes over $25k, follow up more aggressively',
        'Mention upcoming price increases when relevant',
        'Reference any previous relationship history',
      ],
      contextFields: [
        { id: 'follow-up-templates', label: 'Follow-up phrases', placeholder: 'Preferred language for follow-ups (e.g., "Just checking in...", "Wanted to circle back...")' },
        { id: 'exclusion-rules', label: 'Do not follow up', placeholder: 'Accounts or situations to skip (e.g., "On hold accounts")' },
      ],
    },
  },
  'data-intake': {
    triggers: [
      { id: 'file-uploaded', label: 'File uploaded', description: 'When spreadsheet or PDF is added' },
      { id: 'email-attachment', label: 'Email attachment', description: 'When data file arrives via email' },
      { id: 'scheduled-import', label: 'Scheduled import', description: 'On configured schedule' },
    ],
    actions: [
      { id: 'normalize-data', label: 'Normalize data', description: 'Convert to standard format' },
      { id: 'flag-anomalies', label: 'Flag anomalies', description: 'Highlight unusual values' },
      { id: 'merge-duplicates', label: 'Identify duplicates', description: 'Find potential duplicate records' },
    ],
    settings: [
      { id: 'auto-process', label: 'Auto-process uploads', type: 'toggle', default: false },
      { id: 'duplicate-threshold', label: 'Duplicate match threshold (%)', type: 'number', default: 85 },
      { id: 'anomaly-sensitivity', label: 'Anomaly sensitivity', type: 'select', options: ['Low', 'Medium', 'High'], default: 'Medium' },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for how the agent should normalize and validate data...',
        default: 'Map common manufacturer column formats automatically. Flag negative values and unusually high quantities for review. Preserve original data in notes field.',
      },
      examples: [
        'Treat "N/A" and blank cells the same way',
        'Convert all dates to MM/DD/YYYY format',
        'Flag any commission rates above 15%',
      ],
      contextFields: [
        { id: 'column-mappings', label: 'Column name mappings', placeholder: 'Map manufacturer column names (e.g., "Cust #" → "Customer ID")' },
        { id: 'validation-rules', label: 'Validation rules', placeholder: 'Business rules for data validation' },
      ],
    },
  },
  'territory-credit': {
    triggers: [
      { id: 'new-order', label: 'New order received', description: 'When order is created or imported' },
      { id: 'credit-dispute', label: 'Credit disputed', description: 'When credit assignment is questioned' },
      { id: 'rule-change', label: 'Territory rule change', description: 'When territory definitions update' },
    ],
    actions: [
      { id: 'apply-rules', label: 'Apply territory rules', description: 'Determine credit assignment' },
      { id: 'generate-docs', label: 'Generate documentation', description: 'Create credit explanation' },
      { id: 'flag-conflicts', label: 'Flag conflicts', description: 'Highlight overlapping claims' },
    ],
    settings: [
      { id: 'auto-assign', label: 'Auto-assign credit', type: 'toggle', default: false },
      { id: 'conflict-alert', label: 'Alert on conflicts', type: 'toggle', default: true },
      { id: 'documentation-level', label: 'Documentation detail', type: 'select', options: ['Summary', 'Standard', 'Detailed'], default: 'Standard' },
    ],
    directives: {
      instructions: {
        placeholder: 'Add custom instructions for how the agent should apply territory rules and resolve conflicts...',
        default: 'Apply territory rules in order of specificity: named accounts first, then zip code, then state. When conflicts arise, document both claims and flag for manager review.',
      },
      examples: [
        'House accounts always get credited to the house',
        'Split credit 50/50 when ship-to and bill-to are different territories',
        'Give credit to the rep who quoted the job originally',
      ],
      contextFields: [
        { id: 'territory-hierarchy', label: 'Territory priority rules', placeholder: 'Define how to resolve overlapping territories' },
        { id: 'special-accounts', label: 'Special account rules', placeholder: 'Named accounts with non-standard credit rules' },
      ],
    },
  },
};

export default function AgentConfigModal({ agent, onClose }: AgentConfigModalProps) {
  const [enabled, setEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'triggers' | 'actions' | 'directives' | 'settings'>('triggers');
  const [enabledTriggers, setEnabledTriggers] = useState<Set<string>>(new Set(['shipment-update', 'delay-detected']));
  const [enabledActions, setEnabledActions] = useState<Set<string>>(new Set(['draft-email', 'update-order']));
  const [instructions, setInstructions] = useState('');

  const colors = colorClasses[agent.color] || colorClasses.blue;
  const config = agentConfigs[agent.id] || agentConfigs['order-status'];

  const toggleTrigger = (id: string) => {
    setEnabledTriggers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAction = (id: string) => {
    setEnabledActions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.light} ${colors.text}`}>
              {agent.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{agent.name}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{agent.headline}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Enable Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  enabled ? colors.bg : 'bg-[var(--border)]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {(['triggers', 'actions', 'directives', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? `text-[var(--primary)] border-b-2 border-[var(--primary)]`
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab === 'triggers' && 'When to Run'}
              {tab === 'actions' && 'What to Do'}
              {tab === 'directives' && 'Directives'}
              {tab === 'settings' && 'Settings'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'triggers' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Select which events should trigger this agent to run.
              </p>
              {config.triggers.map((trigger) => (
                <label
                  key={trigger.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    enabledTriggers.has(trigger.id)
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledTriggers.has(trigger.id)}
                    onChange={() => toggleTrigger(trigger.id)}
                    className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{trigger.label}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{trigger.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Choose what the agent should do when triggered.
              </p>
              {config.actions.map((action) => (
                <label
                  key={action.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    enabledActions.has(action.id)
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledActions.has(action.id)}
                    onChange={() => toggleAction(action.id)}
                    className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{action.label}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{action.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'directives' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Custom Instructions</label>
                  <span className="text-xs text-[var(--muted-foreground)]">Guide how the agent thinks and acts</span>
                </div>
                <textarea
                  value={instructions || config.directives.instructions.default}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={config.directives.instructions.placeholder}
                  className="w-full h-28 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>

              {/* Example prompts */}
              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">Example Directives</p>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">Click to add to your instructions</p>
                <div className="flex flex-wrap gap-2">
                  {config.directives.examples.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInstructions(prev => prev ? `${prev}\n• ${example}` : `• ${example}`)}
                      className="px-3 py-1.5 text-xs bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-full border border-[var(--border)] transition-colors"
                    >
                      + {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context fields */}
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--foreground)] mb-1">Context & Reference Info</p>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">Provide information the agent can reference</p>
                <div className="space-y-4">
                  {config.directives.contextFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm text-[var(--foreground)] mb-1.5">{field.label}</label>
                      <textarea
                        placeholder={field.placeholder}
                        className="w-full h-20 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Configure how the agent behaves.
              </p>
              {config.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <label className="text-sm text-[var(--foreground)]">{setting.label}</label>
                  {setting.type === 'toggle' && (
                    <button
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        setting.default ? colors.bg : 'bg-[var(--border)]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          setting.default ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                  {setting.type === 'select' && (
                    <select
                      defaultValue={setting.default as string}
                      className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      {setting.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {setting.type === 'number' && (
                    <input
                      type="number"
                      defaultValue={setting.default as number}
                      className="w-20 px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <p className="text-xs text-[var(--muted-foreground)]">
            Changes are saved automatically
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
