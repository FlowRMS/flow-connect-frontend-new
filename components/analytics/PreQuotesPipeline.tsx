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

export default function PreQuotesPipeline() {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('quarter');

  // Pre-quote stages (before a formal quote is sent)
  const preQuoteStages = [
    { stage: 'New Lead', count: 89, value: '$8.9M', avgAge: '3 days', convRate: '72%' },
    { stage: 'Qualification', count: 67, value: '$6.7M', avgAge: '8 days', convRate: '65%' },
    { stage: 'Discovery', count: 45, value: '$5.4M', avgAge: '12 days', convRate: '58%' },
    { stage: 'Solution Design', count: 32, value: '$4.8M', avgAge: '18 days', convRate: '75%' },
    { stage: 'Ready to Quote', count: 24, value: '$3.6M', avgAge: '5 days', convRate: '88%' },
  ];

  // Pre-quote stage chart data
  const stageChartData = preQuoteStages.map(s => ({
    label: s.stage.split(' ')[0],
    value: parseFloat(s.value.replace(/[$M]/g, '')) * 1000
  }));

  // What's ready to quote?
  const readyToQuote = [
    { customer: 'Turner Construction', value: '$890K', rep: 'Justin Partin', daysInStage: 3, project: 'Warehouse Expansion' },
    { customer: 'Miller Electric', value: '$567K', rep: 'Billy Ingram', daysInStage: 5, project: 'Solar Installation' },
    { customer: 'Coastal Builders', value: '$445K', rep: 'Jacobi Smith', daysInStage: 2, project: 'Office Complex' },
    { customer: 'Johnson Controls', value: '$398K', rep: 'David Carnaggio', daysInStage: 7, project: 'HVAC Upgrade' },
    { customer: 'TechCorp', value: '$312K', rep: 'Eric Bush', daysInStage: 4, project: 'Data Center' },
  ];

  // What leads are going stale?
  const staleLeads = [
    { customer: 'Urban Development', value: '$1.2M', stage: 'Discovery', daysStale: 28, lastActivity: 'Email sent', rep: 'Lisa Kim' },
    { customer: 'Green Energy', value: '$890K', stage: 'Qualification', daysStale: 21, lastActivity: 'Call attempted', rep: 'John Davis' },
    { customer: 'Metro Electric', value: '$678K', stage: 'Solution Design', daysStale: 18, lastActivity: 'Meeting held', rep: 'Sarah Johnson' },
    { customer: 'Summit Power', value: '$456K', stage: 'Discovery', daysStale: 15, lastActivity: 'Info requested', rep: 'Mike Thompson' },
    { customer: 'Atlantic Grid', value: '$345K', stage: 'Qualification', daysStale: 12, lastActivity: 'Left voicemail', rep: 'Emma Roberts' },
  ];

  // Stage conversion funnel
  const stageConversion = [
    { from: 'New Lead', to: 'Qualification', conversion: '72%', avgDays: '3', volume: 89, dropped: 25 },
    { from: 'Qualification', to: 'Discovery', conversion: '65%', avgDays: '8', volume: 64, dropped: 22 },
    { from: 'Discovery', to: 'Solution Design', conversion: '58%', avgDays: '12', volume: 42, dropped: 18 },
    { from: 'Solution Design', to: 'Ready to Quote', conversion: '75%', avgDays: '18', volume: 32, dropped: 8 },
    { from: 'Ready to Quote', to: 'Quote Sent', conversion: '88%', avgDays: '5', volume: 24, dropped: 3 },
  ];

  // Lead sources - where are pre-quotes coming from?
  const leadSources = [
    { source: 'Existing Customer', count: 67, value: '$12.4M', convToQuote: '45%', pct: '26%' },
    { source: 'Referral', count: 45, value: '$8.2M', convToQuote: '38%', pct: '18%' },
    { source: 'Website', count: 38, value: '$4.8M', convToQuote: '22%', pct: '15%' },
    { source: 'Trade Show', count: 34, value: '$6.1M', convToQuote: '35%', pct: '13%' },
    { source: 'Cold Outreach', count: 28, value: '$3.2M', convToQuote: '18%', pct: '11%' },
    { source: 'Manufacturer Lead', count: 45, value: '$5.8M', convToQuote: '28%', pct: '17%' },
  ];

  // Rep pre-quote pipeline
  const repPreQuotes = [
    { rep: 'Justin Partin', leads: 42, value: '$8.4M', avgAge: '12 days', readyToQuote: 8, convRate: '42%' },
    { rep: 'Billy Ingram', leads: 38, value: '$6.2M', avgAge: '15 days', readyToQuote: 5, convRate: '35%' },
    { rep: 'Jacobi Smith', leads: 35, value: '$5.8M', avgAge: '10 days', readyToQuote: 6, convRate: '38%' },
    { rep: 'David Carnaggio', leads: 28, value: '$4.1M', avgAge: '18 days', readyToQuote: 3, convRate: '28%' },
    { rep: 'Eric Bush', leads: 24, value: '$3.2M', avgAge: '22 days', readyToQuote: 2, convRate: '24%' },
  ];

  // New leads this period
  const newLeadsData = [
    { label: 'Week 1', value: 28 },
    { label: 'Week 2', value: 34 },
    { label: 'Week 3', value: 22 },
    { label: 'Week 4', value: 31 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Pre-Quote Pipeline</h1>
          <p className="text-sm text-[var(--muted-foreground)]">For sales reps · What leads need attention? What's ready to quote?</p>
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
                ]
              },
              {
                id: 'stage',
                label: 'Pre-Quote Stage',
                type: 'multiselect',
                options: [
                  { value: 'lead', label: 'New Lead' },
                  { value: 'qualification', label: 'Qualification' },
                  { value: 'discovery', label: 'Discovery' },
                  { value: 'solution', label: 'Solution Design' },
                  { value: 'ready', label: 'Ready to Quote' },
                ]
              },
              {
                id: 'source',
                label: 'Lead Source',
                type: 'multiselect',
                options: [
                  { value: 'existing', label: 'Existing Customer' },
                  { value: 'referral', label: 'Referral' },
                  { value: 'website', label: 'Website' },
                  { value: 'tradeshow', label: 'Trade Show' },
                  { value: 'cold', label: 'Cold Outreach' },
                ]
              },
              {
                id: 'value',
                label: 'Opportunity Value',
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

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
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
          question="How many pre-quotes are active?"
          value="257"
          comparison="+34 vs last month"
          trend="up"
          insight="$29.4M total potential value"
        />
        <MetricCard
          question="How many are ready to quote?"
          value="24"
          comparison="$3.6M value"
          trend="flat"
          insight="Avg 5 days in stage"
        />
        <MetricCard
          question="What's our lead-to-quote rate?"
          value="32%"
          comparison="+4% vs last quarter"
          trend="up"
          insight="82 quotes from 257 leads"
        />
        <MetricCard
          question="Average time to quote?"
          value="38 days"
          comparison="-5 days vs target"
          trend="up"
          insight="Goal: 45 days"
        />
      </div>

      {/* Pipeline by Stage and New Leads */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Where are pre-quotes in the funnel?</h3>
          <div className="h-[200px]">
            <BarChart data={stageChartData} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Values in thousands ($K) - Most value at early stages</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Are we generating enough new leads?</h3>
          <div className="h-[200px]">
            <BarChart data={newLeadsData} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">115 new leads this month - on pace for 120 target</div>
        </div>
      </div>

      {/* Ready to Quote */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">What's ready to quote?</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Project</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Est. Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Ready</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {readyToQuote.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--muted)] transition-colors bg-green-50/30">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{item.customer}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.project}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{item.value}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.rep}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${item.daysInStage > 5 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                      {item.daysInStage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
          $2.6M ready to quote - push these to formal quotes this week
        </div>
      </div>

      {/* Stale Leads and Conversion Funnel */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">What leads are going stale?</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Stage</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days Stale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {staleLeads.map((lead, idx) => (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${lead.daysStale > 20 ? 'bg-red-50/50' : lead.daysStale > 14 ? 'bg-yellow-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-[var(--foreground)]">{lead.customer}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{lead.rep}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{lead.value}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{lead.stage}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${lead.daysStale > 20 ? 'text-[var(--destructive)]' : lead.daysStale > 14 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]'}`}>
                        {lead.daysStale}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
            $3.6M at risk of going cold - needs immediate outreach
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Where are we losing leads?</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Transition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Conv %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Avg Days</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Dropped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {stageConversion.map((stage, idx) => {
                  const convNum = parseInt(stage.conversion);
                  const isBottleneck = convNum < 65;
                  return (
                    <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${isBottleneck ? 'bg-yellow-50/50' : ''}`}>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-[var(--foreground)]">{stage.from.split(' ')[0]}</span>
                        <span className="text-[var(--muted-foreground)]"> → </span>
                        <span className="text-[var(--foreground)]">{stage.to.split(' ')[0]}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-medium ${convNum >= 70 ? 'text-[var(--success)]' : convNum >= 60 ? 'text-[var(--foreground)]' : 'text-[var(--destructive)]'}`}>
                          {stage.conversion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{stage.avgDays}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--destructive)]">{stage.dropped}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
            Discovery → Solution Design has lowest conversion (58%)
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Where are pre-quotes coming from?</h3>
        </div>
        <div className="p-4">
          {leadSources.map((source, idx) => {
            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280', '#ec4899'];
            return (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-[var(--foreground)]">{source.source}</span>
                  <span className="text-[var(--muted-foreground)]">{source.count} leads ({source.value}) • {source.convToQuote} to quote</span>
                </div>
                <div className="w-full h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: source.pct, backgroundColor: colors[idx] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
          Existing customers have highest conversion to quote (45%) - prioritize upsell opportunities
        </div>
      </div>

      {/* Rep Pre-Quote Pipeline */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Who's building the best pre-quote pipeline?</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Active Leads</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Avg Age</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Ready to Quote</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Conv Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {repPreQuotes.map((rep, idx) => {
                const convNum = parseInt(rep.convRate);
                return (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${convNum >= 40 ? 'bg-green-50/50' : convNum < 30 ? 'bg-yellow-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.leads}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.value}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`${parseInt(rep.avgAge) > 15 ? 'text-[var(--warning)]' : 'text-[var(--muted-foreground)]'}`}>
                        {rep.avgAge}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[var(--success)]">{rep.readyToQuote}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${convNum >= 40 ? 'text-[var(--success)]' : convNum >= 30 ? 'text-[var(--foreground)]' : 'text-[var(--destructive)]'}`}>
                        {rep.convRate}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
          Eric has oldest avg lead age (22 days) and lowest conversion (24%) - needs coaching
        </div>
      </div>
    </div>
  );
}
