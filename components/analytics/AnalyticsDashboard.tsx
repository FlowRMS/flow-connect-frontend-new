'use client';

import React, { useState, useMemo } from 'react';
import BarChart from '../charts/BarChart';
import AdvancedFilters from './AdvancedFilters';

// Variance Table Component
function RankingTable({
  question,
  columns,
  data,
  highlightTop = 3,
  highlightBottom = 0
}: {
  question: string;
  columns: { key: string; label: string }[];
  data: Record<string, string | number>[];
  highlightTop?: number;
  highlightBottom?: number;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).replace(/[^0-9.-]/g, '');
      const bStr = String(bVal).replace(/[^0-9.-]/g, '');
      const aNum = parseFloat(aStr);
      const bNum = parseFloat(bStr);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)]">{question}</h3>
      </div>
      <div className="max-h-[350px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[var(--muted)]">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedData.map((row, idx) => {
              const isTop = idx < highlightTop;
              const isBottom = highlightBottom > 0 && idx >= sortedData.length - highlightBottom;
              return (
                <tr
                  key={idx}
                  className={`hover:bg-[var(--muted)] transition-colors ${isTop ? 'bg-green-50/50' : ''} ${isBottom ? 'bg-red-50/50' : ''}`}
                >
                  {columns.map(col => {
                    const value = row[col.key];
                    const isVariance = col.key === 'variance' || col.key === 'change';
                    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[%$,]/g, '')) : value;
                    const isPositive = typeof numValue === 'number' && numValue > 0;
                    const isNegative = typeof numValue === 'number' && numValue < 0;

                    return (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {isVariance ? (
                          <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-[var(--success)]' : isNegative ? 'text-[var(--destructive)]' : ''}`}>
                            {isPositive && '+'}{value}
                          </span>
                        ) : (
                          <span className="text-[var(--foreground)]">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Metric Card with context
function MetricCard({
  question,
  value,
  comparison,
  comparisonLabel,
  trend,
  insight
}: {
  question: string;
  value: string;
  comparison?: string;
  comparisonLabel?: string;
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
          {comparison} {comparisonLabel}
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

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'ytd' | 'quarter' | 'month'>('ytd');

  // Which customers are we losing ground with?
  const decliningCustomers = [
    { customer: 'Turner Construction', lastYear: '$6.4M', thisYear: '$244K', change: '-96%' },
    { customer: 'Miller Electric', lastYear: '$6.1M', thisYear: '$205K', change: '-97%' },
    { customer: 'Coastal Builders', lastYear: '$1.8M', thisYear: '$196K', change: '-89%' },
    { customer: 'Johnson Controls', lastYear: '$1.4M', thisYear: '$202K', change: '-86%' },
    { customer: 'Urban Development', lastYear: '$1.3M', thisYear: '$150K', change: '-89%' },
  ];

  // Which customers are growing?
  const growingCustomers = [
    { customer: 'WESCO Distribution', lastYear: '$144K', thisYear: '$312K', change: '+117%' },
    { customer: 'Atlantic Power', lastYear: '$89K', thisYear: '$178K', change: '+100%' },
    { customer: 'Metro Electric', lastYear: '$234K', thisYear: '$398K', change: '+70%' },
    { customer: 'Summit Energy', lastYear: '$156K', thisYear: '$245K', change: '+57%' },
    { customer: 'Greenfield Solar', lastYear: '$67K', thisYear: '$102K', change: '+52%' },
  ];

  // Which reps are hitting targets?
  const repPerformance = [
    { rep: 'Justin Partin', quota: '$2.5M', actual: '$1.3M', attainment: '52%', pipeline: '$4.2M' },
    { rep: 'Billy Ingram', quota: '$1.8M', actual: '$376K', attainment: '21%', pipeline: '$2.1M' },
    { rep: 'Jacobi Smith', quota: '$1.5M', actual: '$365K', attainment: '24%', pipeline: '$1.8M' },
    { rep: 'David Carnaggio', quota: '$1.2M', actual: '$286K', attainment: '24%', pipeline: '$890K' },
    { rep: 'Eric Bush', quota: '$2.0M', actual: '$244K', attainment: '12%', pipeline: '$1.2M' },
  ];

  // Which manufacturers need attention?
  const manufacturerPerformance = [
    { manufacturer: 'ERMCO', lastYear: '$8.0M', thisYear: '$1.3M', change: '-84%', lineCount: 12 },
    { manufacturer: 'PRYSMIAN', lastYear: '$15.3M', thisYear: '$700K', change: '-95%', lineCount: 8 },
    { manufacturer: 'Southern States', lastYear: '$1.6M', thisYear: '$550K', change: '-65%', lineCount: 15 },
    { manufacturer: 'Siemens', lastYear: '$2.7M', thisYear: '$247K', change: '-91%', lineCount: 22 },
    { manufacturer: 'Holophane', lastYear: '$624K', thisYear: '$205K', change: '-67%', lineCount: 6 },
  ];

  // Monthly won quotes trend
  const monthlyWonQuotes = [
    { label: 'Jan', value: 680000 },
    { label: 'Feb', value: 720000 },
    { label: 'Mar', value: 890000 },
    { label: 'Apr', value: 780000 },
    { label: 'May', value: 720000 },
    { label: 'Jun', value: 690000 },
    { label: 'Jul', value: 580000 },
    { label: 'Aug', value: 620000 },
    { label: 'Sep', value: 780000 },
    { label: 'Oct', value: 890000 },
    { label: 'Nov', value: 820000 },
    { label: 'Dec', value: 410000 },
  ];

  const formattedMonthlyWonQuotes = monthlyWonQuotes.map(m => ({
    label: m.label,
    value: m.value / 1000
  }));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Business Performance</h1>
          <p className="text-sm text-[var(--muted-foreground)]">For leadership and owners · Are we hitting our goals? Who's growing or declining?</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Toggle */}
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
              onClick={() => setDateRange('ytd')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'ytd'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              YTD
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
                id: 'customer',
                label: 'Customer Type',
                type: 'multiselect',
                options: [
                  { value: 'new', label: 'New Customers' },
                  { value: 'existing', label: 'Existing Customers' },
                  { value: 'churned', label: 'Churned' },
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
                id: 'revenue',
                label: 'Revenue Range',
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

      {/* Top-level business health metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          question="Won Quotes YTD"
          value="$3.8M"
          comparison="32% of $12M goal"
          comparisonLabel=""
          trend="down"
          insight="Need $8.2M more to hit annual target"
        />
        <MetricCard
          question="Quote Pipeline Coverage"
          value="2.1x"
          comparison="vs 3x target"
          comparisonLabel=""
          trend="down"
          insight="$25M active quotes / $12M quota"
        />
        <MetricCard
          question="Quote Win Rate"
          value="24%"
          comparison="-3% vs last year"
          comparisonLabel=""
          trend="down"
          insight="48 won quotes / 198 total quotes"
        />
        <MetricCard
          question="Average Quote Value"
          value="$78K"
          comparison="+12% vs last year"
          comparisonLabel=""
          trend="up"
          insight="Up from $70K average"
        />
      </div>

      {/* Won Quotes Trend */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Won Quotes by Month</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-[var(--muted)] rounded-lg">
            <div className="text-xs text-[var(--muted-foreground)]">YTD Won Quotes</div>
            <div className="text-lg font-bold text-[var(--foreground)]">$8.1M</div>
          </div>
          <div className="text-center p-3 bg-[var(--muted)] rounded-lg">
            <div className="text-xs text-[var(--muted-foreground)]">Monthly Avg</div>
            <div className="text-lg font-bold text-[var(--foreground)]">$673K</div>
          </div>
          <div className="text-center p-3 bg-[var(--muted)] rounded-lg">
            <div className="text-xs text-[var(--muted-foreground)]">Best Month</div>
            <div className="text-lg font-bold text-[var(--success)]">$890K (Oct)</div>
          </div>
          <div className="text-center p-3 bg-[var(--muted)] rounded-lg">
            <div className="text-xs text-[var(--muted-foreground)]">vs Last Year</div>
            <div className="text-lg font-bold text-[var(--destructive)]">-23%</div>
          </div>
        </div>
        <div className="h-[280px]">
          <BarChart data={formattedMonthlyWonQuotes} height={260} />
        </div>
        <div className="text-xs text-[var(--muted-foreground)] mt-2">Won quote values in thousands ($K)</div>
      </div>

      {/* Customer Analysis - Won Quotes by Customer */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <RankingTable
          question="Declining Won Quote Revenue by Customer"
          columns={[
            { key: 'customer', label: 'Customer' },
            { key: 'lastYear', label: 'Won Quotes Last Year' },
            { key: 'thisYear', label: 'Won Quotes This Year' },
            { key: 'change', label: 'Change' },
          ]}
          data={decliningCustomers}
          highlightTop={0}
          highlightBottom={3}
        />

        <RankingTable
          question="Growing Won Quote Revenue by Customer"
          columns={[
            { key: 'customer', label: 'Customer' },
            { key: 'lastYear', label: 'Won Quotes Last Year' },
            { key: 'thisYear', label: 'Won Quotes This Year' },
            { key: 'change', label: 'Change' },
          ]}
          data={growingCustomers}
          highlightTop={3}
        />
      </div>

      {/* Rep Performance */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Rep Performance - Won Quotes vs Quota</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Rep</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Quota</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Won Quotes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Attainment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Active Quotes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {repPerformance.map((rep, idx) => {
                const attainmentNum = parseInt(rep.attainment);
                const barColor = attainmentNum >= 80 ? '#10b981' : attainmentNum >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{rep.rep}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.quota}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.actual}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${attainmentNum >= 80 ? 'text-[var(--success)]' : attainmentNum >= 50 ? 'text-[var(--warning)]' : 'text-[var(--destructive)]'}`}>
                        {rep.attainment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{rep.pipeline}</td>
                    <td className="px-4 py-3">
                      <div className="w-32 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
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

      {/* Manufacturer Performance */}
      <div className="mb-6">
        <RankingTable
          question="Won Quote Revenue by Manufacturer (YoY)"
          columns={[
            { key: 'manufacturer', label: 'Manufacturer' },
            { key: 'lastYear', label: 'Won Quotes Last Year' },
            { key: 'thisYear', label: 'Won Quotes This Year' },
            { key: 'change', label: 'Change' },
          ]}
          data={manufacturerPerformance}
          highlightBottom={3}
        />
      </div>
    </div>
  );
}
