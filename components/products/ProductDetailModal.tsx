'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SpecSheet {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ManufacturerPriceHistory {
  id: string;
  date: string;
  price10: number;
  price8: number;
  price5: number;
  changePercent: number;
  effectiveDate: string;
  notes?: string;
}

interface QuotePriceHistory {
  id: string;
  quoteNumber: string;
  quoteDate: string;
  customer: string;
  project: string;
  quotedPrice: number;
  commissionLevel: '10%' | '8%' | '5%';
  quantity: number;
  status: 'won' | 'lost' | 'pending' | 'expired';
  competitorPrice?: number;
  notes?: string;
}

interface Product {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  manufacturer: string;
  basePrice: number;
  commission10: number;
  commission8: number;
  commission5: number;
  standardCommissionRate?: number;     // Standard/direct commission rate (e.g., 0.10 for 10%)
  warehouseCommissionRate?: number;    // Warehouse commission rate (e.g., 0.05 for 5%)
  status: 'active' | 'discontinued' | 'while_supplies_last';
  hasConfigurator: boolean;
  specSheets?: SpecSheet[];
  manufacturerPriceHistory?: ManufacturerPriceHistory[];
  quotePriceHistory?: QuotePriceHistory[];
}

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onOpenConfigurator: () => void;
}

// Mock spec sheets data
const mockSpecSheets: SpecSheet[] = [
  {
    id: 'spec-1',
    name: 'Product Specification Sheet',
    fileName: 'ALF-LS600-spec-sheet.pdf',
    fileSize: '2.4 MB',
    uploadedAt: '2024-08-15',
    uploadedBy: 'John Smith',
  },
  {
    id: 'spec-2',
    name: 'Installation Guide',
    fileName: 'ALF-LS600-installation.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2024-08-10',
    uploadedBy: 'John Smith',
  },
  {
    id: 'spec-3',
    name: 'IES Photometric Data',
    fileName: 'ALF-LS600-ies-data.zip',
    fileSize: '856 KB',
    uploadedAt: '2024-07-20',
    uploadedBy: 'Sarah Johnson',
  },
];

// Mock manufacturer price history
const mockManufacturerPriceHistory: ManufacturerPriceHistory[] = [
  {
    id: 'mfr-1',
    date: '2024-10-01',
    price10: 320.00,
    price8: 310.00,
    price5: 301.00,
    changePercent: 3.2,
    effectiveDate: '2024-10-01',
    notes: 'Annual price increase',
  },
  {
    id: 'mfr-2',
    date: '2024-04-01',
    price10: 310.00,
    price8: 300.50,
    price5: 291.75,
    changePercent: 0,
    effectiveDate: '2024-04-01',
  },
  {
    id: 'mfr-3',
    date: '2024-01-15',
    price10: 310.00,
    price8: 300.50,
    price5: 291.75,
    changePercent: -2.5,
    effectiveDate: '2024-01-15',
    notes: 'Promotional pricing',
  },
  {
    id: 'mfr-4',
    date: '2023-10-01',
    price10: 318.00,
    price8: 308.25,
    price5: 299.25,
    changePercent: 4.0,
    effectiveDate: '2023-10-01',
    notes: 'Annual price increase',
  },
  {
    id: 'mfr-5',
    date: '2023-04-01',
    price10: 305.75,
    price8: 296.25,
    price5: 287.75,
    changePercent: 0,
    effectiveDate: '2023-04-01',
  },
];

