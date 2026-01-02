/**
 * Classification Tab Component
 * Clean table layout matching FlowCRM design
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { TakeoffDocument, DocumentClassification, DocumentDiscipline } from '../types';
import { CLASSIFICATION_OPTIONS } from '../constants';
import { showInfoToast } from '../../lib/toast';

// Abridgement state per document
interface DocumentAbridgeState {
  isProcessing: boolean;
  error?: string;
}

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
  documentAbridgeState?: Record<string, DocumentAbridgeState>;
}

// Category tabs
type CategoryTab = 'Fixture Schedules' | 'Specifications' | 'Blueprints' | 'Other Docs' | 'Irrelevant';

const CATEGORY_TABS: CategoryTab[] = [
  'Fixture Schedules',
  'Specifications',
  'Blueprints',
  'Other Docs',
  'Irrelevant',
];

export function ClassificationTab({
  documents,
  onClassify,
  onAbridge,
  onAbridgeAll,
  onDownload,
  onDownloadAll,
  onViewReport,
  onProceedToParsing,
  documentAbridgeState = {},
}: ClassificationTabProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab | null>(null);

  // Count classified documents
  const classifiedCount = documents.filter(d => d.classification).length;

  // Count documents by category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
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

  // Filter documents by active tab
  const filteredDocuments = useMemo(() => {
    if (!activeTab) return documents;
    return documents.filter(doc => doc.classification === activeTab);
  }, [documents, activeTab]);

  // Documents that can be abridged (Fixture Schedules or Specifications, not already abridged)
  const docsToAbridge = useMemo(() => {
    return documents.filter(d =>
      !d.abridged &&
      d.documentUrl &&
      (d.classification === 'Fixture Schedules' || d.classification === 'Specifications')
    );
  }, [documents]);

  // Handle "Abridge All Large Documents" button click
  const handleAbridgeAllClick = useCallback(() => {
    // Always switch to Fixture Schedules tab first
    setActiveTab('Fixture Schedules');

    // Check if there are documents to abridge
    if (docsToAbridge.length === 0) {
      showInfoToast('No documents to abridge. Documents must be classified as "Fixture Schedules" or "Specifications" and not already abridged.');
      return;
    }

    // Start abridging
    onAbridgeAll();
  }, [docsToAbridge.length, onAbridgeAll]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
        <p className="text-sm text-gray-500">
          No documents have been uploaded for this project yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Classification & Duplicate Detection
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {classifiedCount} of {documents.length} documents classified
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDownloadAll?.()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Download All (ZIP)
          </button>
          <button
            onClick={handleAbridgeAllClick}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Abridge All Large Documents
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-gray-200 pb-3">
        {CATEGORY_TABS.map(tab => {
          const count = categoryCounts[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(isActive ? null : tab)}
              className={`text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}{' '}
              <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Document Name
              </th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pages
              </th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Upload Date
              </th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Classification
              </th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                {/* Document Name */}
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400">
                      <button className="hover:text-gray-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                      <button className="hover:text-gray-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="18 15 12 9 6 15"/>
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                      {doc.name}
                    </span>
                  </div>
                </td>

                {/* Type */}
                <td className="py-4">
                  <span className="text-sm text-gray-600">PDF</span>
                </td>

                {/* Pages */}
                <td className="py-4">
                  <span className="text-sm text-gray-600">{doc.pages}</span>
                </td>

                {/* Upload Date */}
                <td className="py-4">
                  <span className="text-sm text-gray-600">{formatDate(doc.uploadDate)}</span>
                </td>

                {/* Classification Dropdown */}
                <td className="py-4">
                  <select
                    value={doc.classification || ''}
                    onChange={(e) => onClassify(doc.id, e.target.value as DocumentClassification)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                  >
                    <option value="">Select...</option>
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>

                {/* Actions */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {/* Download with abridged indicator */}
                    <button
                      onClick={() => onDownload?.(doc)}
                      className="flex items-center gap-1.5 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={doc.abridged ? `Download (Abridged to ${doc.abridgedPages} pages)` : "Download"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {doc.abridged && (
                        <span className="text-xs text-green-600">
                          Abridged to {doc.abridgedPages} pages
                        </span>
                      )}
                    </button>

                    {/* Abridge Button / Processing / View Report */}
                    {(() => {
                      const abridgeState = documentAbridgeState[doc.id];
                      const isProcessing = abridgeState?.isProcessing;
                      const hasError = abridgeState?.error;

                      // Processing state
                      if (isProcessing) {
                        return (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            <span>Processing...</span>
                          </div>
                        );
                      }

                      // Error state with retry
                      if (hasError) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600">{hasError}</span>
                            <button
                              onClick={() => onAbridge(doc.id)}
                              className="px-2 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        );
                      }

                      // Already abridged - show View Report
                      if (doc.abridged) {
                        return (
                          <button
                            onClick={() => onViewReport(doc)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            View Report
                          </button>
                        );
                      }

                      // Not abridged - show Abridge button
                      if (doc.pages > 0) {
                        return (
                          <button
                            onClick={() => onAbridge(doc.id)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Abridge ({doc.pages} pages)
                          </button>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with Proceed Button */}
      <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onProceedToParsing}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Proceed to Parsing
        </button>
      </div>
    </div>
  );
}
