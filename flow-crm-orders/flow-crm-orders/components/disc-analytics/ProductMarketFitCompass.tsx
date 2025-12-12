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
type ProductCategory = {
  id: string;
  name: string;
  code: string;
};

type RegionProductFit = {
  region: string;
  regionName: string;
  products: Record<string, {
    fitScore: number;
    growthRate: number;
    marketSize: number;
    economicCorrelation: number;
  }>;
};

type EconomicIndicator = {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  correlation: number;
};

type ProductTrend = {
  productId: string;
  productName: string;
  region: string;
  trend: 'growing' | 'stable' | 'declining';
  changePercent: number;
  forecast: number[];
};

// Sample data
const productCategories: ProductCategory[] = [
  { id: 'electrical', name: 'Electrical Equipment', code: 'ELEC' },
  { id: 'plumbing', name: 'Plumbing Supplies', code: 'PLMB' },
  { id: 'hvac', name: 'HVAC Systems', code: 'HVAC' },
  { id: 'safety', name: 'Safety Equipment', code: 'SAFE' },
  { id: 'tools', name: 'Tools & Hardware', code: 'TOOL' },
  { id: 'lighting', name: 'Lighting Solutions', code: 'LITE' },
];

const regionProductData: RegionProductFit[] = [
  {
    region: 'SW',
    regionName: 'Southwest',
    products: {
      electrical: { fitScore: 85, growthRate: 12.4, marketSize: 2800, economicCorrelation: 0.82 },
      plumbing: { fitScore: 72, growthRate: 8.2, marketSize: 1900, economicCorrelation: 0.68 },
      hvac: { fitScore: 92, growthRate: 15.1, marketSize: 3200, economicCorrelation: 0.91 },
      safety: { fitScore: 68, growthRate: 5.4, marketSize: 890, economicCorrelation: 0.54 },
      tools: { fitScore: 78, growthRate: 7.8, marketSize: 1450, economicCorrelation: 0.72 },
      lighting: { fitScore: 81, growthRate: 9.6, marketSize: 1680, economicCorrelation: 0.76 },
    },
  },
  {
    region: 'SE',
    regionName: 'Southeast',
    products: {
      electrical: { fitScore: 79, growthRate: 9.8, marketSize: 3100, economicCorrelation: 0.74 },
      plumbing: { fitScore: 88, growthRate: 11.2, marketSize: 2400, economicCorrelation: 0.85 },
      hvac: { fitScore: 95, growthRate: 16.8, marketSize: 4100, economicCorrelation: 0.94 },
      safety: { fitScore: 71, growthRate: 6.2, marketSize: 980, economicCorrelation: 0.62 },
      tools: { fitScore: 74, growthRate: 7.1, marketSize: 1380, economicCorrelation: 0.68 },
      lighting: { fitScore: 76, growthRate: 8.4, marketSize: 1520, economicCorrelation: 0.71 },
    },
  },
  {
    region: 'MW',
    regionName: 'Midwest',
    products: {
      electrical: { fitScore: 82, growthRate: 8.9, marketSize: 2600, economicCorrelation: 0.78 },
      plumbing: { fitScore: 75, growthRate: 6.8, marketSize: 1850, economicCorrelation: 0.65 },
      hvac: { fitScore: 78, growthRate: 7.4, marketSize: 2100, economicCorrelation: 0.72 },
      safety: { fitScore: 84, growthRate: 9.2, marketSize: 1200, economicCorrelation: 0.81 },
      tools: { fitScore: 89, growthRate: 10.5, marketSize: 1980, economicCorrelation: 0.86 },
      lighting: { fitScore: 72, growthRate: 6.1, marketSize: 1340, economicCorrelation: 0.64 },
    },
  },
  {
    region: 'NE',
    regionName: 'Northeast',
    products: {
      electrical: { fitScore: 86, growthRate: 7.6, marketSize: 3400, economicCorrelation: 0.79 },
      plumbing: { fitScore: 81, growthRate: 6.4, marketSize: 2100, economicCorrelation: 0.73 },
      hvac: { fitScore: 74, growthRate: 5.8, marketSize: 1950, economicCorrelation: 0.67 },
      safety: { fitScore: 91, growthRate: 11.8, marketSize: 1580, economicCorrelation: 0.89 },
      tools: { fitScore: 77, growthRate: 5.9, marketSize: 1620, economicCorrelation: 0.69 },
      lighting: { fitScore: 88, growthRate: 8.9, marketSize: 2080, economicCorrelation: 0.84 },
    },
  },
  {
    region: 'WE',
    regionName: 'West',
    products: {
      electrical: { fitScore: 91, growthRate: 14.2, marketSize: 4200, economicCorrelation: 0.88 },
      plumbing: { fitScore: 78, growthRate: 9.1, marketSize: 2800, economicCorrelation: 0.71 },
      hvac: { fitScore: 85, growthRate: 11.4, marketSize: 3600, economicCorrelation: 0.82 },
      safety: { fitScore: 76, growthRate: 7.8, marketSize: 1320, economicCorrelation: 0.68 },
      tools: { fitScore: 82, growthRate: 8.6, marketSize: 2100, economicCorrelation: 0.76 },
      lighting: { fitScore: 93, growthRate: 13.2, marketSize: 2900, economicCorrelation: 0.91 },
    },
  },
];

