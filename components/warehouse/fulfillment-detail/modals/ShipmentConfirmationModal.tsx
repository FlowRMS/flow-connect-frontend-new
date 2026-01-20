'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FulfillmentOrder } from '../../api/fulfillmentApi';
import { FulfillmentDocument } from '../../api/fulfillmentApi';
import { useShippingCarriersByType } from '@/components/warehouse/settings/api/useShippingCarriersApi';

interface ShipmentConfirmationModalProps {
  isOpen: boolean;
  fulfillmentOrder: FulfillmentOrder;
  attachedDocuments: FulfillmentDocument[];
  carrierType: 'parcel' | 'freight';
  carrier: string;
  trackingNumbers: string;
  onClose: () => void;
  onSend: (emailData: {
    to: string;
    subject: string;
    body: string;
    attachedDocIds: string[];
  }) => void;
}

// Mock email templates
const emailTemplates = [
  {
    id: 'standard',
    name: 'Standard Shipment',
    subject: 'Your Order Has Shipped - {orderNumber}',
    body: `Dear {customerName},

Great news! Your order {orderNumber} has been shipped and is on its way.

{trackingInfo}

Shipping Address:
{shippingAddress}

Order Summary:
{orderItems}

Thank you for your business!

Best regards,
The Warehouse Team`,
  },
  {
    id: 'freight',
    name: 'Freight Shipment',
    subject: 'Freight Shipment Notification - {orderNumber}',
    body: `Dear {customerName},

Your order {orderNumber} has been shipped via freight carrier.

{trackingInfo}

IMPORTANT: This is a freight delivery. The carrier will contact you to schedule a delivery appointment. Please ensure someone is available to receive and sign for the shipment.

Shipping Address:
{shippingAddress}

Order Summary:
{orderItems}

If you have any questions, please don't hesitate to contact us.

Best regards,
The Warehouse Team`,
  },
  {
    id: 'will_call',
    name: 'Will Call / Pickup Ready',
    subject: 'Your Order is Ready for Pickup - {orderNumber}',
    body: `Dear {customerName},

Your order {orderNumber} is now ready for pickup at our warehouse.

Pickup Location:
{warehouseAddress}

Order Summary:
{orderItems}

Please bring a valid ID when picking up your order. Our warehouse hours are Monday-Friday, 8am-5pm.

Thank you for your business!

Best regards,
The Warehouse Team`,
  },
];

