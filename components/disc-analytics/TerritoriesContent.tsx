'use client';

import React, { useState, useRef, useCallback } from 'react';

// Years for data entry
const YEARS = ['2023', '2024', '2025', '2026', '2027', '2028', '2029'] as const;
type Year = typeof YEARS[number];

// Market segments
const SEGMENTS = ['Contractor', 'Industrial', 'Utility', 'Institutional'] as const;
type SegmentName = typeof SEGMENTS[number];

// Data entry modes
type DataEntryMode = 'sales' | 'percentShare' | 'market';

// Segment data structure
type SegmentYearData = {
  sales: number;
  salesPercentChange: number | null;
  percentShare: number;
  market: number;
  marketPercentChange: number | null;
};

type MarketSegment = {
  name: SegmentName;
  years: Record<Year, SegmentYearData>;
};

type Territory = {
  id: string;
  name: string;
  levels: string[];
  quota: number;
  owner: string;
  marketSegments: MarketSegment[];
};

const levelOptions = ['Branch', 'Area', 'Region', 'District', 'Division', 'National'];
const ownerOptions = ['Channel Ops', 'West Region', 'East Region', 'Strategy', 'Sales Ops', 'Field Sales'];

// Generate default market segments with sample data
const generateDefaultMarketSegments = (): MarketSegment[] => {
  return [
    {
      name: 'Contractor',
      years: {
        '2023': { sales: 10.0000, salesPercentChange: null, percentShare: 0.15, market: 6665.0991, marketPercentChange: null },
        '2024': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.15, market: 6741.4620, marketPercentChange: 1.15 },
        '2025': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.15, market: 6518.9590, marketPercentChange: -3.30 },
        '2026': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.16, market: 6392.4289, marketPercentChange: -1.94 },
        '2027': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.15, market: 6577.7790, marketPercentChange: 2.90 },
        '2028': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.15, market: 6764.4549, marketPercentChange: 2.84 },
        '2029': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.14, market: 6915.7650, marketPercentChange: 2.24 },
      },
    },
    {
      name: 'Industrial',
      years: {
        '2023': { sales: 10.0000, salesPercentChange: null, percentShare: 0.15, market: 6558.3700, marketPercentChange: null },
        '2024': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.15, market: 6546.7160, marketPercentChange: -0.18 },
        '2025': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.15, market: 6719.4189, marketPercentChange: 2.64 },
        '2026': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.14, market: 7001.4871, marketPercentChange: 4.20 },
        '2027': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.14, market: 7317.4520, marketPercentChange: 4.51 },
        '2028': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.13, market: 7629.1070, marketPercentChange: 4.26 },
        '2029': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.13, market: 7917.4151, marketPercentChange: 3.78 },
      },
    },
    {
      name: 'Utility',
      years: {
        '2023': { sales: 10.0000, salesPercentChange: null, percentShare: 1.25, market: 802.0310, marketPercentChange: null },
        '2024': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 1.20, market: 834.4110, marketPercentChange: 4.04 },
        '2025': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 1.18, market: 847.2900, marketPercentChange: 1.54 },
        '2026': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 1.16, market: 859.5530, marketPercentChange: 1.45 },
        '2027': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 1.14, market: 877.3760, marketPercentChange: 2.07 },
        '2028': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 1.11, market: 902.2890, marketPercentChange: 2.84 },
        '2029': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 1.10, market: 912.9100, marketPercentChange: 1.18 },
      },
    },
    {
      name: 'Institutional',
      years: {
        '2023': { sales: 10.0000, salesPercentChange: null, percentShare: 0.29, market: 3468.0240, marketPercentChange: null },
        '2024': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.28, market: 3512.6370, marketPercentChange: 1.29 },
        '2025': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.28, market: 3574.6490, marketPercentChange: 1.77 },
        '2026': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.27, market: 3671.6120, marketPercentChange: 2.71 },
        '2027': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.27, market: 3741.8880, marketPercentChange: 1.91 },
        '2028': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.26, market: 3816.8489, marketPercentChange: 2.00 },
        '2029': { sales: 10.0000, salesPercentChange: 0.00, percentShare: 0.26, market: 3900.5080, marketPercentChange: 2.19 },
      },
    },
  ];
};

