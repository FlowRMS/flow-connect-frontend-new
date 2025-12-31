/**
 * Classification Tab Component
 * Displays document table with category tabs, classification dropdown and actions
 * Includes discipline filtering and duplicate detection
 */

import React, { useState, useMemo } from 'react';
import type { TakeoffDocument, DocumentClassification, DocumentDiscipline } from '../types';
import { CLASSIFICATION_OPTIONS, DOCUMENT_DISCIPLINE_OPTIONS } from '../constants';
import { canAbridgeDocument } from '../utils';

interface ClassificationTabProps {
  documents: TakeoffDocument[];
  onClassify: (docId: string, classification: DocumentClassification) => void;
  onChangeDiscipline?: (docId: string, discipline: DocumentDiscipline) => void;
  onAbridge: (docId: string) => void;
  onAbridgeAll: () => void;
  onDownload?: (doc: TakeoffDocument) => void;
  onDownloadAll?: () => void;
  onViewReport: (doc: TakeoffDocument) => void;
  onProceedToParsing: () => void;
}

// Category tabs configuration
type CategoryTab = 'all' | 'Fixture Schedules' | 'Specifications' | 'Blueprints' | 'Other Docs' | 'Irrelevant';

// Category tab icon component
function CategoryIcon({ category, className = '' }: { category: CategoryTab; className?: string }) {
  switch (category) {
    case 'all':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      );
    case 'Fixture Schedules':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      );
    case 'Specifications':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      );
    case 'Blueprints':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      );
    case 'Other Docs':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      );
    case 'Irrelevant':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      );
    default:
      return null;
  }
}

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: 'all', label: 'All Documents' },
  { key: 'Fixture Schedules', label: 'Fixture Schedules' },
  { key: 'Specifications', label: 'Specifications' },
  { key: 'Blueprints', label: 'Blueprints' },
  { key: 'Other Docs', label: 'Other Docs' },
  { key: 'Irrelevant', label: 'Irrelevant' },
];

// Helper to detect potential duplicates by name similarity
function findDuplicates(documents: TakeoffDocument[]): Set<string> {
  const duplicateIds = new Set<string>();
  const nameMap = new Map<string, string[]>();

  // Group by normalized name (lowercase, no extension, no numbers)
  documents.forEach(doc => {
    const normalized = doc.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[0-9]+/g, '')   // Remove numbers
      .replace(/[_-]+/g, ' ')   // Normalize separators
      .trim();

    const existing = nameMap.get(normalized) || [];
    existing.push(doc.id);
    nameMap.set(normalized, existing);
  });

  // Also check by file size + page count (same size and pages = likely duplicate)
  const sizePageMap = new Map<string, string[]>();
  documents.forEach(doc => {
    const key = `${doc.size}-${doc.pages}`;
    const existing = sizePageMap.get(key) || [];
    existing.push(doc.id);
    sizePageMap.set(key, existing);
  });

  // Mark duplicates
  nameMap.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => duplicateIds.add(id));
    }
  });

  sizePageMap.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => duplicateIds.add(id));
    }
  });

  return duplicateIds;
}

