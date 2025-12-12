'use client';

import React, { useState } from 'react';
import BarChart from '../charts/BarChart';
import AdvancedFilters from './AdvancedFilters';

// Risk level type
type RiskLevel = 'green' | 'yellow' | 'red';

// Quote type for risk tracking
type RiskQuote = {
  customer: string;
  value: string;
  valueNum: number;
  stage: string;
  daysOld: number;
  daysSinceContact: number;
  rep: string;
  riskLevel: RiskLevel;
  riskReason?: string;
};

// Risk badge component
function RiskBadge({ level }: { level: RiskLevel }) {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };
  const labels = {
    green: 'On Track',
    yellow: 'At Risk',
    red: 'Critical'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[level]}`}>
      {labels[level]}
    </span>
  );
}

// Metric Card
function MetricCard({
  question,
  value,
  comparison,
  trend,
  insight
}: {
  question: string;
  value: string;
  comparison?: string;
  trend?: 'up' | 'down' | 'flat';
  insight?: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
      <div className="text-sm text-[var(--muted-foreground)] mb-2">{question}</div>
      <div className="text-3xl font-bold text-[var(--foreground)]">{value}</div>
      {comparison && (
        <div className={`text-sm mt-2 flex items-center gap-1 ${
          trend === 'up' ? 'text-[var(--success)]' :
          trend === 'down' ? 'text-[var(--destructive)]' :
          'text-[var(--muted-foreground)]'
        }`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {comparison}
        </div>
      )}
      {insight && (
        <div className="text-xs text-[var(--muted-foreground)] mt-2 pt-2 border-t border-[var(--border)]">
          {insight}
        </div>
      )}
    </div>
  );
}

export default function PipelineDashboard() {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  // Quote stages (after a formal quote is sent)
  const quoteStages = [
    { stage: 'Quote Sent', count: 45, value: '$6.8M', avgAge: '8 days' },
    { stage: 'Quote Reviewed', count: 32, value: '$5.2M', avgAge: '12 days' },
    { stage: 'Negotiation', count: 24, value: '$4.4M', avgAge: '18 days' },
    { stage: 'Verbal Commit', count: 18, value: '$3.2M', avgAge: '8 days' },
    { stage: 'Contract Sent', count: 12, value: '$2.1M', avgAge: '5 days' },
  ];

  // Quote stage chart data
  const quoteChartData = quoteStages.map(s => ({
    label: s.stage.split(' ')[0],
    value: parseFloat(s.value.replace(/[$M]/g, '')) * 1000
  }));

  // What's closing this quarter?
  const expectedCloses = [
    { month: 'This Month', committed: '$890K', bestCase: '$1.4M', pipeline: '$2.8M' },
    { month: 'Next Month', committed: '$450K', bestCase: '$1.1M', pipeline: '$3.2M' },
    { month: 'Month After', committed: '$120K', bestCase: '$680K', pipeline: '$2.4M' },
  ];

  // All quotes with risk classification
  const allQuotes: RiskQuote[] = [
    // Green - On track (new quotes, active engagement)
    { customer: 'Apex Manufacturing', value: '$234K', valueNum: 234000, stage: 'Quote Sent', daysOld: 2, daysSinceContact: 1, rep: 'Justin Partin', riskLevel: 'green' },
    { customer: 'Summit Energy', value: '$189K', valueNum: 189000, stage: 'Quote Sent', daysOld: 3, daysSinceContact: 2, rep: 'Billy Ingram', riskLevel: 'green' },
    { customer: 'Metro Systems', value: '$156K', valueNum: 156000, stage: 'Quote Reviewed', daysOld: 4, daysSinceContact: 3, rep: 'Lisa Kim', riskLevel: 'green' },
    { customer: 'Coastal Electric', value: '$412K', valueNum: 412000, stage: 'Negotiation', daysOld: 5, daysSinceContact: 4, rep: 'Jacobi Smith', riskLevel: 'green' },
    { customer: 'Pacific Grid', value: '$287K', valueNum: 287000, stage: 'Verbal Commit', daysOld: 6, daysSinceContact: 5, rep: 'David Carnaggio', riskLevel: 'green' },
    { customer: 'Urban Power', value: '$98K', valueNum: 98000, stage: 'Contract Sent', daysOld: 7, daysSinceContact: 6, rep: 'Eric Bush', riskLevel: 'green' },
    { customer: 'Delta Controls', value: '$345K', valueNum: 345000, stage: 'Quote Reviewed', daysOld: 8, daysSinceContact: 3, rep: 'Justin Partin', riskLevel: 'green' },
    { customer: 'Alpine Electric', value: '$178K', valueNum: 178000, stage: 'Negotiation', daysOld: 10, daysSinceContact: 4, rep: 'Billy Ingram', riskLevel: 'green' },
    { customer: 'Harbor Systems', value: '$267K', valueNum: 267000, stage: 'Verbal Commit', daysOld: 12, daysSinceContact: 5, rep: 'Lisa Kim', riskLevel: 'green' },
    // Yellow - At risk (15-30 days old OR 8-14 days since contact)
    { customer: 'Miller Electric', value: '$890K', valueNum: 890000, stage: 'Negotiation', daysOld: 18, daysSinceContact: 8, rep: 'Lisa Kim', riskLevel: 'yellow', riskReason: 'Quote aging' },
    { customer: 'Johnson Controls', value: '$445K', valueNum: 445000, stage: 'Quote Sent', daysOld: 16, daysSinceContact: 10, rep: 'Sarah Johnson', riskLevel: 'yellow', riskReason: 'Limited engagement' },
    { customer: 'Atlantic Grid', value: '$423K', valueNum: 423000, stage: 'Quote Reviewed', daysOld: 22, daysSinceContact: 6, rep: 'Mike Thompson', riskLevel: 'yellow', riskReason: 'Quote aging' },
    { customer: 'Green Power', value: '$312K', valueNum: 312000, stage: 'Negotiation', daysOld: 15, daysSinceContact: 9, rep: 'Emma Roberts', riskLevel: 'yellow', riskReason: 'Limited engagement' },
    { customer: 'Northern Electric', value: '$534K', valueNum: 534000, stage: 'Quote Reviewed', daysOld: 20, daysSinceContact: 7, rep: 'Justin Partin', riskLevel: 'yellow', riskReason: 'Quote aging' },
    { customer: 'Valley Systems', value: '$267K', valueNum: 267000, stage: 'Quote Sent', daysOld: 17, daysSinceContact: 11, rep: 'Billy Ingram', riskLevel: 'yellow', riskReason: 'Limited engagement' },
    { customer: 'Central Power', value: '$189K', valueNum: 189000, stage: 'Negotiation', daysOld: 25, daysSinceContact: 5, rep: 'David Carnaggio', riskLevel: 'yellow', riskReason: 'Quote aging' },
    // Red - Critical (>30 days old OR >14 days since contact)
    { customer: 'Turner Construction', value: '$1.2M', valueNum: 1200000, stage: 'Quote Sent', daysOld: 35, daysSinceContact: 21, rep: 'John Davis', riskLevel: 'red', riskReason: 'No response' },
    { customer: 'Coastal Builders', value: '$567K', valueNum: 567000, stage: 'Quote Reviewed', daysOld: 42, daysSinceContact: 18, rep: 'Mike Thompson', riskLevel: 'red', riskReason: 'Going stale' },
    { customer: 'TechCorp', value: '$234K', valueNum: 234000, stage: 'Negotiation', daysOld: 38, daysSinceContact: 16, rep: 'Emma Roberts', riskLevel: 'red', riskReason: 'No activity' },
    { customer: 'Industrial Solutions', value: '$678K', valueNum: 678000, stage: 'Quote Sent', daysOld: 31, daysSinceContact: 15, rep: 'Sarah Johnson', riskLevel: 'red', riskReason: 'Stalled' },
    { customer: 'Regional Power', value: '$456K', valueNum: 456000, stage: 'Quote Reviewed', daysOld: 45, daysSinceContact: 22, rep: 'Eric Bush', riskLevel: 'red', riskReason: 'Dead quote' },
  ];

  // New quotes this week
  const newQuotes = allQuotes.filter(q => q.daysOld <= 7);

  // Summary stats by risk level
  const riskSummary = {
    green: allQuotes.filter(q => q.riskLevel === 'green'),
    yellow: allQuotes.filter(q => q.riskLevel === 'yellow'),
    red: allQuotes.filter(q => q.riskLevel === 'red'),
  };

  const totalValue = (quotes: RiskQuote[]) =>
    quotes.reduce((sum, q) => sum + q.valueNum, 0);

  const formatValue = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    return `$${(num / 1000).toFixed(0)}K`;
  };

  // Filter quotes by risk level
  const filteredQuotes = riskFilter === 'all'
    ? allQuotes
    : allQuotes.filter(q => q.riskLevel === riskFilter);

  // Risk distribution chart data
  const riskDistributionData = [
    { label: 'On Track', value: riskSummary.green.length, color: '#22c55e' },
    { label: 'At Risk', value: riskSummary.yellow.length, color: '#eab308' },
    { label: 'Critical', value: riskSummary.red.length, color: '#ef4444' },
  ];

  const riskValueData = [
    { label: 'On Track', value: Math.round(totalValue(riskSummary.green) / 1000), color: '#22c55e' },
    { label: 'At Risk', value: Math.round(totalValue(riskSummary.yellow) / 1000), color: '#eab308' },
    { label: 'Critical', value: Math.round(totalValue(riskSummary.red) / 1000), color: '#ef4444' },
  ];

  // New quotes by week
  const newQuotesByWeek = [
    { label: 'Week 1', value: 8 },
    { label: 'Week 2', value: 12 },
    { label: 'Week 3', value: 6 },
    { label: 'Week 4', value: 11 },
  ];

  // Who has the healthiest quote pipeline?
  const repQuotes = [
    { rep: 'Justin Partin', quotes: 28, value: '$5.8M', avgAge: '14 days', closeRate: '38%', green: 5, yellow: 2, red: 0 },
    { rep: 'Billy Ingram', quotes: 22, value: '$4.1M', avgAge: '16 days', closeRate: '32%', green: 4, yellow: 2, red: 0 },
    { rep: 'Lisa Kim', quotes: 18, value: '$3.2M', avgAge: '12 days', closeRate: '35%', green: 3, yellow: 1, red: 0 },
    { rep: 'Jacobi Smith', quotes: 15, value: '$2.4M', avgAge: '10 days', closeRate: '40%', green: 2, yellow: 0, red: 0 },
    { rep: 'David Carnaggio', quotes: 12, value: '$1.8M', avgAge: '18 days', closeRate: '28%', green: 2, yellow: 1, red: 0 },
    { rep: 'Eric Bush', quotes: 10, value: '$1.2M', avgAge: '22 days', closeRate: '22%', green: 1, yellow: 0, red: 1 },
    { rep: 'Mike Thompson', quotes: 8, value: '$990K', avgAge: '28 days', closeRate: '18%', green: 0, yellow: 1, red: 1 },
    { rep: 'Emma Roberts', quotes: 6, value: '$546K', avgAge: '24 days', closeRate: '20%', green: 0, yellow: 1, red: 1 },
    { rep: 'Sarah Johnson', quotes: 5, value: '$1.1M', avgAge: '20 days', closeRate: '24%', green: 0, yellow: 1, red: 1 },
    { rep: 'John Davis', quotes: 3, value: '$1.2M', avgAge: '35 days', closeRate: '15%', green: 0, yellow: 0, red: 1 },
  ];

  // Why are we losing quotes?
  const lossReasons = [
    { reason: 'Price too high', count: 24, value: '$3.2M', pct: '32%' },
    { reason: 'Lost to competitor', count: 18, value: '$2.1M', pct: '24%' },
    { reason: 'No decision/Delayed', count: 15, value: '$1.8M', pct: '20%' },
    { reason: 'Budget cut', count: 12, value: '$1.2M', pct: '16%' },
    { reason: 'Spec changed', count: 6, value: '$450K', pct: '8%' },
  ];

  // Why quotes go critical
  const redReasons = [
    { reason: 'No customer response', count: 12, value: '$2.1M' },
    { reason: 'Quote too old (>30 days)', count: 8, value: '$1.4M' },
    { reason: 'Competition', count: 5, value: '$890K' },
    { reason: 'Budget issues', count: 3, value: '$456K' },
  ];

  // Quotes needing follow-up
  const quotesNeedingFollowUp = [
    { customer: 'Summit Energy', value: '$678K', stage: 'Quote Sent', daysSinceContact: 14, lastAction: 'Email sent' },
    { customer: 'Metro Electric', value: '$534K', stage: 'Quote Reviewed', daysSinceContact: 10, lastAction: 'Meeting held' },
    { customer: 'Atlantic Grid', value: '$423K', stage: 'Quote Sent', daysSinceContact: 8, lastAction: 'Quote delivered' },
    { customer: 'Green Power', value: '$312K', stage: 'Negotiation', daysSinceContact: 7, lastAction: 'Call' },
    { customer: 'Urban Electric', value: '$289K', stage: 'Quote Sent', daysSinceContact: 6, lastAction: 'Email sent' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quote Pipeline</h1>
          <p className="text-sm text-[var(--muted-foreground)]">For sales managers · What's at risk? What needs follow-up to close?</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'month'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setDateRange('quarter')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'quarter'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'year'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Year
            </button>
          </div>

          <AdvancedFilters
            filterOptions={[
              {
                id: 'rep',
                label: 'Sales Rep',
                type: 'multiselect',
                options: [
                  { value: 'justin', label: 'Justin Partin' },
                  { value: 'billy', label: 'Billy Ingram' },
                  { value: 'lisa', label: 'Lisa Kim' },
                  { value: 'jacobi', label: 'Jacobi Smith' },
                  { value: 'david', label: 'David Carnaggio' },
                ]
              },
              {
                id: 'stage',
                label: 'Quote Stage',
                type: 'multiselect',
                options: [
                  { value: 'sent', label: 'Quote Sent' },
                  { value: 'reviewed', label: 'Quote Reviewed' },
                  { value: 'negotiation', label: 'Negotiation' },
                  { value: 'verbal', label: 'Verbal Commit' },
                  { value: 'contract', label: 'Contract Sent' },
                ]
              },
              {
                id: 'value',
                label: 'Quote Value',
                type: 'range',
                options: [
                  { value: '0-100k', label: 'Under $100K' },
                  { value: '100k-500k', label: '$100K - $500K' },
                  { value: '500k-1m', label: '$500K - $1M' },
                  { value: '1m+', label: 'Over $1M' },
                ]
              },
              {
                id: 'age',
                label: 'Quote Age',
                type: 'range',
                options: [
                  { value: '0-7', label: 'Less than 7 days' },
                  { value: '7-14', label: '7-14 days' },
                  { value: '14-30', label: '14-30 days' },
                  { value: '30+', label: 'Over 30 days' },
                ]
              },
            ]}
            onApply={(filters) => console.log('Applied filters:', filters)}
            onSave={(name, filters) => console.log('Saved filter:', name, filters)}
          />

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          question="What's the total quoted value?"
          value="$21.7M"
          comparison="+$1.8M vs last quarter"
          trend="up"
          insight="131 active quotes"
        />
        <MetricCard
          question="What's our quote-to-win rate?"
          value="32%"
          comparison="-2% vs last quarter"
          trend="down"
          insight="42 of 131 quotes won"
        />
        <MetricCard
          question="Average days to close?"
          value="51 days"
          comparison="+6 days vs target"
          trend="down"
          insight="Goal: 45 days from quote"
        />
        <MetricCard
          question="New quotes this month?"
          value="37"
          comparison="+8 vs last month"
          trend="up"
          insight="$4.2M in new quotes"
        />
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setRiskFilter(riskFilter === 'green' ? 'all' : 'green')}
          className={`bg-[var(--card)] border rounded-lg p-5 text-left transition-all ${riskFilter === 'green' ? 'border-green-500 ring-2 ring-green-200' : 'border-[var(--border)] hover:border-green-300'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-[var(--foreground)]">On Track</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{riskSummary.green.length} quotes</div>
          <div className="text-sm text-[var(--muted-foreground)] mt-2">{formatValue(totalValue(riskSummary.green))} value</div>
        </button>

        <button
          onClick={() => setRiskFilter(riskFilter === 'yellow' ? 'all' : 'yellow')}
          className={`bg-[var(--card)] border rounded-lg p-5 text-left transition-all ${riskFilter === 'yellow' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-[var(--border)] hover:border-yellow-300'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm font-medium text-[var(--foreground)]">At Risk</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">{riskSummary.yellow.length} quotes</div>
          <div className="text-sm text-[var(--muted-foreground)] mt-2">{formatValue(totalValue(riskSummary.yellow))} value</div>
        </button>

        <button
          onClick={() => setRiskFilter(riskFilter === 'red' ? 'all' : 'red')}
          className={`bg-[var(--card)] border rounded-lg p-5 text-left transition-all ${riskFilter === 'red' ? 'border-red-500 ring-2 ring-red-200' : 'border-[var(--border)] hover:border-red-300'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-[var(--foreground)]">Critical</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{riskSummary.red.length} quotes</div>
          <div className="text-sm text-[var(--muted-foreground)] mt-2">{formatValue(totalValue(riskSummary.red))} value</div>
        </button>
      </div>

      {/* Pipeline by Stage and Forecast */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Where are quotes in the process?</h3>
          <div className="h-[200px]">
            <BarChart data={quoteChartData} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Values in thousands ($K) - Heavy at Quote Sent stage</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">What's closing this quarter?</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-[var(--muted-foreground)] uppercase pb-3">Period</th>
                  <th className="text-right text-xs font-medium text-[var(--muted-foreground)] uppercase pb-3">Committed</th>
                  <th className="text-right text-xs font-medium text-[var(--muted-foreground)] uppercase pb-3">Best Case</th>
                  <th className="text-right text-xs font-medium text-[var(--muted-foreground)] uppercase pb-3">Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {expectedCloses.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-sm font-medium text-[var(--foreground)]">{row.month}</td>
                    <td className="py-3 text-sm text-right text-[var(--success)] font-medium">{row.committed}</td>
                    <td className="py-3 text-sm text-right text-[var(--foreground)]">{row.bestCase}</td>
                    <td className="py-3 text-sm text-right text-[var(--muted-foreground)]">{row.pipeline}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[var(--border)]">
                <tr>
                  <td className="pt-3 text-sm font-bold text-[var(--foreground)]">Total</td>
                  <td className="pt-3 text-sm text-right font-bold text-[var(--success)]">$1.46M</td>
                  <td className="pt-3 text-sm text-right font-bold text-[var(--foreground)]">$3.18M</td>
                  <td className="pt-3 text-sm text-right font-bold text-[var(--muted-foreground)]">$8.4M</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* New Quotes This Week */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">What quotes came in this week?</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Stage</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Old</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {newQuotes.map((quote, idx) => (
                <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{quote.customer}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{quote.value}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.stage}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{quote.daysOld}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.rep}</td>
                  <td className="px-4 py-3"><RiskBadge level={quote.riskLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
          {newQuotes.length} new quotes worth {formatValue(totalValue(newQuotes))} this week - all on track
        </div>
      </div>

      {/* All Quotes by Risk Level */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]">
            {riskFilter === 'all' ? 'All Active Quotes' :
             riskFilter === 'green' ? 'On Track Quotes' :
             riskFilter === 'yellow' ? 'At Risk Quotes' : 'Critical Quotes'}
          </h3>
          {riskFilter !== 'all' && (
            <button
              onClick={() => setRiskFilter('all')}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Show all
            </button>
          )}
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)] sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Stage</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Old</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Since Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Risk Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredQuotes.map((quote, idx) => {
                const rowBg = quote.riskLevel === 'red' ? 'bg-red-50/50' :
                              quote.riskLevel === 'yellow' ? 'bg-yellow-50/50' : '';
                return (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${rowBg}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{quote.customer}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{quote.value}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.stage}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{quote.daysOld}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{quote.daysSinceContact}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.rep}</td>
                    <td className="px-4 py-3"><RiskBadge level={quote.riskLevel} /></td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.riskReason || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rep Pipeline Health and Why Quotes Go Critical */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Which reps have the healthiest pipelines?</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Quotes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-green-600 uppercase">On Track</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-yellow-600 uppercase">At Risk</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-red-600 uppercase">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {repQuotes.map((rep, idx) => {
                  const hasRed = rep.red > 0;
                  return (
                    <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${hasRed ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.quotes}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.value}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{rep.green || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center text-yellow-600 font-medium">{rep.yellow || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{rep.red || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Why are quotes going critical?</h3>
          </div>
          <div className="p-4">
            {redReasons.map((reason, idx) => {
              const maxCount = Math.max(...redReasons.map(r => r.count));
              const widthPct = (reason.count / maxCount) * 100;
              return (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[var(--foreground)]">{reason.reason}</span>
                    <span className="text-[var(--muted-foreground)]">{reason.count} quotes ({reason.value})</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
            No customer response is #1 reason - improve follow-up cadence
          </div>
        </div>
      </div>

      {/* Loss Reasons */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Why are we losing quotes?</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4">
            {lossReasons.map((reason, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">{reason.pct}</div>
                <div className="text-sm font-medium text-[var(--foreground)] mt-1">{reason.reason}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{reason.count} quotes · {reason.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
          Price is top loss reason (32%) - review pricing strategy
        </div>
      </div>

      {/* Quotes Needing Follow-up */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Which quotes need follow-up?</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Stage</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Since Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Last Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {quotesNeedingFollowUp.map((quote, idx) => (
                <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${quote.daysSinceContact > 10 ? 'bg-yellow-50/50' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{quote.customer}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{quote.value}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.stage}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${quote.daysSinceContact > 10 ? 'text-yellow-600' : 'text-[var(--foreground)]'}`}>
                      {quote.daysSinceContact}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.lastAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Required Banner */}
      {riskSummary.red.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-red-800">Action Required: {riskSummary.red.length} Critical Quotes</h4>
              <p className="text-sm text-red-700 mt-1">
                {formatValue(totalValue(riskSummary.red))} in quotes need immediate attention.
                These quotes are either over 30 days old or haven't been contacted in over 2 weeks.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setRiskFilter('red')}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
                >
                  Review Critical Quotes
                </button>
                <button className="px-3 py-1.5 bg-white text-red-600 text-sm font-medium rounded border border-red-300 hover:bg-red-50 transition-colors">
                  Schedule Follow-ups
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