// Calculate totals from segments
const calculateTotals = (segments: MarketSegment[]): Record<Year, SegmentYearData & { percentMarket: number }> => {
  const totals: Record<Year, SegmentYearData & { percentMarket: number }> = {} as Record<Year, SegmentYearData & { percentMarket: number }>;

  YEARS.forEach((year, yearIndex) => {
    const totalSales = segments.reduce((sum, seg) => sum + seg.years[year].sales, 0);
    const totalMarket = segments.reduce((sum, seg) => sum + seg.years[year].market, 0);
    const avgPercentShare = totalMarket > 0 ? (totalSales / totalMarket) * 100 : 0;

    const prevYear = yearIndex > 0 ? YEARS[yearIndex - 1] : null;
    let salesPercentChange: number | null = null;
    let marketPercentChange: number | null = null;

    if (prevYear) {
      const prevTotalSales = segments.reduce((sum, seg) => sum + seg.years[prevYear].sales, 0);
      const prevTotalMarket = segments.reduce((sum, seg) => sum + seg.years[prevYear].market, 0);
      salesPercentChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
      marketPercentChange = prevTotalMarket > 0 ? ((totalMarket - prevTotalMarket) / prevTotalMarket) * 100 : 0;
    }

    totals[year] = {
      sales: totalSales,
      salesPercentChange,
      percentShare: avgPercentShare,
      market: totalMarket,
      marketPercentChange,
      percentMarket: 100.00,
    };
  });

  return totals;
};

const initialTerritories: Territory[] = [
  {
    id: '1',
    name: 'test 10',
    levels: ['Branch', 'Area', 'Region'],
    quota: 25000000,
    owner: 'Channel Ops',
    marketSegments: generateDefaultMarketSegments(),
  },
  {
    id: '2',
    name: 'CO - Front Range',
    levels: ['Branch', 'Area', 'Region'],
    quota: 25000000,
    owner: 'Channel Ops',
    marketSegments: generateDefaultMarketSegments(),
  },
  {
    id: '3',
    name: 'AZ - Cochise County',
    levels: ['Branch', 'Area', 'Region'],
    quota: 8000000,
    owner: 'West Region',
    marketSegments: generateDefaultMarketSegments(),
  },
];