const economicIndicators: Record<string, EconomicIndicator[]> = {
  SW: [
    { name: 'Construction Permits', value: 12800, trend: 'up', correlation: 0.89 },
    { name: 'Housing Starts', value: 8400, trend: 'up', correlation: 0.84 },
    { name: 'Manufacturing Output', value: 142, trend: 'stable', correlation: 0.72 },
    { name: 'Population Growth', value: 2.8, trend: 'up', correlation: 0.91 },
  ],
  SE: [
    { name: 'Construction Permits', value: 15200, trend: 'up', correlation: 0.92 },
    { name: 'Housing Starts', value: 11200, trend: 'up', correlation: 0.88 },
    { name: 'Manufacturing Output', value: 128, trend: 'up', correlation: 0.76 },
    { name: 'Population Growth', value: 3.2, trend: 'up', correlation: 0.94 },
  ],
  MW: [
    { name: 'Construction Permits', value: 9800, trend: 'stable', correlation: 0.78 },
    { name: 'Housing Starts', value: 6200, trend: 'stable', correlation: 0.71 },
    { name: 'Manufacturing Output', value: 186, trend: 'up', correlation: 0.86 },
    { name: 'Population Growth', value: 0.8, trend: 'stable', correlation: 0.62 },
  ],
  NE: [
    { name: 'Construction Permits', value: 8400, trend: 'stable', correlation: 0.74 },
    { name: 'Housing Starts', value: 5100, trend: 'down', correlation: 0.68 },
    { name: 'Manufacturing Output', value: 156, trend: 'stable', correlation: 0.79 },
    { name: 'Population Growth', value: 0.4, trend: 'stable', correlation: 0.58 },
  ],
  WE: [
    { name: 'Construction Permits', value: 18600, trend: 'up', correlation: 0.91 },
    { name: 'Housing Starts', value: 14200, trend: 'up', correlation: 0.87 },
    { name: 'Manufacturing Output', value: 168, trend: 'up', correlation: 0.82 },
    { name: 'Population Growth', value: 2.1, trend: 'up', correlation: 0.85 },
  ],
};

const productTrends: ProductTrend[] = [
  { productId: 'hvac', productName: 'HVAC Systems', region: 'SE', trend: 'growing', changePercent: 16.8, forecast: [100, 108, 118, 132, 148] },
  { productId: 'electrical', productName: 'Electrical Equipment', region: 'WE', trend: 'growing', changePercent: 14.2, forecast: [100, 106, 114, 124, 136] },
  { productId: 'lighting', productName: 'Lighting Solutions', region: 'WE', trend: 'growing', changePercent: 13.2, forecast: [100, 105, 112, 120, 130] },
  { productId: 'hvac', productName: 'HVAC Systems', region: 'SW', trend: 'growing', changePercent: 15.1, forecast: [100, 107, 116, 128, 142] },
  { productId: 'tools', productName: 'Tools & Hardware', region: 'MW', trend: 'growing', changePercent: 10.5, forecast: [100, 104, 110, 118, 128] },
  { productId: 'plumbing', productName: 'Plumbing Supplies', region: 'NE', trend: 'stable', changePercent: 6.4, forecast: [100, 102, 105, 109, 114] },
];

// Helper functions
const getFitColor = (score: number): string => {
  if (score >= 90) return '#22C55E';
  if (score >= 80) return '#84CC16';
  if (score >= 70) return '#EAB308';
  if (score >= 60) return '#F97316';
  return '#EF4444';
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'growing' | 'declining') => {
  if (trend === 'up' || trend === 'growing') {
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/></svg>;
  }
  if (trend === 'down' || trend === 'declining') {
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M23 18l-9.5-9.5-5 5L1 6"/></svg>;
  }
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2"><path d="M5 12h14"/></svg>;
};

