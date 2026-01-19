/**
 * Excel Preview Component
 * Right panel showing live preview of the Excel export
 */

'use client';

import React from 'react';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import type { ExcelFieldConfig, ExcelLineItemConfig, ExcelColumnConfig } from './types';
import { ENTITY_TYPE_LABELS, FIELD_CATEGORIES } from './types';
import { formatCurrency, formatDate, formatNumber } from '../pdf-builder/utils';

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

  // Calculate line item total
  const getLineItemTotal = (item: ExcelLineItemConfig) => {
    const qty = item.editedValues?.quantity ?? item.quantity;
    const price = item.editedValues?.unitPrice ?? item.unitPrice;
    return qty * price;
  };

  // Calculate grand total
  const grandTotal = visibleLineItems.reduce((sum, item) => sum + getLineItemTotal(item), 0);
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
                  <td
                    colSpan={Math.max(2, visibleColumns.length)}
                    className={titleCellStyle}
                  >
                    {ENTITY_TYPE_LABELS[entityType]} # {entityNumber}
                  </td>
                </tr>

                {/* Header Fields Section */}
                {includeHeader && visibleFields.length > 0 && (
                  <>
                    {visibleFields.map((field) => (
                      <tr key={field.id}>
                        <td className={`${cellStyle} bg-gray-100 font-semibold text-gray-700 w-40`}>
                          {field.label}
                        </td>
                        <td
                          colSpan={Math.max(1, visibleColumns.length - 1)}
                          className={`${cellStyle} text-gray-900`}
                        >
                          {formatFieldValue(field)}
                        </td>
                      </tr>
                    ))}
                    {/* Empty row as separator */}
                    <tr>
                      <td colSpan={Math.max(2, visibleColumns.length)} className="h-4" />
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

                {/* Empty state */}
                {visibleLineItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className={`${cellStyle} text-center text-gray-400 py-8`}
                    >
                      No line items selected
                    </td>
                  </tr>
                )}
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