export default function TerritoriesContent() {
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataEntryMode, setDataEntryMode] = useState<DataEntryMode>('sales');
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLevels, setFormLevels] = useState<string[]>(['Branch', 'Area', 'Region']);
  const [formQuota, setFormQuota] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formMarketSegments, setFormMarketSegments] = useState<MarketSegment[]>(generateDefaultMarketSegments());

  const resetForm = () => {
    setFormName('');
    setFormLevels(['Branch', 'Area', 'Region']);
    setFormQuota('');
    setFormOwner('');
    setFormMarketSegments(generateDefaultMarketSegments());
    setDataEntryMode('sales');
    setHasChanges(false);
  };

  const openAddModal = () => {
    resetForm();
    setEditingTerritory(null);
    setShowAddModal(true);
  };

  const openEditModal = (territory: Territory) => {
    setFormName(territory.name);
    setFormLevels([...territory.levels]);
    setFormQuota(territory.quota.toString());
    setFormOwner(territory.owner);
    setFormMarketSegments(JSON.parse(JSON.stringify(territory.marketSegments)));
    setEditingTerritory(territory);
    setShowAddModal(true);
  };

  // Recalculate dependent values when one value changes
  const recalculateSegmentData = useCallback((
    segments: MarketSegment[],
    segmentIndex: number,
    year: Year,
    field: DataEntryMode,
    newValue: number
  ): MarketSegment[] => {
    const updatedSegments = JSON.parse(JSON.stringify(segments)) as MarketSegment[];
    const segment = updatedSegments[segmentIndex];
    const yearIndex = YEARS.indexOf(year);

    if (field === 'sales') {
      segment.years[year].sales = newValue;

      // Recalculate sales % change
      if (yearIndex > 0) {
        const prevYear = YEARS[yearIndex - 1];
        const prevSales = segment.years[prevYear].sales;
        segment.years[year].salesPercentChange = prevSales > 0
          ? ((newValue - prevSales) / prevSales) * 100
          : 0;
      }
      if (yearIndex < YEARS.length - 1) {
        const nextYear = YEARS[yearIndex + 1];
        segment.years[nextYear].salesPercentChange = newValue > 0
          ? ((segment.years[nextYear].sales - newValue) / newValue) * 100
          : 0;
      }

      // Recalculate % share
      if (segment.years[year].market > 0) {
        segment.years[year].percentShare = (newValue / segment.years[year].market) * 100;
      }
    } else if (field === 'percentShare') {
      segment.years[year].percentShare = newValue;

      // Recalculate sales from % share and market
      if (segment.years[year].market > 0) {
        const newSales = (newValue / 100) * segment.years[year].market;
        segment.years[year].sales = newSales;

        // Recalculate sales % change
        if (yearIndex > 0) {
          const prevYear = YEARS[yearIndex - 1];
          const prevSales = segment.years[prevYear].sales;
          segment.years[year].salesPercentChange = prevSales > 0
            ? ((newSales - prevSales) / prevSales) * 100
            : 0;
        }
      }
    } else if (field === 'market') {
      segment.years[year].market = newValue;

      // Recalculate market % change
      if (yearIndex > 0) {
        const prevYear = YEARS[yearIndex - 1];
        const prevMarket = segment.years[prevYear].market;
        segment.years[year].marketPercentChange = prevMarket > 0
          ? ((newValue - prevMarket) / prevMarket) * 100
          : 0;
      }
      if (yearIndex < YEARS.length - 1) {
        const nextYear = YEARS[yearIndex + 1];
        segment.years[nextYear].marketPercentChange = newValue > 0
          ? ((segment.years[nextYear].market - newValue) / newValue) * 100
          : 0;
      }

      // Recalculate % share
      if (newValue > 0) {
        segment.years[year].percentShare = (segment.years[year].sales / newValue) * 100;
      }
    }

    return updatedSegments;
  }, []);

  const handleSegmentChange = (segmentIndex: number, year: Year, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = recalculateSegmentData(formMarketSegments, segmentIndex, year, dataEntryMode, numValue);
    setFormMarketSegments(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!formName || !formQuota || !formOwner || formLevels.length === 0) return;

    const newTerritory: Territory = {
      id: editingTerritory?.id || Date.now().toString(),
      name: formName,
      levels: formLevels,
      quota: parseFloat(formQuota),
      owner: formOwner,
      marketSegments: formMarketSegments,
    };

    if (editingTerritory) {
      setTerritories(prev => prev.map(t => t.id === editingTerritory.id ? newTerritory : t));
    } else {
      setTerritories(prev => [...prev, newTerritory]);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setTerritories(prev => prev.filter(t => t.id !== id));
  };

  // When selecting a level, auto-select all levels before it in the hierarchy
  const selectLevel = (level: string) => {
    const levelIndex = levelOptions.indexOf(level);
    if (levelIndex === -1) return;

    // Include all levels from Branch up to and including the selected level
    const selectedLevels = levelOptions.slice(0, levelIndex + 1);
    setFormLevels(selectedLevels);
  };

  // Get the highest selected level (for display)
  const getHighestLevel = () => {
    if (formLevels.length === 0) return null;
    // Find the highest index level that's selected
    let highestIndex = -1;
    formLevels.forEach(level => {
      const idx = levelOptions.indexOf(level);
      if (idx > highestIndex) highestIndex = idx;
    });
    return highestIndex >= 0 ? levelOptions[highestIndex] : null;
  };

  // CSV Upload handling
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    // Parse header to get years
    const header = lines[0].split(',').map(h => h.trim());

    // Expected format: Segment,Metric,2023,2024,2025,2026,2027,2028,2029
    const updatedSegments = JSON.parse(JSON.stringify(formMarketSegments)) as MarketSegment[];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue;

      const segmentName = values[0].toUpperCase();
      const metric = values[1].toLowerCase();

      const segmentIndex = updatedSegments.findIndex(
        s => s.name.toUpperCase() === segmentName
      );

      if (segmentIndex === -1) continue;

      YEARS.forEach((year, yearIdx) => {
        const valueIdx = yearIdx + 2; // Skip segment name and metric columns
        if (valueIdx < values.length) {
          const numValue = parseFloat(values[valueIdx]) || 0;

          if (metric === 'sales') {
            updatedSegments[segmentIndex].years[year].sales = numValue;
          } else if (metric === '% share' || metric === 'percentshare' || metric === 'share') {
            updatedSegments[segmentIndex].years[year].percentShare = numValue;
          } else if (metric === 'market') {
            updatedSegments[segmentIndex].years[year].market = numValue;
          }
        }
      });
    }

    // Recalculate all % changes
    updatedSegments.forEach((segment, segIdx) => {
      YEARS.forEach((year, yearIdx) => {
        if (yearIdx > 0) {
          const prevYear = YEARS[yearIdx - 1];
          const prevSales = segment.years[prevYear].sales;
          const prevMarket = segment.years[prevYear].market;

          segment.years[year].salesPercentChange = prevSales > 0
            ? ((segment.years[year].sales - prevSales) / prevSales) * 100
            : 0;
          segment.years[year].marketPercentChange = prevMarket > 0
            ? ((segment.years[year].market - prevMarket) / prevMarket) * 100
            : 0;
        }
      });
    });

    setFormMarketSegments(updatedSegments);
    setHasChanges(true);
  };

  const downloadCSVTemplate = () => {
    const headers = ['Segment', 'Metric', ...YEARS].join(',');
    const rows: string[] = [headers];

    SEGMENTS.forEach(segment => {
      rows.push([segment, 'Sales', ...YEARS.map(() => '0')].join(','));
      rows.push([segment, '% Share', ...YEARS.map(() => '0')].join(','));
      rows.push([segment, 'Market', ...YEARS.map(() => '0')].join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'territory_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTerritories = territories.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getInputValue = (segment: MarketSegment, year: Year): string => {
    const data = segment.years[year];
    switch (dataEntryMode) {
      case 'sales':
        return data.sales.toString();
      case 'percentShare':
        return data.percentShare.toString();
      case 'market':
        return data.market.toString();
      default:
        return data.sales.toString();
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Territories</h1>
          <p className="text-[var(--muted-foreground)] mt-1">List and manage territories.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Territory
        </button>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        {/* Card Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--foreground)]">All Territories</h2>
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search territories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm w-64 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)] sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Levels</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Quota</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Owner</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerritories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    {searchQuery ? 'No territories match your search.' : 'No territories configured yet.'}
                  </td>
                </tr>
              ) : (
                filteredTerritories.map((territory) => (
                  <tr key={territory.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[var(--primary)] font-medium cursor-pointer hover:underline" onClick={() => openEditModal(territory)}>
                        {territory.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {territory.levels.join(' → ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)] text-right font-medium">
                      {formatCurrency(territory.quota)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {territory.owner}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(territory)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(territory.id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <p className="text-sm text-[var(--muted-foreground)]">
            {filteredTerritories.length} {filteredTerritories.length === 1 ? 'territory' : 'territories'}
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {editingTerritory ? 'Edit Territory' : 'Add Territory'}
                </h3>
                {editingTerritory && (
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Territory: {formName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
                )}
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Basic Info */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., CO - Front Range"
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Quota</label>
                  <input
                    type="number"
                    value={formQuota}
                    onChange={(e) => setFormQuota(e.target.value)}
                    placeholder="25000000"
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Owner</label>
                  <select
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                  >
                    <option value="">Select owner...</option>
                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner}>{owner}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Levels</label>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">Select the hierarchy levels for this territory</p>
                  <div className="flex flex-wrap gap-2">
                    {levelOptions.map((level) => {
                      const levelIndex = levelOptions.indexOf(level);
                      const highestLevel = getHighestLevel();
                      const highestIndex = highestLevel ? levelOptions.indexOf(highestLevel) : -1;
                      const isSelected = levelIndex <= highestIndex;
                      const isHighest = level === highestLevel;

                      return (
                        <button
                          key={level}
                          onClick={() => selectLevel(level)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? isHighest
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--primary)]/70 text-white'
                              : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                  {formLevels.length > 0 && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-2">
                      Hierarchy: {formLevels.join(' → ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Note about saving */}
              <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> Please remember to click on the &quot;Save&quot; button after you make data modifications. Otherwise, your data will NOT be saved.
              </div>

              {/* Data Entry Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--muted-foreground)]">Select data entry mode:</span>
                  <select
                    value={dataEntryMode}
                    onChange={(e) => setDataEntryMode(e.target.value as DataEntryMode)}
                    className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                  >
                    <option value="sales">Enter Sales</option>
                    <option value="percentShare">Enter % Share</option>
                    <option value="market">Enter Market</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                  <button
                    onClick={downloadCSVTemplate}
                    className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Download Template
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17,8 12,3 7,8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload CSV
                  </button>
                </div>
              </div>

              {/* Market Segments Table */}
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1e3a5f] text-white">
                      <th className="text-left px-3 py-2 font-semibold border-r border-[#2d4a6f] min-w-[120px]" colSpan={2}></th>
                      {YEARS.map(year => (
                        <th key={year} className="text-center px-3 py-2 font-semibold border-r border-[#2d4a6f] last:border-r-0 min-w-[100px]">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formMarketSegments.map((segment, segmentIndex) => (
                      <React.Fragment key={segment.name}>
                        {/* Sales Row */}
                        <tr className="bg-[#1e3a5f]/90">
                          <td rowSpan={5} className="px-3 py-2 font-semibold text-white text-center align-middle border-r border-[#2d4a6f] w-[100px]">
                            {segment.name.toUpperCase()}
                          </td>
                          <td className="px-3 py-1.5 text-white text-sm border-r border-[#2d4a6f]">Sales</td>
                          {YEARS.map(year => (
                            <td key={year} className="px-1 py-1 border-r border-[var(--border)] last:border-r-0 bg-amber-50 dark:bg-amber-900/20">
                              <input
                                type="number"
                                step="any"
                                value={segment.years[year].sales}
                                onChange={(e) => handleSegmentChange(segmentIndex, year, e.target.value)}
                                disabled={dataEntryMode !== 'sales'}
                                className="w-full px-2 py-1 bg-white dark:bg-[var(--background)] border border-[var(--border)] rounded text-sm text-right disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                              />
                            </td>
                          ))}
                        </tr>
                        {/* % Change (Sales) Row */}
                        <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                          <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Change</td>
                          {YEARS.map(year => (
                            <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                              {segment.years[year].salesPercentChange !== null
                                ? formatNumber(segment.years[year].salesPercentChange, 2)
                                : 'N/A'}
                            </td>
                          ))}
                        </tr>
                        {/* % Share Row */}
                        <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                          <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Share</td>
                          {YEARS.map(year => (
                            <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                              {formatNumber(segment.years[year].percentShare, 2)}
                            </td>
                          ))}
                        </tr>
                        {/* Market Row */}
                        <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                          <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">Market</td>
                          {YEARS.map(year => (
                            <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--foreground)]">
                              {formatNumber(segment.years[year].market, 4)}
                            </td>
                          ))}
                        </tr>
                        {/* % Change (Market) Row */}
                        <tr className="bg-amber-50/50 dark:bg-amber-900/10 border-b-2 border-[var(--border)]">
                          <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Change</td>
                          {YEARS.map(year => (
                            <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                              {segment.years[year].marketPercentChange !== null
                                ? formatNumber(segment.years[year].marketPercentChange, 2)
                                : 'N/A'}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    ))}
                    {/* Totals Section */}
                    {(() => {
                      const totals = calculateTotals(formMarketSegments);
                      return (
                        <React.Fragment>
                          {/* Total Sales Row */}
                          <tr className="bg-[#1e3a5f]/90">
                            <td rowSpan={6} className="px-3 py-2 font-semibold text-white text-center align-middle border-r border-[#2d4a6f]">
                              TOTALS
                            </td>
                            <td className="px-3 py-1.5 text-white text-sm border-r border-[#2d4a6f]">Sales</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1.5 border-r border-[var(--border)] last:border-r-0 text-right font-medium bg-amber-100 dark:bg-amber-900/30">
                                {formatNumber(totals[year].sales, 4)}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-amber-100/50 dark:bg-amber-900/20">
                            <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Change</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                                {totals[year].salesPercentChange !== null
                                  ? formatNumber(totals[year].salesPercentChange, 2)
                                  : 'N/A'}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-amber-100/50 dark:bg-amber-900/20">
                            <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Share</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                                {formatNumber(totals[year].percentShare, 2)}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-amber-100/50 dark:bg-amber-900/20">
                            <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">Market</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs font-medium text-[var(--foreground)]">
                                {formatNumber(totals[year].market, 4)}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-amber-100/50 dark:bg-amber-900/20">
                            <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Change</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                                {totals[year].marketPercentChange !== null
                                  ? formatNumber(totals[year].marketPercentChange, 2)
                                  : 'N/A'}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-amber-100/50 dark:bg-amber-900/20">
                            <td className="px-3 py-1 text-[var(--muted-foreground)] text-xs border-r border-[var(--border)]">% Market</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-right text-xs text-[var(--muted-foreground)]">
                                {formatNumber(totals[year].percentMarket, 2)}
                              </td>
                            ))}
                          </tr>
                        </React.Fragment>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Select data entry mode to edit values. Related calculations update automatically.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName || !formQuota || !formOwner || formLevels.length === 0}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
