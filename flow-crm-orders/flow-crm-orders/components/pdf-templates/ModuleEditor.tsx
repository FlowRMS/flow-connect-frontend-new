'use client';

import React from 'react';
import type { PdfModule, ModuleConfig } from '../../lib/types/pdf-templates';
import { moduleTypeLabels } from '../../lib/types/pdf-templates';

interface ModuleEditorProps {
  module: PdfModule;
  onChange: (config: ModuleConfig) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function ModuleEditor({
  module,
  onChange,
  onDelete,
  onDuplicate,
}: ModuleEditorProps) {
  const config = module.config;

  const updateConfig = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {moduleTypeLabels[module.type]}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
            title="Duplicate"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Common Settings */}
      <div className="space-y-4">
        {/* Visibility */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-[var(--foreground)]">Visible</label>
          <button
            onClick={() => updateConfig('visible', !config.visible)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              config.visible !== false ? 'bg-[var(--primary)]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                config.visible !== false ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Width</label>
          <select
            value={(config.width as string) || 'full'}
            onChange={(e) => updateConfig('width', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
          >
            <option value="full">Full Width</option>
            <option value="two-thirds">Two Thirds</option>
            <option value="half">Half</option>
            <option value="third">One Third</option>
          </select>
        </div>

        {/* Alignment */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Alignment</label>
          <div className="flex gap-1">
            {['left', 'center', 'right'].map(align => (
              <button
                key={align}
                onClick={() => updateConfig('alignment', align)}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  (config.alignment || 'left') === align
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] hover:bg-[var(--muted)]/80'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Margin Top</label>
            <input
              type="number"
              value={(config.marginTop as number) || 0}
              onChange={(e) => updateConfig('marginTop', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Margin Bottom</label>
            <input
              type="number"
              value={(config.marginBottom as number) || 0}
              onChange={(e) => updateConfig('marginBottom', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
        </div>

        <hr className="border-[var(--border)]" />

        {/* Module-specific settings */}
        <ModuleSpecificSettings module={module} updateConfig={updateConfig} />
      </div>
    </div>
  );
}

// Module-specific settings based on type
function ModuleSpecificSettings({
  module,
  updateConfig,
}: {
  module: PdfModule;
  updateConfig: (key: string, value: unknown) => void;
}) {
  const config = module.config;

  switch (module.type) {
    case 'company-header':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Display Options</h4>
          <ToggleSetting label="Show Logo" checked={config.showLogo as boolean} onChange={(v) => updateConfig('showLogo', v)} />
          <ToggleSetting label="Show Company Name" checked={config.showCompanyName as boolean} onChange={(v) => updateConfig('showCompanyName', v)} />
          <ToggleSetting label="Show Address" checked={config.showAddress as boolean} onChange={(v) => updateConfig('showAddress', v)} />
          <ToggleSetting label="Show Phone" checked={config.showPhone as boolean} onChange={(v) => updateConfig('showPhone', v)} />
          <ToggleSetting label="Show Email" checked={config.showEmail as boolean} onChange={(v) => updateConfig('showEmail', v)} />
          <ToggleSetting label="Show Website" checked={config.showWebsite as boolean} onChange={(v) => updateConfig('showWebsite', v)} />

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Company Name Size</label>
            <input
              type="number"
              value={(config.companyNameSize as number) || 20}
              onChange={(e) => updateConfig('companyNameSize', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
        </div>
      );

    case 'document-title':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Title Settings</h4>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Title Text</label>
            <input
              type="text"
              value={(config.titleText as string) || ''}
              onChange={(e) => updateConfig('titleText', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              placeholder="e.g., QUOTATION, INVOICE"
            />
          </div>
          <ToggleSetting label="Show Document Number" checked={config.showDocumentNumber as boolean} onChange={(v) => updateConfig('showDocumentNumber', v)} />
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Font Size</label>
            <input
              type="number"
              value={(config.fontSize as number) || 12}
              onChange={(e) => updateConfig('fontSize', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
        </div>
      );

    case 'customer-info':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Display Options</h4>
          <ToggleSetting label="Show Sold To" checked={config.showSoldTo as boolean} onChange={(v) => updateConfig('showSoldTo', v)} />
          <ToggleSetting label="Show Bill To" checked={config.showBillTo as boolean} onChange={(v) => updateConfig('showBillTo', v)} />
          <ToggleSetting label="Show Ship To" checked={config.showShipTo as boolean} onChange={(v) => updateConfig('showShipTo', v)} />
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Layout</label>
            <select
              value={(config.layout as string) || 'stacked'}
              onChange={(e) => updateConfig('layout', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            >
              <option value="stacked">Stacked</option>
              <option value="side-by-side">Side by Side</option>
            </select>
          </div>
        </div>
      );

    case 'job-info':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Display Options</h4>
          <ToggleSetting label="Show Job Name" checked={config.showJobName as boolean} onChange={(v) => updateConfig('showJobName', v)} />
          <ToggleSetting label="Show Job Number" checked={config.showJobNumber as boolean} onChange={(v) => updateConfig('showJobNumber', v)} />
          <ToggleSetting label="Show Job Address" checked={config.showJobAddress as boolean} onChange={(v) => updateConfig('showJobAddress', v)} />
          <ToggleSetting label="Show Job Contact" checked={config.showJobContact as boolean} onChange={(v) => updateConfig('showJobContact', v)} />
        </div>
      );

    case 'line-items-table':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Table Settings</h4>
          <ToggleSetting label="Show Section Headers" checked={config.showSectionHeaders as boolean} onChange={(v) => updateConfig('showSectionHeaders', v)} />
          <ToggleSetting label="Show Row Numbers" checked={config.showRowNumbers as boolean} onChange={(v) => updateConfig('showRowNumbers', v)} />
          <ToggleSetting label="Alternate Row Colors" checked={config.alternateRowColors as boolean} onChange={(v) => updateConfig('alternateRowColors', v)} />

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Header Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(config.headerBackgroundColor as string) || '#3B82F6'}
                onChange={(e) => updateConfig('headerBackgroundColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={(config.headerBackgroundColor as string) || '#3B82F6'}
                onChange={(e) => updateConfig('headerBackgroundColor', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
          </div>
        </div>
      );

    case 'pricing-summary':
    case 'totals-summary':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Display Options</h4>
          <ToggleSetting label="Show Subtotal" checked={config.showSubtotal as boolean} onChange={(v) => updateConfig('showSubtotal', v)} />
          <ToggleSetting label="Show Tax" checked={config.showTax as boolean} onChange={(v) => updateConfig('showTax', v)} />
          <ToggleSetting label="Show Discount" checked={config.showDiscount as boolean} onChange={(v) => updateConfig('showDiscount', v)} />
          <ToggleSetting label="Show Shipping" checked={config.showShipping as boolean} onChange={(v) => updateConfig('showShipping', v)} />
          <ToggleSetting label="Show Total" checked={config.showTotal as boolean} onChange={(v) => updateConfig('showTotal', v)} />
          <ToggleSetting label="Show Commission" checked={config.showCommission as boolean} onChange={(v) => updateConfig('showCommission', v)} />
          <ToggleSetting label="Show Overage" checked={config.showOverage as boolean} onChange={(v) => updateConfig('showOverage', v)} />
        </div>
      );

    case 'terms-conditions':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Content</h4>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Title</label>
            <input
              type="text"
              value={(config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              placeholder="Terms & Conditions"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Content</label>
            <textarea
              value={(config.content as string) || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              rows={4}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] resize-none"
              placeholder="Enter terms and conditions..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Font Size</label>
            <input
              type="number"
              value={(config.fontSize as number) || 8}
              onChange={(e) => updateConfig('fontSize', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
        </div>
      );

    case 'custom-text':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Content</h4>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Text Content</label>
            <textarea
              value={(config.content as string) || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              rows={4}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] resize-none"
              placeholder="Enter custom text..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Font Size</label>
            <input
              type="number"
              value={(config.fontSize as number) || 10}
              onChange={(e) => updateConfig('fontSize', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Font Weight</label>
            <select
              value={(config.fontWeight as string) || 'normal'}
              onChange={(e) => updateConfig('fontWeight', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Divider Style</h4>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Line Width</label>
            <input
              type="number"
              value={(config.lineWidth as number) || 1}
              onChange={(e) => updateConfig('lineWidth', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Line Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(config.lineColor as string) || '#E5E7EB'}
                onChange={(e) => updateConfig('lineColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={(config.lineColor as string) || '#E5E7EB'}
                onChange={(e) => updateConfig('lineColor', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Line Style</label>
            <select
              value={(config.lineStyle as string) || 'solid'}
              onChange={(e) => updateConfig('lineStyle', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Spacer Height</h4>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Height (px)</label>
            <input
              type="number"
              value={(config.height as number) || 20}
              onChange={(e) => updateConfig('height', Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Footer Options</h4>
          <ToggleSetting label="Show Page Numbers" checked={config.showPageNumbers as boolean} onChange={(v) => updateConfig('showPageNumbers', v)} />
          <ToggleSetting label="Show Date" checked={config.showDate as boolean} onChange={(v) => updateConfig('showDate', v)} />
          <ToggleSetting label="Show Custom Text" checked={config.showCustomText as boolean} onChange={(v) => updateConfig('showCustomText', v)} />
          {Boolean(config.showCustomText) && (
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Custom Text</label>
              <input
                type="text"
                value={(config.customText as string) || ''}
                onChange={(e) => updateConfig('customText', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
                placeholder="Enter custom footer text..."
              />
            </div>
          )}
        </div>
      );

    default:
      return (
        <p className="text-sm text-[var(--muted-foreground)]">
          No additional settings for this module type.
        </p>
      );
  }
}

// Toggle Setting Component
function ToggleSetting({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-[var(--foreground)]">{label}</label>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-[var(--primary)]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
