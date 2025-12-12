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
type MarketData = {
  id: string;
  region: string;
  marketValue: number;
  competitorCount: number;
  saturationLevel: 'low' | 'medium' | 'high';
  ourShare: number;
  tam: number;
  growthPotential: number;
  whiteSpaceScore: number;
  priorityRank: number;
};

type CompetitorDensity = {
  region: string;
  competitors: number;
  marketShare: number;
  avgCompetitorSize: 'small' | 'medium' | 'large';
};

type MarketTrend = {
  year: number;
  ourShare: number;
  competitorShare: number;
  unaddressed: number;
};

type EmergingMarket = {
  id: string;
  name: string;
  state: string;
  marketValue: number;
  currentPenetration: number;
  competitorDensity: 'low' | 'medium' | 'high';
  growthRate: number;
  recommendation: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
};

// Sample data
const marketData: MarketData[] = [
  { id: '1', region: 'Phoenix Metro', marketValue: 4200, competitorCount: 12, saturationLevel: 'medium', ourShare: 18.5, tam: 8400, growthPotential: 15.2, whiteSpaceScore: 78, priorityRank: 2 },
  { id: '2', region: 'Dallas-Fort Worth', marketValue: 5800, competitorCount: 18, saturationLevel: 'high', ourShare: 12.4, tam: 9200, growthPotential: 11.8, whiteSpaceScore: 62, priorityRank: 5 },
  { id: '3', region: 'Denver Metro', marketValue: 2900, competitorCount: 8, saturationLevel: 'low', ourShare: 24.6, tam: 5100, growthPotential: 18.4, whiteSpaceScore: 85, priorityRank: 1 },
  { id: '4', region: 'Atlanta Metro', marketValue: 4500, competitorCount: 15, saturationLevel: 'medium', ourShare: 15.8, tam: 7800, growthPotential: 13.6, whiteSpaceScore: 71, priorityRank: 3 },
  { id: '5', region: 'Seattle-Tacoma', marketValue: 3100, competitorCount: 10, saturationLevel: 'medium', ourShare: 21.2, tam: 5600, growthPotential: 14.2, whiteSpaceScore: 74, priorityRank: 4 },
  { id: '6', region: 'Miami-Fort Lauderdale', marketValue: 3800, competitorCount: 14, saturationLevel: 'high', ourShare: 11.2, tam: 6400, growthPotential: 10.4, whiteSpaceScore: 58, priorityRank: 7 },
  { id: '7', region: 'Houston Metro', marketValue: 5200, competitorCount: 16, saturationLevel: 'high', ourShare: 13.8, tam: 8100, growthPotential: 12.1, whiteSpaceScore: 64, priorityRank: 6 },
  { id: '8', region: 'Salt Lake City', marketValue: 1800, competitorCount: 5, saturationLevel: 'low', ourShare: 28.4, tam: 3200, growthPotential: 21.6, whiteSpaceScore: 91, priorityRank: 1 },
];

const competitorDensityData: CompetitorDensity[] = [
  { region: 'Southwest', competitors: 42, marketShare: 35, avgCompetitorSize: 'medium' },
  { region: 'Southeast', competitors: 58, marketShare: 42, avgCompetitorSize: 'large' },
  { region: 'Midwest', competitors: 35, marketShare: 28, avgCompetitorSize: 'small' },
  { region: 'Northeast', competitors: 48, marketShare: 38, avgCompetitorSize: 'medium' },
  { region: 'West', competitors: 38, marketShare: 32, avgCompetitorSize: 'medium' },
];

const marketTrends: MarketTrend[] = [
  { year: 2020, ourShare: 14.2, competitorShare: 52.8, unaddressed: 33.0 },
  { year: 2021, ourShare: 15.8, competitorShare: 54.2, unaddressed: 30.0 },
  { year: 2022, ourShare: 17.4, competitorShare: 55.1, unaddressed: 27.5 },
  { year: 2023, ourShare: 18.9, competitorShare: 55.6, unaddressed: 25.5 },
  { year: 2024, ourShare: 20.1, competitorShare: 56.2, unaddressed: 23.7 },
];

