'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PdfModule, GlobalStyles, ModuleType } from '../../lib/types/pdf-templates';
import { moduleTypeLabels } from '../../lib/types/pdf-templates';

interface BuilderCanvasProps {
  modules: PdfModule[];
  globalStyles: GlobalStyles;
  selectedModuleId: string | null;
  onSelectModule: (id: string | null) => void;
  onDeleteModule: (id: string) => void;
  onDuplicateModule: (id: string) => void;
}

export default function BuilderCanvas({
  modules,
  globalStyles,
  selectedModuleId,
  onSelectModule,
  onDeleteModule,
  onDuplicateModule,
}: BuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const visibleModules = modules.filter(m => m.config.visible !== false);
  const sortedModules = [...visibleModules].sort((a, b) => a.position - b.position);

  return (
    <div className="p-6">
      {/* PDF Page Preview */}
      <div
        className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        style={{ width: '595px', minHeight: '842px' }} // A4 dimensions in points (roughly)
      >
        {/* Page Content */}
        <div
          ref={setNodeRef}
          className={`p-4 min-h-[800px] transition-colors ${
            isOver ? 'bg-[var(--primary)]/5' : ''
          }`}
          style={{
            paddingTop: `${globalStyles.pageMargins.top}px`,
            paddingBottom: `${globalStyles.pageMargins.bottom}px`,
            paddingLeft: `${globalStyles.pageMargins.left}px`,
            paddingRight: `${globalStyles.pageMargins.right}px`,
          }}
        >
          <SortableContext
            items={sortedModules.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedModules.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg min-h-[600px]">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Drop modules here</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Drag modules from the palette on the left to start building your template.
                  </p>
                </div>
              </div>
            ) : (
              sortedModules.map(module => (
                <SortableModuleBlock
                  key={module.id}
                  module={module}
                  globalStyles={globalStyles}
                  isSelected={module.id === selectedModuleId}
                  onClick={() => onSelectModule(module.id)}
                  onDelete={() => onDeleteModule(module.id)}
                  onDuplicate={() => onDuplicateModule(module.id)}
                />
              ))
            )}
          </SortableContext>

          {/* Drop indicator when dragging over empty space */}
          {sortedModules.length > 0 && isOver && (
            <div className="mt-2 h-16 border-2 border-dashed border-[var(--primary)] rounded-lg bg-[var(--primary)]/5 flex items-center justify-center">
              <span className="text-sm text-[var(--primary)]">Drop here to add</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sortable Module Block Component
function SortableModuleBlock({
  module,
  globalStyles,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
}: {
  module: PdfModule;
  globalStyles: GlobalStyles;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginTop: `${module.config.marginTop || 0}px`,
    marginBottom: `${module.config.marginBottom || 0}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg transition-all ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Module Content Preview */}
      <ModulePreview module={module} globalStyles={globalStyles} />

      {/* Overlay controls on hover */}
      <div
        className={`absolute inset-0 bg-[var(--primary)]/5 border-2 border-[var(--primary)] rounded-lg transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing bg-white rounded shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <circle cx="9" cy="12" r="1"/>
            <circle cx="9" cy="5" r="1"/>
            <circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="12" r="1"/>
            <circle cx="15" cy="5" r="1"/>
            <circle cx="15" cy="19" r="1"/>
          </svg>
        </div>

        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
            title="Duplicate"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 bg-white rounded shadow-sm hover:bg-red-50 text-red-500"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>

        {/* Module type label */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-[var(--primary)] text-white text-xs font-medium rounded">
          {moduleTypeLabels[module.type]}
        </div>
      </div>
    </div>
  );
}

// Module Preview Component - renders a simplified preview of each module type
function ModulePreview({
  module,
  globalStyles,
}: {
  module: PdfModule;
  globalStyles: GlobalStyles;
}) {
  const config = module.config;

  switch (module.type) {
    case 'company-header':
      return (
        <div
          className="p-4 rounded"
          style={{ backgroundColor: globalStyles.primaryColor }}
        >
          <div className="flex items-center gap-4">
            {Boolean(config.showLogo) && (
              <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              </div>
            )}
            <div>
              {Boolean(config.showCompanyName) && (
                <h2 className="text-white font-bold text-lg">Company Name</h2>
              )}
              {Boolean(config.showAddress) && (
                <p className="text-white/80 text-xs">123 Business St, City, ST 12345</p>
              )}
            </div>
          </div>
        </div>
      );

    case 'document-title':
      return (
        <div className="text-right p-2">
          <h1 className="text-xl font-bold" style={{ color: globalStyles.primaryColor }}>
            {(config.titleText as string) || 'DOCUMENT'}
          </h1>
          {Boolean(config.showDocumentNumber) && (
            <p className="text-sm text-gray-500">#DOC-0001</p>
          )}
        </div>
      );

    case 'customer-info':
      return (
        <div className="p-3 bg-gray-50 rounded">
          {Boolean(config.showSoldTo) && (
            <div className="mb-2">
              <span className="text-xs font-bold text-gray-600">SOLD TO:</span>
              <p className="text-sm">Customer Name</p>
            </div>
          )}
          {Boolean(config.showBillTo) && (
            <div>
              <span className="text-xs font-bold text-gray-600">BILL TO:</span>
              <p className="text-sm">Billing Address</p>
            </div>
          )}
        </div>
      );

    case 'job-info':
      return (
        <div className="p-3 bg-gray-50 rounded">
          {Boolean(config.showJobName) && (
            <div className="flex gap-2">
              <span className="text-xs font-bold text-gray-600">JOB:</span>
              <p className="text-sm">Job Name / Location</p>
            </div>
          )}
        </div>
      );

    case 'document-details':
      return (
        <div className="p-3 grid grid-cols-2 gap-2 text-xs">
          <div><span className="font-bold">Quote Date:</span> 01/15/2024</div>
          <div><span className="font-bold">Expires:</span> 02/15/2024</div>
          <div><span className="font-bold">Terms:</span> Net 30</div>
          <div><span className="font-bold">Version:</span> v1</div>
        </div>
      );

    case 'line-items-table':
      return (
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: (config.headerBackgroundColor as string) || globalStyles.primaryColor }}>
                <th className="px-2 py-1.5 text-left text-white">Description</th>
                <th className="px-2 py-1.5 text-center text-white">Qty</th>
                <th className="px-2 py-1.5 text-right text-white">Price</th>
                <th className="px-2 py-1.5 text-right text-white">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-2 py-1.5">Product Item 1</td>
                <td className="px-2 py-1.5 text-center">10</td>
                <td className="px-2 py-1.5 text-right">$100.00</td>
                <td className="px-2 py-1.5 text-right">$1,000.00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-2 py-1.5">Product Item 2</td>
                <td className="px-2 py-1.5 text-center">5</td>
                <td className="px-2 py-1.5 text-right">$200.00</td>
                <td className="px-2 py-1.5 text-right">$1,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      );

    case 'pricing-summary':
    case 'totals-summary':
      return (
        <div className="p-3 bg-gray-50 rounded ml-auto w-48 text-xs">
          {Boolean(config.showSubtotal) && (
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>$2,000.00</span>
            </div>
          )}
          {Boolean(config.showTax) && (
            <div className="flex justify-between py-1">
              <span>Tax:</span>
              <span>$200.00</span>
            </div>
          )}
          {Boolean(config.showTotal) && (
            <div className="flex justify-between py-1 font-bold border-t border-gray-200 mt-1 pt-1">
              <span>Total:</span>
              <span style={{ color: globalStyles.primaryColor }}>$2,200.00</span>
            </div>
          )}
        </div>
      );

    case 'terms-conditions':
      return (
        <div className="p-3 text-xs text-gray-500">
          <h4 className="font-bold mb-1">{(config.title as string) || 'Terms & Conditions'}</h4>
          <p className="line-clamp-3">{(config.content as string) || '1. Payment terms as stated above.\n2. Prices subject to change.'}</p>
        </div>
      );

    case 'custom-text':
      return (
        <div className="p-3 text-sm">
          <p className="text-gray-600">{(config.content as string) || 'Custom text content...'}</p>
        </div>
      );

    case 'divider':
      return (
        <div className="py-2">
          <hr
            style={{
              borderColor: (config.lineColor as string) || '#E5E7EB',
              borderWidth: `${(config.lineWidth as number) || 1}px`,
              borderStyle: (config.lineStyle as string) || 'solid',
            }}
          />
        </div>
      );

    case 'spacer':
      return (
        <div
          className="bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs"
          style={{ height: `${(config.height as number) || 20}px` }}
        >
          Spacer ({(config.height as number) || 20}px)
        </div>
      );

    case 'footer':
      return (
        <div className="p-3 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
          {Boolean(config.showDate) && <span>Generated: {new Date().toLocaleDateString()}</span>}
          {Boolean(config.showPageNumbers) && <span>Page 1 of 1</span>}
          {Boolean(config.showCustomText) && Boolean(config.customText) && <span>{config.customText as string}</span>}
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-100 rounded text-center">
          <span className="text-sm text-gray-500">{moduleTypeLabels[module.type]}</span>
        </div>
      );
  }
}