const formatCurrency = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}M`;
  return `$${value}K`;
};

export default function ProductMarketFitCompass() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'trends'>('matrix');

  // Get best fit combinations
  const getBestFits = () => {
    const fits: { product: string; region: string; score: number; growth: number }[] = [];
    regionProductData.forEach(region => {
      Object.entries(region.products).forEach(([productId, data]) => {
        const product = productCategories.find(p => p.id === productId);
        if (product) {
          fits.push({
            product: product.name,
            region: region.regionName,
            score: data.fitScore,
            growth: data.growthRate,
          });
        }
      });
    });
    return fits.sort((a, b) => b.score - a.score).slice(0, 6);
  };

  const bestFits = getBestFits();

  // Calculate aggregate stats
  const totalMarketSize = regionProductData.reduce((sum, region) =>
    sum + Object.values(region.products).reduce((s, p) => s + p.marketSize, 0), 0
  );

  const avgFitScore = regionProductData.reduce((sum, region) =>
    sum + Object.values(region.products).reduce((s, p) => s + p.fitScore, 0), 0
  ) / (regionProductData.length * productCategories.length);

  const avgGrowthRate = regionProductData.reduce((sum, region) =>
    sum + Object.values(region.products).reduce((s, p) => s + p.growthRate, 0), 0
  ) / (regionProductData.length * productCategories.length);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Product-Market Fit Compass</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            <span className="font-medium">For Product Managers & Marketing Directors</span> — Align product strategy with regional demand and economic trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Fit Matrix
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'trends'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Trends
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
              <div className="text-sm text-[var(--muted-foreground)]">Total Market Size</div>
              <InfoTooltip content="Sum of market size across all product-region combinations. Source: Market Track data aggregated by product category and geography." />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{formatCurrency(totalMarketSize)}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Across all regions & products</span>
            <DataSourceTag source="market-track" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Avg Fit Score</div>
              <InfoTooltip content="Average product-market fit score (0-100). Calculated using: Sales performance × Regional demand correlation × Economic indicator alignment." />
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{avgFitScore.toFixed(1)}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-green-600 dark:text-green-400">Good product-market alignment</span>
            <RequiresTag requires={['sales', 'products']} />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">Avg Growth Rate</div>
              <InfoTooltip content="Average YoY growth rate across all product-region combinations. Calculation: Avg((Current Year Sales - Prior Year Sales) ÷ Prior Year Sales) × 100" />
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                <path d="M23 6l-9.5 9.5-5-5L1 18"/>
                <path d="M17 6h6v6"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">{avgGrowthRate.toFixed(1)}%</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Year over year</span>
            <DataSourceTag source="market-track" />
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="text-sm text-[var(--muted-foreground)]">High-Fit Combinations</div>
              <InfoTooltip content="Count of product-region pairs with fit score ≥ 85. High fit indicates strong demand alignment and growth potential." />
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-2">
            {regionProductData.reduce((sum, region) =>
              sum + Object.values(region.products).filter(p => p.fitScore >= 85).length, 0
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted-foreground)]">Score 85+</span>
            <RequiresTag requires={['products']} />
          </div>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <>
          {/* Product-Region Fit Matrix */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Which product lines have the best fit in which geographic markets?</h3>
                <div className="flex items-center gap-2 mt-2">
                  <RequiresTag requires={['sales', 'products', 'territories']} />
                  <DataSourceTag source="market-track" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                >
                  <option value="all">All Products</option>
                  {productCategories.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Product</th>
                    {regionProductData.map(region => (
                      <th key={region.region} className="text-center py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">
                        {region.regionName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productCategories
                    .filter(p => selectedProduct === 'all' || p.id === selectedProduct)
                    .map(product => (
                      <tr key={product.id} className="border-b border-[var(--border)]">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-[var(--foreground)]">{product.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{product.code}</div>
                        </td>
                        {regionProductData.map(region => {
                          const data = region.products[product.id as keyof typeof region.products];
                          return (
                            <td key={region.region} className="py-3 px-4">
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: getFitColor(data.fitScore) }}
                                >
                                  {data.fitScore}
                                </div>
                                <div className="text-xs text-[var(--muted-foreground)]">
                                  {data.growthRate > 0 ? '+' : ''}{data.growthRate}%
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-6 text-xs text-[var(--muted-foreground)]">
              <span className="font-medium">Fit Score:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }}></div>
                <span>90+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#84CC16' }}></div>
                <span>80-89</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EAB308' }}></div>
                <span>70-79</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></div>
                <span>60-69</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
                <span>&lt;60</span>
              </div>
            </div>
          </div>

          {/* Best Fits & Economic Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Product-Market Fits */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--foreground)]">Where should we focus product marketing and inventory investments?</h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <RequiresTag requires={['sales', 'products']} />
                <DataSourceTag source="market-track" />
              </div>
              <div className="space-y-3">
                {bestFits.map((fit, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: getFitColor(fit.score) }}
                      >
                        {fit.score}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{fit.product}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{fit.region}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        +{fit.growth}%
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">Growth</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Economic Correlation Analysis */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--foreground)]">What&apos;s the correlation between economic indicators and product demand?</h3>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                >
                  <option value="all">All Regions</option>
                  {regionProductData.map(r => (
                    <option key={r.region} value={r.region}>{r.regionName}</option>
                  ))}
                </select>
              </div>

              {selectedRegion !== 'all' && economicIndicators[selectedRegion] ? (
                <div className="space-y-4">
                  {economicIndicators[selectedRegion].map((indicator, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--foreground)]">{indicator.name}</span>
                          {getTrendIcon(indicator.trend)}
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {indicator.name.includes('Growth') ? `${indicator.value}%` : indicator.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[var(--border)] rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-[var(--primary)]"
                            style={{ width: `${indicator.correlation * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] w-12">
                          r={indicator.correlation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Higher correlation (r) indicates stronger relationship between economic indicator and product demand.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  Select a region to view economic correlations
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Product Trends View */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--foreground)]">Which products are growing/declining in specific regions?</h3>
              <div className="flex items-center gap-2">
                <RequiresTag requires={['sales', 'products', 'territories']} />
                <DataSourceTag source="market-track" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productTrends.map((trend, idx) => (
                <div key={idx} className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{trend.productName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{trend.region}</div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      trend.trend === 'growing'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : trend.trend === 'declining'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {getTrendIcon(trend.trend)}
                      <span className="capitalize">{trend.trend}</span>
                    </div>
                  </div>

                  {/* Mini Forecast Chart */}
                  <div className="h-16 flex items-end gap-1">
                    {trend.forecast.map((value, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[var(--primary)] rounded-t transition-all"
                        style={{
                          height: `${(value / Math.max(...trend.forecast)) * 100}%`,
                          opacity: 0.4 + (i * 0.15)
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                    <span>2024</span>
                    <span>2028</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs text-[var(--muted-foreground)]">Growth Rate</span>
                    <span className={`text-sm font-medium ${
                      trend.changePercent >= 10 ? 'text-green-600 dark:text-green-400' : 'text-[var(--foreground)]'
                    }`}>
                      +{trend.changePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Analysis */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Predictive Analysis: Emerging Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-[var(--muted-foreground)] mb-3">Markets with Rising Economic Indicators</div>
                <div className="space-y-3">
                  {[
                    { region: 'Southeast', indicator: 'Population Growth', value: '+3.2%', impact: 'HVAC, Plumbing demand surge expected' },
                    { region: 'West', indicator: 'Construction Permits', value: '+18.6K', impact: 'Electrical, Lighting high demand' },
                    { region: 'Southwest', indicator: 'Housing Starts', value: '+8.4K', impact: 'Full product portfolio opportunity' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-[var(--muted)] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">{item.region}</span>
                        <span className="text-xs text-green-600 dark:text-green-400">{item.value}</span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">{item.indicator}</div>
                      <div className="text-xs text-[var(--primary)] mt-1">{item.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-[var(--muted-foreground)] mb-3">Recommended Focus Areas</div>
                <div className="space-y-3">
                  {[
                    { product: 'HVAC Systems', action: 'Increase inventory', regions: ['SE', 'SW'], priority: 'high' },
                    { product: 'Lighting Solutions', action: 'Marketing push', regions: ['WE'], priority: 'high' },
                    { product: 'Electrical Equipment', action: 'Expand distribution', regions: ['WE', 'SW'], priority: 'medium' },
                    { product: 'Tools & Hardware', action: 'Monitor growth', regions: ['MW'], priority: 'medium' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{item.product}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{item.action} in {item.regions.join(', ')}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Investment Recommendations */}
      <div className="mt-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <h3 className="font-semibold text-[var(--foreground)]">Investment Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">High Priority</div>
            <div className="text-xs text-green-700 dark:text-green-400">
              HVAC in Southeast - highest fit score (95) with 16.8% growth. Allocate additional inventory and marketing resources.
            </div>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">Medium Priority</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              Lighting in West - strong fit (93) with emerging tech demand. Consider expanding product line diversity.
            </div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Monitor</div>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              Tools in Midwest - stable growth (10.5%) with strong manufacturing correlation. Maintain current investment level.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