const emergingMarkets: EmergingMarket[] = [
  { id: '1', name: 'Boise Metro', state: 'ID', marketValue: 890, currentPenetration: 8.2, competitorDensity: 'low', growthRate: 24.5, recommendation: 'Establish presence immediately', urgency: 'immediate' },
  { id: '2', name: 'Austin Metro', state: 'TX', marketValue: 2100, currentPenetration: 12.4, competitorDensity: 'medium', growthRate: 19.8, recommendation: 'Expand sales team', urgency: 'immediate' },
  { id: '3', name: 'Raleigh-Durham', state: 'NC', marketValue: 1450, currentPenetration: 15.6, competitorDensity: 'low', growthRate: 17.2, recommendation: 'Increase marketing spend', urgency: 'short-term' },
  { id: '4', name: 'Nashville Metro', state: 'TN', marketValue: 1680, currentPenetration: 11.8, competitorDensity: 'medium', growthRate: 16.4, recommendation: 'Open distribution center', urgency: 'short-term' },
  { id: '5', name: 'Las Vegas Metro', state: 'NV', marketValue: 1920, currentPenetration: 18.2, competitorDensity: 'medium', growthRate: 14.8, recommendation: 'Defend market position', urgency: 'long-term' },
  { id: '6', name: 'Charlotte Metro', state: 'NC', marketValue: 1580, currentPenetration: 14.2, competitorDensity: 'low', growthRate: 15.6, recommendation: 'Partner with local distributors', urgency: 'short-term' },
];

