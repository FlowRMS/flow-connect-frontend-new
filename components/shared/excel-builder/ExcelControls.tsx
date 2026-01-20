/**
 * Excel Controls Component
 * Left panel with controls for customizing the Excel export
 */

'use client';

import React, { useState } from 'react';
import type { ExcelFieldConfig, ExcelLineItemConfig, ExcelColumnConfig } from './types';
import { FIELD_CATEGORIES } from './types';
import { formatCurrency } from '../pdf-builder/utils';

interface ExcelControlsProps {
  fields: ExcelFieldConfig[];
  lineItems: ExcelLineItemConfig[];
  columns: ExcelColumnConfig[];
  showLineNumbers: boolean;
  includeHeader: boolean;
  includeTotals: boolean;
  onFieldToggle: (fieldId: string) => void;
  onLineItemToggle: (itemId: string) => void;
  onColumnToggle: (columnId: string) => void;
  onShowLineNumbersToggle: () => void;
  onIncludeHeaderToggle: () => void;
  onIncludeTotalsToggle: () => void;
}

type SectionType = 'fields' | 'lineItems' | 'columns' | 'settings';

export function ExcelControls({
  fields,
  lineItems,
  columns,
  showLineNumbers,
  includeHeader,
  includeTotals,
  onFieldToggle,
  onLineItemToggle,
  onColumnToggle,
  onShowLineNumbersToggle,
  onIncludeHeaderToggle,
  onIncludeTotalsToggle,
}: ExcelControlsProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('fields');

  const getFieldsByCategory = (categoryId: string) => {
    return fields.filter((f) => f.category === categoryId);
  };

  const visibleLineItemsCount = lineItems.filter((item) => item.visible).length;
  const visibleFieldsCount = fields.filter((f) => f.visible).length;
  const visibleColumnsCount = columns.filter((c) => c.visible).length;

  const sections: { id: SectionType; label: string; count?: number; icon: React.ReactNode }[] = [
    {
      id: 'fields',
      label: 'Document Fields',
      count: visibleFieldsCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      id: 'lineItems',
      label: 'Line Items',
      count: visibleLineItemsCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      id: 'columns',
      label: 'Table Columns',
      count: visibleColumnsCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Excel Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Toggle switch component
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
        checked
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-inner'
          : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );

  // Calculate line item total
  const getLineItemTotal = (item: ExcelLineItemConfig) => {
    const qty = item.editedValues?.quantity ?? item.quantity;
    const price = item.editedValues?.unitPrice ?? item.unitPrice;
    return qty * price;
  };

  return (
    <div className="h-full flex">
      {/* Vertical Navigation Sidebar */}
      <div className="w-[240px] bg-white border-r border-gray-100 flex flex-col py-4">
        <div className="px-4 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customize Excel</h2>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                activeSection === section.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeSection === section.id ? 'text-emerald-600' : 'text-gray-400'}>
                {section.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${activeSection === section.id ? 'text-emerald-700' : ''}`}>
                  {section.label}
                </div>
              </div>
              {section.count !== undefined && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  activeSection === section.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {section.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Fields Section */}
        {activeSection === 'fields' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Document Fields</h3>
              <p className="text-sm text-gray-500">Toggle fields to include in the Excel header section.</p>
            </div>

            <div className="space-y-6">
              {FIELD_CATEGORIES.map((category) => {
                const categoryFields = getFieldsByCategory(category.id);
                if (categoryFields.length === 0) return null;
                const visibleCount = categoryFields.filter((f) => f.visible).length;

                return (
                  <div key={category.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">{category.label}</h4>
                      <span className="text-xs text-gray-400">
                        {visibleCount}/{categoryFields.length} visible
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {categoryFields.map((field, idx) => (
                        <div
                          key={field.id}
                          className={`flex items-center gap-4 px-4 py-3.5 ${
                            idx !== categoryFields.length - 1 ? 'border-b border-gray-100' : ''
                          } ${field.visible ? '' : 'bg-gray-50/50'}`}
                        >
                          <Toggle checked={field.visible} onChange={() => onFieldToggle(field.id)} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${field.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.label}
                            </div>
                            <div className={`text-xs mt-0.5 ${field.visible ? 'text-gray-500' : 'text-gray-300'}`}>
                              {field.value || '—'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Line Items Section */}
        {activeSection === 'lineItems' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Line Items</h3>
                  <p className="text-sm text-gray-500">Select which items to include in the Excel export.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => lineItems.forEach((item) => !item.visible && onLineItemToggle(item.id))}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => lineItems.forEach((item) => item.visible && onLineItemToggle(item.id))}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hide All
                  </button>
                </div>
              </div>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No line items found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border-2 transition-all ${
                      item.visible ? 'border-emerald-200 shadow-sm' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="pt-0.5">
                          <Toggle checked={item.visible} onChange={() => onLineItemToggle(item.id)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              #{item.itemNumber}
                            </span>
                            <span className="text-lg font-bold text-emerald-600">
                              {formatCurrency(getLineItemTotal(item))}
                            </span>
                          </div>

                          {/* Product Name */}
                          <div className={`text-sm font-semibold ${item.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                            {item.product}
                          </div>

                          {/* Description */}
                          <div className={`text-sm mt-1 ${item.visible ? 'text-gray-500' : 'text-gray-300'}`}>
                            {item.description || '—'}
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                            <div className={item.visible ? 'text-gray-700' : 'text-gray-300'}>
                              <span className="text-xs text-gray-400">Qty:</span>
                              <span className="text-sm font-medium ml-1">{item.quantity}</span>
                            </div>
                            <div className={item.visible ? 'text-gray-700' : 'text-gray-300'}>
                              <span className="text-xs text-gray-400">Price:</span>
                              <span className="text-sm font-medium ml-1">{formatCurrency(item.unitPrice)}</span>
                            </div>
                            <div className={item.visible ? 'text-gray-700' : 'text-gray-300'}>
                              <span className="text-xs text-gray-400">UOM:</span>
                              <span className="text-sm font-medium ml-1">{item.uom || 'EA'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Columns Section */}
        {activeSection === 'columns' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Table Columns</h3>
              <p className="text-sm text-gray-500">Choose which columns to include in the line items table.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {columns.map((column, idx) => (
                <div
                  key={column.id}
                  className={`flex items-center gap-4 px-4 py-4 ${
                    idx !== columns.length - 1 ? 'border-b border-gray-100' : ''
                  } ${column.visible ? '' : 'bg-gray-50'}`}
                >
                  <Toggle checked={column.visible} onChange={() => onColumnToggle(column.id)} />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${column.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                      {column.label}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    column.visible
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {column.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Excel Settings</h3>
              <p className="text-sm text-gray-500">Configure how your Excel file looks.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Include Header Setting */}
              <div
                onClick={onIncludeHeaderToggle}
                className="flex items-center gap-4 px-5 py-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Toggle checked={includeHeader} onChange={onIncludeHeaderToggle} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Include Header Section</div>
                  <div className="text-xs text-gray-500 mt-0.5">Show document fields at the top of the Excel file</div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                  </svg>
                </div>
              </div>

              {/* Show Line Numbers Setting */}
              <div
                onClick={onShowLineNumbersToggle}
                className="flex items-center gap-4 px-5 py-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Toggle checked={showLineNumbers} onChange={onShowLineNumbersToggle} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Line Item Numbers</div>
                  <div className="text-xs text-gray-500 mt-0.5">Show item numbers in the first column</div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 11-1.087 1.96 1.125 1.125 0 011.088-1.96zm0 5.874a1.125 1.125 0 11-1.087 1.96 1.125 1.125 0 011.088-1.96z" />
                  </svg>
                </div>
              </div>

              {/* Include Totals Setting */}
              <div
                onClick={onIncludeTotalsToggle}
                className="flex items-center gap-4 px-5 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Toggle checked={includeTotals} onChange={onIncludeTotalsToggle} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Include Totals Row</div>
                  <div className="text-xs text-gray-500 mt-0.5">Add a summary row with totals at the bottom</div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
