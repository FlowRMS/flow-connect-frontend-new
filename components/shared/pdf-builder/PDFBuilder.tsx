/**
 * PDF Builder Component
 * Main component for building and exporting PDFs for entities
 * Clean, modern, professional modal design matching Flow CRM UI
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import { fetchEntityForPDF } from '@/components/lib/graphql/pdf-entities';
import { useOrganization } from '@/components/hooks/useOrganization';
import { uploadFile, getFilePresignedUrl } from '@/components/lib/graphql/files';
import { PDFControls } from './PDFControls';
import { PDFPreview } from './PDFPreview';
import type { PDFBuilderState } from './types';
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
    centerLogo: null,
    showCenterLogo: false,
    centerLogoSize: 35,
    centerLogoPosition: 50,
    headerNote: '',
    footerNote: 'Thank you for your business.',
    showLogo: true,
    showLineNumbers: true,
    showSubtotal: true,
    showDiscount: true,
    showTotal: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isUploadingCenterLogo, setIsUploadingCenterLogo] = useState(false);

  // localStorage key for persisting PDF Builder config per entity type
  const storageKey = `pdfBuilder_config_${entityType}`;

  // Save config to localStorage whenever relevant state changes
  useEffect(() => {
    if (state.isLoading || state.error) return;
    if (!state.entityData) return;

    const config = {
      fieldVisibility: state.fields.reduce((acc, f) => { acc[f.id] = f.visible; return acc; }, {} as Record<string, boolean>),
      columnVisibility: state.columns.reduce((acc, c) => { acc[c.id] = c.visible; return acc; }, {} as Record<string, boolean>),
      headerNote: state.headerNote,
      footerNote: state.footerNote,
      showLogo: state.showLogo,
      showLineNumbers: state.showLineNumbers,
      showCenterLogo: state.showCenterLogo,
      centerLogo: state.centerLogo,
      centerLogoSize: state.centerLogoSize,
      centerLogoPosition: state.centerLogoPosition,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch {
      // localStorage may be full or unavailable
    }
  }, [state.fields, state.columns, state.headerNote, state.footerNote, state.showLogo, state.showLineNumbers, state.showCenterLogo, state.centerLogo, state.centerLogoSize, state.centerLogoPosition, state.isLoading, state.error, state.entityData, storageKey]);

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

        let fields = extractFields(entityType, data);
        const lineItems = extractLineItems(entityType, data);

        // Restore saved config from localStorage
        let savedHeaderNote: string | undefined;
        let savedFooterNote: string | undefined;
        let savedShowLogo: boolean | undefined;
        let savedShowLineNumbers: boolean | undefined;
        let savedShowCenterLogo: boolean | undefined;
        let savedCenterLogo: string | null | undefined;
        let savedCenterLogoSize: number | undefined;
        let savedCenterLogoPosition: number | undefined;
        let savedColumnVisibility: Record<string, boolean> | undefined;

        try {
          const saved = localStorage.getItem(`pdfBuilder_config_${entityType}`);
          if (saved) {
            const config = JSON.parse(saved);
            // Restore field visibility
            if (config.fieldVisibility) {
              fields = fields.map((f) => ({
                ...f,
                visible: config.fieldVisibility[f.id] ?? f.visible,
              }));
            }
            savedColumnVisibility = config.columnVisibility;
            savedHeaderNote = config.headerNote;
            savedFooterNote = config.footerNote;
            savedShowLogo = config.showLogo;
            savedShowLineNumbers = config.showLineNumbers;
            savedShowCenterLogo = config.showCenterLogo;
            savedCenterLogo = config.centerLogo;
            savedCenterLogoSize = config.centerLogoSize;
            savedCenterLogoPosition = config.centerLogoPosition;
          }
        } catch {
          // Ignore parse errors
        }

        setState((prev) => ({
          ...prev,
          entityData: data,
          fields,
          lineItems,
          columns: savedColumnVisibility
            ? prev.columns.map((c) => ({ ...c, visible: savedColumnVisibility![c.id] ?? c.visible }))
            : prev.columns,
          ...(savedHeaderNote !== undefined && { headerNote: savedHeaderNote }),
          ...(savedFooterNote !== undefined && { footerNote: savedFooterNote }),
          ...(savedShowLogo !== undefined && { showLogo: savedShowLogo }),
          ...(savedShowLineNumbers !== undefined && { showLineNumbers: savedShowLineNumbers }),
          ...(savedShowCenterLogo !== undefined && { showCenterLogo: savedShowCenterLogo }),
          ...(savedCenterLogo !== undefined && { centerLogo: savedCenterLogo }),
          ...(savedCenterLogoSize !== undefined && { centerLogoSize: savedCenterLogoSize }),
          ...(savedCenterLogoPosition !== undefined && { centerLogoPosition: savedCenterLogoPosition }),
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

  const handleShowCenterLogoToggle = useCallback(() => {
    setState((prev) => ({ ...prev, showCenterLogo: !prev.showCenterLogo }));
  }, []);

  const handleCenterLogoUpload = useCallback(async (file: File) => {
    setIsUploadingCenterLogo(true);
    try {
      // Upload the file
      const uploadedFile = await uploadFile({
        file,
        fileName: file.name,
        folderPath: 'pdf-builder/center-logos',
      });

      // Get presigned URL for the uploaded file
      const presignedUrl = await getFilePresignedUrl(uploadedFile.id);

      if (presignedUrl) {
        setState((prev) => ({ ...prev, centerLogo: presignedUrl }));
      }
    } catch (error) {
      console.error('Failed to upload center logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingCenterLogo(false);
    }
  }, []);

  const handleCenterLogoRemove = useCallback(() => {
    setState((prev) => ({ ...prev, centerLogo: null }));
  }, []);

  const handleCenterLogoSizeChange = useCallback((size: number) => {
    setState((prev) => ({ ...prev, centerLogoSize: size }));
  }, []);

  const handleCenterLogoPositionChange = useCallback((position: number) => {
    setState((prev) => ({ ...prev, centerLogoPosition: position }));
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
      const darkColor: [number, number, number] = [31, 41, 55]; // Dark gray
      const lightGray: [number, number, number] = [156, 163, 175];

      // Get entity number
      const entityNumber = getEntityNumber(entityType, state.entityData);

      // Helper function to load image and convert to base64, also returns natural dimensions
      const loadImageAsBase64 = async (url: string): Promise<{ data: string; width: number; height: number } | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      // Header - Logo and Company Info
      let logoAdded = false;
      if (state.showLogo && state.organizationLogo) {
        try {
          // Load image and convert to base64 for jsPDF
          const logoResult = await loadImageAsBase64(state.organizationLogo);
          if (logoResult) {
            // Fit within a 20x20mm box preserving aspect ratio (matches preview)
            const logoBox = 20;
            const aspect = logoResult.width / logoResult.height;
            let logoW: number, logoH: number;
            if (aspect >= 1) {
              logoW = logoBox;
              logoH = logoBox / aspect;
            } else {
              logoH = logoBox;
              logoW = logoBox * aspect;
            }
            // Center within the 20x20 box
            const logoOffsetX = (logoBox - logoW) / 2;
            const logoOffsetY = (logoBox - logoH) / 2;
            doc.addImage(logoResult.data, 'PNG', margin + logoOffsetX, yPos + logoOffsetY, logoW, logoH);
            logoAdded = true;
          }
        } catch {
          // If logo fails, just skip it
        }
      }

      // Center Logo (Second Company) - positioned in the center at the same height as left logo
      if (state.showCenterLogo && state.centerLogo) {
        try {
          const centerLogoResult = await loadImageAsBase64(state.centerLogo);
          if (centerLogoResult) {
            // Position the center logo based on user-configured horizontal position
            const maxSize = state.centerLogoSize || 35;
            const aspect = centerLogoResult.width / centerLogoResult.height;
            let clW: number, clH: number;
            if (aspect >= 1) {
              clW = maxSize;
              clH = maxSize / aspect;
            } else {
              clH = maxSize;
              clW = maxSize * aspect;
            }
            const positionPercent = state.centerLogoPosition ?? 50;
            const usableWidth = pageWidth - margin * 2;
            const centerX = margin + (usableWidth * positionPercent / 100) - (clW / 2);
            doc.addImage(centerLogoResult.data, 'PNG', centerX, yPos, clW, clH);
          }
        } catch {
          // If center logo fails, just skip it
        }
      }

      // Company name - position based on whether logo was actually added
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text(state.organizationName || 'Company', logoAdded ? margin + 25 : margin, yPos + 5);

      // Company address
      if (state.organizationAddress) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        const addressLines = state.organizationAddress.split('\n');
        addressLines.forEach((line, idx) => {
          doc.text(line, logoAdded ? margin + 25 : margin, yPos + 10 + idx * 4);
        });
      }

      // Document type and number (right side) - only if visible
      // Map entity type to its primary number field
      const primaryNumberFieldMap: Record<string, string> = {
        'PRE_OPPORTUNITIES': 'entityNumber',
        'QUOTES': 'quoteNumber',
        'ORDERS': 'orderNumber',
        'INVOICES': 'invoiceNumber',
        'CHECKS': 'checkNumber',
      };
      const primaryNumberFieldId = primaryNumberFieldMap[entityType];
      const numberField = state.fields.find(f => f.visible && f.id === primaryNumberFieldId);
      if (numberField) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        doc.text(`${ENTITY_TYPE_LABELS[entityType]} #`, pageWidth - margin, yPos + 2, { align: 'right' });

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        const numberValue = numberField.editedValue ?? numberField.value ?? entityNumber;
        doc.text(String(numberValue), pageWidth - margin, yPos + 8, { align: 'right' });
      }

      // Status - if visible
      const statusField = state.fields.find(f => f.visible && f.id === 'status');
      if (statusField) {
        const statusValue = statusField.editedValue ?? statusField.value;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Status: ${String(statusValue || '-')}`, pageWidth - margin, numberField ? yPos + 14 : yPos + 8, { align: 'right' });
      }

      // Date fields on right
      const visibleDateFields = state.fields.filter((f) => f.visible && f.category === 'dates');
      let dateYPos = yPos + (numberField ? 14 : 8) + (statusField ? 6 : 0);
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
      // Only filter out the primary entity number field, NOT reference fields like orderNumber on invoices
      const visibleOtherFields = state.fields.filter((f) => f.visible && (f.category === 'other' || (f.category === 'header' && f.id !== 'status' && f.id !== primaryNumberFieldId)));

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
          const value = String(field.editedValue ?? field.value ?? '-');
          const wrappedLines = doc.splitTextToSize(value, colWidth - 5);
          doc.text(wrappedLines, margin, fieldYPos + 4);
          fieldYPos += 4 + (wrappedLines.length * 4) + 2;
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
          const value = String(field.editedValue ?? field.value ?? '-');
          const wrappedLines = doc.splitTextToSize(value, colWidth - 5);
          doc.text(wrappedLines, margin + colWidth, fieldYPos + 4);
          fieldYPos += 4 + (wrappedLines.length * 4) + 2;
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
          const value = String(field.editedValue ?? field.value ?? '-');
          const wrappedLines = doc.splitTextToSize(value, colWidth - 5);
          doc.text(wrappedLines, margin + colWidth * 2, fieldYPos + 4);
          fieldYPos += 4 + (wrappedLines.length * 4) + 2;
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

      // Summary - check field visibility and calculate totals based on edited values
      const subtotalFieldPDF = state.fields.find((f) => f.id === 'subtotal' && f.visible);
      const totalFieldPDF = state.fields.find((f) => f.id === 'total' && f.visible);
      const discountFieldPDF = state.fields.find((f) => f.id === 'discount' && f.visible);

      // Only render summary section if at least one field is visible
      if (subtotalFieldPDF || totalFieldPDF || discountFieldPDF) {
        const calculatedSubtotal = visibleLineItems.reduce((sum, item) => {
          const qty = item.editedValues?.quantity ?? item.quantity;
          const price = item.editedValues?.unitPrice ?? item.unitPrice;
          return sum + (qty * price);
        }, 0);
        const discount = discountFieldPDF ? Number(discountFieldPDF.editedValue ?? discountFieldPDF.value ?? 0) : 0;

        // Use edited value if available, otherwise calculated
        const subtotalValue = subtotalFieldPDF?.editedValue !== undefined
          ? Number(subtotalFieldPDF.editedValue)
          : calculatedSubtotal;
        const totalValue = totalFieldPDF?.editedValue !== undefined
          ? Number(totalFieldPDF.editedValue)
          : calculatedSubtotal - discount;

        const summaryX = pageWidth - margin - 60;

        if (subtotalFieldPDF) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...lightGray);
          doc.text('Subtotal', summaryX, yPos);
          doc.setTextColor(...darkColor);
          doc.text(formatCurrency(subtotalValue), pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        }

        if (discountFieldPDF && discount > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...lightGray);
          doc.text('Discount', summaryX, yPos);
          doc.setTextColor(220, 38, 38); // Red
          doc.text(`-${formatCurrency(discount)}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        }

        if (totalFieldPDF) {
          yPos += 2;
          doc.setDrawColor(229, 231, 235);
          doc.line(summaryX, yPos - 2, pageWidth - margin, yPos - 2);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...darkColor);
          doc.text('Total', summaryX, yPos + 3);
          doc.setFontSize(12);
          doc.text(formatCurrency(totalValue), pageWidth - margin, yPos + 3, { align: 'right' });
          yPos += 10;
        }

        yPos += 5;
      }

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

      // Load FlowRMS logo for footer
      let flowLogoBase64: string | null = null;
      try {
        const flowLogoResult = await loadImageAsBase64('/flow-logo copy.png');
        flowLogoBase64 = flowLogoResult?.data ?? null;
      } catch {
        // Logo failed to load, continue without it
      }

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Page footer line
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

        // Generated date and page number
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          margin,
          pageHeight - 15
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });

        // Powered by FlowRMS - centered with proper alignment
        const footerY = pageHeight - 8;
        const logoSize = 5;
        const centerX = pageWidth / 2;

        // Calculate total width for centering: "Powered by" + gap + logo + gap + "FlowRMS"
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const poweredByWidth = doc.getTextWidth('Powered by');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const flowRMSWidth = doc.getTextWidth('FlowRMS');

        const gap = 2;
        const totalWidth = poweredByWidth + gap + (flowLogoBase64 ? logoSize + gap : 0) + flowRMSWidth;
        const startX = centerX - totalWidth / 2;

        // Draw "Powered by"
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text('Powered by', startX, footerY);

        let currentX = startX + poweredByWidth + gap;

        // Add FlowRMS logo if loaded
        if (flowLogoBase64) {
          try {
            doc.addImage(flowLogoBase64, 'PNG', currentX, footerY - logoSize + 1, logoSize, logoSize);
            currentX += logoSize + gap;
          } catch {
            // Skip logo if it fails
          }
        }

        // Draw "FlowRMS"
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('FlowRMS', currentX, footerY);
      }

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
                    centerLogo={state.centerLogo}
                    showCenterLogo={state.showCenterLogo}
                    onFieldToggle={handleFieldToggle}
                    onFieldEdit={handleFieldEdit}
                    onLineItemToggle={handleLineItemToggle}
                    onLineItemEdit={handleLineItemEdit}
                    onColumnToggle={handleColumnToggle}
                    onHeaderNoteChange={handleHeaderNoteChange}
                    onFooterNoteChange={handleFooterNoteChange}
                    onShowLogoToggle={handleShowLogoToggle}
                    onShowLineNumbersToggle={handleShowLineNumbersToggle}
                    onCenterLogoUpload={handleCenterLogoUpload}
                    onCenterLogoRemove={handleCenterLogoRemove}
                    onShowCenterLogoToggle={handleShowCenterLogoToggle}
                    centerLogoSize={state.centerLogoSize}
                    onCenterLogoSizeChange={handleCenterLogoSizeChange}
                    centerLogoPosition={state.centerLogoPosition}
                    onCenterLogoPositionChange={handleCenterLogoPositionChange}
                    isUploadingCenterLogo={isUploadingCenterLogo}
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
                    centerLogo={state.centerLogo}
                    showCenterLogo={state.showCenterLogo}
                    centerLogoSize={state.centerLogoSize}
                    centerLogoPosition={state.centerLogoPosition}
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
