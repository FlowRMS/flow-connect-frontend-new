/**
 * PDF Controls Component
 * Left panel with controls for customizing the PDF
 * Clean, modern, user-friendly design matching Flow CRM UI
 */

'use client';

import React, { useState } from 'react';
import type { PDFFieldConfig, PDFLineItemConfig, PDFColumnConfig } from './types';
import { FIELD_CATEGORIES } from './types';
import { formatCurrency } from './utils';
import { StyledDatePicker, parseDateString, formatDateToString } from '../StyledDatePicker';

interface PDFControlsProps {
  fields: PDFFieldConfig[];
  lineItems: PDFLineItemConfig[];
  columns: PDFColumnConfig[];
  headerNote: string;
  footerNote: string;
  showLogo: boolean;
  showLineNumbers: boolean;
  centerLogo: string | null;
  showCenterLogo: boolean;
  onFieldToggle: (fieldId: string) => void;
  onFieldEdit: (fieldId: string, value: string) => void;
  onLineItemToggle: (itemId: string) => void;
  onLineItemEdit: (itemId: string, field: string, value: string | number) => void;
  onColumnToggle: (columnId: string) => void;
  onHeaderNoteChange: (note: string) => void;
  onFooterNoteChange: (note: string) => void;
  onShowLogoToggle: () => void;
  onShowLineNumbersToggle: () => void;
  onCenterLogoUpload: (file: File) => void;
  onCenterLogoRemove: () => void;
  onShowCenterLogoToggle: () => void;
  centerLogoSize: number;
  onCenterLogoSizeChange: (size: number) => void;
  isUploadingCenterLogo?: boolean;
}

type SectionType = 'fields' | 'lineItems' | 'columns' | 'notes' | 'settings';

