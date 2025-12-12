'use client';

import React, { useState, useCallback, useRef } from 'react';

// Market segment years
const YEARS = ['2023', '2024', '2025', '2026', '2027', '2028', '2029'] as const;
type Year = typeof YEARS[number];

// Market segment types
const SEGMENTS = ['Contractor', 'Industrial', 'Utility', 'Institutional'] as const;
type SegmentName = typeof SEGMENTS[number];

type SegmentYearData = {
  value: number;      // Segment Market Value
  percentMarket: number;  // % Market
  percentChange: number | null;  // % Change (null for first year)
};

type MarketSegment = {
  name: SegmentName;
  years: Record<Year, SegmentYearData>;
};

type Product = {
  id: string;
  name: string;
  code: string;
  tags: string[];
  isSystem: boolean;
  cogsPercent: number;
  marketSegments: MarketSegment[];
};

// Data entry mode options
type DataEntryMode = 'value' | 'percentMarket' | 'percentChange';

// Generate initial market segments with default data based on the screenshot
const generateDefaultMarketSegments = (): MarketSegment[] => {
  return [
    {
      name: 'Contractor',
      years: {
        '2023': { value: 1769.1938, percentMarket: 3.08, percentChange: null },
        '2024': { value: 1810.4682, percentMarket: 3.08, percentChange: 2.33 },
        '2025': { value: 1781.4171, percentMarket: 3.08, percentChange: -1.60 },
        '2026': { value: 1747.5226, percentMarket: 3.08, percentChange: -1.90 },
        '2027': { value: 1794.8018, percentMarket: 3.08, percentChange: 2.71 },
        '2028': { value: 1843.2749, percentMarket: 3.08, percentChange: 2.70 },
        '2029': { value: 1879.5901, percentMarket: 3.08, percentChange: 1.97 },
      },
    },
    {
      name: 'Industrial',
      years: {
        '2023': { value: 1332.2747, percentMarket: 3.10, percentChange: null },
        '2024': { value: 1356.5895, percentMarket: 3.10, percentChange: 1.83 },
        '2025': { value: 1417.0703, percentMarket: 3.10, percentChange: 4.46 },
        '2026': { value: 1478.4940, percentMarket: 3.10, percentChange: 4.33 },
        '2027': { value: 1549.6209, percentMarket: 3.10, percentChange: 4.81 },
        '2028': { value: 1622.5971, percentMarket: 3.10, percentChange: 4.71 },
        '2029': { value: 1689.6352, percentMarket: 3.10, percentChange: 4.13 },
      },
    },
    {
      name: 'Utility',
      years: {
        '2023': { value: 36.3667, percentMarket: 0.47, percentChange: null },
        '2024': { value: 38.1190, percentMarket: 0.47, percentChange: 4.82 },
        '2025': { value: 38.9039, percentMarket: 0.47, percentChange: 2.06 },
        '2026': { value: 39.7676, percentMarket: 0.47, percentChange: 2.22 },
        '2027': { value: 40.7776, percentMarket: 0.47, percentChange: 2.54 },
        '2028': { value: 42.1523, percentMarket: 0.47, percentChange: 3.37 },
        '2029': { value: 43.8412, percentMarket: 0.47, percentChange: 4.01 },
      },
    },
    {
      name: 'Institutional',
      years: {
        '2023': { value: 818.6720, percentMarket: 2.74, percentChange: null },
        '2024': { value: 830.9087, percentMarket: 2.74, percentChange: 1.49 },
        '2025': { value: 849.7800, percentMarket: 2.74, percentChange: 2.27 },
        '2026': { value: 873.7911, percentMarket: 2.74, percentChange: 2.83 },
        '2027': { value: 892.7205, percentMarket: 2.74, percentChange: 2.17 },
        '2028': { value: 912.4087, percentMarket: 2.74, percentChange: 2.21 },
        '2029': { value: 934.7439, percentMarket: 2.74, percentChange: 2.45 },
      },
    },
  ];
};