export default function ShipmentConfirmationModal({
  isOpen,
  fulfillmentOrder,
  attachedDocuments,
  carrierType,
  carrier,
  trackingNumbers,
  onClose,
  onSend,
}: ShipmentConfirmationModalProps) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: number }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch carriers to look up names
  const carrierTypeForQuery = carrierType === 'parcel' ? 'PARCEL' : 'FREIGHT';
  const { data: carriers = [] } = useShippingCarriersByType(carrierTypeForQuery, true);

  // Check if string is a UUID
  const isUUID = (str: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  // Format carrier name for display
  const formatCarrier = (carrierValue: string | undefined | null) => {
    if (!carrierValue) return 'N/A';
    // If it's a UUID, look up the carrier name
    if (isUUID(carrierValue)) {
      const foundCarrier = carriers.find(c => c.id === carrierValue);
      if (foundCarrier) {
        return foundCarrier.name + (foundCarrier.code ? ` (${foundCarrier.code})` : '');
      }
      return 'Carrier Selected';
    }
    return carrierValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get formatted carrier name
  const carrierDisplayName = formatCarrier(carrier);

  // Get BOL document if exists
  const bolDocument = attachedDocuments.find(d =>
    d.documentType === 'BILL_OF_LADING' || d.fileName?.toLowerCase().includes('bill of lading') || d.fileName?.toLowerCase().includes('bol')
  );

  // Variable definitions for this shipment
  const shipTo = fulfillmentOrder.shipTo;
  const variables: Record<string, string> = {
    orderNumber: fulfillmentOrder.order?.orderNumber || '-',
    customerName: shipTo?.name || fulfillmentOrder.customer?.companyName || 'N/A',
    trackingInfo: trackingNumbers
      ? `Tracking Number(s): ${trackingNumbers}\nCarrier: ${carrierDisplayName}`
      : 'Tracking information will be provided once available.',
    shippingAddress: shipTo ? [
      shipTo.addressLine1,
      shipTo.addressLine2,
      `${shipTo.city || ''}, ${shipTo.state || ''} ${shipTo.postalCode || ''}`.trim(),
    ].filter(Boolean).join('\n') : 'No shipping address provided',
    orderItems: fulfillmentOrder.lineItems.map(item =>
      `• ${item.product?.description || item.product?.factoryPartNumber || '-'} (${item.product?.factoryPartNumber || '-'}) x ${Math.round(Number(item.allocatedQty))}`
    ).join('\n'),
    warehouseAddress: 'Atlanta Distribution Center\n1234 Industrial Parkway\nAtlanta, GA 30301',
  };

  // Replace variables in text
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return result;
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setToEmail(fulfillmentOrder.shipTo?.contactEmail || '');

      // Select appropriate default template
      const defaultTemplate = carrierType === 'freight' ? 'freight' : 'standard';
      const template = emailTemplates.find(t => t.id === defaultTemplate);

      if (template) {
        setSelectedTemplate(defaultTemplate);
        setSubject(replaceVariables(template.subject));
        setBody(replaceVariables(template.body));
      }

      // Pre-select BOL document if available
      if (bolDocument) {
        setSelectedDocIds([bolDocument.id]);
      } else {
        setSelectedDocIds([]);
      }

      setUploadedFiles([]);
      setViewMode('edit');
    }
  }, [isOpen, fulfillmentOrder, carrier, trackingNumbers, bolDocument, carrierType]);

  const handleSelectTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(replaceVariables(template.subject));
      setBody(replaceVariables(template.body));
    }
    setShowTemplateDropdown(false);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const deliveryEstimate = carrierType === 'freight' ? '3-5 business days' : '2-3 business days';

    setBody(
`Dear ${fulfillmentOrder.shipTo?.name || fulfillmentOrder.customer?.companyName || 'Valued Customer'},

Great news! Your order ${fulfillmentOrder.order?.orderNumber || '-'} has been shipped via ${carrierDisplayName} and is currently en route to your location.

${trackingNumbers ? `You can track your shipment using the following information:
Tracking Number(s): ${trackingNumbers}
Carrier: ${carrierDisplayName}
Estimated Delivery: ${deliveryEstimate}` : `Estimated Delivery: ${deliveryEstimate}`}

Delivery Address:
${fulfillmentOrder.shipTo?.addressLine1 || 'N/A'}${fulfillmentOrder.shipTo?.addressLine2 ? `\n${fulfillmentOrder.shipTo.addressLine2}` : ''}
${fulfillmentOrder.shipTo?.city || ''}, ${fulfillmentOrder.shipTo?.state || ''} ${fulfillmentOrder.shipTo?.postalCode || ''}

Items Shipped:
${fulfillmentOrder.lineItems.map(item =>
  `• ${item.product?.description || item.product?.factoryPartNumber || '-'} (Part #${item.product?.factoryPartNumber || '-'}) - Qty: ${Math.round(Number(item.allocatedQty))}`
).join('\n')}

${carrierType === 'freight' ? `Please note: This is a freight shipment. You will be contacted by the carrier to schedule a delivery appointment. Please ensure someone is available to receive and sign for the delivery.\n` : ''}${bolDocument ? '\nWe have attached the Bill of Lading for your records.' : ''}

Thank you for choosing us for your needs. We truly appreciate your business and look forward to serving you again!

If you have any questions or concerns about your shipment, please reply to this email or contact our customer service team.