// Helper functions
const getSaturationColor = (level: string): string => {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'immediate': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'short-term': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'long-term': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getWhiteSpaceColor = (score: number): string => {
  if (score >= 80) return '#22C55E';
  if (score >= 65) return '#84CC16';
  if (score >= 50) return '#EAB308';
  return '#F97316';
};

const formatCurrency = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value}M`;
};

export default function CompetitiveMarketIntelligence() {
  const [selectedView, setSelectedView] = useState<'saturation' | 'whitespace' | 'emerging'>('saturation');
  const [sortBy, setSortBy] = useState<'priority' | 'whitespace' | 'growth'>('priority');

  // Calculate totals
  const totalTAM = marketData.reduce((sum, m) => sum + m.tam, 0);
  const avgOurShare = marketData.reduce((sum, m) => sum + m.ourShare, 0) / marketData.length;
  const avgWhiteSpace = marketData.reduce((sum, m) => sum + m.whiteSpaceScore, 0) / marketData.length;
  const lowSaturationMarkets = marketData.filter(m => m.saturationLevel === 'low').length;

  // Sort markets
  const sortedMarkets = [...marketData].sort((a, b) => {
    switch (sortBy) {
      case 'priority': return a.priorityRank - b.priorityRank;
      case 'whitespace': return b.whiteSpaceScore - a.whiteSpaceScore;
      case 'growth': return b.growthPotential - a.growthPotential;
      default: return 0;
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Competitive Market Intelligence</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            <span className="font-medium">For Strategic Planners & Market Analysts</span> — Discover underserved markets, analyze competitive density, and prioritize expansion opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            {(['saturation', 'whitespace', 'emerging'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  selectedView === view
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {view === 'whitespace' ? 'White Space' : view}
              </button>
            ))}
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
              <div className="text-sm text-[var(--muted-foreground)]">Total Addressable Market</div>
              <InfoTooltip content="Sum of Total Addressable Market (TAM) across all analyzed geographic markets. Source: Market Track industry sizing data." />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{formatCurrency(totalTAM)}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Across analyzed markets</span>
            <DataSourceTag source="market-track" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Our Avg Market Share</div>
              <InfoTooltip content="Average market share across all territories. Calculation: Avg(Our Sales ÷ Total Market Value) × 100 for each region." />
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{avgOurShare.toFixed(1)}%</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-green-600 dark:text-green-400">+2.4% vs last year</span>
            <RequiresTag requires={['sales', 'territories']} />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Avg White Space Score</div>
              <InfoTooltip content="Average white space opportunity score (0-100). Calculation: (1 - Saturation Level) × Growth Potential × Market Size weighting." />
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{avgWhiteSpace.toFixed(0)}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Higher = more opportunity</span>
            <DataSourceTag source="market-track" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Low Saturation Markets</div>
              <InfoTooltip content="Count of markets with 'low' competitive saturation level. Low saturation indicates fewer than 5 major competitors in the region." />
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{lowSaturationMarkets}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-yellow-600 dark:text-yellow-400">Prime expansion targets</span>
            <DataSourceTag source="data-search" />
          </div>
        </div>
      </div>

      {selectedView === 'saturation' && (
        <>
          {/* Market Saturation Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Saturation Map */}
            <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">Which markets have the lowest competitive saturation?</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <RequiresTag requires={['sales', 'territories']} />
                    <DataSourceTag source="market-track" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted-foreground)]">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'priority' | 'whitespace' | 'growth')}
                    className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                  >
                    <option value="priority">Priority Rank</option>
                    <option value="whitespace">White Space</option>
                    <option value="growth">Growth Potential</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">#</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Market</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Market Value</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Competitors</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Saturation</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Our Share</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">White Space</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMarkets.map((market, idx) => (
                      <tr key={market.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-[var(--foreground)]">{market.region}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">TAM: {formatCurrency(market.tam)}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--foreground)] text-right">{formatCurrency(market.marketValue)}</td>
                        <td className="py-3 px-4 text-sm text-[var(--foreground)] text-center">{market.competitorCount}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getSaturationColor(market.saturationLevel)}`}>
                            {market.saturationLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--foreground)] text-right">{market.ourShare}%</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: getWhiteSpaceColor(market.whiteSpaceScore) }}
                            >
                              {market.whiteSpaceScore}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitor Density by Region */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--foreground)]">How many competitors are active in each region?</h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <DataSourceTag source="market-track" />
              </div>
              <div className="space-y-4">
                {competitorDensityData.map((data, idx) => (
                  <div key={idx} className="p-3 bg-[var(--muted)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{data.region}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{data.competitors} competitors</span>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${data.marketShare}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Combined share: {data.marketShare}%</span>
                      <span className="capitalize">{data.avgCompetitorSize} players</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Share Trends */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--foreground)]">How is our market share trending vs competitors?</h3>
              <div className="flex items-center gap-2">
                <RequiresTag requires={['sales']} />
                <DataSourceTag source="market-track" />
              </div>
            </div>
            <div className="h-64 flex items-end gap-4">
              {marketTrends.map((trend, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col-reverse h-48 gap-1">
                    <div
                      className="w-full bg-[var(--primary)] rounded-t"
                      style={{ height: `${(trend.ourShare / 100) * 200}%` }}
                      title={`Our Share: ${trend.ourShare}%`}
                    />
                    <div
                      className="w-full bg-red-400"
                      style={{ height: `${(trend.competitorShare / 100) * 200}%` }}
                      title={`Competitor Share: ${trend.competitorShare}%`}
                    />
                    <div
                      className="w-full bg-gray-300 dark:bg-gray-600 rounded-b"
                      style={{ height: `${(trend.unaddressed / 100) * 200}%` }}
                      title={`Unaddressed: ${trend.unaddressed}%`}
                    />
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)] mt-2">{trend.year}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[var(--primary)]"></div>
                <span className="text-[var(--muted-foreground)]">Our Share</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-400"></div>
                <span className="text-[var(--muted-foreground)]">Competitor Share</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600"></div>
                <span className="text-[var(--muted-foreground)]">Unaddressed Market</span>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'whitespace' && (
        <>
          {/* White Space Identification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* White Space Matrix */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--foreground)]">Where are the largest untapped market opportunities?</h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <RequiresTag requires={['sales', 'territories']} />
                <DataSourceTag source="market-track" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mb-4">High market value + Low competition = Prime opportunity</p>

              {/* Quadrant Chart Visualization */}
              <div className="relative h-72 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
                {/* Quadrant Labels */}
                <div className="absolute top-2 left-2 text-xs text-[var(--muted-foreground)]">Low Value / Low Competition</div>
                <div className="absolute top-2 right-2 text-xs text-[var(--muted-foreground)]">High Value / Low Competition</div>
                <div className="absolute bottom-2 left-2 text-xs text-[var(--muted-foreground)]">Low Value / High Competition</div>
                <div className="absolute bottom-2 right-2 text-xs text-[var(--muted-foreground)]">High Value / High Competition</div>

                {/* Axes */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border)]"></div>

                {/* Data Points */}
                {marketData.map((market) => {
                  const x = ((market.marketValue / 6000) * 80) + 10;
                  const y = 90 - ((market.competitorCount / 20) * 80);
                  return (
                    <div
                      key={market.id}
                      className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white text-xs font-medium cursor-pointer transition-transform hover:scale-125"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: getWhiteSpaceColor(market.whiteSpaceScore),
                      }}
                      title={`${market.region}: White Space ${market.whiteSpaceScore}`}
                    >
                      {market.whiteSpaceScore}
                    </div>
                  );
                })}

                {/* Axis Labels */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-6 text-xs text-[var(--muted-foreground)]">Market Value →</div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 -ml-8 text-xs text-[var(--muted-foreground)]">Competition ↑</div>

                {/* Prime Zone Highlight */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-green-500/10 rounded-tr-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-green-600 dark:text-green-400">
                    Prime Zone
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Ranking */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--foreground)]">Which markets should we enter first?</h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <DataSourceTag source="market-track" />
              </div>
              <div className="space-y-3">
                {[...marketData]
                  .sort((a, b) => a.priorityRank - b.priorityRank)
                  .slice(0, 6)
                  .map((market) => (
                    <div key={market.id} className="flex items-center gap-4 p-3 bg-[var(--muted)] rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        market.priorityRank <= 2 ? 'bg-green-500' : market.priorityRank <= 4 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}>
                        {market.priorityRank}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--foreground)]">{market.region}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          Growth: {market.growthPotential}% | White Space: {market.whiteSpaceScore}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(market.tam)}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">TAM</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Opportunity Analysis */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Opportunity Analysis Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">Immediate Opportunities</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
                  {marketData.filter(m => m.saturationLevel === 'low').length}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Low saturation markets with high potential. Combined TAM: {formatCurrency(
                    marketData.filter(m => m.saturationLevel === 'low').reduce((s, m) => s + m.tam, 0)
                  )}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Growth Potential</span>
                </div>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                  {marketData.reduce((s, m) => s + m.growthPotential, 0) / marketData.length}%
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Average growth rate across identified markets. Top market: {
                    [...marketData].sort((a, b) => b.growthPotential - a.growthPotential)[0].region
                  }
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Revenue Opportunity</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                  {formatCurrency(
                    marketData.reduce((s, m) => s + (m.tam * (1 - m.ourShare / 100)), 0)
                  )}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Uncaptured market value across all regions based on current penetration
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'emerging' && (
        <>
          {/* Emerging Markets */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Where are the highest-growth emerging market opportunities?</h3>
                <div className="flex items-center gap-2 mt-2">
                  <RequiresTag requires={['trading-areas']} />
                  <DataSourceTag source="data-search" />
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">High-growth markets with low competitive density</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergingMarkets.map((market) => (
                <div key={market.id} className="p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{market.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{market.state}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getUrgencyColor(market.urgency)}`}>
                      {market.urgency}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)]">Market Value</div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(market.marketValue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)]">Growth Rate</div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">+{market.growthRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)]">Our Penetration</div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{market.currentPenetration}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)]">Competition</div>
                      <div className={`text-sm font-medium capitalize ${
                        market.competitorDensity === 'low' ? 'text-green-600 dark:text-green-400' :
                        market.competitorDensity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {market.competitorDensity}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Recommendation</div>
                    <div className="text-sm text-[var(--primary)]">{market.recommendation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Entry Strategy */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <h3 className="font-semibold text-[var(--foreground)]">What should be our market entry strategy timeline?</h3>
              <div className="flex items-center gap-2 mt-2 mb-4">
                <RequiresTag requires={['trading-areas', 'territories']} />
                <DataSourceTag source="data-search" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Immediate Action (0-3 months)</span>
                </div>
                <div className="space-y-2">
                  {emergingMarkets.filter(m => m.urgency === 'immediate').map(m => (
                    <div key={m.id} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                      <div className="font-medium text-red-800 dark:text-red-300">{m.name}</div>
                      <div className="text-red-600 dark:text-red-400">{m.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Short-term (3-6 months)</span>
                </div>
                <div className="space-y-2">
                  {emergingMarkets.filter(m => m.urgency === 'short-term').map(m => (
                    <div key={m.id} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                      <div className="font-medium text-yellow-800 dark:text-yellow-300">{m.name}</div>
                      <div className="text-yellow-600 dark:text-yellow-400">{m.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">3</div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Long-term (6-12 months)</span>
                </div>
                <div className="space-y-2">
                  {emergingMarkets.filter(m => m.urgency === 'long-term').map(m => (
                    <div key={m.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                      <div className="font-medium text-blue-800 dark:text-blue-300">{m.name}</div>
                      <div className="text-blue-600 dark:text-blue-400">{m.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