// Mock quote price history
const mockQuotePriceHistory: QuotePriceHistory[] = [
  {
    id: 'quote-1',
    quoteNumber: 'Q-2024-1542',
    quoteDate: '2024-11-28',
    customer: 'Metro Construction Co.',
    project: 'Downtown Office Complex',
    quotedPrice: 315.00,
    commissionLevel: '8%',
    quantity: 48,
    status: 'pending',
  },
  {
    id: 'quote-2',
    quoteNumber: 'Q-2024-1489',
    quoteDate: '2024-11-15',
    customer: 'Greenfield Development',
    project: 'Parking Structure Lighting',
    quotedPrice: 305.00,
    commissionLevel: '5%',
    quantity: 120,
    status: 'won',
    notes: 'Volume discount applied',
  },
  {
    id: 'quote-3',
    quoteNumber: 'Q-2024-1423',
    quoteDate: '2024-10-22',
    customer: 'City of Riverside',
    project: 'Municipal Parking Lot',
    quotedPrice: 325.00,
    commissionLevel: '10%',
    quantity: 36,
    status: 'lost',
    competitorPrice: 298.00,
    notes: 'Lost to Acuity - price too high',
  },
  {
    id: 'quote-4',
    quoteNumber: 'Q-2024-1367',
    quoteDate: '2024-09-18',
    customer: 'Harbor Industrial Park',
    project: 'Warehouse Exterior',
    quotedPrice: 310.00,
    commissionLevel: '8%',
    quantity: 64,
    status: 'won',
  },
  {
    id: 'quote-5',
    quoteNumber: 'Q-2024-1298',
    quoteDate: '2024-08-30',
    customer: 'Sunrise Medical Center',
    project: 'Emergency Entrance',
    quotedPrice: 320.00,
    commissionLevel: '10%',
    quantity: 24,
    status: 'expired',
  },
  {
    id: 'quote-6',
    quoteNumber: 'Q-2024-1156',
    quoteDate: '2024-07-12',
    customer: 'Tech Campus LLC',
    project: 'Building A Perimeter',
    quotedPrice: 308.00,
    commissionLevel: '8%',
    quantity: 86,
    status: 'won',
  },
  {
    id: 'quote-7',
    quoteNumber: 'Q-2024-1089',
    quoteDate: '2024-06-05',
    customer: 'Retail Plaza Partners',
    project: 'Shopping Center Parking',
    quotedPrice: 322.00,
    commissionLevel: '10%',
    quantity: 42,
    status: 'lost',
    competitorPrice: 310.00,
    notes: 'Customer went with incumbent supplier',
  },
];

