'use client';

import React, { useState } from 'react';
import AdvancedFilters from './advancedFilters/AdvancedFilters';

// ============================================
// TYPES
// ============================================

type ProductCross = {
  id: string;
  competitorManufacturer: string;
  competitorPartNumber: string;
  competitorDescription: string;
  ourManufacturer: string;
  ourPartNumber: string;
  ourDescription: string;
  timesUsed: number;
  lastUsed: string;
  addedBy: string;
  addedDate: string;
};

// ============================================
// MOCK DATA
// ============================================

const mockProductCrosses: ProductCross[] = [
  {
    id: 'cross-1',
    competitorManufacturer: 'Competitor A',
    competitorPartNumber: 'CA-12345',
    competitorDescription: 'LED Panel Light 2x4 40W 5000K',
    ourManufacturer: 'Our Company',
    ourPartNumber: 'OC-98765',
    ourDescription: 'LED Panel Light 2x4 40W 5000K High Output',
    timesUsed: 47,
    lastUsed: '2025-11-28',
    addedBy: 'John Smith',
    addedDate: '2024-05-12',
  },
  {
    id: 'cross-2',
    competitorManufacturer: 'Competitor B',
    competitorPartNumber: 'CB-55555',
    competitorDescription: 'Recessed Downlight 6" LED 15W',
    ourManufacturer: 'Our Company',
    ourPartNumber: 'OC-45678',
    ourDescription: 'Recessed LED Downlight 6" 15W 3000K',
    timesUsed: 32,
    lastUsed: '2025-12-01',
    addedBy: 'Sarah Johnson',
    addedDate: '2024-03-08',
  },
  {
    id: 'cross-3',
    competitorManufacturer: 'Competitor C',
    competitorPartNumber: 'CC-99999',
    competitorDescription: 'Linear LED Fixture 4ft 40W',
    ourManufacturer: 'Our Company',
    ourPartNumber: 'OC-34567',
    ourDescription: 'LED Linear Light 4ft 40W 4000K',
    timesUsed: 18,
    lastUsed: '2025-11-15',
    addedBy: 'Marcus Chen',
    addedDate: '2024-07-22',
  },
  {
    id: 'cross-4',
    competitorManufacturer: 'Competitor A',
    competitorPartNumber: 'CA-77777',
    competitorDescription: 'Track Light Head Adjustable 20W',
    ourManufacturer: 'Our Company',
    ourPartNumber: 'OC-23456',
    ourDescription: 'Track Light Head 20W Adjustable Beam',
    timesUsed: 5,
    lastUsed: '2025-10-12',
    addedBy: 'John Smith',
    addedDate: '2024-09-15',
  },
  {
    id: 'cross-5',
    competitorManufacturer: 'Competitor D',
    competitorPartNumber: 'CD-11111',
    competitorDescription: 'Wall Sconce LED 12W',
    ourManufacturer: 'Our Company',
    ourPartNumber: 'OC-56789',
    ourDescription: 'Wall Mount LED Sconce 12W Dimmable',
    timesUsed: 1,
    lastUsed: '2025-09-05',
    addedBy: 'Sarah Johnson',
    addedDate: '2024-08-30',
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductCrossesContent() {
  const [productCrosses, setProductCrosses] = useState<ProductCross[]>(mockProductCrosses);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ProductCross>('timesUsed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filterOptions = [
    { id: 'competitor-manufacturer', label: 'Competitor Manufacturer', type: 'dropdown' as const },
    { id: 'our-manufacturer', label: 'Our Manufacturer', type: 'dropdown' as const },
    { id: 'times-used', label: 'Times Used', type: 'dropdown' as const },
    { id: 'date-added', label: 'Date Added', type: 'date' as const },
    { id: 'last-used', label: 'Last Used', type: 'date' as const },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (uploadedFile) {
      alert(`Uploading ${uploadedFile.name}...`);
      setShowUploadModal(false);
      setUploadedFile(null);
    }
  };

  const handleSort = (field: keyof ProductCross) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredCrosses = productCrosses
    .filter(cross =>
      cross.competitorManufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cross.competitorPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cross.competitorDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cross.ourPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cross.ourDescription.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });

  const getUsageColor = (timesUsed: number) => {
    if (timesUsed >= 30) return 'bg-green-100 text-green-700';
    if (timesUsed >= 10) return 'bg-blue-100 text-blue-700';
    if (timesUsed >= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Product Crosses</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage known product crosses and track their usage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Downloading product crosses template...')}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download Template
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 17V7m0 0L7 10m3-3l3 3M3 3h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload Product Crosses
            </button>
          </div>
        </div>

        {/* Search, Filters and Stats */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by manufacturer, part number, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8.5" cy="8.5" r="5.5"/>
              <path d="M12.5 12.5L17 17" strokeLinecap="round"/>
            </svg>
          </div>
          <AdvancedFilters filterOptions={filterOptions} />
          <button
            onClick={() => handleSort(sortField)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
            </svg>
            Sort
          </button>
          <div className="flex items-center gap-4 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">{productCrosses.length}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Crosses</div>
            </div>
            <div className="h-8 w-px bg-[var(--border)]"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {productCrosses.reduce((sum, cross) => sum + cross.timesUsed, 0)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Uses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Crosses Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <tr>
                <th
                  onClick={() => handleSort('competitorManufacturer')}
                  className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-center gap-1">
                    Competitor Manufacturer
                    {sortField === 'competitorManufacturer' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path d={sortDirection === 'asc' ? 'M5 10l5-5 5 5H5z' : 'M5 10l5 5 5-5H5z'} />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('competitorPartNumber')}
                  className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-center gap-1">
                    Competitor Part #
                    {sortField === 'competitorPartNumber' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path d={sortDirection === 'asc' ? 'M5 10l5-5 5 5H5z' : 'M5 10l5 5 5-5H5z'} />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Competitor Description
                </th>
                <th
                  onClick={() => handleSort('ourManufacturer')}
                  className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-center gap-1">
                    Our Manufacturer
                    {sortField === 'ourManufacturer' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path d={sortDirection === 'asc' ? 'M5 10l5-5 5 5H5z' : 'M5 10l5 5 5-5H5z'} />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ourPartNumber')}
                  className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-center gap-1">
                    Our Part #
                    {sortField === 'ourPartNumber' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path d={sortDirection === 'asc' ? 'M5 10l5-5 5 5H5z' : 'M5 10l5 5 5-5H5z'} />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Our Description
                </th>
                <th
                  onClick={() => handleSort('timesUsed')}
                  className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-center gap-1">
                    Times Used
                    {sortField === 'timesUsed' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path d={sortDirection === 'asc' ? 'M5 10l5-5 5 5H5z' : 'M5 10l5 5 5-5H5z'} />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lastUsed')}
                  className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-center gap-1">
                    Last Used
                    {sortField === 'lastUsed' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path d={sortDirection === 'asc' ? 'M5 10l5-5 5 5H5z' : 'M5 10l5 5 5-5H5z'} />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCrosses.map((cross) => (
                <tr key={cross.id} className="hover:bg-[var(--muted)]/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--foreground)]">{cross.competitorManufacturer}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                        Competitor
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{cross.competitorPartNumber}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{cross.competitorDescription}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--foreground)]">{cross.ourManufacturer}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Our Mfr
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{cross.ourPartNumber}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{cross.ourDescription}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUsageColor(cross.timesUsed)}`}>
                      {cross.timesUsed}x
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{cross.lastUsed}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`Edit cross ${cross.id}`)}
                        className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2l4 4L7 17H3v-4L14 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete this product cross?`)) {
                            setProductCrosses(productCrosses.filter(c => c.id !== cross.id));
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 5h14M8 5V3h4v2m-8 0v12a2 2 0 002 2h4a2 2 0 002-2V5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCrosses.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[var(--muted-foreground)]">No product crosses found</p>
          </div>
        )}
      </div>

      {/* Usage Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
        <span className="font-semibold">Usage Indicator:</span>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">30+</span>
          <span>High Confidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">10-29</span>
          <span>Medium Confidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">5-9</span>
          <span>Low Confidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">&lt;5</span>
          <span>Very Low Confidence</span>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Upload Product Crosses</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Upload an Excel or CSV file containing your product crosses. The file should include columns for:
                Competitor Manufacturer, Competitor Part Number, Competitor Description, Our Manufacturer, Our Part Number, and Our Description.
              </p>

              <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-[var(--muted-foreground)]"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                      Choose file
                    </span>
                    <span className="text-[var(--muted-foreground)]"> or drag and drop</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Excel (.xlsx, .xls) or CSV files only
                </p>
              </div>

              {uploadedFile && (
                <div className="mt-4 p-3 bg-[var(--muted)]/30 rounded border border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16l4-3 4 3 4-3V4a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm text-[var(--foreground)]">{uploadedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-1 hover:bg-[var(--muted)] rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                }}
                className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadedFile}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
