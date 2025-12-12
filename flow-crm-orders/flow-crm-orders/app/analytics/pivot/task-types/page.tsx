'use client';

import React, { useState } from 'react';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

// Task type breakdown data
const taskTypeData = [
  { label: 'Calls', value: 2450, color: '#3b82f6', lastYear: 2100, thisYear: 2450 },
  { label: 'Meetings', value: 1234, color: '#8b5cf6', lastYear: 890, thisYear: 1234 },
  { label: 'Emails', value: 4521, color: '#10b981', lastYear: 5670, thisYear: 4521 },
  { label: 'Site Visits', value: 312, color: '#f59e0b', lastYear: 234, thisYear: 312 },
  { label: 'Webinars', value: 78, color: '#14b8a6', lastYear: 45, thisYear: 78 },
  { label: 'Trade Shows', value: 18, color: '#ec4899', lastYear: 12, thisYear: 18 },
];

// Monthly breakdown by task type
const monthlyData = [
  { month: 'Jan', calls: 180, meetings: 95, emails: 380, siteVisits: 25, webinars: 5, tradeShows: 1 },
  { month: 'Feb', calls: 195, meetings: 102, emails: 365, siteVisits: 28, webinars: 6, tradeShows: 0 },
  { month: 'Mar', calls: 210, meetings: 110, emails: 390, siteVisits: 30, webinars: 7, tradeShows: 2 },
  { month: 'Apr', calls: 225, meetings: 98, emails: 400, siteVisits: 27, webinars: 8, tradeShows: 1 },
  { month: 'May', calls: 205, meetings: 105, emails: 375, siteVisits: 32, webinars: 6, tradeShows: 2 },
  { month: 'Jun', calls: 190, meetings: 115, emails: 360, siteVisits: 28, webinars: 7, tradeShows: 3 },
  { month: 'Jul', calls: 175, meetings: 88, emails: 340, siteVisits: 22, webinars: 5, tradeShows: 1 },
  { month: 'Aug', calls: 185, meetings: 92, emails: 355, siteVisits: 25, webinars: 6, tradeShows: 2 },
  { month: 'Sep', calls: 220, meetings: 108, emails: 395, siteVisits: 30, webinars: 8, tradeShows: 2 },
  { month: 'Oct', calls: 235, meetings: 112, emails: 410, siteVisits: 33, webinars: 9, tradeShows: 2 },
  { month: 'Nov', calls: 230, meetings: 105, emails: 390, siteVisits: 28, webinars: 7, tradeShows: 1 },
  { month: 'Dec', calls: 200, meetings: 104, emails: 361, siteVisits: 24, webinars: 4, tradeShows: 1 },
];

// By rep breakdown
const byRepData = [
  { rep: 'Sarah Johnson', calls: 487, meetings: 242, emails: 924, siteVisits: 68, webinars: 12, tradeShows: 4 },
  { rep: 'Mike Thompson', calls: 521, meetings: 198, emails: 898, siteVisits: 72, webinars: 18, tradeShows: 3 },
  { rep: 'Lisa Kim', calls: 456, meetings: 271, emails: 845, siteVisits: 58, webinars: 15, tradeShows: 5 },
  { rep: 'John Davis', calls: 498, meetings: 245, emails: 912, siteVisits: 65, webinars: 10, tradeShows: 2 },
  { rep: 'Emma Roberts', calls: 488, meetings: 278, emails: 942, siteVisits: 49, webinars: 23, tradeShows: 4 },
];

function SummaryStats({ total, average, highest, lowest }: { total: string; average: string; highest: string; lowest: string }) {
  return (
    <div className="grid grid-cols-4 gap-0 mb-4">
      <div className="bg-blue-50 border border-blue-100 rounded-l-lg p-4">
        <div className="text-xs text-blue-600 font-medium">Total</div>
        <div className="text-lg font-bold text-blue-700">{total}</div>
      </div>
      <div className="bg-teal-50 border-y border-teal-100 p-4">
        <div className="text-xs text-teal-600 font-medium">Average</div>
        <div className="text-lg font-bold text-teal-700">{average}</div>
      </div>
      <div className="bg-green-50 border-y border-green-100 p-4">
        <div className="text-xs text-green-600 font-medium">Highest</div>
        <div className="text-lg font-bold text-green-700">{highest}</div>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-r-lg p-4">
        <div className="text-xs text-red-600 font-medium">Lowest</div>
        <div className="text-lg font-bold text-red-700">{lowest}</div>
      </div>
    </div>
  );
}

export default function TaskTypesPage() {
  const [showFilters, setShowFilters] = useState(false);

  const totalTasks = taskTypeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Activity by Task Type</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Breakdown of activities by type: Calls, Meetings, Emails, Site Visits, Webinars, Trade Shows</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            Save View
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Global Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>Global Filters</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {taskTypeData.map(type => (
          <div key={type.label} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-sm text-[var(--muted-foreground)] mb-1">{type.label}</div>
            <div className="text-2xl font-bold text-[var(--foreground)]">{type.value.toLocaleString()}</div>
            <div className={`text-xs mt-1 ${type.thisYear > type.lastYear ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
              {type.thisYear > type.lastYear ? '▲' : '▼'} {Math.abs(((type.thisYear - type.lastYear) / type.lastYear * 100)).toFixed(1)}% vs last year
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Distribution Chart */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Task Type Distribution</h3>
          <SummaryStats
            total={totalTasks.toLocaleString()}
            average={Math.round(totalTasks / 6).toLocaleString()}
            highest={Math.max(...taskTypeData.map(t => t.value)).toLocaleString()}
            lowest={Math.min(...taskTypeData.map(t => t.value)).toLocaleString()}
          />
          <div className="flex justify-center">
            <PieChart data={taskTypeData} showPercentages={true} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Tasks by Type</h3>
          <div className="h-[350px]">
            <BarChart data={taskTypeData} height={320} />
          </div>
        </div>
      </div>

      {/* Year-over-Year Comparison Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Year-over-Year Comparison by Task Type</h3>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
            </svg>
            Sort
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Task Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Last Year</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">This Year</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Variance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {taskTypeData.map(type => {
                const variance = ((type.thisYear - type.lastYear) / type.lastYear * 100).toFixed(2);
                const percentOfTotal = ((type.thisYear / totalTasks) * 100).toFixed(1);
                const isPositive = type.thisYear > type.lastYear;

                return (
                  <tr key={type.label} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                        <span className="font-medium text-[var(--foreground)]">{type.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{type.lastYear.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{type.thisYear.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`flex items-center justify-end gap-1 ${isPositive ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
                        {isPositive ? '▲' : '▼'} {variance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{percentOfTotal}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[var(--muted)]">
              <tr>
                <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Total</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--foreground)]">{taskTypeData.reduce((sum, t) => sum + t.lastYear, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--foreground)]">{totalTasks.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--foreground)]">-</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--foreground)]">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* By Rep Breakdown */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Task Types by Sales Rep</h3>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
            </svg>
            Sort
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Sales Rep</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Calls</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Meetings</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Emails</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Site Visits</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Webinars</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Trade Shows</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {byRepData.map(rep => {
                const total = rep.calls + rep.meetings + rep.emails + rep.siteVisits + rep.webinars + rep.tradeShows;
                return (
                  <tr key={rep.rep} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.calls.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.meetings.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.emails.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.siteVisits.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.webinars.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.tradeShows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--foreground)]">{total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
