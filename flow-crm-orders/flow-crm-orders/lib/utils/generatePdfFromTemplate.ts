import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PdfTemplate, PdfModule, GlobalStyles } from '../types/pdf-templates';

// Data interfaces for PDF generation
export interface QuoteData {
  quoteNumber: string;
  quoteName: string;
  version: number;
  stage: string;
  soldToCustomer: string;
  billToCustomer: string;
  jobName: string;
  jobId?: string;
  quoteDate: string;
  expirationDate: string;
  revisedDate?: string;
  acceptDate?: string;
  paymentTerms: string;
  freightTerms: string;
  lineItems: LineItemData[];
  totals: TotalsData;
}

export interface LineItemData {
  sectionName: string;
  productNumber: string;
  description: string;
  quantity: number;
  sellPrice: number;
  extendedPrice: number;
  basePrice?: number;
}

export interface TotalsData {
  baseTotal: number;
  sellTotal: number;
  commission?: number;
  overage?: number;
  tax?: number;
  discount?: number;
  shipping?: number;
}

export interface CompanyData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

// Default company data (would come from settings in production)
const defaultCompanyData: CompanyData = {
  name: 'FlowRMS',
  address: '123 Business Ave',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  phone: '(555) 123-4567',
  email: 'sales@flowrms.com',
  website: 'www.flowrms.com',
};

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

// Module renderers
function renderCompanyHeader(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  pageWidth: number,
  company: CompanyData
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  const startY = yPos + (config.marginTop || 0);
  let currentY = startY;

  // Draw header background
  doc.setFillColor(...hexToRgb(globalStyles.primaryColor));
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company name
  if (config.showCompanyName) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize((config.companyNameSize as number) || 20);
    doc.setFont(globalStyles.fontFamily, 'bold');
    doc.text(company.name, globalStyles.pageMargins.left, 25);
  }

  currentY = 45 + (config.marginBottom || 0);
  return currentY;
}

function renderDocumentTitle(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  pageWidth: number,
  documentNumber: string
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  // Title is rendered in the header area
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(globalStyles.fontFamily, 'normal');
  doc.text((config.titleText as string) || 'DOCUMENT', pageWidth - globalStyles.pageMargins.right, 20, { align: 'right' });

  if (config.showDocumentNumber) {
    doc.setFontSize(16);
    doc.setFont(globalStyles.fontFamily, 'bold');
    doc.text(documentNumber, pageWidth - globalStyles.pageMargins.right, 30, { align: 'right' });
  }

  return yPos;
}

function renderCustomerInfo(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  data: QuoteData
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  let currentY = yPos + (config.marginTop || 0);
  const leftMargin = globalStyles.pageMargins.left;

  doc.setTextColor(...hexToRgb(globalStyles.secondaryColor));
  doc.setFontSize(globalStyles.bodyFontSize);

  if (config.showSoldTo) {
    doc.setFont(globalStyles.fontFamily, 'bold');
    doc.text('SOLD TO:', leftMargin, currentY);
    doc.setFont(globalStyles.fontFamily, 'normal');
    doc.text(data.soldToCustomer, leftMargin, currentY + 5);
    currentY += 15;
  }

  if (config.showBillTo && data.billToCustomer && data.billToCustomer !== data.soldToCustomer) {
    doc.setFont(globalStyles.fontFamily, 'bold');
    doc.text('BILL TO:', leftMargin, currentY);
    doc.setFont(globalStyles.fontFamily, 'normal');
    doc.text(data.billToCustomer, leftMargin, currentY + 5);
    currentY += 15;
  }

  return currentY + (config.marginBottom || 0);
}

function renderJobInfo(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  data: QuoteData
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  let currentY = yPos + (config.marginTop || 0);
  const leftMargin = globalStyles.pageMargins.left;

  doc.setTextColor(...hexToRgb(globalStyles.secondaryColor));
  doc.setFontSize(globalStyles.bodyFontSize);

  if (config.showJobName) {
    doc.setFont(globalStyles.fontFamily, 'bold');
    doc.text('JOB:', leftMargin, currentY);
    doc.setFont(globalStyles.fontFamily, 'normal');
    doc.text(data.jobName, leftMargin, currentY + 5);
    currentY += 15;
  }

  return currentY + (config.marginBottom || 0);
}

