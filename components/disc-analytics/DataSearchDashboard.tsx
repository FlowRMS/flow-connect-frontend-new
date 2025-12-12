'use client';

import React, { useState, useMemo } from 'react';

// Types
type Segment = 'Total' | 'Contractor' | 'Industrial' | 'Utility' | 'Institutional' | 'All';
type Year = '2024' | '2025' | '2026' | '2027' | '2028' | '2029' | 'All';
type SortField = 'state' | 'database' | 'value' | 'percentChange' | 'cumulative' | 'percentTotal' | 'percentCumulative';
type SortOrder = 'asc' | 'desc';

type TerritoryRecord = {
  territory: string;
  baseTerritory: string;
  database: string;
  induSales2024: number;
  induPercentChange: number;
  mktIndu2024: number;
  mktPercentChange: number;
  index: number;
};

const segments: { value: Segment; label: string }[] = [
  { value: 'Total', label: 'Total' },
  { value: 'Contractor', label: 'Contractor' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Utility', label: 'Utility' },
  { value: 'Institutional', label: 'Institutional' },
  { value: 'All', label: 'All Segments' },
];

const years: { value: Year; label: string }[] = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' },
  { value: '2029', label: '2029' },
  { value: 'All', label: 'All Years' },
];

type ProductProfileRecord = {
  state: string;
  database: string;
  values: Record<string, { value: number; percentChange: number }>;
};

// Sample data based on the screenshot
const generateSampleData = (): ProductProfileRecord[] => {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
    'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
    'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
    'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
    'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const databases = ['DataSearch Master', 'BUILDING WIRE'];

  const data: ProductProfileRecord[] = [];

  // Base values for DataSearch Master (larger values)
  const dsBaseValues: Record<string, number> = {
    'AL': 583.58, 'AK': 135.35, 'AZ': 1224.61, 'AR': 604.18, 'CA': 6741.46,
    'CO': 1394.58, 'CT': 806.92, 'DE': 115.53, 'DC': 179.54, 'FL': 2845.63,
    'GA': 2574.53, 'HI': 201.49, 'ID': 240.86, 'IL': 3907.27, 'IN': 1097.88,
    'IA': 614.54, 'KS': 460.55, 'KY': 422.51, 'LA': 512.34, 'ME': 156.78,
    'MD': 892.45, 'MA': 1234.56, 'MI': 1567.89, 'MN': 987.65, 'MS': 345.67,
    'MO': 789.12, 'MT': 123.45, 'NE': 234.56, 'NV': 567.89, 'NH': 178.90,
    'NJ': 1456.78, 'NM': 289.01, 'NY': 4567.89, 'NC': 1678.90, 'ND': 98.76,
    'OH': 1890.12, 'OK': 456.78, 'OR': 678.90, 'PA': 2345.67, 'RI': 145.67,
    'SC': 567.89, 'SD': 87.65, 'TN': 987.65, 'TX': 5678.90, 'UT': 345.67,
    'VT': 78.90, 'VA': 1234.56, 'WA': 1456.78, 'WV': 234.56, 'WI': 876.54, 'WY': 65.43
  };

  // Percent changes for each state
  const percentChanges: Record<string, number> = {
    'AL': 3.31, 'AK': 7.23, 'AZ': 2.34, 'AR': 4.78, 'CA': 1.15,
    'CO': 0.77, 'CT': 1.16, 'DE': 3.15, 'DC': 1.52, 'FL': 3.64,
    'GA': 3.25, 'HI': 6.25, 'ID': 4.72, 'IL': 0.95, 'IN': 3.43,
    'IA': 3.53, 'KS': 2.47, 'KY': 3.05, 'LA': 2.89, 'ME': 4.12,
    'MD': 1.78, 'MA': 1.23, 'MI': 2.34, 'MN': 1.89, 'MS': 3.67,
    'MO': 2.45, 'MT': 5.67, 'NE': 3.21, 'NV': 4.56, 'NH': 2.78,
    'NJ': 1.45, 'NM': 3.89, 'NY': 0.89, 'NC': 2.67, 'ND': 6.78,
    'OH': 1.56, 'OK': 3.45, 'OR': 2.12, 'PA': 1.34, 'RI': 2.89,
    'SC': 3.12, 'SD': 5.43, 'TN': 2.78, 'TX': 1.67, 'UT': 4.23,
    'VT': 5.12, 'VA': 1.89, 'WA': 1.56, 'WV': 4.34, 'WI': 2.12, 'WY': 6.89
  };

  states.forEach(state => {
    databases.forEach(db => {
      const baseValue = db === 'DataSearch Master'
        ? (dsBaseValues[state] || 500)
        : (dsBaseValues[state] || 500) * 0.0785; // Building wire is ~7.85% of DataSearch

      const pctChange = percentChanges[state] || 3.0;

      const record: ProductProfileRecord = {
        state,
        database: db,
        values: {}
      };

      // Generate values for each year
      ['2024', '2025', '2026', '2027', '2028', '2029'].forEach((year, idx) => {
        const yearMultiplier = 1 + (idx * 0.02); // Slight growth each year
        record.values[year] = {
          value: baseValue * yearMultiplier,
          percentChange: pctChange + (Math.random() * 0.5 - 0.25) // Slight variation
        };
      });

      data.push(record);
    });
  });

  return data;
};

const sampleData = generateSampleData();

// Generate territory data
const generateTerritoryData = (): TerritoryRecord[] => {
  return [
    {
      territory: 'test',
      baseTerritory: 'test 20',
      database: 'DataSearch Master',
      induSales2024: 0.00,
      induPercentChange: 0.00,
      mktIndu2024: 100.00,
      mktPercentChange: 0.00,
      index: 0.00
    }
  ];
};

