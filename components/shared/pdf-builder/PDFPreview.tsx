/**
 * PDF Preview Component
 * Right panel showing live preview of the PDF
 */

'use client';

import React from 'react';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import type { PDFFieldConfig, PDFLineItemConfig, PDFColumnConfig } from './types';
import { ENTITY_TYPE_LABELS, FIELD_CATEGORIES } from './types';
import { formatCurrency, formatDate, formatNumber, formatStatus, getStatusColor } from './utils';

interface PDFPreviewProps {
  entityType: PDFEntityType;
  entityNumber: string;
  fields: PDFFieldConfig[];
  lineItems: PDFLineItemConfig[];
  columns: PDFColumnConfig[];
  headerNote: string;
  footerNote: string;
  showLogo: boolean;
  showLineNumbers: boolean;
  organizationName: string;
  organizationLogo: string | null;
  organizationAddress: string;
  centerLogo: string | null;
  showCenterLogo: boolean;
  centerLogoSize: number;
  centerLogoPosition: number;
}

export function PDFPreview({
  entityType,
  entityNumber,
  fields,
  lineItems,
  columns,
  headerNote,
  footerNote,
  showLogo,
  showLineNumbers,
  organizationName,
  organizationLogo,
  organizationAddress,
  centerLogo,
  showCenterLogo,
  centerLogoSize,
  centerLogoPosition,
}: PDFPreviewProps) {
  const visibleFields = fields.filter((f) => f.visible);
  const visibleLineItems = lineItems.filter((item) => item.visible);
  const visibleColumns = columns.filter((c) => c.visible);

  // Group visible fields by category
  const fieldsByCategory = FIELD_CATEGORIES.reduce((acc, cat) => {
    const catFields = visibleFields.filter((f) => f.category === cat.id);
    if (catFields.length > 0) {
      acc[cat.id] = catFields;
    }
    return acc;
  }, {} as Record<string, PDFFieldConfig[]>);

  // Get summary fields
  const summaryFields = fieldsByCategory['summary'] || [];
  const headerFields = fieldsByCategory['header'] || [];
  const customerFields = fieldsByCategory['customer'] || [];
  const dateFields = fieldsByCategory['dates'] || [];
  const termsFields = fieldsByCategory['terms'] || [];
  const otherFields = fieldsByCategory['other'] || [];

  // Calculate line item total based on edited values
  const getLineItemTotal = (item: PDFLineItemConfig) => {
    const qty = item.editedValues?.quantity ?? item.quantity;
    const price = item.editedValues?.unitPrice ?? item.unitPrice;
    return qty * price;
  };

  // Calculate totals using edited values
  const subtotal = visibleLineItems.reduce((sum, item) => sum + getLineItemTotal(item), 0);

  // Get discount if visible
  const discountField = visibleFields.find(f => f.id === 'discount');
  const discount = discountField ? Number(discountField.editedValue ?? discountField.value ?? 0) : 0;

  // Calculate total (subtotal - discount)
  const total = subtotal - discount;

  // Format field value based on type
  const formatFieldValue = (field: PDFFieldConfig): string => {
    const value = field.editedValue ?? field.value;
    if (value == null || value === '') return '-';

    switch (field.type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'date':
        return formatDate(String(value));
      case 'percentage':
        return `${formatNumber(Number(value))}%`;
      case 'number':
        return formatNumber(Number(value));
      default:
        return String(value);
    }
  };

  return (
    <div className="h-full bg-gray-100 overflow-auto p-8">
      {/* PDF Document Container */}
      <div className="max-w-[850px] mx-auto bg-white shadow-xl rounded-sm" style={{ minHeight: '1100px' }}>
        {/* PDF Content */}
        <div className="p-10">
          {/* Header Section */}
          <div className="relative mb-8 pb-6 border-b-2 border-gray-200">
            {/* Center Logo (Second Company) - Absolutely positioned in center */}
            {showCenterLogo && centerLogo && (
              <div className="absolute top-0 -translate-x-1/2" style={{ left: `${centerLogoPosition}%` }}>
                <div
                  className="rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100"
                  style={{ maxWidth: `${centerLogoSize * 3.78}px`, maxHeight: `${centerLogoSize * 3.78}px` }}
                >
                  <img
                    src={centerLogo}
                    alt="Partner Logo"
                    style={{ maxWidth: `${centerLogoSize * 3.78}px`, maxHeight: `${centerLogoSize * 3.78}px` }}
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-start">
              {/* Company Info & Logo (Left) */}
              <div className="flex items-start gap-4">
                {showLogo && organizationLogo && (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                    <img
                      src={organizationLogo}
                      alt={organizationName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                {showLogo && !organizationLogo && (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {organizationName?.charAt(0) || 'C'}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{organizationName || 'Company Name'}</h2>
                  {organizationAddress && (
                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{organizationAddress}</p>
                  )}
                </div>
              </div>

              {/* Document Info */}
              <div className="text-right">
              {/* Entity Number - only show if visible */}
              {(() => {
                // Map entity type to its primary number field
                const primaryNumberFieldMap: Record<string, string> = {
                  'PRE_OPPORTUNITIES': 'entityNumber',
                  'QUOTES': 'quoteNumber',
                  'ORDERS': 'orderNumber',
                  'INVOICES': 'invoiceNumber',
                  'CHECKS': 'checkNumber',
                };
                const primaryNumberFieldId = primaryNumberFieldMap[entityType];
                const numberField = visibleFields.find(f => f.id === primaryNumberFieldId);
                if (numberField) {
                  return (
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{ENTITY_TYPE_LABELS[entityType]} #</span>
                      <span className="text-xl font-bold text-gray-900">{formatFieldValue(numberField)}</span>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Status - show if visible */}
              {(() => {
                const statusField = visibleFields.find(f => f.id === 'status');
                if (statusField) {
                  const statusValue = statusField.editedValue ?? statusField.value;
                  return (
                    <div className="mb-2">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(String(statusValue))}`}>
                        {formatStatus(String(statusValue))}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Date fields on the right */}
              <div className="space-y-1">
                {dateFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-gray-500">{field.label}:</span>
                    <span className="font-medium text-gray-800">{formatFieldValue(field)}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Header Note */}
          {headerNote && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-800 whitespace-pre-line">{headerNote}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Customer Info */}
            {customerFields.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer Information</h3>
                {customerFields.map((field) => (
                  <div key={field.id}>
                    <div className="text-[10px] text-gray-500">{field.label}</div>
                    <div className="text-sm font-medium text-gray-900">{formatFieldValue(field)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Terms */}
            {termsFields.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Terms</h3>
                {termsFields.map((field) => (
                  <div key={field.id}>
                    <div className="text-[10px] text-gray-500">{field.label}</div>
                    <div className="text-sm font-medium text-gray-900">{formatFieldValue(field)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Other Info - filter out status and the primary entity number field (shown in header) */}
            {(() => {
              // Only filter out the PRIMARY entity number field for this type, not reference fields like orderNumber on invoices
              const primaryNumberFieldMap: Record<string, string> = {
                'PRE_OPPORTUNITIES': 'entityNumber',
                'QUOTES': 'quoteNumber',
                'ORDERS': 'orderNumber',
                'INVOICES': 'invoiceNumber',
                'CHECKS': 'checkNumber',
              };
              const primaryNumberFieldId = primaryNumberFieldMap[entityType];
              const detailHeaderFields = headerFields.filter(f => f.id !== 'status' && f.id !== primaryNumberFieldId);
              if (otherFields.length > 0 || detailHeaderFields.length > 0) {
                return (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Details</h3>
                    {detailHeaderFields.map((field) => (
                      <div key={field.id}>
                        <div className="text-[10px] text-gray-500">{field.label}</div>
                        <div className="text-sm font-medium text-gray-900">{formatFieldValue(field)}</div>
                      </div>
                    ))}
                    {otherFields.map((field) => (
                      <div key={field.id}>
                        <div className="text-[10px] text-gray-500">{field.label}</div>
                        <div className="text-sm font-medium text-gray-900">{formatFieldValue(field)}</div>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-white">
                  {visibleColumns.map((col, idx) => (
                    <th
                      key={col.id}
                      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider ${
                        idx === 0 ? 'rounded-tl-lg' : ''
                      } ${idx === visibleColumns.length - 1 ? 'rounded-tr-lg' : ''} ${
                        col.id === 'total' || col.id === 'unitPrice' || col.id === 'quantity' || col.id === 'appliedAmount'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                      style={{ width: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleLineItems.map((item, rowIdx) => (
                  <tr key={item.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {visibleColumns.map((col) => {
                      let value: React.ReactNode = '-';
                      const editedValues = item.editedValues || {};

                      switch (col.id) {
                        case 'itemNumber':
                          value = showLineNumbers ? item.itemNumber : rowIdx + 1;
                          break;
                        case 'product':
                          value = editedValues.product ?? item.product;
                          break;
                        case 'description':
                          value = editedValues.description ?? item.description;
                          break;
                        case 'quantity':
                          value = formatNumber(editedValues.quantity ?? item.quantity, 0);
                          break;
                        case 'unitPrice':
                          value = formatCurrency(editedValues.unitPrice ?? item.unitPrice);
                          break;
                        case 'uom':
                          value = editedValues.uom ?? item.uom ?? 'EA';
                          break;
                        case 'endUser':
                          value = item.endUser || '-';
                          break;
                        case 'total':
                          value = formatCurrency(getLineItemTotal(item));
                          break;
                        case 'source':
                          value = item.product;
                          break;
                        case 'reference':
                          value = item.description;
                          break;
                        case 'appliedAmount':
                          value = formatCurrency(item.total);
                          break;
                      }

                      return (
                        <td
                          key={col.id}
                          className={`px-3 py-2.5 text-xs ${
                            col.id === 'total' || col.id === 'unitPrice' || col.id === 'quantity' || col.id === 'appliedAmount'
                              ? 'text-right font-medium'
                              : 'text-left'
                          } ${col.id === 'description' ? 'text-gray-500' : 'text-gray-900'}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section - only show if at least one summary field is visible */}
          {(() => {
            const subtotalField = visibleFields.find(f => f.id === 'subtotal');
            const totalField = visibleFields.find(f => f.id === 'total');
            const discountFieldVisible = visibleFields.find(f => f.id === 'discount');

            // If no summary fields are visible, don't show this section
            if (!subtotalField && !totalField && !discountFieldVisible) {
              return null;
            }

            // Get edited/original values
            const subtotalValue = subtotalField
              ? (subtotalField.editedValue !== undefined ? Number(subtotalField.editedValue) : subtotal)
              : subtotal;
            const totalValue = totalField
              ? (totalField.editedValue !== undefined ? Number(totalField.editedValue) : total)
              : total;

            return (
              <div className="flex justify-end mb-8">
                <div className="w-72">
                  <div className="space-y-2 pb-3 border-b border-gray-200">
                    {subtotalField && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium text-gray-900">{formatCurrency(subtotalValue)}</span>
                      </div>
                    )}
                    {discountFieldVisible && (discountFieldVisible.editedValue ?? discountFieldVisible.value) ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{discountFieldVisible.label}</span>
                        <span className="font-medium text-red-600">-{formatFieldValue(discountFieldVisible)}</span>
                      </div>
                    ) : null}
                  </div>
                  {totalField && (
                    <div className="flex justify-between pt-3">
                      <span className="text-sm font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Footer Note */}
          {footerNote && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes & Terms</h4>
              <p className="text-xs text-gray-600 whitespace-pre-line">{footerNote}</p>
            </div>
          )}

          {/* Page Footer */}
          <div className="mt-12 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-4">
              <span>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Page 1 of 1</span>
            </div>
            {/* Powered by FlowRMS */}
            <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400 leading-none">Powered by</span>
              <img
                src="/flow-logo copy.png"
                alt="FlowRMS"
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  // Hide broken image
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-sm font-semibold text-gray-600 leading-none">FlowRMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