// Calculate total market from segments
const calculateTotalMarket = (segments: MarketSegment[]): Record<Year, SegmentYearData> => {
  const totals: Record<Year, SegmentYearData> = {} as Record<Year, SegmentYearData>;

  YEARS.forEach((year, yearIndex) => {
    const totalValue = segments.reduce((sum, seg) => sum + seg.years[year].value, 0);
    const prevYear = yearIndex > 0 ? YEARS[yearIndex - 1] : null;
    let percentChange: number | null = null;

    if (prevYear) {
      const prevTotalValue = segments.reduce((sum, seg) => sum + seg.years[prevYear].value, 0);
      percentChange = ((totalValue - prevTotalValue) / prevTotalValue) * 100;
    }

    totals[year] = {
      value: totalValue,
      percentMarket: 2.86, // Fixed for total market as shown in screenshot
      percentChange,
    };
  });

  return totals;
};

const initialProducts: Product[] = [
  { id: '1', name: 'Building wire', code: '', tags: [], isSystem: false, cogsPercent: 72, marketSegments: generateDefaultMarketSegments() },
  { id: '2', name: 'Circuit breakers', code: '', tags: [], isSystem: false, cogsPercent: 65, marketSegments: generateDefaultMarketSegments() },
  { id: '3', name: 'Enclosures', code: '', tags: [], isSystem: false, cogsPercent: 58, marketSegments: generateDefaultMarketSegments() },
  { id: '4', name: 'Fuses', code: '', tags: [], isSystem: false, cogsPercent: 55, marketSegments: generateDefaultMarketSegments() },
  { id: '5', name: 'Lamps', code: '', tags: [], isSystem: false, cogsPercent: 48, marketSegments: generateDefaultMarketSegments() },
  { id: '6', name: 'Motor controls', code: '', tags: [], isSystem: false, cogsPercent: 62, marketSegments: generateDefaultMarketSegments() },
  { id: '7', name: 'Starters', code: '', tags: [], isSystem: false, cogsPercent: 60, marketSegments: generateDefaultMarketSegments() },
  { id: '8', name: 'Relays', code: '', tags: [], isSystem: false, cogsPercent: 54, marketSegments: generateDefaultMarketSegments() },
  { id: '9', name: 'Panel boards', code: '', tags: [], isSystem: false, cogsPercent: 68, marketSegments: generateDefaultMarketSegments() },
  { id: '10', name: 'Switch boards', code: '', tags: [], isSystem: false, cogsPercent: 70, marketSegments: generateDefaultMarketSegments() },
  { id: '11', name: 'Programmable controllers', code: '', tags: [], isSystem: false, cogsPercent: 45, marketSegments: generateDefaultMarketSegments() },
  { id: '12', name: 'Safety switches', code: '', tags: [], isSystem: false, cogsPercent: 52, marketSegments: generateDefaultMarketSegments() },
  { id: '13', name: 'Specialty transformers', code: '', tags: [], isSystem: false, cogsPercent: 58, marketSegments: generateDefaultMarketSegments() },
  { id: '14', name: 'Wiring devices', code: '', tags: [], isSystem: false, cogsPercent: 42, marketSegments: generateDefaultMarketSegments() },
];

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsSystem, setFormIsSystem] = useState(false);
  const [formCogsPercent, setFormCogsPercent] = useState('');
  const [formMarketSegments, setFormMarketSegments] = useState<MarketSegment[]>(generateDefaultMarketSegments());
  const [dataEntryMode, setDataEntryMode] = useState<DataEntryMode>('value');

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormTags('');
    setFormIsSystem(false);
    setFormCogsPercent('');
    setFormMarketSegments(generateDefaultMarketSegments());
    setDataEntryMode('value');
  };

  const openAddModal = () => {
    resetForm();
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormName(product.name);
    setFormCode(product.code);
    setFormTags(product.tags.join(', '));
    setFormIsSystem(product.isSystem);
    setFormCogsPercent(product.cogsPercent.toString());
    setFormMarketSegments(JSON.parse(JSON.stringify(product.marketSegments))); // Deep copy
    setEditingProduct(product);
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

    // Calculate total market value for the year (before update)
    const getTotalMarketForYear = (y: Year) =>
      updatedSegments.reduce((sum, seg) => sum + seg.years[y].value, 0);

    if (field === 'value') {
      // User entered market value directly
      segment.years[year].value = newValue;

      // Recalculate % Market based on new total
      const newTotal = getTotalMarketForYear(year);
      updatedSegments.forEach(seg => {
        seg.years[year].percentMarket = (seg.years[year].value / newTotal) * 100;
      });

      // Recalculate % Change for this year and next year
      if (yearIndex > 0) {
        const prevYear = YEARS[yearIndex - 1];
        segment.years[year].percentChange =
          ((segment.years[year].value - segment.years[prevYear].value) / segment.years[prevYear].value) * 100;
      }
      if (yearIndex < YEARS.length - 1) {
        const nextYear = YEARS[yearIndex + 1];
        segment.years[nextYear].percentChange =
          ((segment.years[nextYear].value - segment.years[year].value) / segment.years[year].value) * 100;
      }
    } else if (field === 'percentMarket') {
      // User entered % Market - calculate value from total market
      const currentTotal = getTotalMarketForYear(year);
      const newValueFromPercent = (newValue / 100) * currentTotal;
      segment.years[year].value = newValueFromPercent;
      segment.years[year].percentMarket = newValue;

      // Recalculate % Change
      if (yearIndex > 0) {
        const prevYear = YEARS[yearIndex - 1];
        segment.years[year].percentChange =
          ((segment.years[year].value - segment.years[prevYear].value) / segment.years[prevYear].value) * 100;
      }
      if (yearIndex < YEARS.length - 1) {
        const nextYear = YEARS[yearIndex + 1];
        segment.years[nextYear].percentChange =
          ((segment.years[nextYear].value - segment.years[year].value) / segment.years[year].value) * 100;
      }
    } else if (field === 'percentChange' && yearIndex > 0) {
      // User entered % Change - calculate value from previous year
      const prevYear = YEARS[yearIndex - 1];
      const prevValue = segment.years[prevYear].value;
      segment.years[year].value = prevValue * (1 + newValue / 100);
      segment.years[year].percentChange = newValue;

      // Recalculate % Market based on new total
      const newTotal = getTotalMarketForYear(year);
      updatedSegments.forEach(seg => {
        seg.years[year].percentMarket = (seg.years[year].value / newTotal) * 100;
      });

      // Recalculate next year's % Change if exists
      if (yearIndex < YEARS.length - 1) {
        const nextYear = YEARS[yearIndex + 1];
        segment.years[nextYear].percentChange =
          ((segment.years[nextYear].value - segment.years[year].value) / segment.years[year].value) * 100;
      }
    }

    return updatedSegments;
  }, []);

  const handleSegmentChange = (segmentIndex: number, year: Year, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = recalculateSegmentData(formMarketSegments, segmentIndex, year, dataEntryMode, numValue);
    setFormMarketSegments(updated);
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

    // Expected format: Segment,2023,2024,2025,2026,2027,2028,2029
    const updatedSegments = JSON.parse(JSON.stringify(formMarketSegments)) as MarketSegment[];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 2) continue;

      const segmentName = values[0].toUpperCase();
      const segmentIndex = updatedSegments.findIndex(
        s => s.name.toUpperCase() === segmentName
      );

      if (segmentIndex === -1) continue;

      YEARS.forEach((year, yearIdx) => {
        const valueIdx = yearIdx + 1; // Skip segment name column
        if (valueIdx < values.length) {
          const numValue = parseFloat(values[valueIdx]) || 0;
          updatedSegments[segmentIndex].years[year].value = numValue;
        }
      });
    }

    // Recalculate all % changes and % market
    const totalByYear: Record<Year, number> = {} as Record<Year, number>;
    YEARS.forEach(year => {
      totalByYear[year] = updatedSegments.reduce((sum, seg) => sum + seg.years[year].value, 0);
    });

    updatedSegments.forEach((segment) => {
      YEARS.forEach((year, yearIdx) => {
        // Recalculate % market
        if (totalByYear[year] > 0) {
          segment.years[year].percentMarket = (segment.years[year].value / totalByYear[year]) * 100;
        }
        // Recalculate % change
        if (yearIdx > 0) {
          const prevYear = YEARS[yearIdx - 1];
          const prevValue = segment.years[prevYear].value;
          segment.years[year].percentChange = prevValue > 0
            ? ((segment.years[year].value - prevValue) / prevValue) * 100
            : 0;
        }
      });
    });

    setFormMarketSegments(updatedSegments);
  };

  const downloadCSVTemplate = () => {
    const headers = ['Segment', ...YEARS].join(',');
    const rows: string[] = [headers];

    SEGMENTS.forEach(segment => {
      const segmentData = formMarketSegments.find(s => s.name === segment);
      if (segmentData) {
        rows.push([segment, ...YEARS.map(year => segmentData.years[year].value.toString())].join(','));
      } else {
        rows.push([segment, ...YEARS.map(() => '0')].join(','));
      }
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_market_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (!formName) return;

    const newProduct: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formName,
      code: formCode,
      tags: formTags ? formTags.split(',').map(t => t.trim()).filter(t => t) : [],
      isSystem: formIsSystem,
      cogsPercent: formCogsPercent ? parseFloat(formCogsPercent) : 0,
      marketSegments: formMarketSegments,
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts(prev => [...prev, newProduct]);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const getDisplayValue = (segment: MarketSegment, year: Year): string => {
    const data = segment.years[year];
    switch (dataEntryMode) {
      case 'value':
        return formatNumber(data.value);
      case 'percentMarket':
        return formatNumber(data.percentMarket, 2);
      case 'percentChange':
        return data.percentChange !== null ? formatNumber(data.percentChange, 2) : 'N/A';
      default:
        return formatNumber(data.value);
    }
  };

  const getInputValue = (segment: MarketSegment, year: Year): string => {
    const data = segment.years[year];
    switch (dataEntryMode) {
      case 'value':
        return data.value.toString();
      case 'percentMarket':
        return data.percentMarket.toString();
      case 'percentChange':
        return data.percentChange !== null ? data.percentChange.toString() : '';
      default:
        return data.value.toString();
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Products</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Seeded catalog for MVP with local edits.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Product
        </button>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        {/* Card Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--foreground)]">Catalog</h2>
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
              placeholder="Search products..."
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
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Code</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Tags</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">COGS %</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">System?</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    {searchQuery ? 'No products match your search.' : 'No products configured yet.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[var(--primary)] font-medium cursor-pointer hover:underline" onClick={() => openEditModal(product)}>
                        {product.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                      {product.code || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                      {product.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[var(--muted)] rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {product.cogsPercent > 0 ? `${product.cogsPercent}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {product.isSystem ? 'System' : 'User-defined'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Basic Info Section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Circuit breakers"
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g., CB-001"
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Tags</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g., electrical, safety (comma separated)"
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  />
                </div>

                {/* COGS Percent */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Cost of Goods Sold %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formCogsPercent}
                      onChange={(e) => setFormCogsPercent(e.target.value)}
                      placeholder="e.g., 65"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
                  </div>
                </div>
              </div>

              {/* System checkbox */}
              <div className="flex items-center gap-2 mb-6">
                <input
                  type="checkbox"
                  id="isSystem"
                  checked={formIsSystem}
                  onChange={(e) => setFormIsSystem(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)]"
                />
                <label htmlFor="isSystem" className="text-sm text-[var(--foreground)]">
                  System product (cannot be deleted by users)
                </label>
              </div>

              {/* Market Segments Section */}
              <div className="border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Market Segments</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--muted-foreground)]">Select data entry mode:</span>
                      <select
                        value={dataEntryMode}
                        onChange={(e) => setDataEntryMode(e.target.value as DataEntryMode)}
                        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                      >
                        <option value="value">Enter Segment Market Value</option>
                        <option value="percentMarket">Enter % Market</option>
                        <option value="percentChange">Enter % Change</option>
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
                </div>

                {/* Market Segments Table */}
                <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-white">
                        <th className="text-left px-4 py-2 font-semibold border-r border-[#2d4a6f] min-w-[160px]">Market Segment</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-center px-4 py-2 font-semibold border-r border-[#2d4a6f] last:border-r-0 min-w-[120px]">
                            {year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formMarketSegments.map((segment, segmentIndex) => (
                        <React.Fragment key={segment.name}>
                          {/* Segment Value Row */}
                          <tr className="border-b border-[var(--border)]">
                            <td className="px-4 py-2 font-medium text-[var(--foreground)] bg-[var(--muted)]/30">
                              {segment.name}
                            </td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1 border-l border-[var(--border)]">
                                <input
                                  type="number"
                                  step="any"
                                  value={getInputValue(segment, year)}
                                  onChange={(e) => handleSegmentChange(segmentIndex, year, e.target.value)}
                                  disabled={dataEntryMode === 'percentChange' && year === '2023'}
                                  className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-right text-[var(--foreground)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                                />
                              </td>
                            ))}
                          </tr>
                          {/* % Market Row */}
                          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/10">
                            <td className="px-4 py-1.5 text-xs text-[var(--muted-foreground)] pl-8">% Market</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1.5 border-l border-[var(--border)] text-right text-xs text-[var(--muted-foreground)]">
                                {formatNumber(segment.years[year].percentMarket, 2)}
                              </td>
                            ))}
                          </tr>
                          {/* % Change Row */}
                          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/10">
                            <td className="px-4 py-1.5 text-xs text-[var(--muted-foreground)] pl-8">% Change</td>
                            {YEARS.map(year => (
                              <td key={year} className="px-2 py-1.5 border-l border-[var(--border)] text-right text-xs text-[var(--muted-foreground)]">
                                {segment.years[year].percentChange !== null
                                  ? formatNumber(segment.years[year].percentChange, 2)
                                  : 'N/A'}
                              </td>
                            ))}
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* Total Market Row */}
                      {(() => {
                        const totals = calculateTotalMarket(formMarketSegments);
                        return (
                          <React.Fragment>
                            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                              <td className="px-4 py-2 font-semibold text-[var(--foreground)]">Total Market</td>
                              {YEARS.map(year => (
                                <td key={year} className="px-2 py-2 border-l border-[var(--border)] text-right font-medium text-[var(--foreground)]">
                                  {formatNumber(totals[year].value)}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                              <td className="px-4 py-1.5 text-xs text-[var(--muted-foreground)] pl-8">% Market</td>
                              {YEARS.map(year => (
                                <td key={year} className="px-2 py-1.5 border-l border-[var(--border)] text-right text-xs text-[var(--muted-foreground)]">
                                  {formatNumber(totals[year].percentMarket, 2)}
                                </td>
                              ))}
                            </tr>
                            <tr className="bg-[var(--muted)]/30">
                              <td className="px-4 py-1.5 text-xs text-[var(--muted-foreground)] pl-8">% Change</td>
                              {YEARS.map(year => (
                                <td key={year} className="px-2 py-1.5 border-l border-[var(--border)] text-right text-xs text-[var(--muted-foreground)]">
                                  {totals[year].percentChange !== null
                                    ? formatNumber(totals[year].percentChange, 2)
                                    : 'N/A'}
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
                  Edit values in the input cells. When you change one value, related values (% Market and % Change) are automatically recalculated.
                </p>
              </div>
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
                disabled={!formName}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
