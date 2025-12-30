'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getWarehouseFactories,
  mockInventory,
  mockWarehouses,
  getManufacturerContacts,
  getDefaultContact,
  setDefaultContact,
  addShipmentRequest,
  saveDraftShipmentRequest,
  getAllFulfillmentOrders,
  getShipmentRequestsForManufacturer,
} from '@/lib/data/warehouse-mock';
import {
  ManufacturerContact,
  ShipmentRequestMethod,
  ShipmentRequest,
  ShipmentRequestStatus,
  shipmentRequestMethodLabels,
  shipmentRequestStatusLabels,
  Inventory,
} from '@/lib/types/warehouse';

// Email templates for shipment requests
const emailTemplates = [
  {
    id: 'standard',
    name: 'Standard Request',
    description: 'Professional inventory request with product details',
    subject: 'Inventory Request - {warehouse} - {date}',
    body: `Hi {contactFirstName},

I hope this message finds you well. I'm writing to request the following inventory items for {warehouse}:

{productList}

Total: {totalUnits} units

Requested Delivery Date: {deliveryDate}

{contextNote}{urgencyNote}Please confirm availability and let me know if you have any questions about this order.

Thank you for your continued partnership.

Best regards`,
  },
  {
    id: 'urgent',
    name: 'Urgent Restock',
    description: 'For critical inventory needs requiring immediate attention',
    subject: 'URGENT: Inventory Request - {warehouse} - Immediate Attention Required',
    body: `Hi {contactFirstName},

This is an urgent request requiring your immediate attention. We have critical inventory needs for {warehouse}:

{productList}

Total: {totalUnits} units

Requested Delivery Date: {deliveryDate}

{contextNote}This order is time-sensitive and we would greatly appreciate expedited processing. Please confirm receipt of this request and provide an estimated fulfillment date as soon as possible.

Thank you for your prompt attention to this matter.

Best regards`,
  },
  {
    id: 'backorder',
    name: 'Backorder Resolution',
    description: 'For restocking items that are on customer backorder',
    subject: 'Priority Restock Request - Customer Backorders Pending - {warehouse}',
    body: `Hi {contactFirstName},

We have pending customer orders that are awaiting inventory fulfillment. I'm reaching out to request an expedited restock of the following items for {warehouse}:

{productList}

Total: {totalUnits} units

Requested Delivery Date: {deliveryDate}

These items are needed to fulfill customer backorders, and any delay impacts our customer satisfaction. {urgencyNote}Please let us know the earliest possible ship date and any partial shipment options if full quantities are not immediately available.

Thank you for prioritizing this request.

Best regards`,
  },
  {
    id: 'routine',
    name: 'Routine Restock',
    description: 'Regular inventory replenishment',
    subject: 'Routine Inventory Restock - {warehouse}',
    body: `Hi {contactFirstName},

This is a routine inventory replenishment request for {warehouse}:

{productList}

Total: {totalUnits} units

Requested Delivery Date: {deliveryDate}

Please process this order at your convenience and confirm the expected delivery date.

Thank you.

Best regards`,
  },
];

interface RequestLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  requestedQuantity: number;
  currentStock: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

interface AlertItem {
  type: 'backorder' | 'low_stock';
  productId: string;
  productName: string;
  partNumber: string;
  currentStock: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  backorderQty?: number;
  orderNumber?: string;
  customerName?: string;
}

