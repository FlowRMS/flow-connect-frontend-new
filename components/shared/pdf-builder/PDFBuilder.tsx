/**
 * PDF Builder Component
 * Main component for building and exporting PDFs for entities
 * Clean, modern, professional modal design matching Flow CRM UI
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import { fetchEntityForPDF } from '@/components/lib/graphql/pdf-entities';
import { useOrganization } from '@/components/hooks/useOrganization';
import { PDFControls } from './PDFControls';
import { PDFPreview } from './PDFPreview';
import type { PDFFieldConfig, PDFLineItemConfig, PDFColumnConfig, PDFBuilderState } from './types';
import { DEFAULT_COLUMNS, ENTITY_TYPE_LABELS } from './types';
import { extractFields, extractLineItems, getEntityNumber, formatCurrency, formatDate, formatNumber } from './utils';

interface PDFBuilderProps {
  entityId: string;
  entityType: PDFEntityType;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFBuilder({ entityId, entityType, isOpen, onClose }: PDFBuilderProps) {
  const { organization, logoUrl } = useOrganization();

  // State
  const [state, setState] = useState<PDFBuilderState>({
    entityType,
    entityId,
    entityData: null,
    fields: [],
    lineItems: [],
    columns: DEFAULT_COLUMNS[entityType] || [],
    isLoading: true,
    error: null,
    organizationName: '',
    organizationLogo: null,
    organizationAddress: '',
    headerNote: '',
    footerNote: 'Thank you for your business.',
    showLogo: true,
    showLineNumbers: true,
    showSubtotal: true,
    showDiscount: true,
    showTotal: true,
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
        console.error('Failed to load entity for PDF:', err);
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
      const addressParts = [
        organization.streetAddress,
        organization.addressLine2,
        [organization.city, organization.state, organization.zipCode].filter(Boolean).join(', '),
      ].filter(Boolean);

      setState((prev) => ({
        ...prev,
        organizationName: organization.companyName || 'Company',
        organizationLogo: logoUrl,
        organizationAddress: addressParts.join('\n'),
      }));
    }
  }, [organization, logoUrl]);

  // Handlers
  const handleFieldToggle = useCallback((fieldId: string) => {
    setState((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === fieldId ? { ...f, visible: !f.visible } : f
      ),
    }));
  }, []);

  const handleFieldEdit = useCallback((fieldId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === fieldId ? { ...f, editedValue: value } : f
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

  const handleLineItemEdit = useCallback((itemId: string, field: string, value: string | number) => {
    setState((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              editedValues: {
                ...item.editedValues,
                [field]: value,
              },
            }
          : item
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

  const handleHeaderNoteChange = useCallback((note: string) => {
    setState((prev) => ({ ...prev, headerNote: note }));
  }, []);

  const handleFooterNoteChange = useCallback((note: string) => {
    setState((prev) => ({ ...prev, footerNote: note }));
  }, []);

  const handleShowLogoToggle = useCallback(() => {
    setState((prev) => ({ ...prev, showLogo: !prev.showLogo }));
  }, []);

  const handleShowLineNumbersToggle = useCallback(() => {
    setState((prev) => ({ ...prev, showLineNumbers: !prev.showLineNumbers }));
  }, []);

  // Export to PDF
  const handleExport = useCallback(async () => {
    if (!state.entityData) return;

    setIsExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Colors
      const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
      const darkColor: [number, number, number] = [31, 41, 55]; // Dark gray
      const lightGray: [number, number, number] = [156, 163, 175];

      // Get entity number
      const entityNumber = getEntityNumber(entityType, state.entityData);

      // Header - Logo and Company Info
      if (state.showLogo && state.organizationLogo) {
        try {
          // Add logo
          doc.addImage(state.organizationLogo, 'PNG', margin, yPos, 20, 20);
        } catch {
          // If logo fails, just skip it
        }
      }

      // Company name
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text(state.organizationName || 'Company', state.showLogo ? margin + 25 : margin, yPos + 5);

      // Company address
      if (state.organizationAddress) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        const addressLines = state.organizationAddress.split('\n');
        addressLines.forEach((line, idx) => {
          doc.text(line, state.showLogo ? margin + 25 : margin, yPos + 10 + idx * 4);
        });
      }

      // Document type and number (right side)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightGray);
      doc.text(`${ENTITY_TYPE_LABELS[entityType]} #`, pageWidth - margin, yPos + 2, { align: 'right' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text(entityNumber, pageWidth - margin, yPos + 8, { align: 'right' });

      // Date fields on right
      const visibleDateFields = state.fields.filter((f) => f.visible && f.category === 'dates');
      let dateYPos = yPos + 14;
      doc.setFontSize(8);
      visibleDateFields.forEach((field) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        const value = field.editedValue ?? field.value;
        const formattedValue = field.type === 'date' ? formatDate(String(value)) : String(value || '-');
        doc.text(`${field.label}: ${formattedValue}`, pageWidth - margin, dateYPos, { align: 'right' });
        dateYPos += 4;
      });

      yPos = Math.max(yPos + 30, dateYPos + 5);

      // Header note
      if (state.headerNote) {
        doc.setFillColor(239, 246, 255); // Light blue background
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 64, 175); // Blue text
        doc.text(state.headerNote, margin + 3, yPos + 7);
        yPos += 18;
      }

      // Info sections
      const visibleCustomerFields = state.fields.filter((f) => f.visible && f.category === 'customer');
      const visibleTermsFields = state.fields.filter((f) => f.visible && f.category === 'terms');
      const visibleOtherFields = state.fields.filter((f) => f.visible && (f.category === 'other' || (f.category === 'header' && f.id !== 'status' && !f.id.includes('Number'))));

      const colWidth = (pageWidth - margin * 2) / 3;
      let maxSectionHeight = 0;

      // Customer info column
      if (visibleCustomerFields.length > 0) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...lightGray);
        doc.text('CUSTOMER INFORMATION', margin, yPos);
        let fieldYPos = yPos + 5;
        doc.setFont('helvetica', 'normal');
        visibleCustomerFields.forEach((field) => {
          doc.setFontSize(7);
          doc.setTextColor(...lightGray);
          doc.text(field.label, margin, fieldYPos);
          doc.setFontSize(9);
          doc.setTextColor(...darkColor);
          const value = field.editedValue ?? field.value;
          doc.text(String(value || '-'), margin, fieldYPos + 4);
          fieldYPos += 10;
        });
        maxSectionHeight = Math.max(maxSectionHeight, fieldYPos - yPos);
      }

      // Terms column
      if (visibleTermsFields.length > 0) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...lightGray);
        doc.text('TERMS', margin + colWidth, yPos);
        let fieldYPos = yPos + 5;
        doc.setFont('helvetica', 'normal');
        visibleTermsFields.forEach((field) => {
          doc.setFontSize(7);
          doc.setTextColor(...lightGray);
          doc.text(field.label, margin + colWidth, fieldYPos);
          doc.setFontSize(9);
          doc.setTextColor(...darkColor);
          const value = field.editedValue ?? field.value;
          doc.text(String(value || '-'), margin + colWidth, fieldYPos + 4);
          fieldYPos += 10;
        });
        maxSectionHeight = Math.max(maxSectionHeight, fieldYPos - yPos);
      }

      // Other info column
      if (visibleOtherFields.length > 0) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...lightGray);
        doc.text('DETAILS', margin + colWidth * 2, yPos);
        let fieldYPos = yPos + 5;
        doc.setFont('helvetica', 'normal');
        visibleOtherFields.forEach((field) => {
          doc.setFontSize(7);
          doc.setTextColor(...lightGray);
          doc.text(field.label, margin + colWidth * 2, fieldYPos);
          doc.setFontSize(9);
          doc.setTextColor(...darkColor);
          const value = field.editedValue ?? field.value;
          doc.text(String(value || '-'), margin + colWidth * 2, fieldYPos + 4);
          fieldYPos += 10;
        });
        maxSectionHeight = Math.max(maxSectionHeight, fieldYPos - yPos);
      }

      yPos += maxSectionHeight + 10;

      // Line items table
      const visibleColumns = state.columns.filter((c) => c.visible);
      const visibleLineItems = state.lineItems.filter((item) => item.visible);

      const tableHeaders = visibleColumns.map((col) => col.label);
      const tableBody = visibleLineItems.map((item, idx) => {
        return visibleColumns.map((col) => {
          const editedValues = item.editedValues || {};
          switch (col.id) {
            case 'itemNumber':
              return state.showLineNumbers ? String(item.itemNumber) : String(idx + 1);
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
            case 'total': {
              const qty = editedValues.quantity ?? item.quantity;
              const price = editedValues.unitPrice ?? item.unitPrice;
              return formatCurrency(qty * price);
            }
            case 'source':
              return item.product;
            case 'reference':
              return item.description;
            case 'appliedAmount':
              return formatCurrency(item.total);
            default:
              return '-';
          }
        });
      });

      autoTable(doc, {
        startY: yPos,
        head: [tableHeaders],
        body: tableBody,
        theme: 'plain',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: darkColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: visibleColumns.reduce((acc, col, idx) => {
          if (col.id === 'total' || col.id === 'unitPrice' || col.id === 'quantity' || col.id === 'appliedAmount') {
            acc[idx] = { halign: 'right' };
          }
          if (col.id === 'description') {
            acc[idx] = { cellWidth: 'auto' };
          }
          return acc;
        }, {} as Record<number, { halign?: 'right' | 'left' | 'center'; cellWidth?: 'auto' | number }>),
        margin: { left: margin, right: margin },
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
      yPos = finalY + 10;

      // Summary - calculate totals based on edited values
      const subtotal = visibleLineItems.reduce((sum, item) => {
        const qty = item.editedValues?.quantity ?? item.quantity;
        const price = item.editedValues?.unitPrice ?? item.unitPrice;
        return sum + (qty * price);
      }, 0);
      const discountField = state.fields.find((f) => f.id === 'discount' && f.visible);
      const discount = discountField ? Number(discountField.editedValue ?? discountField.value ?? 0) : 0;
      const total = subtotal - discount;

      const summaryX = pageWidth - margin - 60;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightGray);
      doc.text('Subtotal', summaryX, yPos);
      doc.setTextColor(...darkColor);
      doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: 'right' });

      if (discount > 0) {
        yPos += 5;
        doc.setTextColor(...lightGray);
        doc.text('Discount', summaryX, yPos);
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`-${formatCurrency(discount)}`, pageWidth - margin, yPos, { align: 'right' });
      }

      yPos += 7;
      doc.setDrawColor(229, 231, 235);
      doc.line(summaryX, yPos - 2, pageWidth - margin, yPos - 2);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Total', summaryX, yPos + 3);
      doc.setFontSize(12);
      doc.text(formatCurrency(total), pageWidth - margin, yPos + 3, { align: 'right' });

      yPos += 15;

      // Footer note
      if (state.footerNote) {
        if (yPos + 30 > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }

        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...lightGray);
        doc.text('NOTES & TERMS', margin, yPos);
        yPos += 4;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const noteLines = doc.splitTextToSize(state.footerNote, pageWidth - margin * 2);
        doc.text(noteLines, margin, yPos);
      }

      // Page footer
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        margin,
        pageHeight - 14
      );
      doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 14, { align: 'right' });

      // Powered by FlowRMS
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text('Powered by FlowRMS', pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Save the PDF
      const fileName = `${ENTITY_TYPE_LABELS[entityType]}_${entityNumber}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [state, entityType]);

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
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6a1 1 0 001 1h5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  PDF Builder
                </h1>
                <p className="text-sm text-gray-500">
                  {ENTITY_TYPE_LABELS[entityType]} {entityNumber && <span className="font-semibold text-gray-700">#{entityNumber}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || state.isLoading || !!state.error}
                className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
                    Download PDF
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
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
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
                {/* Left Panel - Controls (wider for better UX) */}
                <div className="w-[700px] flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-hidden">
                  <PDFControls
                    fields={state.fields}
                    lineItems={state.lineItems}
                    columns={state.columns}
                    headerNote={state.headerNote}
                    footerNote={state.footerNote}
                    showLogo={state.showLogo}
                    showLineNumbers={state.showLineNumbers}
                    onFieldToggle={handleFieldToggle}
                    onFieldEdit={handleFieldEdit}
                    onLineItemToggle={handleLineItemToggle}
                    onLineItemEdit={handleLineItemEdit}
                    onColumnToggle={handleColumnToggle}
                    onHeaderNoteChange={handleHeaderNoteChange}
                    onFooterNoteChange={handleFooterNoteChange}
                    onShowLogoToggle={handleShowLogoToggle}
                    onShowLineNumbersToggle={handleShowLineNumbersToggle}
                  />
                </div>

                {/* Right Panel - Preview */}
                <div className="flex-1 overflow-hidden bg-gray-100">
                  <PDFPreview
                    entityType={entityType}
                    entityNumber={entityNumber}
                    fields={state.fields}
                    lineItems={state.lineItems}
                    columns={state.columns}
                    headerNote={state.headerNote}
                    footerNote={state.footerNote}
                    showLogo={state.showLogo}
                    showLineNumbers={state.showLineNumbers}
                    organizationName={state.organizationName}
                    organizationLogo={state.organizationLogo}
                    organizationAddress={state.organizationAddress}
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

export default PDFBuilder;