export function PDFControls({
  fields,
  lineItems,
  columns,
  headerNote,
  footerNote,
  showLogo,
  showLineNumbers,
  centerLogo,
  showCenterLogo,
  onFieldToggle,
  onFieldEdit,
  onLineItemToggle,
  onLineItemEdit,
  onColumnToggle,
  onHeaderNoteChange,
  onFooterNoteChange,
  onShowLogoToggle,
  onShowLineNumbersToggle,
  onCenterLogoUpload,
  onCenterLogoRemove,
  onShowCenterLogoToggle,
  centerLogoSize,
  onCenterLogoSizeChange,
  isUploadingCenterLogo,
}: PDFControlsProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('fields');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingLineItem, setEditingLineItem] = useState<{ id: string; field: string } | null>(null);

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
      id: 'notes',
      label: 'Notes & Terms',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'PDF Settings',
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
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-inner'
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

  // Render editable field value - ALL fields are now editable
  const renderFieldEditor = (field: PDFFieldConfig) => {
    const currentValue = field.editedValue ?? field.value ?? '';
    const isEditing = editingField === field.id;

    // Date field - use StyledDatePicker
    if (field.type === 'date') {
      if (isEditing) {
        return (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <StyledDatePicker
              selected={parseDateString(String(currentValue))}
              onChange={(date) => {
                onFieldEdit(field.id, formatDateToString(date));
                setEditingField(null);
              }}
              placeholder="Select date..."
              className="!py-2 !text-sm"
            />
          </div>
        );
      }
      return (
        <div
          onClick={() => field.visible && setEditingField(field.id)}
          className={`text-sm mt-1 flex items-center gap-2 ${
            field.visible ? 'text-gray-600 cursor-pointer hover:text-blue-600' : 'text-gray-300'
          }`}
        >
          <span>{currentValue || '—'}</span>
          {field.visible && (
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
        </div>
      );
    }

    // Text/other field - use input (ALL fields editable now)
    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={String(currentValue)}
          autoFocus
          onBlur={(e) => {
            onFieldEdit(field.id, e.target.value);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onFieldEdit(field.id, e.currentTarget.value);
              setEditingField(null);
            } else if (e.key === 'Escape') {
              setEditingField(null);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      );
    }

    return (
      <div
        onClick={() => field.visible && setEditingField(field.id)}
        className={`text-sm mt-1 flex items-center gap-2 ${
          field.visible ? 'text-gray-600 cursor-pointer hover:text-blue-600' : 'text-gray-300'
        }`}
      >
        <span>{currentValue || '—'}</span>
        {field.visible && (
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )}
      </div>
    );
  };

  // Render editable line item field
  const renderLineItemField = (item: PDFLineItemConfig, fieldName: string, label: string, type: 'text' | 'number' | 'currency' = 'text') => {
    const isEditing = editingLineItem?.id === item.id && editingLineItem.field === fieldName;
    let currentValue: string | number;

    switch (fieldName) {
      case 'product':
        currentValue = item.editedValues?.product ?? item.product;
        break;
      case 'description':
        currentValue = item.editedValues?.description ?? item.description;
        break;
      case 'quantity':
        currentValue = item.editedValues?.quantity ?? item.quantity;
        break;
      case 'unitPrice':
        currentValue = item.editedValues?.unitPrice ?? item.unitPrice;
        break;
      case 'uom':
        currentValue = item.editedValues?.uom ?? item.uom ?? '';
        break;
      default:
        currentValue = '';
    }

    if (isEditing) {
      return (
        <input
          type={type === 'number' || type === 'currency' ? 'number' : 'text'}
          step={type === 'currency' ? '0.01' : type === 'number' ? '1' : undefined}
          defaultValue={currentValue}
          autoFocus
          onBlur={(e) => {
            const val = type === 'number' ? parseInt(e.target.value) : type === 'currency' ? parseFloat(e.target.value) : e.target.value;
            onLineItemEdit(item.id, fieldName, val);
            setEditingLineItem(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = type === 'number' ? parseInt(e.currentTarget.value) : type === 'currency' ? parseFloat(e.currentTarget.value) : e.currentTarget.value;
              onLineItemEdit(item.id, fieldName, val);
              setEditingLineItem(null);
            } else if (e.key === 'Escape') {
              setEditingLineItem(null);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      );
    }

    const displayValue = type === 'currency' ? formatCurrency(Number(currentValue)) : String(currentValue || '—');

    return (
      <div
        onClick={() => item.visible && setEditingLineItem({ id: item.id, field: fieldName })}
        className={`flex items-center gap-1 ${
          item.visible ? 'text-gray-700 cursor-pointer hover:text-blue-600' : 'text-gray-300'
        }`}
      >
        <span className="text-xs text-gray-400">{label}:</span>
        <span className="text-sm font-medium">{displayValue}</span>
        {item.visible && (
          <svg className="w-3 h-3 text-blue-500 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )}
      </div>
    );
  };

  // Calculate line item total based on edited values
  const getLineItemTotal = (item: PDFLineItemConfig) => {
    const qty = item.editedValues?.quantity ?? item.quantity;
    const price = item.editedValues?.unitPrice ?? item.unitPrice;
    return qty * price;
  };

  return (
    <div className="h-full flex">
      {/* Vertical Navigation Sidebar - MUCH WIDER */}
      <div className="w-[240px] bg-white border-r border-gray-100 flex flex-col py-4">
        <div className="px-4 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customize PDF</h2>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeSection === section.id ? 'text-blue-600' : 'text-gray-400'}>
                {section.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${activeSection === section.id ? 'text-blue-700' : ''}`}>
                  {section.label}
                </div>
              </div>
              {section.count !== undefined && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
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
              <p className="text-sm text-gray-500">Toggle fields to show/hide on PDF. Click the pencil icon to edit any value.</p>
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
                          className={`flex items-start gap-4 px-4 py-3.5 ${
                            idx !== categoryFields.length - 1 ? 'border-b border-gray-100' : ''
                          } ${field.visible ? '' : 'bg-gray-50/50'}`}
                        >
                          <div className="pt-0.5">
                            <Toggle checked={field.visible} onChange={() => onFieldToggle(field.id)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${field.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.label}
                            </div>
                            {renderFieldEditor(field)}
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
                  <p className="text-sm text-gray-500">Select which items to include. Click any value to edit.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => lineItems.forEach((item) => !item.visible && onLineItemToggle(item.id))}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
                      item.visible ? 'border-blue-200 shadow-sm' : 'border-gray-100 opacity-60'
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
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(getLineItemTotal(item))}
                            </span>
                          </div>

                          {/* Product Name - Editable */}
                          {editingLineItem?.id === item.id && editingLineItem.field === 'product' ? (
                            <input
                              type="text"
                              defaultValue={item.editedValues?.product ?? item.product}
                              autoFocus
                              onBlur={(e) => {
                                onLineItemEdit(item.id, 'product', e.target.value);
                                setEditingLineItem(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onLineItemEdit(item.id, 'product', e.currentTarget.value);
                                  setEditingLineItem(null);
                                } else if (e.key === 'Escape') {
                                  setEditingLineItem(null);
                                }
                              }}
                              className="w-full px-3 py-1.5 text-sm font-semibold border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div
                              onClick={() => item.visible && setEditingLineItem({ id: item.id, field: 'product' })}
                              className={`text-sm font-semibold flex items-center gap-2 ${
                                item.visible ? 'text-gray-900 cursor-pointer hover:text-blue-600' : 'text-gray-400'
                              }`}
                            >
                              <span>{item.editedValues?.product ?? item.product}</span>
                              {item.visible && (
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              )}
                            </div>
                          )}

                          {/* Description - Editable */}
                          {editingLineItem?.id === item.id && editingLineItem.field === 'description' ? (
                            <textarea
                              defaultValue={item.editedValues?.description ?? item.description}
                              autoFocus
                              rows={2}
                              onBlur={(e) => {
                                onLineItemEdit(item.id, 'description', e.target.value);
                                setEditingLineItem(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingLineItem(null);
                                }
                              }}
                              className="w-full mt-2 px-3 py-1.5 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          ) : (
                            <div
                              onClick={() => item.visible && setEditingLineItem({ id: item.id, field: 'description' })}
                              className={`text-sm mt-1 flex items-center gap-2 ${
                                item.visible ? 'text-gray-500 cursor-pointer hover:text-blue-600' : 'text-gray-300'
                              }`}
                            >
                              <span>{(item.editedValues?.description ?? item.description) || '—'}</span>
                              {item.visible && (
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              )}
                            </div>
                          )}

                          {/* Editable Qty, Unit Price, UOM */}
                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                            {renderLineItemField(item, 'quantity', 'Qty', 'number')}
                            {renderLineItemField(item, 'unitPrice', 'Price', 'currency')}
                            {renderLineItemField(item, 'uom', 'UOM', 'text')}
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
              <p className="text-sm text-gray-500">Choose which columns to display in the line items table.</p>
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
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {column.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {activeSection === 'notes' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Notes & Terms</h3>
              <p className="text-sm text-gray-500">Add custom notes to your PDF document.</p>
            </div>

            <div className="space-y-6">
              {/* Header Note */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Header Note</h4>
                    <p className="text-xs text-gray-500">Appears at the top of the document</p>
                  </div>
                </div>
                <textarea
                  value={headerNote}
                  onChange={(e) => onHeaderNoteChange(e.target.value)}
                  placeholder="Add a note to appear below the document header..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              {/* Footer Note */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Footer Note / Terms</h4>
                    <p className="text-xs text-gray-500">Appears at the bottom of the document</p>
                  </div>
                </div>
                <textarea
                  value={footerNote}
                  onChange={(e) => onFooterNoteChange(e.target.value)}
                  placeholder="Add terms, conditions, payment instructions, or other notes..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">PDF Settings</h3>
              <p className="text-sm text-gray-500">Configure how your PDF looks.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Show Logo Setting */}
              <div
                onClick={onShowLogoToggle}
                className="flex items-center gap-4 px-5 py-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Toggle checked={showLogo} onChange={onShowLogoToggle} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Company Logo</div>
                  <div className="text-xs text-gray-500 mt-0.5">Display your organization logo in the PDF header (left side)</div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>

              {/* Center Logo Setting */}
              <div className="border-b border-gray-100">
                <div
                  onClick={onShowCenterLogoToggle}
                  className="flex items-center gap-4 px-5 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Toggle checked={showCenterLogo} onChange={onShowCenterLogoToggle} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Center Logo (Second Company)</div>
                    <div className="text-xs text-gray-500 mt-0.5">Display a second logo in the center of the PDF header</div>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                </div>

                {/* Center Logo Upload Area - Only show when enabled */}
                {showCenterLogo && (
                  <div className="px-5 pb-5">
                    {centerLogo ? (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                          <img
                            src={centerLogo}
                            alt="Center Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">Center Logo Uploaded</div>
                          <div className="text-xs text-gray-500 mt-0.5">This logo will appear in the center of the PDF header</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCenterLogoRemove();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                          {isUploadingCenterLogo ? (
                            <>
                              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                              <div className="text-sm font-medium text-gray-700">Uploading...</div>
                            </>
                          ) : (
                            <>
                              <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                              </svg>
                              <div className="text-sm font-medium text-gray-700">Upload Center Logo</div>
                              <div className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</div>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onCenterLogoUpload(file);
                            }
                            e.target.value = '';
                          }}
                          disabled={isUploadingCenterLogo}
                        />
                      </label>
                    )}

                    {/* Center Logo Size Slider */}
                    {centerLogo && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Logo Size</span>
                          <span className="text-sm font-semibold text-blue-600">{centerLogoSize}mm</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={60}
                          value={centerLogoSize}
                          onChange={(e) => onCenterLogoSizeChange(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Small</span>
                          <span>Large</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Show Line Numbers Setting */}
              <div
                onClick={onShowLineNumbersToggle}
                className="flex items-center gap-4 px-5 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Toggle checked={showLineNumbers} onChange={onShowLineNumbersToggle} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Line Item Numbers</div>
                  <div className="text-xs text-gray-500 mt-0.5">Show item numbers in the line items table</div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 11-1.087 1.96 1.125 1.125 0 011.088-1.96zm0 5.874a1.125 1.125 0 11-1.087 1.96 1.125 1.125 0 011.088-1.96z" />
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