export default function ShipmentRequestBuilder() {
  const router = useRouter();
  const factories = useMemo(() => getWarehouseFactories(), []);

  // Form state
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(mockWarehouses[0]?.id || '');
  const [requestedDate, setRequestedDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'standard' | 'expedited' | 'urgent'>('standard');
  const [requestMethod, setRequestMethod] = useState<ShipmentRequestMethod>('EMAIL');
  const [lineItems, setLineItems] = useState<RequestLineItem[]>([]);

  // Email composer state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Email-specific state
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contacts, setContacts] = useState<ManufacturerContact[]>([]);

  // Call/System confirmation state
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationNotes, setConfirmationNotes] = useState('');

  // Product search state
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'none' | 'backorders' | 'low_stock'>('none');

  // Alert state
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const selectedVendor = factories.find(f => f.id === selectedVendorId);
  const selectedWarehouse = mockWarehouses.find(w => w.id === selectedWarehouseId);
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Load contacts when vendor changes
  useEffect(() => {
    if (selectedVendorId) {
      const vendorContacts = getManufacturerContacts(selectedVendorId);
      setContacts(vendorContacts);

      const defaultContact = getDefaultContact(selectedVendorId);
      if (defaultContact) {
        setSelectedContactId(defaultContact.id);
      } else if (vendorContacts.length > 0) {
        setSelectedContactId(vendorContacts[0].id);
      } else {
        setSelectedContactId('');
      }
    } else {
      setContacts([]);
      setSelectedContactId('');
    }
  }, [selectedVendorId]);

  // Get products available from selected vendor
  const vendorProducts = useMemo(() => {
    if (!selectedVendorId) return [];
    return mockInventory.filter(inv => inv.factoryId === selectedVendorId);
  }, [selectedVendorId]);

  // Get recent shipment requests for selected manufacturer
  const recentRequests = useMemo(() => {
    if (!selectedVendorId) return [];
    return getShipmentRequestsForManufacturer(selectedVendorId).slice(0, 5);
  }, [selectedVendorId]);

  // Calculate alerts for selected vendor
  const alerts = useMemo(() => {
    if (!selectedVendorId) return [];

    const alertItems: AlertItem[] = [];
    const fulfillmentOrders = getAllFulfillmentOrders();

    // Get backorders for this vendor
    fulfillmentOrders.forEach(fo => {
      fo.lineItems.forEach(item => {
        if (item.backorderQty > 0) {
          const inv = mockInventory.find(i => i.productId === item.productId);
          if (inv && inv.factoryId === selectedVendorId) {
            const alertId = `backorder-${fo.orderNumber}-${item.productId}`;
            if (!dismissedAlerts.has(alertId)) {
              alertItems.push({
                type: 'backorder',
                productId: item.productId,
                productName: item.productName,
                partNumber: item.partNumber,
                currentStock: inv.availableQuantity,
                reorderPoint: inv.reorderPoint,
                reorderQuantity: inv.reorderQuantity,
                backorderQty: item.backorderQty,
                orderNumber: fo.orderNumber,
                customerName: fo.customerName,
              });
            }
          }
        }
      });
    });

    // Get low stock items for this vendor
    vendorProducts.forEach(inv => {
      if (inv.availableQuantity <= (inv.reorderPoint || 0)) {
        const alertId = `low_stock-${inv.productId}`;
        if (!dismissedAlerts.has(alertId)) {
          // Check if not already in backorder alerts
          const existingBackorder = alertItems.find(
            a => a.type === 'backorder' && a.productId === inv.productId
          );
          if (!existingBackorder) {
            alertItems.push({
              type: 'low_stock',
              productId: inv.productId,
              productName: inv.productName,
              partNumber: inv.partNumber,
              currentStock: inv.availableQuantity,
              reorderPoint: inv.reorderPoint,
              reorderQuantity: inv.reorderQuantity,
            });
          }
        }
      }
    });

    return alertItems;
  }, [selectedVendorId, vendorProducts, dismissedAlerts]);

  // Get products with backorders
  const backorderProducts = useMemo(() => {
    return vendorProducts.filter(p =>
      alerts.some(a => a.type === 'backorder' && a.productId === p.productId)
    );
  }, [vendorProducts, alerts]);

  // Get low stock products (not including backorders)
  const lowStockProducts = useMemo(() => {
    return vendorProducts.filter(p =>
      p.availableQuantity <= (p.reorderPoint || 0) &&
      !alerts.some(a => a.type === 'backorder' && a.productId === p.productId)
    );
  }, [vendorProducts, alerts]);

  // Filter products based on search and quick filter
  const filteredProducts = useMemo(() => {
    let products = vendorProducts;

    // Apply quick filter
    if (quickFilter === 'backorders') {
      products = backorderProducts;
    } else if (quickFilter === 'low_stock') {
      products = lowStockProducts;
    }

    // Apply search
    if (productSearch.trim()) {
      const search = productSearch.toLowerCase();
      products = products.filter(p =>
        p.productName.toLowerCase().includes(search) ||
        p.partNumber.toLowerCase().includes(search)
      );
    }

    return products;
  }, [vendorProducts, productSearch, quickFilter, backorderProducts, lowStockProducts]);

  const handleAddProduct = (product: Inventory) => {
    if (lineItems.some(item => item.productId === product.productId)) {
      return;
    }
    // Use reorderQuantity if set, otherwise calculate suggested qty
    const suggestedQty = product.reorderQuantity ||
      Math.max(1, (product.reorderPoint || 50) - product.availableQuantity);
    setLineItems(prev => [...prev, {
      id: `line-${Date.now()}`,
      productId: product.productId,
      productName: product.productName,
      partNumber: product.partNumber,
      requestedQuantity: suggestedQty > 0 ? suggestedQty : 10,
      currentStock: product.availableQuantity,
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
    }]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleAddFromAlert = (alert: AlertItem) => {
    if (lineItems.some(item => item.productId === alert.productId)) {
      return;
    }
    const suggestedQty = alert.reorderQuantity ||
      (alert.backorderQty ? alert.backorderQty + 10 : Math.max(1, (alert.reorderPoint || 50) - alert.currentStock));
    setLineItems(prev => [...prev, {
      id: `line-${Date.now()}`,
      productId: alert.productId,
      productName: alert.productName,
      partNumber: alert.partNumber,
      requestedQuantity: suggestedQty > 0 ? suggestedQty : 10,
      currentStock: alert.currentStock,
      reorderPoint: alert.reorderPoint,
      reorderQuantity: alert.reorderQuantity,
    }]);
  };

  const handleAddAllAlerts = () => {
    alerts.forEach(alert => {
      if (!lineItems.some(item => item.productId === alert.productId)) {
        const suggestedQty = alert.reorderQuantity ||
          (alert.backorderQty ? alert.backorderQty + 10 : Math.max(1, (alert.reorderPoint || 50) - alert.currentStock));
        setLineItems(prev => [...prev, {
          id: `line-${Date.now()}-${alert.productId}`,
          productId: alert.productId,
          productName: alert.productName,
          partNumber: alert.partNumber,
          requestedQuantity: suggestedQty > 0 ? suggestedQty : 10,
          currentStock: alert.currentStock,
          reorderPoint: alert.reorderPoint,
          reorderQuantity: alert.reorderQuantity,
        }]);
      }
    });
  };

  const handleDismissAlert = (alert: AlertItem) => {
    const alertId = alert.type === 'backorder'
      ? `backorder-${alert.orderNumber}-${alert.productId}`
      : `low_stock-${alert.productId}`;
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const handleRemoveProduct = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, requestedQuantity: Math.max(1, quantity) } : item
    ));
  };

  const handleSetDefaultContact = (contactId: string) => {
    if (selectedVendorId) {
      setDefaultContact(selectedVendorId, contactId);
      setContacts([...getManufacturerContacts(selectedVendorId)]);
    }
  };

  // Helper function to replace template variables
  const replaceTemplateVariables = useCallback((template: string) => {
    const contactFirstName = selectedContact?.name.split(' ')[0] || 'there';
    const productList = lineItems.map(item =>
      `• ${item.productName} (${item.partNumber}) - ${item.requestedQuantity} units`
    ).join('\n');

    const hasBackorders = lineItems.some(item =>
      alerts.some(a => a.type === 'backorder' && a.productId === item.productId)
    );
    const hasLowStock = lineItems.some(item =>
      item.currentStock <= (item.reorderPoint || 0)
    );

    let urgencyNote = '';
    if (priority === 'urgent') {
      urgencyNote = 'This is an urgent request and we would appreciate expedited processing.\n\n';
    } else if (priority === 'expedited') {
      urgencyNote = 'We would appreciate expedited processing if possible.\n\n';
    }

    let contextNote = '';
    if (hasBackorders && hasLowStock) {
      contextNote = 'We have several items on backorder and low inventory levels, making this restock critical for our operations.\n\n';
    } else if (hasBackorders) {
      contextNote = 'Some of these items are needed to fulfill pending customer orders that are currently on backorder.\n\n';
    } else if (hasLowStock) {
      contextNote = 'Our inventory levels for these items are running low and we need to restock before reaching stockout.\n\n';
    }

    return template
      .replace(/\{contactFirstName\}/g, contactFirstName)
      .replace(/\{warehouse\}/g, selectedWarehouse?.name || 'Warehouse')
      .replace(/\{date\}/g, new Date(requestedDate).toLocaleDateString())
      .replace(/\{deliveryDate\}/g, new Date(requestedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/\{productList\}/g, productList)
      .replace(/\{totalUnits\}/g, String(lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0)))
      .replace(/\{contextNote\}/g, contextNote)
      .replace(/\{urgencyNote\}/g, urgencyNote);
  }, [selectedContact, selectedWarehouse, lineItems, alerts, priority, requestedDate]);

  // Generate email content from template
  const handleGenerateEmail = async (templateId?: string) => {
    if (!selectedVendor || !selectedContact || lineItems.length === 0) return;

    setIsGeneratingEmail(true);

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const template = emailTemplates.find(t => t.id === (templateId || selectedTemplateId)) || emailTemplates[0];

    const generatedSubject = replaceTemplateVariables(template.subject);
    const generatedBody = replaceTemplateVariables(template.body);

    setEmailSubject(generatedSubject);
    setEmailBody(generatedBody);
    setIsGeneratingEmail(false);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (selectedContact && lineItems.length > 0) {
      handleGenerateEmail(templateId);
    }
  };

  // Send email function
  const handleSendEmail = async () => {
    if (!canSubmit() || !emailSubject || !emailBody) return;

    setIsSendingEmail(true);

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create the shipment request with SENT status
    const newRequest = addShipmentRequest({
      vendorId: selectedVendorId,
      vendorName: selectedVendor?.name || '',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      requestMethod: 'EMAIL',
      status: 'SENT',
      priority,
      requestedDeliveryDate: new Date(requestedDate).toISOString(),
      items: lineItems,
      totalQuantity: lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0),
      contactId: selectedContact?.id,
      contactName: selectedContact?.name,
      contactEmail: selectedContact?.email,
      emailSentAt: new Date().toISOString(),
      notes: emailBody,
      createdBy: 'Current User',
    });

    setIsSendingEmail(false);
    setEmailSent(true);
    setShowPreviewModal(false);

    // Redirect after a short delay to show success
    setTimeout(() => {
      router.push('/warehouse/inventory?tab=requests');
    }, 1500);
  };

  const canSubmit = () => {
    if (!selectedVendorId || !selectedWarehouseId || lineItems.length === 0) return false;
    if (requestMethod === 'EMAIL' && !selectedContactId) return false;
    if ((requestMethod === 'CALL' || requestMethod === 'MANUFACTURER_SYSTEM') && !isConfirmed) return false;
    return true;
  };

  const canSaveDraft = () => {
    return selectedVendorId && selectedWarehouseId;
  };

  const handleSaveDraft = () => {
    if (!canSaveDraft()) return;

    const draftRequest = saveDraftShipmentRequest({
      vendorId: selectedVendorId,
      vendorName: selectedVendor?.name || '',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      requestMethod,
      priority,
      requestedDeliveryDate: new Date(requestedDate).toISOString(),
      items: lineItems,
      totalQuantity: lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0),
      notes: requestMethod === 'EMAIL' ? emailBody || undefined : confirmationNotes || undefined,
      createdBy: 'Current User',
    });

    router.push('/warehouse/inventory?tab=requests');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    const newRequest = addShipmentRequest({
      vendorId: selectedVendorId,
      vendorName: selectedVendor?.name || '',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      requestMethod,
      status: 'SENT',
      priority,
      requestedDeliveryDate: new Date(requestedDate).toISOString(),
      items: lineItems,
      totalQuantity: lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0),

      // Email fields
      ...(requestMethod === 'EMAIL' && selectedContact ? {
        contactId: selectedContact.id,
        contactName: selectedContact.name,
        contactEmail: selectedContact.email,
        emailSentAt: new Date().toISOString(),
      } : {}),

      // Call/System confirmation fields
      ...((requestMethod === 'CALL' || requestMethod === 'MANUFACTURER_SYSTEM') ? {
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'Current User',
        confirmationNotes: confirmationNotes || undefined,
      } : {}),

      // Email content
      ...(requestMethod === 'EMAIL' ? {
        emailSubject: emailSubject || undefined,
        emailBody: emailBody || undefined,
      } : {}),

      notes: requestMethod === 'EMAIL' ? emailBody || undefined : confirmationNotes || undefined,
      createdBy: 'Current User',
    });

    router.push('/warehouse/inventory?tab=requests');
  };

  const totalItems = lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0);
  const backorderAlerts = alerts.filter(a => a.type === 'backorder');
  const lowStockAlerts = alerts.filter(a => a.type === 'low_stock');

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/warehouse/inventory"
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">New Inventory Request</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Request inventory from a vendor/manufacturer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={!canSaveDraft()}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestMethod === 'EMAIL' ? 'Send Request' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
              {/* Vendor and Warehouse Selection */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Request Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Vendor/Manufacturer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => {
                        setSelectedVendorId(e.target.value);
                        setLineItems([]);
                        setProductSearch('');
                        setDismissedAlerts(new Set());
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      required
                    >
                      <option value="">Select vendor</option>
                      {factories.map((factory) => (
                        <option key={factory.id} value={factory.id}>
                          {factory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Destination Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      required
                    >
                      {mockWarehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Requested Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'standard' | 'expedited' | 'urgent')}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      <option value="standard">Standard</option>
                      <option value="expedited">Expedited</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-[var(--foreground)]">Products to Request</h2>
                  {selectedVendorId && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {vendorProducts.length} products available
                    </span>
                  )}
                </div>

                {selectedVendorId ? (
                  <>
                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 mb-4">
                      {backorderProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (quickFilter === 'backorders') {
                              setQuickFilter('none');
                              setShowProductDropdown(false);
                            } else {
                              setQuickFilter('backorders');
                              setShowProductDropdown(true);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                            quickFilter === 'backorders'
                              ? 'bg-red-100 border-red-300 text-red-700'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Backorders ({backorderProducts.length})
                        </button>
                      )}
                      {lowStockProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (quickFilter === 'low_stock') {
                              setQuickFilter('none');
                              setShowProductDropdown(false);
                            } else {
                              setQuickFilter('low_stock');
                              setShowProductDropdown(true);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                            quickFilter === 'low_stock'
                              ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                              : 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Low Inventory ({lowStockProducts.length})
                        </button>
                      )}
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input
                          type="text"
                          placeholder="Search products by name or part number..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          onBlur={(e) => {
                            // Delay hiding to allow click events on dropdown items
                            setTimeout(() => {
                              if (!e.relatedTarget?.closest('.product-dropdown')) {
                                setShowProductDropdown(false);
                                if (quickFilter !== 'none') {
                                  setQuickFilter('none');
                                }
                              }
                            }, 200);
                          }}
                          className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>

                      {/* Product Dropdown - Shows when search focused or quick filter active */}
                      {showProductDropdown && (
                        <div className="product-dropdown absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-80 overflow-y-auto">
                          {/* Header showing filter context */}
                          {quickFilter !== 'none' && (
                            <div className={`px-4 py-2 border-b border-[var(--border)] text-xs font-medium uppercase tracking-wider ${
                              quickFilter === 'backorders' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {quickFilter === 'backorders' ? 'Products with Backorders' : 'Low Inventory Products'}
                            </div>
                          )}
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                              const isAdded = lineItems.some(item => item.productId === product.productId);
                              const isLowStock = product.availableQuantity <= (product.reorderPoint || 0);
                              const isOutOfStock = product.availableQuantity === 0;
                              const hasBackorder = backorderAlerts.some(a => a.productId === product.productId);
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleAddProduct(product)}
                                  disabled={isAdded}
                                  className={`w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-b-0 ${
                                    isAdded ? 'opacity-50 cursor-not-allowed bg-[var(--muted)]/30' : ''
                                  }`}
                                >
                                  {/* Status Indicator */}
                                  <div className="flex-shrink-0">
                                    {isOutOfStock ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" title="Out of stock" />
                                    ) : isLowStock ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" title="Low stock" />
                                    ) : (
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" title="In stock" />
                                    )}
                                  </div>

                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-[var(--foreground)] truncate">{product.productName}</span>
                                      {hasBackorder && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded">BACKORDER</span>
                                      )}
                                      {isLowStock && !hasBackorder && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700 rounded">LOW</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{product.partNumber}</div>
                                  </div>

                                  {/* Stock Info */}
                                  <div className="flex-shrink-0 text-right min-w-[80px]">
                                    <div className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-[var(--foreground)]'}`}>
                                      {product.availableQuantity} {isOutOfStock && product.inTransitQuantity > 0 && (
                                        <span className="text-xs text-blue-600">({product.inTransitQuantity} incoming)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-[var(--muted-foreground)]">
                                      {product.reorderPoint && `Reorder: ${product.reorderPoint}`}
                                    </div>
                                  </div>

                                  {/* Action */}
                                  <div className="flex-shrink-0 w-16 text-right">
                                    {isAdded ? (
                                      <span className="text-xs text-green-600 font-medium">Added</span>
                                    ) : (
                                      <span className="text-xs text-[var(--primary)] font-medium">+ Add</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : productSearch ? (
                            <div className="p-4 text-center text-[var(--muted-foreground)]">
                              No products found matching "{productSearch}"
                            </div>
                          ) : (
                            <div className="p-4 text-center text-[var(--muted-foreground)]">
                              Type to search for products
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Products List */}
                    {lineItems.length > 0 && (
                      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                            Products in Request ({lineItems.length})
                          </span>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Current Stock</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Request Qty</th>
                              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {lineItems.map((item) => {
                              const isLowStock = item.currentStock <= (item.reorderPoint || 0);
                              const isOutOfStock = item.currentStock === 0;
                              const hasBackorder = backorderAlerts.some(a => a.productId === item.productId);
                              return (
                                <tr key={item.id} className={isLowStock || hasBackorder ? 'bg-orange-50/30' : ''}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-[var(--foreground)]">{item.productName}</span>
                                      {hasBackorder && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded">BACKORDER</span>
                                      )}
                                      {isLowStock && !hasBackorder && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700 rounded">LOW</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{item.partNumber}</div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-[var(--foreground)]'}`}>
                                      {item.currentStock}
                                    </span>
                                    {item.reorderPoint && (
                                      <div className="text-xs text-[var(--muted-foreground)]">
                                        Reorder: {item.reorderPoint}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(item.id, item.requestedQuantity - 10)}
                                        className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.requestedQuantity}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                        className="w-20 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(item.id, item.requestedQuantity + 10)}
                                        className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="12" y1="5" x2="12" y2="19"/>
                                          <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                      </button>
                                    </div>
                                    {item.reorderQuantity && (
                                      <div className="text-xs text-center text-[var(--muted-foreground)] mt-1">
                                        Default: {item.reorderQuantity}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProduct(item.id)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="px-4 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)]">
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">
                              {lineItems.length} product{lineItems.length !== 1 ? 's' : ''}
                            </span>
                            <span className="font-medium text-[var(--foreground)]">
                              Total: {totalItems} units
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
                    <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="font-medium text-[var(--foreground)]">Select a vendor to view products</p>
                    <p className="text-sm mt-1">Choose a manufacturer above to see available products and inventory levels</p>
                  </div>
                )}
              </div>

              {/* Request Method */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Request Method</h2>
                <div className="grid grid-cols-3 gap-3">
                  {(['EMAIL', 'CALL', 'MANUFACTURER_SYSTEM'] as ShipmentRequestMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setRequestMethod(method);
                        setIsConfirmed(false);
                        setConfirmationNotes('');
                      }}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        requestMethod === method
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {method === 'EMAIL' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        )}
                        {method === 'CALL' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                          </svg>
                        )}
                        {method === 'MANUFACTURER_SYSTEM' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                        )}
                        <span className="font-medium text-sm">{shipmentRequestMethodLabels[method]}</span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {method === 'EMAIL' && 'Send request via email'}
                        {method === 'CALL' && 'Request by phone call'}
                        {method === 'MANUFACTURER_SYSTEM' && 'Submit via vendor portal'}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Email Contact Selection */}
                {requestMethod === 'EMAIL' && selectedVendorId && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-800 mb-3">
                      Select Contact <span className="text-red-500">*</span>
                    </label>
                    {contacts.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {contacts.map((contact) => (
                          <label
                            key={contact.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedContactId === contact.id
                                ? 'border-blue-500 bg-white'
                                : 'border-blue-200 hover:border-blue-300 bg-white/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="contact"
                              value={contact.id}
                              checked={selectedContactId === contact.id}
                              onChange={(e) => setSelectedContactId(e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[var(--foreground)]">{contact.name}</span>
                                {contact.isDefaultForOrders && (
                                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Default</span>
                                )}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">{contact.role}</div>
                              <div className="text-xs text-blue-600 mt-0.5">{contact.email}</div>
                            </div>
                            {!contact.isDefaultForOrders && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSetDefaultContact(contact.id);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Set as default
                              </button>
                            )}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-blue-700">No contacts available for this vendor.</p>
                    )}

                  </div>
                )}

                {/* Call/System Confirmation */}
                {(requestMethod === 'CALL' || requestMethod === 'MANUFACTURER_SYSTEM') && (
                  <div className={`mt-4 border rounded-lg p-4 ${
                    requestMethod === 'CALL' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="confirmed"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                        className={`mt-1 rounded ${
                          requestMethod === 'CALL' ? 'text-green-600 focus:ring-green-500' : 'text-purple-600 focus:ring-purple-500'
                        }`}
                      />
                      <div className="flex-1">
                        <label htmlFor="confirmed" className={`block text-sm font-medium cursor-pointer ${
                          requestMethod === 'CALL' ? 'text-green-800' : 'text-purple-800'
                        }`}>
                          {requestMethod === 'CALL'
                            ? 'I confirm I have called and requested this inventory'
                            : 'I confirm I have submitted this request in the manufacturer system'
                          }
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <p className={`text-xs mt-1 ${
                          requestMethod === 'CALL' ? 'text-green-700' : 'text-purple-700'
                        }`}>
                          {requestMethod === 'CALL'
                            ? 'Check this box after completing your phone call with the vendor.'
                            : 'Check this box after submitting the order in the manufacturer\'s portal.'
                          }
                        </p>
                      </div>
                    </div>

                    {isConfirmed && (
                      <div className="mt-3">
                        <label className={`block text-sm font-medium mb-1 ${
                          requestMethod === 'CALL' ? 'text-green-800' : 'text-purple-800'
                        }`}>
                          Confirmation Notes
                        </label>
                        <textarea
                          value={confirmationNotes}
                          onChange={(e) => setConfirmationNotes(e.target.value)}
                          rows={2}
                          placeholder={requestMethod === 'CALL'
                            ? 'Who did you speak with? What was confirmed?'
                            : 'Confirmation number or any relevant details...'
                          }
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Email Composer - Only show when EMAIL method is selected */}
              {requestMethod === 'EMAIL' && selectedVendorId && selectedContact && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-medium text-[var(--foreground)]">Email Content</h2>
                      <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                        To: {selectedContact.name} ({selectedContact.email})
                      </p>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Email Template
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {emailTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template.id)}
                          disabled={lineItems.length === 0}
                          className={`p-3 border rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedTemplateId === template.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                          }`}
                        >
                          <div className="font-medium text-sm text-[var(--foreground)]">{template.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      placeholder="Email subject line..."
                    />
                  </div>

                  {/* Email Body */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Message
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                      placeholder="Select a template above or write your message here..."
                    />
                  </div>

                  {/* Helper text */}
                  {lineItems.length === 0 && (
                    <p className="mb-4 text-xs text-[var(--muted-foreground)]">
                      Add products to your request to enable email generation.
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      disabled={!emailSubject || !emailBody || lineItems.length === 0}
                      className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      Preview & Send
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateEmail()}
                      disabled={isGeneratingEmail || lineItems.length === 0}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingEmail ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 11-6.219-8.56"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      )}
                      {isGeneratingEmail ? 'Generating...' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Requests for This Manufacturer */}
              {selectedVendorId && recentRequests.length > 0 && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                  <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
                    Recent Requests to {selectedVendor?.name}
                  </h2>
                  <div className="space-y-3">
                    {recentRequests.map((request) => {
                      const statusColors: Record<ShipmentRequestStatus, string> = {
                        DRAFT: 'bg-gray-100 text-gray-700',
                        PENDING: 'bg-yellow-100 text-yellow-700',
                        SENT: 'bg-blue-100 text-blue-700',
                        CONFIRMED: 'bg-purple-100 text-purple-700',
                        SHIPPED: 'bg-indigo-100 text-indigo-700',
                        RECEIVED: 'bg-green-100 text-green-700',
                        CANCELLED: 'bg-red-100 text-red-700',
                      };
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-[var(--foreground)]">
                                {request.requestNumber}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[request.status]}`}>
                                {shipmentRequestStatusLabels[request.status]}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                              {request.totalQuantity} units • {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <span>{shipmentRequestMethodLabels[request.requestMethod]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSendingEmail && setShowPreviewModal(false)}
          />
          <div className="relative bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Preview Email</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Review before sending to {selectedContact?.name}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                disabled={isSendingEmail}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Email Header Info */}
              <div className="mb-4 p-4 bg-[var(--muted)]/30 rounded-lg">
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-[var(--muted-foreground)]">To:</span>
                  <span className="text-[var(--foreground)]">{selectedContact?.name} &lt;{selectedContact?.email}&gt;</span>
                  <span className="text-[var(--muted-foreground)]">Subject:</span>
                  <span className="font-medium text-[var(--foreground)]">{emailSubject}</span>
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="border border-[var(--border)] rounded-lg p-4 bg-white">
                <pre className="whitespace-pre-wrap text-sm text-[var(--foreground)] font-sans">
                  {emailBody}
                </pre>
              </div>

              {/* Products Summary */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">Request Summary</div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>{lineItems.length} product{lineItems.length !== 1 ? 's' : ''} • {lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0)} total units</div>
                  <div>Requested delivery: {new Date(requestedDate).toLocaleDateString()}</div>
                  <div>Priority: {priority.charAt(0).toUpperCase() + priority.slice(1)}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/20">
              <button
                onClick={() => setShowPreviewModal(false)}
                disabled={isSendingEmail}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50"
              >
                Edit Email
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {emailSent && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <div className="font-medium">Email Sent Successfully</div>
              <div className="text-sm text-green-100">Redirecting to requests...</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
