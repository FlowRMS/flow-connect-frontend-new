'use client';

import React, { useState, useMemo } from 'react';

// Types
type Category = 'Purchases' | 'Employees' | 'Establishments' | 'Employee Ratio' | 'All';
type Year = '2025' | '2026' | '2027' | '2028' | '2029' | 'All';
type SortField = 'naicsCode' | 'industryDescription' | 'section';
type SortOrder = 'Ascending Order' | 'Descending Order';

const categories: { value: Category; label: string }[] = [
  { value: 'Purchases', label: 'Purchases' },
  { value: 'Employees', label: 'Employees' },
  { value: 'Establishments', label: 'Establishments' },
  { value: 'Employee Ratio', label: 'Employee Ratio' },
  { value: 'All', label: 'All Categories' },
];

const years: { value: Year; label: string }[] = [
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' },
  { value: '2029', label: '2029' },
  { value: 'All', label: 'All Years' },
];

type MarketTrackRecord = {
  naicsCode: string;
  industryDescription: string;
  section: string;
  values: Record<string, { purch: number; percentChange: number }>;
};

type TradingAreaRecord = {
  tradingArea: string;
  naicsCode: string;
  industryDescription: string;
  section: string;
  values: Record<string, { purch: number; percentChange: number }>;
};

// Sample data based on the screenshot
const generateSampleData = (): MarketTrackRecord[] => {
  const industries = [
    { code: '111000', desc: 'Crop Production', section: 'Industrial' },
    { code: '112000', desc: 'Animal Production and Aquaculture', section: 'Industrial' },
    { code: '113110', desc: 'Timber Tract Operations', section: 'Industrial' },
    { code: '113210', desc: 'Forest Nurseries and Gathering of Forest Products', section: 'Industrial' },
    { code: '113310', desc: 'Logging', section: 'Industrial' },
    { code: '114111', desc: 'Finfish Fishing', section: 'Industrial' },
    { code: '114112', desc: 'Shellfish Fishing', section: 'Industrial' },
    { code: '114210', desc: 'Hunting and Trapping', section: 'Industrial' },
    { code: '115111', desc: 'Cotton Ginning', section: 'Industrial' },
    { code: '115112', desc: 'Soil Preparation Planting and Cultivating', section: 'Industrial' },
    { code: '115113', desc: 'Crop Harvesting Primarily by Machine', section: 'Industrial' },
    { code: '115114', desc: 'Postharvest Crop Activities (except Cotton Ginning)', section: 'Industrial' },
    { code: '115115', desc: 'Farm Labor Contractors and Crew Leaders', section: 'Industrial' },
    { code: '115116', desc: 'Farm Management Services', section: 'Industrial' },
    { code: '115210', desc: 'Support Activities for Animal Production', section: 'Industrial' },
    { code: '115310', desc: 'Support Activities for Forestry', section: 'Industrial' },
    { code: '211111', desc: 'Crude Petroleum and Natural Gas Extraction', section: 'Industrial' },
    { code: '211112', desc: 'Natural Gas Liquid Extraction', section: 'Industrial' },
    { code: '212111', desc: 'Bituminous Coal and Lignite Surface Mining', section: 'Industrial' },
    { code: '212112', desc: 'Bituminous Coal Underground Mining', section: 'Industrial' },
  ];

  const data: MarketTrackRecord[] = industries.map(industry => {
    const basePurch = Math.random() * 5000000 + 100000;
    const record: MarketTrackRecord = {
      naicsCode: industry.code,
      industryDescription: industry.desc,
      section: industry.section,
      values: {}
    };

    ['2025', '2026', '2027', '2028', '2029'].forEach((year, idx) => {
      const yearMultiplier = 1 + (idx * 0.04);
      record.values[year] = {
        purch: basePurch * yearMultiplier,
        percentChange: (Math.random() * 20 - 5)
      };
    });

    return record;
  });

  return data;
};

const sampleData = generateSampleData();

