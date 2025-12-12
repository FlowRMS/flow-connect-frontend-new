import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface QuotePdfData {
  quoteNumber: string;
  quoteName: string;
  version: number;
  stage: string;
  soldToCustomer: string;
  billToCustomer: string;
  jobName: string;
  quoteDate: string;
  expirationDate: string;
  revisedDate?: string;
  acceptDate?: string;
  paymentTerms: string;
  freightTerms: string;
  lineItems: {
    sectionName: string;
    productNumber: string;
    description: string;
    quantity: number;
    sellPrice: number;
    extendedPrice: number;
  }[];
  totals: {
    baseTotal: number;
    sellTotal: number;
    commission: number;
    overage: number;
  };
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export function generateQuotePdf(data: QuotePdfData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const textColor: [number, number, number] = [31, 41, 55]; // Dark gray
  const mutedColor: [number, number, number] = [107, 114, 128]; // Gray

  let yPosition = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company Name/Logo placeholder
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'FlowRMS', 15, 25);

  // Quote label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('QUOTATION', pageWidth - 15, 20, { align: 'right' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.quoteNumber, pageWidth - 15, 30, { align: 'right' });

  yPosition = 55;

  // Quote Info Section
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Left column - Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text('SOLD TO:', 15, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.soldToCustomer, 15, yPosition + 5);

  if (data.billToCustomer && data.billToCustomer !== data.soldToCustomer) {
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 15, yPosition + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(data.billToCustomer, 15, yPosition + 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('JOB:', 15, yPosition + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(data.jobName, 15, yPosition + 35);

  // Right column - Quote Details
  const rightColX = 120;
  doc.setFont('helvetica', 'bold');
  doc.text('Quote Name:', rightColX, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.quoteName, rightColX + 30, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Version:', rightColX, yPosition + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`v${data.version}`, rightColX + 30, yPosition + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Stage:', rightColX, yPosition + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.stage, rightColX + 30, yPosition + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Quote Date:', rightColX, yPosition + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.quoteDate), rightColX + 30, yPosition + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Expires:', rightColX, yPosition + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.expirationDate), rightColX + 30, yPosition + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment:', rightColX, yPosition + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(data.paymentTerms || 'Net 30', rightColX + 30, yPosition + 35);

  yPosition += 55;

  // Divider line
  doc.setDrawColor(...mutedColor);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);

  yPosition += 10;

  // Line Items Table
  const tableData = data.lineItems.map(item => [
    item.sectionName,
    item.productNumber,
    item.description.length > 40 ? item.description.substring(0, 40) + '...' : item.description,
    item.quantity.toString(),
    formatCurrency(item.sellPrice),
    formatCurrency(item.extendedPrice),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Section', 'Product #', 'Description', 'Qty', 'Unit Price', 'Extended']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 55 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (hookData) => {
      // Add page number
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.text(`Page ${hookData.pageNumber} of ${pageNumber}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    },
  });

  // Get final Y position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
  yPosition = finalY + 15;

  // Check if we need a new page for totals
  if (yPosition > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // Totals Section
  const totalsX = pageWidth - 80;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX - 10, yPosition - 5, 75, 50, 3, 3, 'F');

  doc.setTextColor(...textColor);
  doc.setFontSize(9);

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPosition + 5);
  doc.text(formatCurrency(data.totals.baseTotal), pageWidth - 20, yPosition + 5, { align: 'right' });

  // Divider
  doc.setDrawColor(...mutedColor);
  doc.line(totalsX, yPosition + 25, pageWidth - 20, yPosition + 25);

  // Grand Total
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', totalsX, yPosition + 35);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(data.totals.sellTotal), pageWidth - 20, yPosition + 35, { align: 'right' });

  yPosition += 65;

  // Terms & Conditions
  if (yPosition < doc.internal.pageSize.getHeight() - 40) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms & Conditions:', 15, yPosition);
    doc.text('1. This quote is valid until the expiration date shown above.', 15, yPosition + 7);
    doc.text('2. Prices are subject to change without notice after expiration.', 15, yPosition + 12);
    doc.text('3. Payment terms as stated above. Late payments may be subject to finance charges.', 15, yPosition + 17);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...mutedColor);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, footerY);
  if (data.companyEmail) {
    doc.text(data.companyEmail, pageWidth - 15, footerY, { align: 'right' });
  }

  // Save the PDF
  const filename = `Quote_${data.quoteNumber}_v${data.version}.pdf`;
  doc.save(filename);
}

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
