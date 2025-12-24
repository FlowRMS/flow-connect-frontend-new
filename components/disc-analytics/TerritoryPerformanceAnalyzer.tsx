'use client';

import React, { useState } from 'react';

// Data Source Tag Component
function DataSourceTag({ source }: { source: 'data-search' | 'market-track' }) {
  const isDataSearch = source === 'data-search';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isDataSearch
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isDataSearch ? (
          <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>
        ) : (
          <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>
        )}
      </svg>
      {isDataSearch ? 'Data Search' : 'Market Track'}
    </span>
  );
}

// Info Tooltip Component - shows calculation methodology on hover
function InfoTooltip({ content }: { content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-help"
        aria-label="More information"
      >
        ?
      </button>
      {isVisible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none">
          <div className="whitespace-pre-line">{content}</div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

// Requirements Tag Component
type RequirementType = 'sales' | 'trading-areas' | 'territories' | 'products';

function RequiresTag({ requires }: { requires: RequirementType[] }) {
  const getConfig = (type: RequirementType) => {
    switch (type) {
      case 'sales':
        return { label: 'Sales', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
      case 'trading-areas':
        return { label: 'Trading Areas', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' };
      case 'territories':
        return { label: 'Territories', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' };
      case 'products':
        return { label: 'Products', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' };
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {requires.map((req) => {
        const config = getConfig(req);
        return (
          <span
            key={req}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color}`}
            title={`Requires ${config.label} data`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={config.icon} />
            </svg>
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

// Types
type Territory = {
  id: string;
  name: string;
  rep: string;
  revenue: number;
  marketPotential: number;
  penetrationRate: number;
  revenuePerCapita: number;
  growthRate: number;
  opportunities: number;
  status: 'exceeding' | 'meeting' | 'underperforming';
};

type RegionData = {
  name: string;
  revenue: number;
  potential: number;
  penetration: number;
};

// Sample data
const territories: Territory[] = [
  { id: '1', name: 'Southwest Region', rep: 'Sarah Chen', revenue: 4850000, marketPotential: 8200000, penetrationRate: 59.1, revenuePerCapita: 142, growthRate: 12.4, opportunities: 48, status: 'exceeding' },
  { id: '2', name: 'Pacific Northwest', rep: 'Mike Rodriguez', revenue: 3200000, marketPotential: 4100000, penetrationRate: 78.0, revenuePerCapita: 198, growthRate: 8.2, opportunities: 23, status: 'exceeding' },
  { id: '3', name: 'Mountain West', rep: 'Alex Thompson', revenue: 2100000, marketPotential: 5500000, penetrationRate: 38.2, revenuePerCapita: 89, growthRate: 3.1, opportunities: 67, status: 'underperforming' },
  { id: '4', name: 'Central Plains', rep: 'Jennifer Park', revenue: 1850000, marketPotential: 3800000, penetrationRate: 48.7, revenuePerCapita: 112, growthRate: 5.6, opportunities: 42, status: 'meeting' },
  { id: '5', name: 'Great Lakes', rep: 'David Kim', revenue: 3900000, marketPotential: 7200000, penetrationRate: 54.2, revenuePerCapita: 134, growthRate: 7.8, opportunities: 56, status: 'meeting' },
  { id: '6', name: 'Northeast Corridor', rep: 'Rachel Adams', revenue: 5200000, marketPotential: 9100000, penetrationRate: 57.1, revenuePerCapita: 156, growthRate: 9.4, opportunities: 71, status: 'meeting' },
  { id: '7', name: 'Southeast', rep: 'James Wilson', revenue: 4100000, marketPotential: 8800000, penetrationRate: 46.6, revenuePerCapita: 98, growthRate: 4.2, opportunities: 89, status: 'underperforming' },
  { id: '8', name: 'Texas & Gulf', rep: 'Maria Garcia', revenue: 5800000, marketPotential: 10200000, penetrationRate: 56.9, revenuePerCapita: 145, growthRate: 11.2, opportunities: 63, status: 'exceeding' },
];

const regionHeatmapData: RegionData[] = [
  { name: 'CA', revenue: 2800, potential: 4500, penetration: 62 },
  { name: 'TX', revenue: 3200, potential: 5100, penetration: 63 },
  { name: 'FL', revenue: 1800, potential: 4200, penetration: 43 },
  { name: 'NY', revenue: 2400, potential: 3800, penetration: 63 },
  { name: 'WA', revenue: 1600, potential: 2100, penetration: 76 },
  { name: 'CO', revenue: 1200, potential: 2800, penetration: 43 },
  { name: 'AZ', revenue: 1400, potential: 2600, penetration: 54 },
  { name: 'GA', revenue: 1100, potential: 2900, penetration: 38 },
  { name: 'IL', revenue: 1900, potential: 3400, penetration: 56 },
  { name: 'OH', revenue: 1500, potential: 3100, penetration: 48 },
];

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'exceeding': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    case 'meeting': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'underperforming': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getPenetrationColor = (penetration: number): string => {
  if (penetration >= 70) return '#22C55E';
  if (penetration >= 50) return '#EAB308';
  if (penetration >= 30) return '#F97316';
  return '#EF4444';
};

export default function TerritoryPerformanceAnalyzer() {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [sortBy, setSortBy] = useState<'revenue' | 'penetration' | 'growth'>('revenue');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Calculate totals
  const totalRevenue = territories.reduce((sum, t) => sum + t.revenue, 0);
  const totalPotential = territories.reduce((sum, t) => sum + t.marketPotential, 0);
  const avgPenetration = (totalRevenue / totalPotential) * 100;
  const avgGrowth = territories.reduce((sum, t) => sum + t.growthRate, 0) / territories.length;

  // Sort territories
  const sortedTerritories = [...territories].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return b.revenue - a.revenue;
      case 'penetration': return b.penetrationRate - a.penetrationRate;
      case 'growth': return b.growthRate - a.growthRate;
      default: return 0;
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Territory Performance Analyzer</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            <span className="font-medium">For Sales Managers & Regional Directors</span> — Optimize territory assignments, identify underperforming regions, and allocate resources effectively
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Cards
            </button>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Total Revenue</div>
              <InfoTooltip content="Sum of all territory revenue. Calculation: Σ(Territory Revenue). Source: Sales data filtered by territory assignments." />
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{formatCurrency(totalRevenue)}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-green-600 dark:text-green-400">+8.3% vs last quarter</span>
            <RequiresTag requires={['sales', 'territories']} />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Market Potential</div>
              <InfoTooltip content="Total addressable market (TAM) across all territories. Calculated from Market Track data using industry sizing models." />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{formatCurrency(totalPotential)}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Total addressable market</span>
            <DataSourceTag source="market-track" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Avg Penetration</div>
              <InfoTooltip content="Average market penetration rate. Calculation: Avg(Territory Revenue ÷ Territory Market Potential) × 100" />
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{avgPenetration.toFixed(1)}%</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-yellow-600 dark:text-yellow-400">{(100 - avgPenetration).toFixed(1)}% untapped</span>
            <RequiresTag requires={['sales', 'territories']} />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Avg Growth Rate</div>
              <InfoTooltip content="Average YoY growth rate across territories. Calculation: Avg((Current Year Revenue - Prior Year Revenue) ÷ Prior Year Revenue) × 100" />
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                <path d="M23 6l-9.5 9.5-5-5L1 18"/>
                <path d="M17 6h6v6"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{avgGrowth.toFixed(1)}%</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Year over year</span>
            <RequiresTag requires={['sales']} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Territory Performance Heat Map */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">What is our market penetration rate by territory?</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Revenue captured vs total market potential by state</p>
            </div>
            <div className="flex items-center gap-2">
              <RequiresTag requires={['sales', 'territories']} />
              <DataSourceTag source="market-track" />
            </div>
          </div>

          {/* Simple Heat Map Grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {regionHeatmapData.map((region) => (
              <div
                key={region.name}
                className="relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: getPenetrationColor(region.penetration) }}
              >
                <div className="text-white font-bold text-lg">{region.name}</div>
                <div className="text-white/90 text-xs">{region.penetration}%</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
              <span>&lt;30%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></div>
              <span>30-50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EAB308' }}></div>
              <span>50-70%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }}></div>
              <span>&gt;70%</span>
            </div>
          </div>
        </div>

        {/* Opportunity Gap Analysis */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--foreground)]">Where are we underperforming relative to market opportunity?</h3>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <RequiresTag requires={['sales', 'territories']} />
            <DataSourceTag source="market-track" />
          </div>
          <div className="space-y-4">
            {territories
              .filter(t => t.status === 'underperforming')
              .sort((a, b) => (b.marketPotential - b.revenue) - (a.marketPotential - a.revenue))
              .slice(0, 4)
              .map((territory) => {
                const gap = territory.marketPotential - territory.revenue;
                const gapPercent = ((gap / territory.marketPotential) * 100).toFixed(0);
                return (
                  <div key={territory.id} className="p-3 bg-[var(--muted)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm text-[var(--foreground)]">{territory.name}</div>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">{gapPercent}% gap</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mb-2">Rep: {territory.rep}</div>
                    <div className="w-full bg-[var(--border)] rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${territory.penetrationRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                      <span>{formatCurrency(territory.revenue)}</span>
                      <span>{formatCurrency(territory.marketPotential)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Territory Table/Cards */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Which territories/regions are generating the most revenue vs. potential?</h3>
            <div className="flex items-center gap-2 mt-2">
              <RequiresTag requires={['sales', 'territories']} />
              <DataSourceTag source="market-track" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'revenue' | 'penetration' | 'growth')}
              className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
            >
              <option value="revenue">Revenue</option>
              <option value="penetration">Penetration</option>
              <option value="growth">Growth Rate</option>
            </select>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Territory</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Rep</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Market Potential</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Penetration</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">$/Capita</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Growth</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTerritories.map((territory) => (
                  <tr
                    key={territory.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTerritory(territory)}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-[var(--foreground)]">{territory.name}</td>
                    <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">{territory.rep}</td>
                    <td className="py-3 px-4 text-sm text-[var(--foreground)] text-right">{formatCurrency(territory.revenue)}</td>
                    <td className="py-3 px-4 text-sm text-[var(--muted-foreground)] text-right">{formatCurrency(territory.marketPotential)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-[var(--border)] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${territory.penetrationRate}%`,
                              backgroundColor: getPenetrationColor(territory.penetrationRate)
                            }}
                          />
                        </div>
                        <span className="text-sm text-[var(--foreground)]">{territory.penetrationRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--foreground)] text-right">${territory.revenuePerCapita}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={territory.growthRate >= 8 ? 'text-green-600 dark:text-green-400' : territory.growthRate >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                        {territory.growthRate > 0 ? '+' : ''}{territory.growthRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(territory.status)}`}>
                        {territory.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedTerritories.map((territory) => (
              <div
                key={territory.id}
                className="p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 cursor-pointer transition-colors"
                onClick={() => setSelectedTerritory(territory)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-sm text-[var(--foreground)]">{territory.name}</div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(territory.status)}`}>
                    {territory.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mb-3">{territory.rep}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Revenue</span>
                    <span className="font-medium text-[var(--foreground)]">{formatCurrency(territory.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Penetration</span>
                    <span className="font-medium text-[var(--foreground)]">{territory.penetrationRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Growth</span>
                    <span className={territory.growthRate >= 8 ? 'font-medium text-green-600 dark:text-green-400' : 'font-medium text-[var(--foreground)]'}>
                      {territory.growthRate > 0 ? '+' : ''}{territory.growthRate}%
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-[var(--border)] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${territory.penetrationRate}%`,
                        backgroundColor: getPenetrationColor(territory.penetrationRate)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Benchmark Comparison */}
      <div className="mt-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--foreground)]">Which sales reps/territories need additional support or resources?</h3>
          <div className="flex items-center gap-2">
            <RequiresTag requires={['sales', 'territories']} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-[var(--muted-foreground)] mb-3">Revenue vs Target</div>
            <div className="space-y-3">
              {sortedTerritories.slice(0, 5).map((t) => {
                const targetPercent = Math.min((t.revenue / (t.marketPotential * 0.6)) * 100, 100);
                return (
                  <div key={t.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--foreground)]">{t.name}</span>
                      <span className="text-[var(--muted-foreground)]">{targetPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[var(--primary)]"
                        style={{ width: `${targetPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm text-[var(--muted-foreground)] mb-3">Growth Rate Distribution</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground)]">High Growth (&gt;10%)</span>
                <span className="font-medium text-green-600 dark:text-green-400">{territories.filter(t => t.growthRate > 10).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground)]">Medium Growth (5-10%)</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">{territories.filter(t => t.growthRate >= 5 && t.growthRate <= 10).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground)]">Low Growth (&lt;5%)</span>
                <span className="font-medium text-red-600 dark:text-red-400">{territories.filter(t => t.growthRate < 5).length}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-[var(--muted-foreground)] mb-3">Top Opportunities</div>
            <div className="space-y-2">
              {territories
                .sort((a, b) => b.opportunities - a.opportunities)
                .slice(0, 3)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--foreground)]">{t.name}</span>
                    <span className="font-medium text-[var(--primary)]">{t.opportunities} opps</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Territory Detail Modal */}
      {selectedTerritory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTerritory(null)}>
          <div className="bg-[var(--background)] rounded-xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedTerritory.name}</h2>
              <button onClick={() => setSelectedTerritory(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-[var(--muted)] rounded-lg">
                <div className="text-sm text-[var(--muted-foreground)]">Sales Rep</div>
                <div className="text-lg font-medium text-[var(--foreground)]">{selectedTerritory.rep}</div>
              </div>
              <div className="p-4 bg-[var(--muted)] rounded-lg">
                <div className="text-sm text-[var(--muted-foreground)]">Status</div>
                <div className={`text-lg font-medium capitalize ${selectedTerritory.status === 'exceeding' ? 'text-green-600' : selectedTerritory.status === 'meeting' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {selectedTerritory.status}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--muted-foreground)]">Revenue vs Market Potential</span>
                  <span className="text-[var(--foreground)]">{formatCurrency(selectedTerritory.revenue)} / {formatCurrency(selectedTerritory.marketPotential)}</span>
                </div>
                <div className="w-full bg-[var(--border)] rounded-full h-4">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-[var(--primary)] to-blue-400"
                    style={{ width: `${selectedTerritory.penetrationRate}%` }}
                  />
                </div>
                <div className="text-right text-sm text-[var(--muted-foreground)] mt-1">{selectedTerritory.penetrationRate}% penetration</div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">${selectedTerritory.revenuePerCapita}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Revenue per Capita</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${selectedTerritory.growthRate >= 8 ? 'text-green-600' : 'text-[var(--foreground)]'}`}>
                    {selectedTerritory.growthRate > 0 ? '+' : ''}{selectedTerritory.growthRate}%
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">Growth Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">{selectedTerritory.opportunities}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Open Opportunities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