function renderDocumentDetails(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  pageWidth: number,
  data: QuoteData
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  const startY = yPos + (config.marginTop || 0);
  let currentY = startY;
  const rightColX = pageWidth - 80;

  doc.setTextColor(...hexToRgb(globalStyles.secondaryColor));
  doc.setFontSize(globalStyles.bodyFontSize);

  const fields = (config.fields as Array<{ visible: boolean; label: string; field: string }>) || [];
  const fieldMap: Record<string, string> = {
    quoteName: data.quoteName,
    version: `v${data.version}`,
    stage: data.stage,
    quoteDate: formatDate(data.quoteDate),
    expirationDate: formatDate(data.expirationDate),
    paymentTerms: data.paymentTerms || 'Net 30',
    freightTerms: data.freightTerms || '-',
  };

  fields.forEach((field: { visible: boolean; label: string; field: string }) => {
    if (field.visible && fieldMap[field.field]) {
      doc.setFont(globalStyles.fontFamily, 'bold');
      doc.text(`${field.label}:`, rightColX, currentY);
      doc.setFont(globalStyles.fontFamily, 'normal');
      doc.text(fieldMap[field.field], rightColX + 35, currentY);
      currentY += 7;
    }
  });

  return Math.max(startY + 40, currentY) + (config.marginBottom || 0);
}