export function ClassificationTab({
  documents,
  onClassify,
  onChangeDiscipline,
  onAbridge,
  onAbridgeAll,
  onDownload,
  onDownloadAll,
  onViewReport,
  onProceedToParsing,
}: ClassificationTabProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<DocumentDiscipline | ''>('');

  // Reset discipline filter when documents change significantly (new upload)
  React.useEffect(() => {
    // If all documents have no discipline assigned, reset the filter
    const docsWithDisciplines = documents.filter(d => d.discipline);
    if (docsWithDisciplines.length === 0 && disciplineFilter) {
      setDisciplineFilter('');
    }
  }, [documents, disciplineFilter]);

  // Detect duplicates
  const duplicateIds = useMemo(() => findDuplicates(documents), [documents]);
  const duplicateCount = duplicateIds.size;

  // Count documents by category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      'all': documents.length,
      'Fixture Schedules': 0,
      'Specifications': 0,
      'Blueprints': 0,
      'Other Docs': 0,
      'Irrelevant': 0,
    };

    documents.forEach(doc => {
      const classification = doc.classification as CategoryTab;
      if (classification && classification in counts) {
        counts[classification]++;
      }
    });

    return counts;
  }, [documents]);

  // Filter documents by active tab and discipline
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by category tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(doc => doc.classification === activeTab);
    }

    // Filter by discipline - only if documents actually have disciplines assigned
    // Don't filter out documents that haven't been assigned a discipline yet
    if (disciplineFilter) {
      const docsWithDisciplines = documents.filter(d => d.discipline);
      // Only apply filter if some documents have disciplines
      if (docsWithDisciplines.length > 0) {
        filtered = filtered.filter(doc => doc.discipline === disciplineFilter || !doc.discipline);
      }
    }

    return filtered;
  }, [documents, activeTab, disciplineFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Log documents for debugging
  console.log('[ClassificationTab] Received documents:', documents.length);

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Documents Available</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          No documents have been uploaded for this project yet.
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          If you just uploaded files, they may still be processing.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Category Tabs */}
      <div className="border-b border-[var(--border)] mb-4">
        <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Document Categories">
          {CATEGORY_TABS.map(tab => {
            const count = categoryCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-gray-300'
                  }
                `}
              >
                <CategoryIcon category={tab.key} className={isActive ? 'text-blue-600' : ''} />
                {tab.label}
                <span className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                  ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-[var(--muted-foreground)]">
            Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>

          {/* Active Filter Badge */}
          {disciplineFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M3 4h14M3 10h14M3 16h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-medium text-purple-700">
                Filtering: {disciplineFilter.toLowerCase()}
              </span>
              <button
                onClick={() => setDisciplineFilter('')}
                className="ml-1 text-purple-500 hover:text-purple-700"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          )}

          {/* Rep Types Filter Active Indicator */}
          {disciplineFilter && (
            <span className="text-xs text-green-600 font-medium">
              Rep types filter active
            </span>
          )}

          {/* Duplicate Warning */}
          {duplicateCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                <path d="M10 6v4M10 14h.01M3.172 15.172L10 2l6.828 13.172H3.172z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-medium text-yellow-700">
                {duplicateCount} potential duplicate{duplicateCount !== 1 ? 's' : ''} detected
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Discipline Filter */}
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value as DocumentDiscipline | '')}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Disciplines</option>
            {DOCUMENT_DISCIPLINE_OPTIONS.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>

          <button
            onClick={() => onDownloadAll?.()}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download All
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Document Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Discipline
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Pages
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Reclassify As
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No documents in this category
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => {
                const isDuplicate = duplicateIds.has(doc.id);
                const isClassified = !!doc.classification;
                return (
                <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${isDuplicate ? 'bg-yellow-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* PDF Icon */}
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">{doc.name}</p>
                          {isDuplicate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700">
                              Duplicate?
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">{doc.size} • {formatDate(doc.uploadDate)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={doc.discipline || ''}
                      onChange={(e) => onChangeDiscipline?.(doc.id, e.target.value as DocumentDiscipline)}
                      className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs text-[var(--foreground)] bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select...</option>
                      {DOCUMENT_DISCIPLINE_OPTIONS.map(discipline => (
                        <option key={discipline} value={discipline}>{discipline}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                    {doc.abridged ? (
                      <span className="text-green-600">
                        {doc.abridgedPages}/{doc.pages}
                      </span>
                    ) : (
                      doc.pages
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {/* Status Badge with confidence */}
                    <div className="flex items-center gap-2">
                      {isClassified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          Classified
                          {doc.confidence > 0 && (
                            <span className="text-blue-500 text-[10px]">
                              {Math.round(doc.confidence * 100)}%
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={doc.classification || ''}
                      onChange={(e) => onClassify(doc.id, e.target.value as DocumentClassification)}
                      className="w-full px-2 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      {CLASSIFICATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Download Button */}
                      <button
                        onClick={() => onDownload?.(doc)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Download"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                          <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* View Button */}
                      <button
                        onClick={() => onViewReport(doc)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="View Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                          <path d="M2 10c2-4 5-6 8-6s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6z"/>
                        </svg>
                      </button>

                      {/* Abridge Button */}
                      {canAbridgeDocument(doc) && (
                        <button
                          onClick={() => onAbridge(doc.id)}
                          className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                          title="Abridge Document"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                            <rect x="3" y="3" width="14" height="14" rx="2"/>
                            <line x1="7" y1="10" x2="13" y2="10"/>
                          </svg>
                        </button>
                      )}

                      {/* Abridged Badge */}
                      {doc.abridged && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Abridged
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Proceed Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onProceedToParsing}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Continue to Abridgement
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