export default function ProductDetailModal({ product, onClose, onOpenConfigurator }: ProductDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'manufacturer-pricing' | 'quote-history'>('overview');
  const [showAddSpecSheet, setShowAddSpecSheet] = useState(false);

  const handleEditProduct = () => {
    onClose();
    router.push(`/products/${product.id}/edit`);
  };

  // Use mock data for now
  const specSheets = product.specSheets || mockSpecSheets;
  const manufacturerPriceHistory = product.manufacturerPriceHistory || mockManufacturerPriceHistory;
  const quotePriceHistory = product.quotePriceHistory || mockQuotePriceHistory;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'discontinued':
        return 'bg-red-100 text-red-700';
      case 'while_supplies_last':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'discontinued':
        return 'Discontinued';
      case 'while_supplies_last':
        return 'While Supplies Last';
      default:
        return status;
    }
  };

  const getQuoteStatusBadge = (status: QuotePriceHistory['status']) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-700';
      case 'lost':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate quote stats
  const quoteStats = {
    total: quotePriceHistory.length,
    won: quotePriceHistory.filter(q => q.status === 'won').length,
    lost: quotePriceHistory.filter(q => q.status === 'lost').length,
    pending: quotePriceHistory.filter(q => q.status === 'pending').length,
    winRate: quotePriceHistory.filter(q => q.status === 'won' || q.status === 'lost').length > 0
      ? Math.round((quotePriceHistory.filter(q => q.status === 'won').length / quotePriceHistory.filter(q => q.status === 'won' || q.status === 'lost').length) * 100)
      : 0,
    avgWinPrice: quotePriceHistory.filter(q => q.status === 'won').length > 0
      ? quotePriceHistory.filter(q => q.status === 'won').reduce((sum, q) => sum + q.quotedPrice, 0) / quotePriceHistory.filter(q => q.status === 'won').length
      : 0,
    avgLossPrice: quotePriceHistory.filter(q => q.status === 'lost').length > 0
      ? quotePriceHistory.filter(q => q.status === 'lost').reduce((sum, q) => sum + q.quotedPrice, 0) / quotePriceHistory.filter(q => q.status === 'lost').length
      : 0,
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: `Spec Sheets (${specSheets.length})` },
    { id: 'manufacturer-pricing', label: 'Manufacturer Pricing' },
    { id: 'quote-history', label: `Quote History (${quotePriceHistory.length})` },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{product.partNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-[var(--muted-foreground)]">{product.manufacturer}</span>
                <span className="text-[var(--muted-foreground)]">•</span>
                <span className="text-sm text-[var(--muted-foreground)]">{product.category}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${getStatusBadge(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {product.hasConfigurator && (
              <button
                onClick={onOpenConfigurator}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
                </svg>
                Configurator
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-[var(--border)]">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Description</h3>
                <p className="text-sm text-[var(--foreground)] bg-[var(--muted)]/30 rounded-lg p-4">
                  {product.description}
                </p>
              </div>

              {/* Current Pricing */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Current Commission Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">10% Commission</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(product.commission10)}</div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">8% Commission</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(product.commission8)}</div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">5% Commission</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(product.commission5)}</div>
                  </div>
                </div>
              </div>

              {/* Commission Rates */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission Rates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Standard Commission Rate</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">
                      {product.standardCommissionRate != null
                        ? `${(product.standardCommissionRate * 100).toFixed(1)}%`
                        : '—'}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">Direct sales commission</div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Warehouse Commission Rate</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">
                      {product.warehouseCommissionRate != null
                        ? `${(product.warehouseCommissionRate * 100).toFixed(1)}%`
                        : '—'}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">Warehouse sales commission</div>
                  </div>
                </div>
              </div>

              {/* Quote Performance */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Quote Performance</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Win Rate</div>
                    <div className="text-2xl font-semibold text-green-600">{quoteStats.winRate}%</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">{quoteStats.won} won / {quoteStats.won + quoteStats.lost} decided</div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Avg Win Price</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(quoteStats.avgWinPrice)}</div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Avg Loss Price</div>
                    <div className="text-2xl font-semibold text-[var(--foreground)]">{formatCurrency(quoteStats.avgLossPrice)}</div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="text-xs text-[var(--muted-foreground)] mb-1">Pending Quotes</div>
                    <div className="text-2xl font-semibold text-blue-600">{quoteStats.pending}</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Recent Price Change</h3>
                  <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--muted-foreground)]">Last Update</span>
                      <span className="text-sm text-[var(--foreground)]">{formatDate(manufacturerPriceHistory[0]?.date || '')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Change</span>
                      <span className={`text-sm font-medium ${manufacturerPriceHistory[0]?.changePercent > 0 ? 'text-red-600' : manufacturerPriceHistory[0]?.changePercent < 0 ? 'text-green-600' : 'text-[var(--foreground)]'}`}>
                        {manufacturerPriceHistory[0]?.changePercent > 0 ? '+' : ''}{manufacturerPriceHistory[0]?.changePercent}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Attached Documents</h3>
                  <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--muted-foreground)]">Spec Sheets</span>
                      <span className="text-sm text-[var(--foreground)]">{specSheets.length} files</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('specs')}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      View all documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spec Sheets Tab */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Attached Spec Sheets</h3>
                <button
                  onClick={() => setShowAddSpecSheet(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                  </svg>
                  Add Spec Sheet
                </button>
              </div>

              {specSheets.length === 0 ? (
                <div className="text-center py-12 bg-[var(--muted)]/30 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
                  </svg>
                  <p className="text-[var(--muted-foreground)]">No spec sheets attached</p>
                  <button
                    onClick={() => setShowAddSpecSheet(true)}
                    className="mt-3 text-sm text-[var(--primary)] hover:underline"
                  >
                    Add your first spec sheet
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {specSheets.map((spec) => (
                    <div
                      key={spec.id}
                      className="flex items-center justify-between p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{spec.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {spec.fileName} • {spec.fileSize} • Uploaded {formatDate(spec.uploadedAt)} by {spec.uploadedBy}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors" title="Preview">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors" title="Download">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-red-500" title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Spec Sheet Form */}
              {showAddSpecSheet && (
                <div className="mt-4 p-4 bg-[var(--muted)]/30 rounded-lg border border-dashed border-[var(--border)]">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
                    </svg>
                    <p className="text-sm text-[var(--foreground)] mb-1">Drop files here or click to upload</p>
                    <p className="text-xs text-[var(--muted-foreground)]">PDF, DOC, XLS, ZIP up to 10MB</p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
                        Choose File
                      </button>
                      <button
                        onClick={() => setShowAddSpecSheet(false)}
                        className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manufacturer Pricing Tab */}
          {activeTab === 'manufacturer-pricing' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Manufacturer Price History</h3>

              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Effective Date</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">10% Comm</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">8% Comm</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">5% Comm</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-center">Change</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Notes</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-[var(--border)]">
                  {manufacturerPriceHistory.map((record, idx) => (
                    <div
                      key={record.id}
                      className={`grid grid-cols-6 gap-4 px-4 py-3 ${idx === 0 ? 'bg-[var(--primary)]/5' : ''}`}
                    >
                      <div className="flex items-center">
                        <span className="text-sm text-[var(--foreground)]">{formatDate(record.effectiveDate)}</span>
                        {idx === 0 && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">Current</span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--foreground)] text-right font-medium">{formatCurrency(record.price10)}</div>
                      <div className="text-sm text-[var(--foreground)] text-right font-medium">{formatCurrency(record.price8)}</div>
                      <div className="text-sm text-[var(--foreground)] text-right font-medium">{formatCurrency(record.price5)}</div>
                      <div className="text-center">
                        {record.changePercent !== 0 ? (
                          <span className={`text-sm font-medium ${record.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {record.changePercent > 0 ? '+' : ''}{record.changePercent}%
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">-</span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)] truncate">{record.notes || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quote History Tab */}
          {activeTab === 'quote-history' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                  <div className="text-xs text-green-600 font-medium">Won</div>
                  <div className="text-xl font-semibold text-green-700">{quoteStats.won}</div>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                  <div className="text-xs text-red-600 font-medium">Lost</div>
                  <div className="text-xl font-semibold text-red-700">{quoteStats.lost}</div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                  <div className="text-xs text-blue-600 font-medium">Pending</div>
                  <div className="text-xl font-semibold text-blue-700">{quoteStats.pending}</div>
                </div>
                <div className="bg-[var(--muted)]/30 rounded-lg border border-[var(--border)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)] font-medium">Win Rate</div>
                  <div className="text-xl font-semibold text-[var(--foreground)]">{quoteStats.winRate}%</div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[var(--foreground)]">Quote History</h3>

              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-8 gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Quote #</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Date</div>
                  <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Customer / Project</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Quoted</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-center">Qty</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase text-center">Status</div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Notes</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-[var(--border)]">
                  {quotePriceHistory.map((quote) => (
                    <div
                      key={quote.id}
                      className="grid grid-cols-8 gap-4 px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors"
                    >
                      <div className="text-sm text-[var(--primary)] font-medium cursor-pointer hover:underline">
                        {quote.quoteNumber}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">{formatDate(quote.quoteDate)}</div>
                      <div className="col-span-2">
                        <div className="text-sm text-[var(--foreground)]">{quote.customer}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{quote.project}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(quote.quotedPrice)}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{quote.commissionLevel}</div>
                      </div>
                      <div className="text-sm text-[var(--foreground)] text-center">{quote.quantity}</div>
                      <div className="text-center">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${getQuoteStatusBadge(quote.status)}`}>
                          {quote.status}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {quote.status === 'lost' && quote.competitorPrice && (
                          <div className="text-red-600">Comp: {formatCurrency(quote.competitorPrice)}</div>
                        )}
                        {quote.notes && <div className="truncate">{quote.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/20">
          <div className="text-sm text-[var(--muted-foreground)]">
            Last updated: {formatDate(manufacturerPriceHistory[0]?.date || new Date().toISOString())}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleEditProduct}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
