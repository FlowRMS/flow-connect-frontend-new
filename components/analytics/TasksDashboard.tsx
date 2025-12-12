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

export default function TasksDashboard() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Who's doing the most outreach?
  const repActivity = [
    { rep: 'Emma Roberts', calls: 89, emails: 234, meetings: 12, siteVisits: 4, total: 339, target: 300, attainment: '113%' },
    { rep: 'Mike Thompson', calls: 76, emails: 198, meetings: 8, siteVisits: 6, total: 288, target: 300, attainment: '96%' },
    { rep: 'Sarah Johnson', calls: 65, emails: 187, meetings: 15, siteVisits: 3, total: 270, target: 300, attainment: '90%' },
    { rep: 'John Davis', calls: 58, emails: 156, meetings: 9, siteVisits: 2, total: 225, target: 300, attainment: '75%' },
    { rep: 'Lisa Kim', calls: 42, emails: 98, meetings: 5, siteVisits: 1, total: 146, target: 300, attainment: '49%' },
  ];

  // Which customers aren't getting enough attention?
  const neglectedCustomers = [
    { customer: 'Turner Construction', lastContact: '45 days ago', openOpps: '$1.2M', lastRep: 'John Davis' },
    { customer: 'Miller Electric', lastContact: '38 days ago', openOpps: '$890K', lastRep: 'Lisa Kim' },
    { customer: 'Coastal Builders', lastContact: '32 days ago', openOpps: '$567K', lastRep: 'Mike Thompson' },
    { customer: 'Johnson Controls', lastContact: '28 days ago', openOpps: '$445K', lastRep: 'Sarah Johnson' },
    { customer: 'TechCorp', lastContact: '25 days ago', openOpps: '$234K', lastRep: 'Emma Roberts' },
  ];

  // What activities drive the most wins?
  const activityToWinRate = [
    { activity: 'Site Visits', winRate: '68%', avgPerWin: '2.3', totalWon: '$4.2M' },
    { activity: 'Meetings', winRate: '45%', avgPerWin: '4.1', totalWon: '$2.8M' },
    { activity: 'Calls', winRate: '23%', avgPerWin: '8.7', totalWon: '$1.9M' },
    { activity: 'Emails', winRate: '12%', avgPerWin: '24.3', totalWon: '$890K' },
    { activity: 'Webinars', winRate: '34%', avgPerWin: '1.2', totalWon: '$456K' },
  ];

  // Are we following up on quotes?
  const quoteFollowUp = [
    { status: 'No follow-up (>7 days)', count: 23, value: '$2.1M', pct: '28%' },
    { status: 'One follow-up', count: 34, value: '$1.8M', pct: '35%' },
    { status: 'Multiple follow-ups', count: 18, value: '$1.2M', pct: '22%' },
    { status: 'Won', count: 12, value: '$890K', pct: '15%' },
  ];

  // Weekly activity trend
  const weeklyActivity = [
    { label: 'Mon', value: 145 },
    { label: 'Tue', value: 178 },
    { label: 'Wed', value: 156 },
    { label: 'Thu', value: 189 },
    { label: 'Fri', value: 134 },
  ];

  // Monthly activity by type
  const monthlyByType = [
    { label: 'Calls', value: 487 },
    { label: 'Emails', value: 1234 },
    { label: 'Meetings', value: 89 },
    { label: 'Site Visits', value: 28 },
    { label: 'Webinars', value: 12 },
  ];

  // Overdue tasks by rep
  const overdueTasks = [
    { rep: 'Lisa Kim', overdue: 18, oldest: '12 days', highPriority: 5 },
    { rep: 'John Davis', overdue: 12, oldest: '8 days', highPriority: 3 },
    { rep: 'Mike Thompson', overdue: 7, oldest: '5 days', highPriority: 2 },
    { rep: 'Sarah Johnson', overdue: 4, oldest: '3 days', highPriority: 1 },
    { rep: 'Emma Roberts', overdue: 2, oldest: '1 day', highPriority: 0 },
  ];

  // Which manufacturers need more attention?
  const manufacturerActivity = [
    { manufacturer: 'ERMCO', tasksThisMonth: 12, lastMonth: 34, change: '-65%', revenue: '$1.3M' },
    { manufacturer: 'PRYSMIAN', tasksThisMonth: 8, lastMonth: 28, change: '-71%', revenue: '$700K' },
    { manufacturer: 'Siemens', tasksThisMonth: 15, lastMonth: 22, change: '-32%', revenue: '$247K' },
    { manufacturer: 'Southern States', tasksThisMonth: 18, lastMonth: 19, change: '-5%', revenue: '$550K' },
    { manufacturer: 'Holophane', tasksThisMonth: 22, lastMonth: 18, change: '+22%', revenue: '$205K' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Sales Activity</h1>
          <p className="text-sm text-[var(--muted-foreground)]">For sales managers · Who's doing outreach? Which customers need attention?</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'week'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Week
            </button>
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
          </div>

          <AdvancedFilters
            filterOptions={[
              {
                id: 'rep',
                label: 'Sales Rep',
                type: 'multiselect',
                options: [
                  { value: 'emma', label: 'Emma Roberts' },
                  { value: 'mike', label: 'Mike Thompson' },
                  { value: 'sarah', label: 'Sarah Johnson' },
                  { value: 'john', label: 'John Davis' },
                  { value: 'lisa', label: 'Lisa Kim' },
                ]
              },
              {
                id: 'activityType',
                label: 'Activity Type',
                type: 'multiselect',
                options: [
                  { value: 'call', label: 'Calls' },
                  { value: 'email', label: 'Emails' },
                  { value: 'meeting', label: 'Meetings' },
                  { value: 'site', label: 'Site Visits' },
                ]
              },
              {
                id: 'status',
                label: 'Task Status',
                type: 'multiselect',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'overdue', label: 'Overdue' },
                ]
              },
              {
                id: 'priority',
                label: 'Priority',
                type: 'select',
                options: [
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
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
          question="Are we making enough touches?"
          value="1,850"
          comparison="+12% vs last month"
          trend="up"
          insight="Target: 2,000 touches/month"
        />
        <MetricCard
          question="How many site visits this month?"
          value="28"
          comparison="+8 vs last month"
          trend="up"
          insight="Site visits have 68% win rate"
        />
        <MetricCard
          question="What's our response time?"
          value="4.2 hrs"
          comparison="-1.3 hrs vs last month"
          trend="up"
          insight="Goal: <4 hours"
        />
        <MetricCard
          question="How many tasks are overdue?"
          value="43"
          comparison="+7 from yesterday"
          trend="down"
          insight="18 are high priority"
        />
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">When are we most active?</h3>
          <div className="h-[200px]">
            <BarChart data={weeklyActivity} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Thursday has highest activity - focus prospecting calls here</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">What activities are we doing?</h3>
          <div className="h-[200px]">
            <BarChart data={monthlyByType} height={180} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Heavy on emails - consider more calls and meetings for higher conversion</div>
        </div>
      </div>

      {/* Rep Activity Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Who's doing the most outreach?</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Calls</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Emails</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Meetings</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Site Visits</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">vs Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {repActivity.map((rep, idx) => {
                const attainmentNum = parseInt(rep.attainment);
                const barColor = attainmentNum >= 100 ? '#10b981' : attainmentNum >= 80 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.calls}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.emails}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.meetings}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.siteVisits}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{rep.total}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${attainmentNum >= 100 ? 'text-[var(--success)]' : attainmentNum >= 80 ? 'text-[var(--warning)]' : 'text-[var(--destructive)]'}`}>
                        {rep.attainment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(attainmentNum, 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity to Win Rate and Neglected Customers */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">What activities drive the most wins?</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Activity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Win Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Avg Per Win</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Revenue Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activityToWinRate.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${idx === 0 ? 'bg-green-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{item.activity}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${parseInt(item.winRate) >= 50 ? 'text-[var(--success)]' : 'text-[var(--foreground)]'}`}>
                        {item.winRate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{item.avgPerWin}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{item.totalWon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
            Site visits have the highest ROI - aim for 2+ per opportunity
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Which customers need attention?</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Last Contact</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Open Opps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {neglectedCustomers.map((cust, idx) => {
                  const daysAgo = parseInt(cust.lastContact);
                  return (
                    <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${daysAgo > 30 ? 'bg-red-50/50' : daysAgo > 14 ? 'bg-yellow-50/50' : ''}`}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-[var(--foreground)]">{cust.customer}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{cust.lastRep}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${daysAgo > 30 ? 'text-[var(--destructive)]' : daysAgo > 14 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]'}`}>
                          {cust.lastContact}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{cust.openOpps}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quote Follow-up and Overdue Tasks */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Are we following up on quotes?</h3>
          </div>
          <div className="p-4">
            {quoteFollowUp.map((item, idx) => {
              const barColor = item.status.includes('No follow-up') ? '#ef4444' :
                              item.status === 'Won' ? '#10b981' : '#3b82f6';
              return (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${item.status.includes('No follow-up') ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}`}>
                      {item.status}
                    </span>
                    <span className="text-[var(--muted-foreground)]">{item.count} quotes ({item.value})</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: item.pct, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
            $2.1M in quotes have no follow-up - potential revenue at risk
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Who has overdue tasks?</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Overdue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Oldest</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">High Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {overdueTasks.map((rep, idx) => (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${rep.overdue > 10 ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${rep.overdue > 10 ? 'text-[var(--destructive)]' : rep.overdue > 5 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]'}`}>
                        {rep.overdue}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{rep.oldest}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${rep.highPriority > 3 ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}`}>
                        {rep.highPriority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manufacturer Activity */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Are we giving each line enough attention?</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Manufacturer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Tasks This Month</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Last Month</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Change</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">YTD Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {manufacturerActivity.map((mfr, idx) => {
                const changeNum = parseInt(mfr.change);
                return (
                  <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${changeNum < -50 ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{mfr.manufacturer}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{mfr.tasksThisMonth}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{mfr.lastMonth}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${changeNum > 0 ? 'text-[var(--success)]' : changeNum < -30 ? 'text-[var(--destructive)]' : 'text-[var(--warning)]'}`}>
                        {mfr.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{mfr.revenue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
          ERMCO and PRYSMIAN activity down significantly - correlates with revenue decline
        </div>
      </div>
    </div>
  );
}
