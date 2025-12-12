'use client';

import React, { useState } from 'react';
import AdvancedFilters from './AdvancedFilters';

// ============================================
// TYPES
// ============================================

type Takeoff = {
  id: string;
  title: string;
  source: string;
  createdBy: string;
  createdDate: string;
  status: 'Classification' | 'Abridgment' | 'Parsing' | 'Complete';
  quoteId?: string;
};

type Document = {
  id: string;
  name: string;
  type: 'PDF';
  size: string;
  uploadDate: string;
  classification: 'Fixture Schedules' | 'Specifications' | 'Blueprints' | 'Other Docs' | 'Irrelevant' | '';
  confidence: number;
  pages: number;
  abridged: boolean;
  abridgedPages?: number;
};

type ParsedItem = {
  id: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  quantity: number;
  isOurManufacturer: boolean;
  isCrossed: boolean;
  crossedManufacturer?: string;
  crossedPartNumber?: string;
  crossedDescription?: string;
};

type AbridgmentReportItem = {
  page: number;
  included: boolean;
  reason: string;
};

// ============================================
// MOCK DATA
// ============================================

const mockTakeoffs: Takeoff[] = [
  {
    id: 'TO-001',
    title: 'Downtown Plaza Renovation',
    source: 'Manual Upload',
    createdBy: 'Sarah Johnson',
    createdDate: '2025-01-15',
    status: 'Complete',
    quoteId: 'Q-001',
  },
  {
    id: 'TO-002',
    title: 'Hospital Expansion Project',
    source: 'Email',
    createdBy: 'Marcus Chen',
    createdDate: '2025-01-20',
    status: 'Parsing',
  },
  {
    id: 'TO-003',
    title: 'Office Complex Lighting',
    source: 'Manual Upload',
    createdBy: 'Sarah Johnson',
    createdDate: '2025-01-22',
    status: 'Classification',
  },
];

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: '076---P151 ENLARGED PLUMBING PLANS.pdf',
    type: 'PDF',
    size: '897.8 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 45,
    abridged: false,
  },
  {
    id: 'doc-2',
    name: '067---M801 MECHANICAL SCHEDULES.pdf',
    type: 'PDF',
    size: '760.7 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 38,
    abridged: false,
  },
  {
    id: 'doc-3',
    name: '136--ADDM1 P801 PLUMBING SCHEDULES.pdf',
    type: 'PDF',
    size: '743.4 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 892,
    abridged: false,
  },
  {
    id: 'doc-4',
    name: '081---P801 PLUMBING SCHEDULES.pdf',
    type: 'PDF',
    size: '728.0 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 615,
    abridged: false,
  },
  {
    id: 'doc-5',
    name: '074---P101 LEVEL 1 PLUMBING PLAN.pdf',
    type: 'PDF',
    size: '1094.0 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 725,
    abridged: false,
  },
];

const mockParsedItems: ParsedItem[] = [
  {
    id: 'item-1',
    manufacturer: 'Competitor A',
    partNumber: 'CA-12345',
    description: 'LED Panel Light 2x4 40W 5000K',
    quantity: 125,
    isOurManufacturer: false,
    isCrossed: false,
  },
  {
    id: 'item-2',
    manufacturer: 'Our Company',
    partNumber: 'OC-98765',
    description: 'Emergency Exit Sign LED Red',
    quantity: 48,
    isOurManufacturer: true,
    isCrossed: false,
  },
  {
    id: 'item-3',
    manufacturer: 'Competitor B',
    partNumber: 'CB-55555',
    description: 'Recessed Downlight 6" LED 15W',
    quantity: 200,
    isOurManufacturer: false,
    isCrossed: true,
    crossedManufacturer: 'Our Company',
    crossedPartNumber: 'OC-45678',
    crossedDescription: 'Recessed LED Downlight 6" 15W 3000K',
  },
  {
    id: 'item-4',
    manufacturer: 'Competitor A',
    partNumber: 'CA-77777',
    description: 'Track Light Head Adjustable 20W',
    quantity: 75,
    isOurManufacturer: false,
    isCrossed: false,
  },
  {
    id: 'item-5',
    manufacturer: 'Competitor C',
    partNumber: 'CC-99999',
    description: 'Linear LED Fixture 4ft 40W',
    quantity: 85,
    isOurManufacturer: false,
    isCrossed: true,
    crossedManufacturer: 'Our Company',
    crossedPartNumber: 'OC-34567',
    crossedDescription: 'LED Linear Light 4ft 40W 4000K',
  },
];

