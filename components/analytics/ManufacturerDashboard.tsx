'use client';

import React, { useState } from 'react';
import BarChart from '../charts/BarChart';
import AdvancedFilters from './AdvancedFilters';

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

// Activity Card with icon
function ActivityCard({
  icon,
  label,
  value,
  change,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  change: string;
  color: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
          <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
        </div>
        <div className="text-xs text-[var(--success)] font-medium">{change}</div>
      </div>
    </div>
  );
}

// Stage Badge
function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    'New Lead': 'bg-blue-100 text-blue-800 border-blue-200',
    'Qualification': 'bg-purple-100 text-purple-800 border-purple-200',
    'Discovery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Solution Design': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Ready to Quote': 'bg-teal-100 text-teal-800 border-teal-200',
    'Quote Sent': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Quote Reviewed': 'bg-orange-100 text-orange-800 border-orange-200',
    'Negotiation': 'bg-amber-100 text-amber-800 border-amber-200',
    'Verbal Commit': 'bg-lime-100 text-lime-800 border-lime-200',
    'Contract Sent': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Won': 'bg-green-100 text-green-800 border-green-200',
    'Lost': 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[stage] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {stage}
    </span>
  );
}

export default function ManufacturerDashboard() {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [selectedManufacturer, setSelectedManufacturer] = useState('schneider');

  const manufacturers = [
    { id: 'schneider', name: 'Schneider Electric', logo: 'SE' },
    { id: 'siemens', name: 'Siemens', logo: 'SI' },
    { id: 'abb', name: 'ABB', logo: 'ABB' },
    { id: 'eaton', name: 'Eaton', logo: 'EA' },
    { id: 'ge', name: 'GE', logo: 'GE' },
  ];

  const currentManufacturer = manufacturers.find(m => m.id === selectedManufacturer) || manufacturers[0];

  // Pipeline summary for this manufacturer
  const pipelineSummary = {
    preQuotes: { count: 34, value: '$4.2M' },
    activeQuotes: { count: 18, value: '$2.8M' },
    wonThisQuarter: { count: 8, value: '$1.4M' },
    lostThisQuarter: { count: 3, value: '$420K' },
  };

  // Activity metrics
  const activityMetrics = {
    totalTouches: 287,
    calls: 45,
    emails: 189,
    meetings: 28,
    siteVisits: 12,
    demos: 13,
    webinars: 8,
    proposals: 24,
  };

  // Pre-quote opportunities
  const preQuoteOpportunities = [
    { customer: 'Turner Construction', project: 'Warehouse Automation', value: '$890K', stage: 'Solution Design', rep: 'Justin Partin', daysInStage: 8, nextAction: 'Technical review meeting', nextDate: 'Dec 10' },
    { customer: 'Miller Electric', project: 'Solar Inverter System', value: '$567K', stage: 'Discovery', rep: 'Billy Ingram', daysInStage: 5, nextAction: 'Site survey', nextDate: 'Dec 12' },
    { customer: 'Coastal Builders', project: 'Building Management', value: '$445K', stage: 'Ready to Quote', rep: 'Jacobi Smith', daysInStage: 3, nextAction: 'Prepare quote', nextDate: 'Dec 9' },
    { customer: 'Johnson Controls', project: 'Motor Control Center', value: '$398K', stage: 'Qualification', rep: 'David Carnaggio', daysInStage: 4, nextAction: 'Budget confirmation', nextDate: 'Dec 11' },
    { customer: 'TechCorp', project: 'Power Distribution', value: '$312K', stage: 'New Lead', rep: 'Eric Bush', daysInStage: 2, nextAction: 'Initial call', nextDate: 'Dec 8' },
    { customer: 'Summit Energy', project: 'Switchgear Upgrade', value: '$678K', stage: 'Solution Design', rep: 'Lisa Kim', daysInStage: 12, nextAction: 'Spec review', nextDate: 'Dec 13' },
  ];

  // Active quotes
  const activeQuotes = [
    { customer: 'Metro Systems', project: 'Industrial Automation', value: '$456K', stage: 'Quote Sent', rep: 'Justin Partin', daysOld: 8, lastContact: '2 days ago', probability: 'High' },
    { customer: 'Pacific Grid', project: 'Substation Equipment', value: '$789K', stage: 'Negotiation', rep: 'Billy Ingram', daysOld: 18, lastContact: '1 day ago', probability: 'High' },
    { customer: 'Urban Power', project: 'UPS System', value: '$234K', stage: 'Quote Reviewed', rep: 'Jacobi Smith', daysOld: 12, lastContact: '3 days ago', probability: 'Medium' },
    { customer: 'Delta Controls', project: 'VFD Package', value: '$345K', stage: 'Verbal Commit', rep: 'David Carnaggio', daysOld: 22, lastContact: 'Today', probability: 'Very High' },
    { customer: 'Alpine Electric', project: 'Lighting Controls', value: '$178K', stage: 'Quote Sent', rep: 'Eric Bush', daysOld: 6, lastContact: '4 days ago', probability: 'Medium' },
    { customer: 'Harbor Systems', project: 'Generator Controls', value: '$567K', stage: 'Contract Sent', rep: 'Lisa Kim', daysOld: 28, lastContact: 'Today', probability: 'Very High' },
  ];

  // Won deals this quarter
  const wonDeals = [
    { customer: 'Northern Electric', project: 'MCC Installation', value: '$234K', closeDate: 'Nov 28', rep: 'Justin Partin', daysToClose: 45 },
    { customer: 'Valley Systems', project: 'PLC Upgrade', value: '$189K', closeDate: 'Nov 15', rep: 'Billy Ingram', daysToClose: 38 },
    { customer: 'Central Power', project: 'Switchboard', value: '$312K', closeDate: 'Nov 8', rep: 'Jacobi Smith', daysToClose: 52 },
    { customer: 'Green Energy', project: 'Solar Inverters', value: '$156K', closeDate: 'Oct 28', rep: 'David Carnaggio', daysToClose: 41 },
    { customer: 'Atlantic Grid', project: 'Transformer', value: '$278K', closeDate: 'Oct 18', rep: 'Eric Bush', daysToClose: 35 },
    { customer: 'Summit Power', project: 'VFD System', value: '$198K', closeDate: 'Oct 5', rep: 'Lisa Kim', daysToClose: 48 },
  ];

  // Lost deals this quarter
  const lostDeals = [
    { customer: 'Regional Power', project: 'Automation System', value: '$234K', lostDate: 'Nov 20', rep: 'John Davis', reason: 'Price - chose competitor', competitor: 'Siemens' },
    { customer: 'Industrial Solutions', project: 'Motor Starters', value: '$98K', lostDate: 'Oct 25', rep: 'Mike Thompson', reason: 'Project delayed', competitor: '-' },
    { customer: 'Metro Electric', project: 'Distribution Panel', value: '$88K', lostDate: 'Oct 12', rep: 'Sarah Johnson', reason: 'Spec changed to different brand', competitor: 'ABB' },
  ];

  // Recent activity log
  const recentActivity = [
    { date: 'Today', rep: 'Justin Partin', type: 'Meeting', customer: 'Turner Construction', notes: 'Technical review - customer approved spec' },
    { date: 'Today', rep: 'Lisa Kim', type: 'Call', customer: 'Harbor Systems', notes: 'Contract signing scheduled for Friday' },
    { date: 'Yesterday', rep: 'Billy Ingram', type: 'Email', customer: 'Pacific Grid', notes: 'Sent revised pricing per negotiation' },
    { date: 'Yesterday', rep: 'David Carnaggio', type: 'Site Visit', customer: 'Delta Controls', notes: 'Final walkthrough before PO' },
    { date: 'Dec 4', rep: 'Jacobi Smith', type: 'Demo', customer: 'Coastal Builders', notes: 'Product demo - well received' },
    { date: 'Dec 4', rep: 'Eric Bush', type: 'Call', customer: 'TechCorp', notes: 'Initial discovery call completed' },
    { date: 'Dec 3', rep: 'Justin Partin', type: 'Meeting', customer: 'Metro Systems', notes: 'Quote review meeting - awaiting feedback' },
    { date: 'Dec 3', rep: 'Lisa Kim', type: 'Email', customer: 'Summit Energy', notes: 'Sent updated spec sheet' },
  ];

  // Rep performance for this manufacturer
  const repPerformance = [
    { rep: 'Justin Partin', preQuotes: 8, activeQuotes: 4, won: 2, lost: 0, value: '$1.2M', touches: 56 },
    { rep: 'Billy Ingram', preQuotes: 6, activeQuotes: 3, won: 1, lost: 0, value: '$890K', touches: 48 },
    { rep: 'Jacobi Smith', preQuotes: 5, activeQuotes: 3, won: 2, lost: 0, value: '$678K', touches: 42 },
    { rep: 'David Carnaggio', preQuotes: 4, activeQuotes: 2, won: 1, lost: 0, value: '$456K', touches: 38 },
    { rep: 'Eric Bush', preQuotes: 4, activeQuotes: 2, won: 1, lost: 1, value: '$398K', touches: 35 },
    { rep: 'Lisa Kim', preQuotes: 3, activeQuotes: 2, won: 1, lost: 0, value: '$534K', touches: 32 },
    { rep: 'John Davis', preQuotes: 2, activeQuotes: 1, won: 0, lost: 1, value: '$189K', touches: 18 },
    { rep: 'Mike Thompson', preQuotes: 1, activeQuotes: 1, won: 0, lost: 1, value: '$98K', touches: 12 },
    { rep: 'Sarah Johnson', preQuotes: 1, activeQuotes: 0, won: 0, lost: 0, value: '$88K', touches: 6 },
  ];

  // Monthly won quotes trend
  const monthlyWonQuotes = [
    { label: 'Jul', value: 180 },
    { label: 'Aug', value: 245 },
    { label: 'Sep', value: 312 },
    { label: 'Oct', value: 476 },
    { label: 'Nov', value: 423 },
    { label: 'Dec', value: 234 },
  ];

  // Opportunities by stage
  const opportunitiesByStage = [
    { label: 'Pre-Quotes', value: 4200 },
    { label: 'Active Quotes', value: 2800 },
    { label: 'Negotiation', value: 1200 },
    { label: 'Verbal Commit', value: 890 },
  ];

  // Activity by type for chart
  const activityByType = [
    { label: 'Emails', value: activityMetrics.emails },
    { label: 'Calls', value: activityMetrics.calls },
    { label: 'Meetings', value: activityMetrics.meetings },
    { label: 'Demos', value: activityMetrics.demos },
    { label: 'Site Visits', value: activityMetrics.siteVisits },
  ];

  // Weekly activity trend
  const weeklyActivityTrend = [
    { label: 'W1', value: 58 },
    { label: 'W2', value: 72 },
    { label: 'W3', value: 65 },
    { label: 'W4', value: 92 },
  ];

  // Insights
  const insights = [
    { type: 'success', title: 'Strong Active Quotes', message: `$2.8M in active quotes with ${currentManufacturer.name} products. 2 quotes ($912K) at Verbal Commit stage expected to close this month.` },
    { type: 'warning', title: 'Pre-Quotes Aging', message: '3 pre-quote opportunities have been in Solution Design for over 10 days. Consider scheduling technical reviews to move forward.' },
    { type: 'info', title: 'Activity Trending Up', message: 'Total touchpoints increased 18% vs last quarter. Site visits up 25% - a leading indicator of closed deals.' },
    { type: 'success', title: 'Win Rate Strong', message: `72% win rate on ${currentManufacturer.name} quotes this quarter (8 won, 3 lost). Above company average of 65%.` },
    { type: 'warning', title: 'Competitor Activity', message: '2 of 3 lost deals went to Siemens. Consider competitive positioning review.' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Manufacturer Selector */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
              {currentManufacturer.logo}
            </div>
            <div>
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="text-2xl font-bold text-[var(--foreground)] bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <p className="text-sm text-[var(--muted-foreground)]">For manufacturer partners · What is the rep doing for us? Where's our pipeline?</p>
            </div>
          </div>
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
                  { value: 'jacobi', label: 'Jacobi Smith' },
                  { value: 'david', label: 'David Carnaggio' },
                  { value: 'eric', label: 'Eric Bush' },
                  { value: 'lisa', label: 'Lisa Kim' },
                ]
              },
              {
                id: 'region',
                label: 'Region',
                type: 'multiselect',
                options: [
                  { value: 'northeast', label: 'Northeast' },
                  { value: 'southeast', label: 'Southeast' },
                  { value: 'midwest', label: 'Midwest' },
                  { value: 'west', label: 'West' },
                ]
              },
              {
                id: 'productLine',
                label: 'Product Line',
                type: 'multiselect',
                options: [
                  { value: 'automation', label: 'Automation' },
                  { value: 'power', label: 'Power Distribution' },
                  { value: 'controls', label: 'Controls' },
                  { value: 'drives', label: 'Drives & Motors' },
                ]
              },
              {
                id: 'value',
                label: 'Deal Value',
                type: 'range',
                options: [
                  { value: '0-100k', label: 'Under $100K' },
                  { value: '100k-500k', label: '$100K - $500K' },
                  { value: '500k-1m', label: '$500K - $1M' },
                  { value: '1m+', label: 'Over $1M' },
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
            Export Report
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <MetricCard
          question="Total Opportunity Value"
          value="$7.0M"
          comparison="+$890K vs last quarter"
          trend="up"
          insight="Pre-Quotes + Active Quotes combined"
        />
        <MetricCard
          question="Pre-Quotes"
          value={pipelineSummary.preQuotes.value}
          comparison={`${pipelineSummary.preQuotes.count} opportunities`}
          trend="flat"
          insight="Before formal quote sent"
        />
        <MetricCard
          question="Active Quotes"
          value={pipelineSummary.activeQuotes.value}
          comparison={`${pipelineSummary.activeQuotes.count} quotes out`}
          trend="flat"
          insight="Formal quotes outstanding"
        />
        <MetricCard
          question="Won Quotes This Quarter"
          value={pipelineSummary.wonThisQuarter.value}
          comparison={`${pipelineSummary.wonThisQuarter.count} deals closed`}
          trend="up"
          insight="42 day avg sales cycle"
        />
        <MetricCard
          question="Quote Win Rate"
          value="72%"
          comparison="+7% vs company avg"
          trend="up"
          insight="8 won / 11 decided"
        />
      </div>

      {/* Activity Metrics - Visual Cards */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Rep Activity for {currentManufacturer.name}</h3>
          <div className="text-sm text-[var(--muted-foreground)]">This Quarter · {activityMetrics.totalTouches} Total Touchpoints</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>}
            label="Calls"
            value={activityMetrics.calls}
            change="+12%"
            color="bg-green-100 text-green-600"
          />
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
            label="Emails"
            value={activityMetrics.emails}
            change="+8%"
            color="bg-purple-100 text-purple-600"
          />
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            label="Meetings"
            value={activityMetrics.meetings}
            change="+22%"
            color="bg-blue-100 text-blue-600"
          />
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>}
            label="Site Visits"
            value={activityMetrics.siteVisits}
            change="+25%"
            color="bg-orange-100 text-orange-600"
          />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
            label="Demos"
            value={activityMetrics.demos}
            change="+18%"
            color="bg-cyan-100 text-cyan-600"
          />
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l5 5-5 5"/><path d="M4 4v7a4 4 0 004 4h12"/></svg>}
            label="Webinars"
            value={activityMetrics.webinars}
            change="+33%"
            color="bg-indigo-100 text-indigo-600"
          />
          <ActivityCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>}
            label="Proposals Sent"
            value={activityMetrics.proposals}
            change="+15%"
            color="bg-teal-100 text-teal-600"
          />
          <div className="bg-[var(--muted)] border border-[var(--border)] rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">{activityMetrics.totalTouches}</div>
              <div className="text-sm text-[var(--muted-foreground)]">Total Touchpoints</div>
              <div className="text-xs text-[var(--success)] font-medium mt-1">+18% vs Last Quarter</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Won Quotes by Month ($K)</h3>
          <div className="h-[200px]">
            <BarChart data={monthlyWonQuotes} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">$1.87M in won quotes YTD</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Opportunities by Stage ($K)</h3>
          <div className="h-[200px]">
            <BarChart data={opportunitiesByStage} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Pre-Quotes + Active Quotes combined</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Weekly Activity Trend</h3>
          <div className="h-[200px]">
            <BarChart data={weeklyActivityTrend} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Activity ramping up toward quarter end</div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Insights & Recommendations</h3>
        </div>
        <div className="p-4 space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                insight.type === 'success' ? 'bg-green-50/50 border-green-200' :
                insight.type === 'warning' ? 'bg-yellow-50/50 border-yellow-200' :
                'bg-blue-50/50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  insight.type === 'success' ? 'bg-green-100 text-green-600' :
                  insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {insight.type === 'success' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  )}
                  {insight.type === 'warning' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                  {insight.type === 'info' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${
                    insight.type === 'success' ? 'text-green-800' :
                    insight.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>{insight.title}</div>
                  <div className={`text-sm mt-1 ${
                    insight.type === 'success' ? 'text-green-700' :
                    insight.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>{insight.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Quotes */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]">Pre-Quotes ({preQuoteOpportunities.length})</h3>
          <span className="text-sm text-[var(--muted-foreground)]">{pipelineSummary.preQuotes.value} total value</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Project</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Next Action</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {preQuoteOpportunities.map((opp, idx) => (
                <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{opp.customer}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{opp.project}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{opp.value}</td>
                  <td className="px-4 py-3"><StageBadge stage={opp.stage} /></td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{opp.rep}</td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">{opp.nextAction}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{opp.nextDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Quotes */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]">Active Quotes ({activeQuotes.length})</h3>
          <span className="text-sm text-[var(--muted-foreground)]">{pipelineSummary.activeQuotes.value} total value</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Project</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Quote Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Quote Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Old</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Last Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {activeQuotes.map((quote, idx) => {
                const probColor = quote.probability === 'Very High' ? 'text-green-600' :
                                  quote.probability === 'High' ? 'text-blue-600' :
                                  quote.probability === 'Medium' ? 'text-yellow-600' : 'text-red-600';
                return (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{quote.customer}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.project}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{quote.value}</td>
                    <td className="px-4 py-3"><StageBadge stage={quote.stage} /></td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.rep}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{quote.daysOld}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{quote.lastContact}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${probColor}`}>{quote.probability}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Won and Lost Deals */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Won Deals */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-green-50/50">
            <h3 className="font-semibold text-green-800">Won Quotes This Quarter ({wonDeals.length})</h3>
            <span className="text-sm font-medium text-green-600">{pipelineSummary.wonThisQuarter.value}</span>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full">
              <thead className="bg-[var(--muted)] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Close Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {wonDeals.map((deal, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium text-[var(--foreground)]">{deal.customer}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{deal.project}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-green-600">{deal.value}</td>
                    <td className="px-4 py-2 text-sm text-[var(--muted-foreground)]">{deal.rep}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{deal.closeDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lost Deals */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-red-50/50">
            <h3 className="font-semibold text-red-800">Lost Quotes This Quarter ({lostDeals.length})</h3>
            <span className="text-sm font-medium text-red-600">{pipelineSummary.lostThisQuarter.value}</span>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full">
              <thead className="bg-[var(--muted)] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Lost To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {lostDeals.map((deal, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium text-[var(--foreground)]">{deal.customer}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{deal.project}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-red-600">{deal.value}</td>
                    <td className="px-4 py-2 text-sm text-[var(--muted-foreground)]">{deal.reason}</td>
                    <td className="px-4 py-2 text-sm text-[var(--muted-foreground)]">{deal.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity and Rep Performance */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Recent Activity */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Recent Activity</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'Meeting' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'Call' ? 'bg-green-100 text-green-600' :
                    activity.type === 'Email' ? 'bg-purple-100 text-purple-600' :
                    activity.type === 'Site Visit' ? 'bg-orange-100 text-orange-600' :
                    'bg-cyan-100 text-cyan-600'
                  }`}>
                    {activity.type === 'Meeting' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    )}
                    {activity.type === 'Call' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    )}
                    {activity.type === 'Email' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    )}
                    {activity.type === 'Site Visit' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    )}
                    {activity.type === 'Demo' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--foreground)]">{activity.customer}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{activity.date}</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">{activity.rep} · {activity.type}</div>
                    <div className="text-sm text-[var(--foreground)] mt-1">{activity.notes}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rep Performance */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Rep Performance for {currentManufacturer.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Pre-Quotes</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Quotes</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Won</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Touches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {repPerformance.map((rep, idx) => (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${rep.lost > 0 ? 'bg-red-50/30' : rep.won > 0 ? 'bg-green-50/30' : ''}`}>
                    <td className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--foreground)]">{rep.preQuotes}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--foreground)]">{rep.activeQuotes}</td>
                    <td className="px-4 py-2 text-sm text-right text-green-600 font-medium">{rep.won}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--foreground)]">{rep.value}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{rep.touches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
