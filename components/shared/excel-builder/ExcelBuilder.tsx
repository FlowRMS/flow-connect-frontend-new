/**
 * Excel Builder Component
 * Main component for building and exporting Excel files for entities
 * Clean, modern, professional modal design matching Flow CRM UI
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import { fetchEntityForPDF } from '@/components/lib/graphql/pdf-entities';
import { useOrganization } from '@/components/hooks/useOrganization';
import { ExcelControls } from './ExcelControls';
import { ExcelPreview } from './ExcelPreview';
import { exportEntityToExcel } from './utils';
import type { ExcelBuilderState } from './types';
import { DEFAULT_COLUMNS, ENTITY_TYPE_LABELS } from './types';
import { extractFields, extractLineItems, getEntityNumber } from '../pdf-builder/utils';

interface ExcelBuilderProps {
  entityId: string;
  entityType: PDFEntityType;
  isOpen: boolean;
  onClose: () => void;
}

export function ExcelBuilder({ entityId, entityType, isOpen, onClose }: ExcelBuilderProps) {
  const { organization } = useOrganization();

  // State
  const [state, setState] = useState<ExcelBuilderState>({
    entityType,
    entityId,
    entityData: null,
    fields: [],
    lineItems: [],
    columns: DEFAULT_COLUMNS[entityType] || [],
    isLoading: true,
    error: null,
    organizationName: '',
    showLineNumbers: true,
    includeHeader: true,
    includeTotals: true,
  });

  const [isExporting, setIsExporting] = useState(false);

  // Load entity data
  useEffect(() => {
    if (!isOpen || !entityId) return;

    const loadData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await fetchEntityForPDF(entityId, entityType);

        if (!data) {
          throw new Error('Entity not found');
        }

        const fields = extractFields(entityType, data);
        const lineItems = extractLineItems(entityType, data);

        setState((prev) => ({
          ...prev,
          entityData: data,
          fields,
          lineItems,
          isLoading: false,
        }));
      } catch (err) {
        console.error('Failed to load entity for Excel:', err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load data',
          isLoading: false,
        }));
      }
    };

    loadData();
  }, [entityId, entityType, isOpen]);

  // Update organization info when loaded
  useEffect(() => {
    if (organization) {
      setState((prev) => ({
        ...prev,
        organizationName: organization.companyName || 'Company',
      }));
    }
  }, [organization]);

  // Handlers
  const handleFieldToggle = useCallback((fieldId: string) => {
    setState((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === fieldId ? { ...f, visible: !f.visible } : f
      ),
    }));
  }, []);

  const handleLineItemToggle = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === itemId ? { ...item, visible: !item.visible } : item
      ),
    }));
  }, []);

  const handleColumnToggle = useCallback((columnId: string) => {
    setState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) =>
        c.id === columnId ? { ...c, visible: !c.visible } : c
      ),
    }));
  }, []);

  const handleShowLineNumbersToggle = useCallback(() => {
    setState((prev) => ({ ...prev, showLineNumbers: !prev.showLineNumbers }));
  }, []);

  const handleIncludeHeaderToggle = useCallback(() => {
    setState((prev) => ({ ...prev, includeHeader: !prev.includeHeader }));
  }, []);

  const handleIncludeTotalsToggle = useCallback(() => {
    setState((prev) => ({ ...prev, includeTotals: !prev.includeTotals }));
  }, []);

  // Export to Excel
  const handleExport = useCallback(async () => {
    if (!state.entityData) return;

    setIsExporting(true);

    try {
      const entityNumber = getEntityNumber(entityType, state.entityData);

      await exportEntityToExcel({
        entityType,
        entityNumber,
        fields: state.fields,
        lineItems: state.lineItems,
        columns: state.columns,
        showLineNumbers: state.showLineNumbers,
        includeHeader: state.includeHeader,
        includeTotals: state.includeTotals,
      });

      // Close modal after successful export
      onClose();
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Failed to export Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [state, entityType, onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const entityNumber = state.entityData ? getEntityNumber(entityType, state.entityData) : '';

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container - Centered with max dimensions */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 flex items-center justify-center">
        <div className="w-full h-full max-w-[1600px] max-h-[900px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Excel Builder
                </h1>
                <p className="text-sm text-gray-500">
                  {ENTITY_TYPE_LABELS[entityType]} {entityNumber && <span className="font-semibold text-gray-700">#{entityNumber}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* X Close Button */}
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || state.isLoading || !!state.error}
                className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Loading State */}
            {state.isLoading && (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-lg font-medium text-gray-700">Loading document...</p>
                  <p className="text-sm text-gray-500 mt-1">Fetching your data</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {state.error && (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load</h3>
                  <p className="text-gray-500 mb-6">{state.error}</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            {!state.isLoading && !state.error && (
              <>
                {/* Left Panel - Controls */}
                <div className="w-[700px] flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-hidden">
                  <ExcelControls
                    fields={state.fields}
                    lineItems={state.lineItems}
                    columns={state.columns}
                    showLineNumbers={state.showLineNumbers}
                    includeHeader={state.includeHeader}
                    includeTotals={state.includeTotals}
                    onFieldToggle={handleFieldToggle}
                    onLineItemToggle={handleLineItemToggle}
                    onColumnToggle={handleColumnToggle}
                    onShowLineNumbersToggle={handleShowLineNumbersToggle}
                    onIncludeHeaderToggle={handleIncludeHeaderToggle}
                    onIncludeTotalsToggle={handleIncludeTotalsToggle}
                  />
                </div>

                {/* Right Panel - Preview */}
                <div className="flex-1 overflow-hidden bg-gray-100">
                  <ExcelPreview
                    entityType={entityType}
                    entityNumber={entityNumber}
                    fields={state.fields}
                    lineItems={state.lineItems}
                    columns={state.columns}
                    showLineNumbers={state.showLineNumbers}
                    includeHeader={state.includeHeader}
                    includeTotals={state.includeTotals}
                    organizationName={state.organizationName}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at root level
  return createPortal(modalContent, document.body);
}

export default ExcelBuilder;
