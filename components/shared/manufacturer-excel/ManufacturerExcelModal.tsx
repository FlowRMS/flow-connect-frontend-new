/**
 * ManufacturerExcelModal
 * Lists available manufacturer Excel templates and handles export
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import { fetchEntityForPDF } from '@/components/lib/graphql/pdf-entities';
import { ENTITY_TYPE_LABELS } from '@/components/shared/excel-builder/types';
import { getTemplatesForEntity } from './templates';
import type { ManufacturerTemplate, ManufacturerTemplateId } from './types';
import { exportManufacturerTemplate } from './utils';
import { RequestTemplateModal } from './RequestTemplateModal';

interface ManufacturerExcelModalProps {
  entityId: string;
  entityType: PDFEntityType;
  isOpen: boolean;
  onClose: () => void;
}

export function ManufacturerExcelModal({
  entityId,
  entityType,
  isOpen,
  onClose,
}: ManufacturerExcelModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<ManufacturerTemplateId | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const templates = useMemo(() => getTemplatesForEntity(entityType), [entityType]);

  useEffect(() => {
    if (isOpen) {
      setIsExporting(false);
      setActiveTemplateId(null);
      setShowRequestModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleExport = useCallback(
    async (template: ManufacturerTemplate) => {
      if (!entityId) return;
      setIsExporting(true);
      setActiveTemplateId(template.id);

      try {
        const data = await fetchEntityForPDF(entityId, entityType);
        if (!data) {
          throw new Error('Entity not found');
        }

        await exportManufacturerTemplate({
          templateId: template.id,
          entityType,
          entityData: data,
        });

        onClose();
      } catch (error) {
        console.error('Failed to export manufacturer Excel:', error);
        alert('Failed to export manufacturer Excel. Please try again.');
      } finally {
        setIsExporting(false);
        setActiveTemplateId(null);
      }
    },
    [entityId, entityType, onClose]
  );

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-4 md:inset-8 lg:inset-12 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manufacturer Excel</h1>
                <p className="text-sm text-gray-500">
                  {ENTITY_TYPE_LABELS[entityType]} templates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl p-10">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">No templates yet</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Request a manufacturer template for {ENTITY_TYPE_LABELS[entityType].toLowerCase()} exports.
                </p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Request Template
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Available templates</h2>
                    <p className="text-xs text-gray-500">
                      Download a manufacturer-specific Excel format.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="px-4 py-2 text-sm font-semibold bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Request Template
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template) => {
                    const isLoading = isExporting && activeTemplateId === template.id;
                    return (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                            {template.factoryName}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            Uses {ENTITY_TYPE_LABELS[entityType]} data
                          </div>
                          <button
                            onClick={() => handleExport(template)}
                            disabled={isExporting}
                            className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Downloading...' : 'Download'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <RequestTemplateModal
        entityType={entityType}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ManufacturerExcelModal;