const territoryData = generateTerritoryData();

export default function DataSearchDashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment>('Contractor');
  const [selectedYear, setSelectedYear] = useState<Year>('2024');
  const [sortField, setSortField] = useState<SortField>('state');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Count active filters
  const activeFilterCount = (selectedSegment !== 'All' ? 1 : 0) + (selectedYear !== 'All' ? 1 : 0);

  // Calculate cumulative values and sort data
  const processedData = useMemo(() => {
    let cumulative = 0;
    const yearKey = selectedYear === 'All' ? '2024' : selectedYear;

    // First pass: calculate total for percentages
    const total = sampleData.reduce((sum, record) => {
      return sum + (record.values[yearKey]?.value || 0);
    }, 0);

    // Map data with cumulative values
    const mappedData = sampleData.map(record => {
      const value = record.values[yearKey]?.value || 0;
      const percentChange = record.values[yearKey]?.percentChange || 0;
      cumulative += value;
      const percentTotal = total > 0 ? (value / total) * 100 : 0;
      const percentCumulative = total > 0 ? (cumulative / total) * 100 : 0;

      return {
        ...record,
        value,
        percentChange,
        cumulative,
        percentTotal,
        percentCumulative
      };
    });

    // Sort data
    return mappedData.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'state':
          comparison = a.state.localeCompare(b.state);
          break;
        case 'database':
          comparison = a.database.localeCompare(b.database);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'percentChange':
          comparison = a.percentChange - b.percentChange;
          break;
        case 'cumulative':
          comparison = a.cumulative - b.cumulative;
          break;
        case 'percentTotal':
          comparison = a.percentTotal - b.percentTotal;
          break;
        case 'percentCumulative':
          comparison = a.percentCumulative - b.percentCumulative;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [selectedSegment, selectedYear, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getColumnHeader = () => {
    const segmentPrefix = selectedSegment === 'Contractor' ? 'Contr' :
                          selectedSegment === 'Industrial' ? 'Ind' :
                          selectedSegment === 'Utility' ? 'Util' :
                          selectedSegment === 'Institutional' ? 'Inst' : 'Total';
    return `${segmentPrefix} ${selectedYear}`;
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Data Search</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Analyze product performance by state and database.</p>
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

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Segments Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Segments</h3>
            <div className="space-y-2">
              {segments.map(segment => (
                <button
                  key={segment.value}
                  onClick={() => setSelectedSegment(segment.value)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--muted)] transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedSegment === segment.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]'
                      : 'border-[var(--border)]'
                  }`}>
                    {selectedSegment === segment.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{segment.label}</span>
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
                  <option value="state">State Code</option>
                  <option value="database">Database</option>
                  <option value="value">Value</option>
                  <option value="percentChange">% Change</option>
                  <option value="cumulative">Cumulative</option>
                  <option value="percentTotal">% Total</option>
                  <option value="percentCumulative">% Cumulative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--foreground)] mb-2">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {processedData.length} records found
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Territory Performance */}
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Territory Performance</h2>

      {/* Territory Table */}
      <div className="mb-6 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#3b5a7f] text-white">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Territory</th>
                <th className="text-left px-4 py-3 font-semibold">Base Territory</th>
                <th className="text-left px-4 py-3 font-semibold">Database</th>
                <th className="text-right px-4 py-3 font-semibold">Indu Sales 2024</th>
                <th className="text-right px-4 py-3 font-semibold">% Chg</th>
                <th className="text-right px-4 py-3 font-semibold">Mkt Indu 2024</th>
                <th className="text-right px-4 py-3 font-semibold">% Chg</th>
                <th className="text-right px-4 py-3 font-semibold">Index</th>
              </tr>
            </thead>
            <tbody>
              {territoryData.map((record, index) => (
                <tr
                  key={`${record.territory}-${record.database}`}
                  className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-[var(--foreground)]">{record.territory}</td>
                  <td className="px-4 py-2 text-[var(--foreground)]">{record.baseTerritory}</td>
                  <td className="px-4 py-2 text-[var(--foreground)]">{record.database}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.induSales2024)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.induPercentChange)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.mktIndu2024)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.mktPercentChange)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.index)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Performance */}
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Product Performance</h2>

      {/* Data Table */}
      <div className="mb-6 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1e3a5f] text-white sticky top-0">
              <tr>
                <th
                  className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('state')}
                >
                  State {sortField === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('database')}
                >
                  Database {sortField === 'database' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('value')}
                >
                  {getColumnHeader()} {sortField === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('percentChange')}
                >
                  % Chg {sortField === 'percentChange' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('cumulative')}
                >
                  Cumulative {sortField === 'cumulative' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('percentTotal')}
                >
                  % Total {sortField === 'percentTotal' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold cursor-pointer hover:bg-[#2d4a6f] transition-colors"
                  onClick={() => handleSort('percentCumulative')}
                >
                  % Cumm {sortField === 'percentCumulative' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((record, index) => (
                <tr
                  key={`${record.state}-${record.database}`}
                  className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors ${
                    index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--muted)]/20'
                  }`}
                >
                  <td className="px-4 py-2 font-medium text-[var(--foreground)]">{record.state}</td>
                  <td className="px-4 py-2 text-[var(--foreground)]">{record.database}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.value)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.percentChange)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.cumulative)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.percentTotal)}</td>
                  <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatNumber(record.percentCumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {processedData.length} records
          </p>
          <button className="text-sm text-[var(--primary)] hover:underline">
            Data Download
          </button>
        </div>
      </div>
    </div>
  );
}
