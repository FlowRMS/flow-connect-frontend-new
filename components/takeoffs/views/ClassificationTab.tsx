/**
 * Classification Tab Component
 */

import React from 'react';
import type { TakeoffDocument, DocumentClassification } from '../types';
import { CLASSIFICATION_OPTIONS } from '../constants';
import { canAbridgeDocument, countDocumentsByClassification } from '../utils';

interface ClassificationTabProps {
  documents: TakeoffDocument[];
  onClassify: (docId: string, classification: DocumentClassification) => void;
  onAbridge: (docId: string) => void;
  onAbridgeAll: () => void;
  onDownload?: (doc: TakeoffDocument) => void;
  onDownloadAll?: () => void;
  onViewReport: (doc: TakeoffDocument) => void;
  onProceedToParsing: () => void;
}

export function ClassificationTab({
  documents,
  onClassify,
  onAbridge,
  onAbridgeAll,
  onDownload,
  onDownloadAll,
  onViewReport,
  onProceedToParsing,
}: ClassificationTabProps) {
  const categories = countDocumentsByClassification(documents);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
      {/* Header */}
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
            onClick={() => onDownloadAll?.()}
            className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Download All (ZIP)
          </button>
          <button
            onClick={onAbridgeAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Abridge All Large Documents
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        {categories.map((category, index) => (
          <button 
            key={category.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              index === 0 
                ? 'bg-white text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:bg-white/50'
            }`}
          >
            {category.label} <span className="ml-2 text-[var(--muted-foreground)]">{category.count}</span>
          </button>
        ))}
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
                  <select
                    value={doc.classification}
                    onChange={(e) => onClassify(doc.id, e.target.value as DocumentClassification)}
                    className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDownload?.(doc)}
                      className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                      title="Download document"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {canAbridgeDocument(doc) && (
                      <button
                        onClick={() => onAbridge(doc.id)}
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
                          onClick={() => onViewReport(doc)}
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

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
        <button
          onClick={onProceedToParsing}
          className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          Proceed to Parsing
        </button>
      </div>
    </div>
  );
}
