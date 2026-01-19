/**
 * Excel Preview Component
 * Right panel showing live preview of the Excel export
 */

'use client';

import React from 'react';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import type { ExcelFieldConfig, ExcelLineItemConfig, ExcelColumnConfig } from './types';
import { ENTITY_TYPE_LABELS } from './types';
import { formatCurrency, formatDate, formatNumber, formatStatus, getStatusColor } from '../pdf-builder/utils';

interface ExcelPreviewProps {
  entityType: PDFEntityType;
  entityNumber: string;
  fields: ExcelFieldConfig[];
  lineItems: ExcelLineItemConfig[];
  columns: ExcelColumnConfig[];
  showLineNumbers: boolean;
  includeHeader: boolean;
  includeTotals: boolean;
  organizationName: string;
}

export function ExcelPreview({
  entityType,
  entityNumber,
  fields,
  lineItems,
  columns,
  showLineNumbers,
  includeHeader,
  includeTotals,
  organizationName,
}: ExcelPreviewProps) {
  const visibleFields = fields.filter((f) => f.visible);
  const visibleLineItems = lineItems.filter((item) => item.visible);
  const visibleColumns = columns.filter((c) => c.visible);
  const primaryNumberFieldMap: Record<PDFEntityType, string> = {
    PRE_OPPORTUNITIES: 'entityNumber',
    QUOTES: 'quoteNumber',
    ORDERS: 'orderNumber',
    INVOICES: 'invoiceNumber',
    CHECKS: 'checkNumber',
  };
  const primaryNumberFieldId = primaryNumberFieldMap[entityType];
  const primaryNumberField = visibleFields.find((field) => field.id === primaryNumberFieldId);
  const showPrimaryNumberInTitle = Boolean(primaryNumberField && entityNumber);
  const summaryFields = visibleFields.filter((field) => field.category === 'summary');
  const headerFields = visibleFields.filter((field) => {
    if (field.category === 'summary') return false;
    if (showPrimaryNumberInTitle && field.id === primaryNumberFieldId) return false;
    return true;
  });
  const totalColumns = Math.max(2, visibleColumns.length);
  const rightSectionWidth = Math.min(2, totalColumns - 1);
  const leftSectionWidth = totalColumns - rightSectionWidth;
  const titleText = showPrimaryNumberInTitle && entityNumber
    ? `${ENTITY_TYPE_LABELS[entityType]} # ${entityNumber}`
    : ENTITY_TYPE_LABELS[entityType];
  const titleLeftText = organizationName?.trim() || '';
  const showSplitTitle = Boolean(titleLeftText && showPrimaryNumberInTitle && entityNumber);
  const singleTitleText = titleLeftText || titleText;

  // Calculate line item total
  const getLineItemTotal = (item: ExcelLineItemConfig) => {
    const qty = item.editedValues?.quantity ?? item.quantity;
    const price = item.editedValues?.unitPrice ?? item.unitPrice;
    return qty * price;
  };

  const lineItemsSubtotal = visibleLineItems.reduce(
    (sum, item) => sum + getLineItemTotal(item),
    0
  );
  const discountField = summaryFields.find((field) => field.id === 'discount');
  const discountValue = Number(discountField?.editedValue ?? discountField?.value ?? 0);
  const totalValue = lineItemsSubtotal - discountValue;

  // Calculate grand total
  const grandTotal = lineItemsSubtotal;
  const totalQuantity = visibleLineItems.reduce((sum, item) => sum + (item.editedValues?.quantity ?? item.quantity), 0);

  // Format field value based on type
  const formatFieldValue = (field: ExcelFieldConfig): string => {
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

  // Get cell value for line item
  const getCellValue = (item: ExcelLineItemConfig, column: ExcelColumnConfig, index: number): React.ReactNode => {
    const editedValues = item.editedValues || {};

    switch (column.id) {
      case 'itemNumber':
        return showLineNumbers ? item.itemNumber : index + 1;
      case 'product':
        return editedValues.product ?? item.product;
      case 'description':
        return editedValues.description ?? item.description;
      case 'quantity':
        return formatNumber(editedValues.quantity ?? item.quantity, 0);
      case 'unitPrice':
        return formatCurrency(editedValues.unitPrice ?? item.unitPrice);
      case 'uom':
        return editedValues.uom ?? item.uom ?? 'EA';
      case 'total':
        return formatCurrency(getLineItemTotal(item));
      case 'source':
        return item.product;
      case 'reference':
        return item.description;
      case 'appliedAmount':
        return formatCurrency(item.total);
      default:
        return '-';
    }
  };

  // Excel-like cell style
  const cellStyle = "border border-gray-300 px-2 py-1.5 text-xs";
  const headerCellStyle = "border border-gray-400 px-2 py-1.5 text-xs font-semibold bg-gray-800 text-white";
  const titleCellStyle = "border border-gray-400 px-2 py-2 text-sm font-bold bg-blue-700 text-white";
  const titleRightCellStyle = `${titleCellStyle} text-right`;
  const footerLabelStyle = "border border-gray-300 px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider";
  const footerNoteStyle = "border border-gray-300 px-2 py-2 text-xs text-gray-600";
  const footerMetaStyle = "px-2 py-1 text-[10px] text-gray-400";
  const footerPoweredStyle = "px-2 py-2 text-xs text-gray-500 text-center";
  const summaryLabelStyle = "px-2 py-1 text-xs text-gray-500 text-right";
  const summaryValueStyle = "px-2 py-1 text-xs text-gray-900 text-right";
  const summaryTotalLabelStyle = "px-2 py-2 text-sm font-semibold text-gray-900 text-right border-t border-gray-300";
  const summaryTotalValueStyle = "px-2 py-2 text-sm font-bold text-gray-900 text-right border-t border-gray-300";

  const getSummaryNumericValue = (field: ExcelFieldConfig) => {
    if (field.id === 'subtotal') {
      return field.editedValue !== undefined ? Number(field.editedValue) : lineItemsSubtotal;
    }
    if (field.id === 'discount') {
      return Number(field.editedValue ?? field.value ?? 0);
    }
    if (field.id === 'total') {
      return field.editedValue !== undefined ? Number(field.editedValue) : totalValue;
    }
    return Number(field.editedValue ?? field.value ?? 0);
  };

  const formatSummaryValue = (field: ExcelFieldConfig) => {
    const numericValue = getSummaryNumericValue(field);
    if (field.type === 'currency') {
      const formatted = formatCurrency(Math.abs(numericValue));
      if (field.id === 'discount' && numericValue !== 0) {
        return `-${formatted}`;
      }
      return formatted;
    }
    if (field.type === 'number') {
      return formatNumber(numericValue);
    }
    if (field.type === 'percentage') {
      return `${formatNumber(numericValue)}%`;
    }
    return formatFieldValue(field);
  };

  const generatedOn = `Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  return (
    <div className="h-full bg-gray-100 overflow-auto p-8">
      {/* Excel Document Preview */}
      <div className="max-w-[900px] mx-auto">
        {/* Excel-like container */}
        <div className="bg-white shadow-xl rounded-sm border border-gray-300 overflow-hidden">
          {/* Excel toolbar simulation */}
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-gray-600 font-medium">
                {ENTITY_TYPE_LABELS[entityType]}_{entityNumber || 'Export'}.xlsx
              </span>
            </div>
            <div className="w-16" />
          </div>

          {/* Excel sheet content */}
          <div className="p-4 bg-white min-h-[600px]">
            <table className="w-full border-collapse">
              <tbody>
                {/* Title Row - Merged */}
                <tr>
                  {showSplitTitle ? (
                    <>
                      <td colSpan={leftSectionWidth} className={titleCellStyle}>
                        {titleLeftText}
                      </td>
                      <td colSpan={rightSectionWidth} className={titleRightCellStyle}>
                        {titleText}
                      </td>
                    </>
                  ) : (
                    <td colSpan={totalColumns} className={titleCellStyle}>
                      {singleTitleText}
                    </td>
                  )}
                </tr>

                {/* Header Fields Section */}
                {includeHeader && headerFields.length > 0 && (
                  <>
                    {headerFields.map((field) => {
                      const statusValue = String(field.editedValue ?? field.value ?? '');
                      const isStatus = field.id === 'status';
                      const valueContent = isStatus
                        ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(statusValue)}`}>
                            {formatStatus(statusValue)}
                          </span>
                        )
                        : formatFieldValue(field);
                      const isNumeric = ['currency', 'number', 'percentage'].includes(field.type);
                      const valueAlignClass = isStatus
                        ? 'text-center'
                        : field.category === 'dates' || isNumeric
                          ? 'text-right'
                          : 'text-left';

                      return (
                      <tr key={field.id}>
                        <td className={`${cellStyle} bg-gray-100 font-semibold text-gray-700 w-40`}>
                          {field.label}
                        </td>
                        <td
                          colSpan={Math.max(1, totalColumns - 1)}
                          className={`${cellStyle} text-gray-900 ${valueAlignClass}`}
                        >
                          {valueContent}
                        </td>
                      </tr>
                      );
                    })}
                    {/* Empty row as separator */}
                    <tr>
                      <td colSpan={totalColumns} className="h-4" />
                    </tr>
                  </>
                )}

                {/* Line Items Header Row */}
                <tr>
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`${headerCellStyle} ${
                        column.id === 'total' || column.id === 'unitPrice' || column.id === 'quantity' || column.id === 'appliedAmount'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {column.label}
                    </td>
                  ))}
                </tr>

                {/* Line Items Data Rows */}
                {visibleLineItems.map((item, rowIdx) => (
                  <tr key={item.id} className={rowIdx % 2 === 1 ? 'bg-gray-50' : ''}>
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className={`${cellStyle} ${
                          column.id === 'total' || column.id === 'unitPrice' || column.id === 'quantity' || column.id === 'appliedAmount'
                            ? 'text-right'
                            : 'text-left'
                        } ${column.id === 'description' ? 'text-gray-600' : 'text-gray-900'}`}
                      >
                        {getCellValue(item, column, rowIdx)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Totals Row */}
                {includeTotals && visibleLineItems.length > 0 && (
                  <tr className="bg-gray-100 font-semibold">
                    {visibleColumns.map((column, colIdx) => {
                      let value: React.ReactNode = '';

                      if (colIdx === 0) {
                        value = 'TOTAL';
                      } else if (column.id === 'quantity') {
                        value = formatNumber(totalQuantity, 0);
                      } else if (column.id === 'total' || column.id === 'appliedAmount') {
                        value = formatCurrency(grandTotal);
                      }

                      return (
                        <td
                          key={column.id}
                          className={`${cellStyle} bg-gray-200 font-bold ${
                            column.id === 'total' || column.id === 'unitPrice' || column.id === 'quantity' || column.id === 'appliedAmount'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                )}

                {/* Summary Section */}
                {summaryFields.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={totalColumns} className="h-4" />
                    </tr>
                    {summaryFields.map((field) => {
                      const isTotal = field.id === 'total';
                      const labelClass = isTotal ? summaryTotalLabelStyle : summaryLabelStyle;
                      const valueClass = isTotal
                        ? summaryTotalValueStyle
                        : field.id === 'discount'
                          ? `${summaryValueStyle} text-red-600`
                          : summaryValueStyle;
                      return (
                        <tr key={field.id}>
                          <td colSpan={Math.max(1, totalColumns - 1)} className={labelClass}>
                            {field.label}
                          </td>
                          <td className={valueClass}>
                            {formatSummaryValue(field)}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}

                {/* Empty state */}
                {visibleLineItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={totalColumns}
                      className={`${cellStyle} text-center text-gray-400 py-8`}
                    >
                      No line items selected
                    </td>
                  </tr>
                )}

                {/* Footer Section */}
                <tr>
                  <td colSpan={totalColumns} className="h-4" />
                </tr>
                <tr>
                  <td colSpan={totalColumns} className={footerLabelStyle}>
                    NOTES &amp; TERMS
                  </td>
                </tr>
                <tr>
                  <td colSpan={totalColumns} className={footerNoteStyle}>
                    Thank you for your business.
                  </td>
                </tr>
                <tr>
                  <td colSpan={totalColumns} className="h-4" />
                </tr>
                <tr>
                  <td colSpan={Math.max(1, totalColumns - 1)} className={footerMetaStyle}>
                    {generatedOn}
                  </td>
                  <td className={`${footerMetaStyle} text-right`}>Page 1 of 1</td>
                </tr>
                <tr>
                  <td colSpan={totalColumns} className="h-4" />
                </tr>
                <tr>
                  <td colSpan={totalColumns} className={footerPoweredStyle}>
                    Powered by FlowRMS
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Excel footer */}
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-2 border-t border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700">
                Export
              </div>
              <div className="px-3 py-1 bg-gray-50 border border-gray-300 rounded text-xs text-gray-500">
                +
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {visibleLineItems.length} rows | {visibleColumns.length} columns
            </div>
          </div>
        </div>

        {/* Preview info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This is a preview. The actual Excel file may have slightly different formatting.
          </p>
        </div>
      </div>
    </div>
  );
}