function renderLineItemsTable(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  data: QuoteData
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  const startY = yPos + (config.marginTop || 0);

  // Build table columns and data from config
  type ColumnConfig = { visible: boolean; label: string; field: string; width?: number; alignment?: string; format?: string };
  const columns = (config.columns as ColumnConfig[]) || [];
  const visibleColumns = columns.filter((c) => c.visible);

  const head = [visibleColumns.map((c: { label: string }) => c.label)];
  const body = data.lineItems.map((item) => {
    return visibleColumns.map((col: { field: string; format?: string }) => {
      const value = item[col.field as keyof LineItemData];
      if (col.format === 'currency' && typeof value === 'number') {
        return formatCurrency(value);
      }
      if (typeof value === 'string' && value.length > 40) {
        return value.substring(0, 40) + '...';
      }
      return String(value ?? '-');
    });
  });

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'striped',
    headStyles: {
      fillColor: hexToRgb((config.headerBackgroundColor as string) || globalStyles.primaryColor),
      textColor: hexToRgb((config.headerTextColor as string) || '#FFFFFF'),
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: hexToRgb(globalStyles.secondaryColor),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columnStyles: visibleColumns.reduce((acc: Record<number, any>, col, index) => {
      acc[index] = {
        cellWidth: col.width ? (doc.internal.pageSize.getWidth() - 30) * (col.width / 100) : 'auto',
        halign: col.alignment || 'left',
      };
      return acc;
    }, {}),
    margin: { left: globalStyles.pageMargins.left, right: globalStyles.pageMargins.right },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || startY + 50;
  return finalY + (config.marginBottom || 0);
}

function renderPricingSummary(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  pageWidth: number,
  data: QuoteData
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  const startY = yPos + (config.marginTop || 0);
  let currentY = startY;
  const rightMargin = pageWidth - globalStyles.pageMargins.right;
  const labelX = rightMargin - 70;

  // Background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(labelX - 10, startY - 5, 80, 50, 3, 3, 'F');

  doc.setTextColor(...hexToRgb(globalStyles.secondaryColor));
  doc.setFontSize(9);

  if (config.showSubtotal) {
    doc.setFont(globalStyles.fontFamily, 'normal');
    doc.text('Subtotal:', labelX, currentY + 5);
    doc.text(formatCurrency(data.totals.baseTotal), rightMargin, currentY + 5, { align: 'right' });
    currentY += 10;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(labelX, currentY + 15, rightMargin, currentY + 15);

  // Total
  if (config.showTotal) {
    doc.setFontSize(11);
    doc.setFont(globalStyles.fontFamily, 'bold');
    doc.text('Total:', labelX, currentY + 25);
    doc.setTextColor(...hexToRgb(globalStyles.primaryColor));
    doc.text(formatCurrency(data.totals.sellTotal), rightMargin, currentY + 25, { align: 'right' });
  }

  return startY + 55 + (config.marginBottom || 0);
}

function renderTermsConditions(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  let currentY = yPos + (config.marginTop || 0);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize((config.fontSize as number) || 8);
  doc.setFont(globalStyles.fontFamily, 'normal');

  if (config.title) {
    doc.text((config.title as string) + ':', globalStyles.pageMargins.left, currentY);
    currentY += 7;
  }

  const lines = ((config.content as string) || '').split('\n');
  lines.forEach((line: string) => {
    doc.text(line, globalStyles.pageMargins.left, currentY);
    currentY += 5;
  });

  return currentY + (config.marginBottom || 0);
}

function renderDivider(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  yPos: number,
  pageWidth: number
): number {
  const config = module.config;
  if (!config.visible) return yPos;

  const currentY = yPos + (config.marginTop || 0);

  doc.setDrawColor(...hexToRgb((config.lineColor as string) || '#E5E7EB'));
  doc.setLineWidth((config.lineWidth as number) || 0.5);
  doc.line(
    globalStyles.pageMargins.left,
    currentY,
    pageWidth - globalStyles.pageMargins.right,
    currentY
  );

  return currentY + (config.marginBottom || 0);
}

function renderFooter(
  doc: jsPDF,
  module: PdfModule,
  globalStyles: GlobalStyles,
  pageWidth: number,
  pageHeight: number,
  company: CompanyData
): void {
  const config = module.config;
  if (!config.visible) return;

  const footerY = pageHeight - 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(globalStyles.pageMargins.left, footerY - 5, pageWidth - globalStyles.pageMargins.right, footerY - 5);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont(globalStyles.fontFamily, 'normal');

  if (config.showDate) {
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, globalStyles.pageMargins.left, footerY);
  }

  if (config.showPageNumbers) {
    const pageCount = doc.getNumberOfPages();
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`, pageWidth / 2, footerY, { align: 'center' });
  }

  if (company.email) {
    doc.text(company.email, pageWidth - globalStyles.pageMargins.right, footerY, { align: 'right' });
  }
}

// Main PDF generation function
export function generatePdfFromTemplate(
  template: PdfTemplate,
  data: QuoteData,
  company: CompanyData = defaultCompanyData
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const globalStyles = template.globalStyles;

  let yPosition = globalStyles.pageMargins.top;

  // Sort modules by position
  const sortedModules = [...template.modules].sort((a, b) => a.position - b.position);

  // Render each module
  for (const module of sortedModules) {
    switch (module.type) {
      case 'company-header':
        yPosition = renderCompanyHeader(doc, module, globalStyles, yPosition, pageWidth, company);
        break;
      case 'document-title':
        renderDocumentTitle(doc, module, globalStyles, yPosition, pageWidth, data.quoteNumber);
        break;
      case 'customer-info':
        yPosition = renderCustomerInfo(doc, module, globalStyles, yPosition, data);
        break;
      case 'job-info':
        yPosition = renderJobInfo(doc, module, globalStyles, yPosition, data);
        break;
      case 'document-details':
        yPosition = renderDocumentDetails(doc, module, globalStyles, yPosition, pageWidth, data);
        break;
      case 'line-items-table':
        yPosition = renderLineItemsTable(doc, module, globalStyles, yPosition, data);
        break;
      case 'pricing-summary':
      case 'totals-summary':
        yPosition = renderPricingSummary(doc, module, globalStyles, yPosition, pageWidth, data);
        break;
      case 'terms-conditions':
        yPosition = renderTermsConditions(doc, module, globalStyles, yPosition);
        break;
      case 'divider':
        yPosition = renderDivider(doc, module, globalStyles, yPosition, pageWidth);
        break;
      case 'footer':
        renderFooter(doc, module, globalStyles, pageWidth, pageHeight, company);
        break;
      case 'spacer':
        yPosition += (module.config.height as number) || 20;
        break;
      default:
        // Skip unknown module types
        break;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = globalStyles.pageMargins.top;
    }
  }

  return doc;
}

// Convenience function to generate and download PDF
export function downloadPdfFromTemplate(
  template: PdfTemplate,
  data: QuoteData,
  filename?: string,
  company?: CompanyData
): void {
  const doc = generatePdfFromTemplate(template, data, company);
  const defaultFilename = `${template.type}_${data.quoteNumber}_v${data.version}.pdf`;
  doc.save(filename || defaultFilename);
}

// Generate PDF as blob for preview
export function generatePdfBlobFromTemplate(
  template: PdfTemplate,
  data: QuoteData,
  company?: CompanyData
): Blob {
  const doc = generatePdfFromTemplate(template, data, company);
  return doc.output('blob');
}

// Generate PDF as data URL for preview
export function generatePdfDataUrlFromTemplate(
  template: PdfTemplate,
  data: QuoteData,
  company?: CompanyData
): string {
  const doc = generatePdfFromTemplate(template, data, company);
  return doc.output('dataurlstring');
}
