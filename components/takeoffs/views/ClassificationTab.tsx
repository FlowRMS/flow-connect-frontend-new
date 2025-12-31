/**
 * Classification Tab Component
 * Displays document table with classification dropdown and actions
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
  const [disciplineFilter, setDisciplineFilter] = useState<DocumentDiscipline | ''>('');

  // Detect duplicates
  const duplicateIds = useMemo(() => findDuplicates(documents), [documents]);
  const duplicateCount = duplicateIds.size;

  // Filter documents by discipline
  const filteredDocuments = useMemo(() => {
    if (!disciplineFilter) return documents;
    return documents.filter(doc => doc.discipline === disciplineFilter);
  }, [documents, disciplineFilter]);

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

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Documents in This Category</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Documents will appear here once they are classified into this category.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-[var(--muted-foreground)]">
            Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>

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
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Reclassify
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {filteredDocuments.map((doc) => {
              const isDuplicate = duplicateIds.has(doc.id);
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
                  {doc.confidence > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            doc.confidence >= 0.8 ? 'bg-green-500' :
                            doc.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${doc.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {Math.round(doc.confidence * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">-</span>
                  )}
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
            })}
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