const mockAbridgmentReport: AbridgmentReportItem[] = [
  { page: 1, included: true, reason: 'Title page with project information' },
  { page: 2, included: false, reason: 'Table of contents - not relevant' },
  { page: 3, included: true, reason: 'Fixture schedule table' },
  { page: 4, included: true, reason: 'Fixture specifications' },
  { page: 5, included: false, reason: 'Blank page' },
  { page: 6, included: true, reason: 'Lighting plan details' },
  { page: 7, included: false, reason: 'General notes - redundant' },
  { page: 8, included: true, reason: 'Product specifications' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function TakeoffsContent() {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTakeoff, setSelectedTakeoff] = useState<Takeoff | null>(null);
  const [currentStep, setCurrentStep] = useState<'classification' | 'abridgment' | 'parsing'>('classification');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAbridgmentReportModal, setShowAbridgmentReportModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>(mockParsedItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const filterOptions = [
    { id: 'takeoff-id', label: 'Takeoff ID', type: 'text' as const },
    { id: 'title', label: 'Title', type: 'text' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
    { id: 'created-by', label: 'Created By', type: 'dropdown' as const },
    { id: 'date', label: 'Date', type: 'date' as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-500 text-white';
      case 'Parsing':
        return 'bg-blue-500 text-white';
      case 'Abridgment':
        return 'bg-yellow-500 text-white';
      case 'Classification':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 20);
      setUploadedFiles(files);
    }
  };

  const handleUploadStart = () => {
    setShowUploadModal(false);
    setViewMode('detail');
    setCurrentStep('classification');
    setSelectedTakeoff({
      id: 'TO-NEW',
      title: 'New Takeoff Project',
      source: 'Manual Upload',
      createdBy: 'Current User',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Classification',
    });
  };

  const handleClassifyDocument = (docId: string, classification: Document['classification']) => {
    setDocuments(docs =>
      docs.map(doc => (doc.id === docId ? { ...doc, classification } : doc))
    );
  };

  const handleAbridgeDocument = (docId: string) => {
    setDocuments(docs =>
      docs.map(doc => {
        if (doc.id === docId) {
          const abridgedPages = Math.floor(doc.pages * 0.2);
          return { ...doc, abridged: true, abridgedPages };
        }
        return doc;
      })
    );
  };

  const handleAbridgeAll = () => {
    setDocuments(docs =>
      docs.map(doc => {
        if (doc.pages > 20) {
          const abridgedPages = Math.floor(doc.pages * 0.2);
          return { ...doc, abridged: true, abridgedPages };
        }
        return doc;
      })
    );
  };

  const handleCrossItem = (itemId: string) => {
    setParsedItems(items =>
      items.map(item => {
        if (item.id === itemId && !item.isOurManufacturer) {
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        }
        return item;
      })
    );
  };

  const handleCrossSelected = () => {
    setParsedItems(items =>
      items.map(item => {
        if (selectedItems.has(item.id) && !item.isOurManufacturer) {
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        }
        return item;
      })
    );
    setSelectedItems(new Set());
  };

  const handleCrossAll = () => {
    setParsedItems(items =>
      items.map(item => {
        if (!item.isOurManufacturer) {
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        }
        return item;
      })
    );
  };

  const handleToggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleCreateQuote = () => {
    alert('Quote created successfully! You can view it on the Quotes page.');
    setViewMode('list');
    setSelectedTakeoff(null);
  };

  // ============================================
  // DETAIL VIEW - MULTI-STEP FLOW
  // ============================================

  if (viewMode === 'detail' && selectedTakeoff) {
    const steps = [
      { id: 'classification', label: 'Classification', icon: '📑' },
      { id: 'parsing', label: 'Schedule Parsing', icon: '🔍' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedTakeoff(null);
            }}
            className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Takeoffs
          </button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">{selectedTakeoff.title}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedTakeoff.id}</p>
            </div>
          </div>

          {/* Step Tabs */}
          <div className="flex gap-2 border-b border-[var(--border)]">
            <button
              onClick={() => setCurrentStep('classification')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                currentStep === 'classification'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Classification
            </button>
            <button
              onClick={() => setCurrentStep('parsing')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                currentStep === 'parsing'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Schedule Parsing
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-6">
        {currentStep === 'classification' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Classification & Duplicate Detection
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {documents.length} of {documents.length} documents classified
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Downloading all documents as ZIP...')}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Download All (ZIP)
                </button>
                <button
                  onClick={handleAbridgeAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Abridge All Large Documents
                </button>
              </div>
            </div>

            {/* Document Categories Tabs */}
            <div className="flex gap-2 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <button className="px-4 py-2 bg-white text-[var(--foreground)] rounded-lg text-sm font-medium shadow-sm">
                Fixture Schedules <span className="ml-2 text-[var(--muted-foreground)]">5</span>
              </button>
              <button className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-white/50 rounded-lg text-sm font-medium">
                Specifications <span className="ml-2">1</span>
              </button>
              <button className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-white/50 rounded-lg text-sm font-medium">
                Blueprints <span className="ml-2">0</span>
              </button>
              <button className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-white/50 rounded-lg text-sm font-medium">
                Other Docs <span className="ml-2">6</span>
              </button>
              <button className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-white/50 rounded-lg text-sm font-medium">
                Irrelevant <span className="ml-2">0</span>
              </button>
            </div>

            {/* Documents Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Document Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Pages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Classification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--muted)]/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-[var(--muted)] rounded">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 3v14M3 10h14" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-[var(--muted)] rounded">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 12l6-6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <span className="text-sm text-[var(--foreground)]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{doc.type}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{doc.pages}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{doc.uploadDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={doc.classification}
                            onChange={(e) => handleClassifyDocument(doc.id, e.target.value as Document['classification'])}
                            className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                          >
                            <option value="Fixture Schedules">Fixture Schedules</option>
                            <option value="Specifications">Specifications</option>
                            <option value="Blueprints">Blueprints</option>
                            <option value="Other Docs">Other Useful Docs</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert(`Downloading ${doc.name}...`)}
                            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                            title="Download document"
                          >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          {doc.pages > 20 && !doc.abridged && (
                            <button
                              onClick={() => handleAbridgeDocument(doc.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              Abridge ({doc.pages} pages)
                            </button>
                          )}
                          {doc.abridged && (
                            <>
                              <span className="text-xs text-green-600 font-medium">
                                Abridged to {doc.abridgedPages} pages
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowAbridgmentReportModal(true);
                                }}
                                className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                              >
                                View Report
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => setCurrentStep('parsing')}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                Proceed to Parsing
              </button>
            </div>
          </div>
        )}

        {currentStep === 'parsing' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Parsed Schedule Items</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Review and cross competitor products with your products
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleCrossSelected}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Cross Selected ({selectedItems.size})
                  </button>
                )}
                <button
                  onClick={handleCrossAll}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Cross All
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === parsedItems.filter(item => !item.isOurManufacturer && !item.isCrossed).length && parsedItems.filter(item => !item.isOurManufacturer && !item.isCrossed).length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(new Set(parsedItems.filter(item => !item.isOurManufacturer && !item.isCrossed).map(item => item.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                        className="accent-[var(--primary)]"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Manufacturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Part Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Crossed Manufacturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Crossed Part Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Crossed Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {parsedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--muted)]/20">
                      <td className="px-6 py-4">
                        {!item.isOurManufacturer && !item.isCrossed && (
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleToggleSelectItem(item.id)}
                            className="accent-[var(--primary)]"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--foreground)]">{item.manufacturer}</span>
                          {item.isOurManufacturer ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Our Mfr
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              Competitor
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{item.partNumber}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{item.quantity}</td>
                      <td className="px-6 py-4">
                        {item.isCrossed && item.crossedManufacturer ? (
                          <span className="text-sm text-green-600 font-medium">{item.crossedManufacturer}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.isCrossed && item.crossedPartNumber ? (
                          <span className="text-sm text-green-600">{item.crossedPartNumber}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.isCrossed && item.crossedDescription ? (
                          <span className="text-sm text-green-600">{item.crossedDescription}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!item.isOurManufacturer && !item.isCrossed && (
                          <button
                            onClick={() => handleCrossItem(item.id)}
                            className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                          >
                            Cross
                          </button>
                        )}
                        {item.isCrossed && (
                          <button
                            onClick={() => handleCrossItem(item.id)}
                            className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                          >
                            Re-Cross
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={handleCreateQuote}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
              >
                Create Quote
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Abridgment Report Modal */}
        {showAbridgmentReportModal && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Abridgment Report</h2>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{selectedDocument.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Download Excel
                  </button>
                  <button
                    onClick={() => {
                      setShowAbridgmentReportModal(false);
                      setSelectedDocument(null);
                    }}
                    className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          Page
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          Included
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {mockAbridgmentReport.map((reportItem) => (
                        <tr key={reportItem.page} className="hover:bg-[var(--muted)]/20">
                          <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                            Page {reportItem.page}
                          </td>
                          <td className="px-6 py-4">
                            {reportItem.included ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Yes
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                            {reportItem.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ============================================
  // LIST VIEW
  // ============================================

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Take-Offs</h1>
          </div>
          <div className="flex items-center gap-2">
            <AdvancedFilters filterOptions={filterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3v14M3 10h14" strokeLinecap="round"/>
              </svg>
              Upload Documents for New Project
            </button>
          </div>
        </div>
      </div>

      {/* Takeoffs Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Takeoff Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {mockTakeoffs.map((takeoff) => (
                <tr
                  key={takeoff.id}
                  className="hover:bg-[var(--muted)]/20 cursor-pointer"
                  onClick={() => {
                    setSelectedTakeoff(takeoff);
                    setViewMode('detail');
                    setCurrentStep(
                      takeoff.status === 'Complete' ? 'parsing' :
                      takeoff.status === 'Parsing' ? 'parsing' :
                      'classification'
                    );
                  }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <h3 className="font-medium text-[var(--foreground)]">{takeoff.title}</h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{takeoff.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{takeoff.source}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{takeoff.createdBy}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{takeoff.createdDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(takeoff.status)}`}>
                      {takeoff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTakeoff(takeoff);
                          setViewMode('detail');
                        }}
                        className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                      >
                        View
                      </button>
                      {takeoff.quoteId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Navigate to quote ${takeoff.quoteId}`);
                          }}
                          className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          View Quote
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Upload Documents for New Project</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFiles([]);
                }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
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
                      Choose files
                    </span>
                    <span className="text-[var(--muted-foreground)]"> or drag and drop</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  PDF files only, up to 20 files
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
                    Selected Files ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded border border-[var(--border)]"
                      >
                        <span className="text-sm text-[var(--foreground)] truncate">{file.name}</span>
                        <button
                          onClick={() => {
                            setUploadedFiles(files => files.filter((_, i) => i !== index));
                          }}
                          className="p-1 hover:bg-[var(--muted)] rounded"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFiles([]);
                }}
                className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadStart}
                disabled={uploadedFiles.length === 0}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