Warm regards,
The Warehouse Team`
    );
    setSelectedTemplate(null);
    setIsGenerating(false);
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Simple text formatting (would integrate with actual rich text editor)
  const insertFormatting = (type: 'bold' | 'italic' | 'underline' | 'link' | 'list') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        newText = `_${selectedText}_`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'underline':
        newText = `__${selectedText}__`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? newText.length - 1 : 1;
        break;
      case 'list':
        newText = `\n• ${selectedText}`;
        cursorOffset = selectedText ? 0 : 2;
        break;
    }

    const newBody = body.substring(0, start) + newText + body.substring(end);
    setBody(newBody);

    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      const newPos = start + newText.length - cursorOffset;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSend = () => {
    onSend({
      to: toEmail,
      subject,
      body,
      attachedDocIds: [...selectedDocIds, ...uploadedFiles.map(f => f.id)],
    });
  };

  if (!isOpen) return null;

  const totalAttachments = selectedDocIds.length + uploadedFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Send Shipment Confirmation</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Order {fulfillmentOrder.order?.orderNumber || '-'} - {fulfillmentOrder.shipTo?.name || fulfillmentOrder.customer?.companyName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full">
            {/* Left - Email Compose */}
            <div className="flex-1 p-6 border-r border-[var(--border)] overflow-y-auto">
              {/* To */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">To</label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>

              {/* Template & AI Buttons */}
              <div className="flex items-center gap-2 mb-4">
                {/* Template Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                    {selectedTemplate ? emailTemplates.find(t => t.id === selectedTemplate)?.name : 'Load Template'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {showTemplateDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTemplateDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                        {emailTemplates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template.id)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2 ${
                              selectedTemplate === template.id ? 'bg-green-50 text-green-700' : ''
                            }`}
                          >
                            {selectedTemplate === template.id && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            )}
                            <span className={selectedTemplate === template.id ? '' : 'ml-5'}>{template.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Template
                </button>

                <div className="flex-1" />

                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  )}
                  Write with AI
                </button>
              </div>

              {/* Message Editor */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[var(--foreground)]">Message</label>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-0.5 bg-[var(--muted)] rounded-lg">
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'edit'
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Toolbar - only show in edit mode */}
                {viewMode === 'edit' && (
                  <div className="flex items-center gap-1 p-2 border border-[var(--border)] border-b-0 rounded-t-lg bg-[var(--muted)]">
                    <button
                      onClick={() => insertFormatting('bold')}
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      title="Bold"
                    >
                      <span className="font-bold text-sm">B</span>
                    </button>
                    <button
                      onClick={() => insertFormatting('italic')}
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      title="Italic"
                    >
                      <span className="italic text-sm">I</span>
                    </button>
                    <button
                      onClick={() => insertFormatting('underline')}
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      title="Underline"
                    >
                      <span className="underline text-sm">U</span>
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-1" />
                    <button
                      onClick={() => insertFormatting('link')}
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      title="Insert Link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-1" />
                    <button
                      onClick={() => insertFormatting('list')}
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      title="Bullet List"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}

                {/* Textarea or Preview */}
                {viewMode === 'edit' ? (
                  <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setSelectedTemplate(null);
                    }}
                    rows={14}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-b-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none font-mono text-sm"
                    placeholder="Write your message..."
                  />
                ) : (
                  <div className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] min-h-[350px] text-sm whitespace-pre-wrap">
                    {body}
                  </div>
                )}
              </div>
            </div>

            {/* Right - Attachments & Info */}
            <div className="w-80 p-6 overflow-y-auto bg-[var(--muted)]/10">
              {/* Shipment Summary */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Shipment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Carrier:</span>
                    <span className="font-medium">{carrierDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Type:</span>
                    <span className="font-medium capitalize">{carrierType}</span>
                  </div>
                  {trackingNumbers && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Tracking:</span>
                      <span className="font-medium text-xs truncate max-w-[120px]" title={trackingNumbers}>
                        {trackingNumbers}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Items:</span>
                    <span className="font-medium">{fulfillmentOrder.lineItems.length} line items</span>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                    Attachments
                  </h3>
                  <span className="text-xs text-[var(--muted-foreground)]">{totalAttachments} selected</span>
                </div>

                {/* Order Documents */}
                {attachedDocuments.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[var(--muted-foreground)] mb-2">Order Documents</p>
                    <div className="space-y-1.5">
                      {attachedDocuments.map(doc => (
                        <label
                          key={doc.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedDocIds.includes(doc.id)
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-[var(--muted)]/50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={() => toggleDocument(doc.id)}
                            className="w-4 h-4 rounded border-[var(--border)] text-green-600 focus:ring-green-500"
                          />
                          <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                            doc.documentType === 'BILL_OF_LADING' ? 'bg-amber-100 text-amber-600' :
                            doc.documentType === 'PACKING_SLIP' ? 'bg-blue-100 text-blue-600' :
                            doc.documentType === 'SHIPPING_LABEL' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                              <path d="M14 2v6h6"/>
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[var(--foreground)] truncate">{doc.fileName}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{doc.documentType.replace('_', ' ')}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[var(--muted-foreground)] mb-2">Uploaded Files</p>
                    <div className="space-y-1.5">
                      {uploadedFiles.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200"
                        >
                          <div className="w-7 h-7 rounded bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                              <path d="M14 2v6h6"/>
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[var(--foreground)] truncate">{file.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => removeUploadedFile(file.id)}
                            className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 text-sm text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-lg hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload File
                </button>

                {/* BOL suggestion for freight */}
                {carrierType === 'freight' && !bolDocument && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700">
                      <strong>Tip:</strong> Consider attaching a Bill of Lading for freight shipments.
                    </p>
                  </div>
                )}
              </div>

              {/* Ship To Info */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Ship To</h3>
                <div className="text-sm text-[var(--muted-foreground)]">
                  <p className="font-medium text-[var(--foreground)]">{fulfillmentOrder.shipTo?.name || fulfillmentOrder.customer?.companyName || 'N/A'}</p>
                  <p>{fulfillmentOrder.shipTo?.addressLine1 || 'N/A'}</p>
                  {fulfillmentOrder.shipTo?.addressLine2 && <p>{fulfillmentOrder.shipTo.addressLine2}</p>}
                  <p>{fulfillmentOrder.shipTo?.city || ''}, {fulfillmentOrder.shipTo?.state || ''} {fulfillmentOrder.shipTo?.postalCode || ''}</p>
                  {fulfillmentOrder.shipTo?.contactPhone && (
                    <p className="mt-1">{fulfillmentOrder.shipTo.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            {totalAttachments > 0 && (
              <span>{totalAttachments} attachment{totalAttachments !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!toEmail || !subject}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              Send Confirmation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