// Generate trading area data
const generateTradingAreaData = (): TradingAreaRecord[] => {
  const tradingAreas = ['test', 'Testing', 'test 10'];
  const industries = [
    { code: '111000', desc: 'Crop Production', section: 'Industrial' },
    { code: '112000', desc: 'Animal Production and Aquaculture', section: 'Industrial' },
    { code: '113110', desc: 'Timber Tract Operations', section: 'Industrial' },
    { code: '113210', desc: 'Forest Nurseries and Gathering of Forest Products', section: 'Industrial' },
    { code: '113310', desc: 'Logging', section: 'Industrial' },
  ];

  const data: TradingAreaRecord[] = [];

  tradingAreas.forEach(area => {
    industries.forEach(industry => {
      const basePurch = Math.random() * 2000000 + 50000;
      const record: TradingAreaRecord = {
        tradingArea: area,
        naicsCode: industry.code,
        industryDescription: industry.desc,
        section: industry.section,
        values: {}
      };

      ['2025', '2026', '2027', '2028', '2029'].forEach((year, idx) => {
        const yearMultiplier = 1 + (idx * 0.05);
        record.values[year] = {
          purch: basePurch * yearMultiplier,
          percentChange: (Math.random() * 25 - 2)
        };
      });

      data.push(record);
    });
  });

  return data;
};

const tradingAreaData = generateTradingAreaData();

export default function MarketTrackDashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Purchases');
  const [selectedYear, setSelectedYear] = useState<Year>('All');
  const [sortField, setSortField] = useState<SortField>('naicsCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('Ascending Order');

  // Count active filters
  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedYear !== 'All' ? 1 : 0);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Market Track</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Analyze market trends by industry and year.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                showFilters ? 'bg-white/20 text-white' : 'bg-[var(--primary)] text-white'
              }`}>
                {activeFilterCount}
              </span>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={showFilters ? "M3 7.5l3-3 3 3" : "M3 4.5l3 3 3-3"}/>
            </svg>
          </button>

          {/* View Totals Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <span>⊕</span>
            <span>View Totals</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Categories Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--muted)] transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedCategory === category.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]'
                      : 'border-[var(--border)]'
                  }`}>
                    {selectedCategory === category.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Years Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Years</h3>
            <div className="space-y-2">
              {years.map(year => (
                <button
                  key={year.value}
                  onClick={() => setSelectedYear(year.value)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--muted)] transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedYear === year.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]'
                      : 'border-[var(--border)]'
                  }`}>
                    {selectedYear === year.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{year.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Sort Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--foreground)] mb-2">Sort By</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                >
                  <option value="naicsCode">Industry Code</option>
                  <option value="industryDescription">Industry Description</option>
                  <option value="section">Section</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--foreground)] mb-2">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                >
                  <option value="Ascending Order">Ascending</option>
                  <option value="Descending Order">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Industry Data Table */}
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Industry Data</h2>

      <div className="mb-6 bg-[var(--card)] border border-[var(--border)] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#3b5a7f] text-white">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">NAICS Code</th>
                <th className="text-left px-3 py-2.5 font-semibold">Industry Description</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2025</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2026</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2027</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2028</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2029</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold">Section</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((record, index) => (
                <tr
                  key={record.naicsCode}
                  className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors ${
                    index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--muted)]/20'
                  }`}
                >
                  <td className="px-3 py-2 text-[var(--foreground)]">{record.naicsCode}</td>
                  <td className="px-3 py-2 text-[var(--foreground)]">{record.industryDescription}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2025'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2025'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2026'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2026'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2027'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2027'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2028'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2028'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2029'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2029'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{record.section}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trading Areas Table */}
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Trading Areas</h2>

      <div className="mb-6 bg-[var(--card)] border border-[var(--border)] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#3b5a7f] text-white">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">Trading Area</th>
                <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">NAICS Code</th>
                <th className="text-left px-3 py-2.5 font-semibold">Industry Description</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2025</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2026</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2027</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2028</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">$ Purch 2029</th>
                <th className="text-right px-3 py-2.5 font-semibold whitespace-nowrap">% Chg</th>
                <th className="text-right px-3 py-2.5 font-semibold">Section</th>
              </tr>
            </thead>
            <tbody>
              {tradingAreaData.map((record, index) => (
                <tr
                  key={`${record.tradingArea}-${record.naicsCode}`}
                  className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors ${
                    index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--muted)]/20'
                  }`}
                >
                  <td className="px-3 py-2 text-[var(--foreground)]">{record.tradingArea}</td>
                  <td className="px-3 py-2 text-[var(--foreground)]">{record.naicsCode}</td>
                  <td className="px-3 py-2 text-[var(--foreground)]">{record.industryDescription}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2025'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2025'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2026'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2026'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2027'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2027'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2028'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2028'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2029'].purch)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{formatNumber(record.values['2029'].percentChange)}</td>
                  <td className="px-3 py-2 text-right text-[var(--foreground)]">{record.section}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
