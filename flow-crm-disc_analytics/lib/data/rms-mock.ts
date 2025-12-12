// ============================================================================
// FlowRMS - Mock Data
// Sales Order Management & Commission Tracking
// ============================================================================

import type {
  Order,
  OrderLineItem,
  OrderSplitRate,
  Invoice,
  InvoiceLineItem,
  Credit,
  CreditLineItem,
  CommissionCheck,
  CheckDetail,
  Expense,
  Product,
  ProductPricingTier,
  CustomerPartNumber,
  CreditReason,
  ExpenseCategory,
  Manufacturer,
  SalesRep,
  Customer,
  CommissionSummary,
  ManufacturerCommissionSummary,
  OrderSummaryStats,
  InvoiceSummaryStats,
} from '../types/rms';

// -----------------------------------------------------------------------------
// Manufacturers
// -----------------------------------------------------------------------------

export const mockManufacturers: Manufacturer[] = [
  {
    id: 'MFG-001',
    name: 'Acuity Brands',
    baseCommissionRate: 0.08,
    paymentTerms: 'Net 30',
    salesModel: 'direct',
    isActive: true,
  },
  {
    id: 'MFG-002',
    name: 'Hubbell Lighting',
    baseCommissionRate: 0.10,
    paymentTerms: 'Net 30',
    salesModel: 'direct',
    isActive: true,
  },
  {
    id: 'MFG-003',
    name: 'Eaton Lighting',
    baseCommissionRate: 0.09,
    paymentTerms: 'Net 45',
    salesModel: 'direct',
    isActive: true,
  },
  {
    id: 'MFG-004',
    name: 'Signify (Philips)',
    baseCommissionRate: 0.07,
    paymentTerms: 'Net 30',
    salesModel: 'warehouse',
    isActive: true,
  },
  {
    id: 'MFG-005',
    name: 'Cree Lighting',
    baseCommissionRate: 0.085,
    paymentTerms: 'Net 30',
    salesModel: 'direct',
    isActive: true,
  },
  {
    id: 'MFG-006',
    name: 'RAB Lighting',
    baseCommissionRate: 0.12,
    paymentTerms: 'Net 30',
    salesModel: 'buy_sell',
    isActive: true,
  },
];

// -----------------------------------------------------------------------------
// Sales Reps
// -----------------------------------------------------------------------------

export const mockSalesReps: SalesRep[] = [
  {
    id: 'REP-001',
    name: 'John Mitchell',
    email: 'jmitchell@flowconnect.com',
    repType: 'outside',
    defaultSplitRate: 50,
    territories: ['West', 'Southwest'],
    isActive: true,
  },
  {
    id: 'REP-002',
    name: 'Sarah Chen',
    email: 'schen@flowconnect.com',
    repType: 'outside',
    defaultSplitRate: 50,
    territories: ['East', 'Northeast'],
    isActive: true,
  },
  {
    id: 'REP-003',
    name: 'Mike Thompson',
    email: 'mthompson@flowconnect.com',
    repType: 'inside',
    defaultSplitRate: 25,
    territories: ['Central'],
    isActive: true,
  },
  {
    id: 'REP-004',
    name: 'Emily Rodriguez',
    email: 'erodriguez@flowconnect.com',
    repType: 'outside',
    defaultSplitRate: 50,
    territories: ['Central', 'South'],
    isActive: true,
  },
  {
    id: 'REP-005',
    name: 'David Park',
    email: 'dpark@flowconnect.com',
    repType: 'inside',
    defaultSplitRate: 25,
    territories: ['West'],
    isActive: true,
  },
];

// -----------------------------------------------------------------------------
// Customers
// -----------------------------------------------------------------------------

export const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Turner Construction',
    email: 'purchasing@turnerconst.com',
    phone: '(555) 234-5678',
    territory: 'West',
    isActive: true,
  },
  {
    id: 'CUST-002',
    name: 'Miller Electric',
    email: 'orders@millerelectric.com',
    phone: '(555) 345-6789',
    territory: 'West',
    isActive: true,
  },
  {
    id: 'CUST-003',
    name: 'Hensel Phelps',
    email: 'procurement@henselphelps.com',
    phone: '(555) 456-7890',
    territory: 'Central',
    isActive: true,
  },
  {
    id: 'CUST-004',
    name: 'Skanska USA',
    email: 'electrical@skanska.com',
    phone: '(555) 567-8901',
    territory: 'East',
    isActive: true,
  },
  {
    id: 'CUST-005',
    name: 'Summit Electric',
    email: 'purchasing@summitelec.com',
    phone: '(555) 678-9012',
    territory: 'West',
    isActive: true,
  },
  {
    id: 'CUST-006',
    name: 'McCarthy Building',
    email: 'orders@mccarthybuilding.com',
    phone: '(555) 789-0123',
    territory: 'Central',
    isActive: true,
  },
  {
    id: 'CUST-007',
    name: 'Bay Area Electric',
    email: 'purchasing@bayareaelec.com',
    phone: '(555) 890-1234',
    territory: 'West',
    isActive: true,
  },
];

// -----------------------------------------------------------------------------
// Products
// -----------------------------------------------------------------------------

export const mockProducts: Product[] = [
  // Acuity Brands
  {
    id: 'PROD-001',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    partNumber: 'LBL4-LP840',
    description: '4ft LED Low Bay, 4000K, 8000 lumens',
    unitPrice: 285.00,
    cost: 185.00,
    commissionRate: 0.08,
    category: 'Industrial',
    leadTimeDays: 5,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-11-01',
  },
  {
    id: 'PROD-002',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    partNumber: 'DERA-2X4-40L-840',
    description: '2x4 LED Troffer, 4000K, 4000 lumens',
    unitPrice: 145.00,
    cost: 95.00,
    commissionRate: 0.08,
    category: 'Indoor',
    leadTimeDays: 3,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-11-01',
  },
  // Hubbell Lighting
  {
    id: 'PROD-003',
    manufacturerId: 'MFG-002',
    manufacturerName: 'Hubbell Lighting',
    partNumber: 'LNC4-40-4K',
    description: '4ft LED Strip Light, 4000K',
    unitPrice: 125.00,
    cost: 82.00,
    commissionRate: 0.10,
    category: 'Industrial',
    leadTimeDays: 7,
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-10-15',
  },
  {
    id: 'PROD-004',
    manufacturerId: 'MFG-002',
    manufacturerName: 'Hubbell Lighting',
    partNumber: 'DERA-LED-2X2',
    description: '2x2 LED Recessed Troffer',
    unitPrice: 165.00,
    cost: 108.00,
    commissionRate: 0.10,
    category: 'Indoor',
    leadTimeDays: 5,
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-10-15',
  },
  // Eaton Lighting
  {
    id: 'PROD-005',
    manufacturerId: 'MFG-003',
    manufacturerName: 'Eaton Lighting',
    partNumber: 'WPLED-150',
    description: 'LED Wall Pack, 150W equivalent',
    unitPrice: 195.00,
    cost: 128.00,
    commissionRate: 0.09,
    category: 'Outdoor',
    leadTimeDays: 10,
    isActive: true,
    createdAt: '2024-03-01',
    updatedAt: '2024-09-20',
  },
  {
    id: 'PROD-006',
    manufacturerId: 'MFG-003',
    manufacturerName: 'Eaton Lighting',
    partNumber: 'AFL-LED-200W',
    description: 'LED Area Flood Light, 200W',
    unitPrice: 425.00,
    cost: 285.00,
    commissionRate: 0.09,
    category: 'Outdoor',
    leadTimeDays: 14,
    isActive: true,
    createdAt: '2024-03-01',
    updatedAt: '2024-09-20',
  },
  // RAB Lighting
  {
    id: 'PROD-007',
    manufacturerId: 'MFG-006',
    manufacturerName: 'RAB Lighting',
    partNumber: 'WPLED26',
    description: 'Full Cutoff LED Wall Pack, 26W',
    unitPrice: 165.00,
    cost: 98.00,
    commissionRate: 0.12,
    category: 'Outdoor',
    leadTimeDays: 3,
    isActive: true,
    createdAt: '2024-04-01',
    updatedAt: '2024-11-01',
  },
  {
    id: 'PROD-008',
    manufacturerId: 'MFG-006',
    manufacturerName: 'RAB Lighting',
    partNumber: 'FFLED18',
    description: 'LED Flood Light, 18W',
    unitPrice: 89.00,
    cost: 52.00,
    commissionRate: 0.12,
    category: 'Outdoor',
    leadTimeDays: 3,
    isActive: true,
    createdAt: '2024-04-01',
    updatedAt: '2024-11-01',
  },
];

// -----------------------------------------------------------------------------
// Credit Reasons
// -----------------------------------------------------------------------------

export const mockCreditReasons: CreditReason[] = [
  { id: 'CR-001', code: 'RETURN', description: 'Product Return', isActive: true },
  { id: 'CR-002', code: 'DAMAGED', description: 'Damaged Goods', isActive: true },
  { id: 'CR-003', code: 'PRICE_ADJ', description: 'Pricing Adjustment', isActive: true },
  { id: 'CR-004', code: 'SHORTAGE', description: 'Short Shipment', isActive: true },
  { id: 'CR-005', code: 'CANCEL', description: 'Order Cancellation', isActive: true },
  { id: 'CR-006', code: 'WARRANTY', description: 'Warranty Claim', isActive: true },
  { id: 'CR-007', code: 'OTHER', description: 'Other', isActive: true },
];

// -----------------------------------------------------------------------------
// Expense Categories
// -----------------------------------------------------------------------------

export const mockExpenseCategories: ExpenseCategory[] = [
  { id: 'EXP-001', name: 'Bonus', description: 'Sales bonus', isActive: true },
  { id: 'EXP-002', name: 'SPIFF', description: 'Special incentive', isActive: true },
  { id: 'EXP-003', name: 'Override', description: 'Commission override', isActive: true },
  { id: 'EXP-004', name: 'Marketing', description: 'Marketing allowance', isActive: true },
  { id: 'EXP-005', name: 'Rebate', description: 'Customer rebate', isActive: true },
  { id: 'EXP-006', name: 'Adjustment', description: 'General adjustment', isActive: true },
];

// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    orderNumber: 'SO-2024-0001',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    customerId: 'CUST-001',
    customerName: 'Turner Construction',
    jobId: 'JOB-001',
    jobName: 'Downtown Office Tower',
    status: 'shipped',
    fulfillmentStatus: 'completed',
    billingStatus: 'invoiced',
    commissionStatus: 'paid',
    orderDate: '2024-10-15',
    requestedShipDate: '2024-10-25',
    actualShipDate: '2024-10-24',
    lineItems: [
      {
        id: 'OLI-001-1',
        lineNumber: 1,
        productId: 'PROD-001',
        partNumber: 'LBL4-LP840',
        description: '4ft LED Low Bay, 4000K, 8000 lumens',
        quantity: 50,
        unitPrice: 285.00,
        extendedPrice: 14250.00,
        commissionRate: 0.08,
        commissionAmount: 1140.00,
        quantityShipped: 50,
        quantityInvoiced: 50,
        quantityCredited: 0,
        isCancelled: false,
      },
      {
        id: 'OLI-001-2',
        lineNumber: 2,
        productId: 'PROD-002',
        partNumber: 'DERA-2X4-40L-840',
        description: '2x4 LED Troffer, 4000K, 4000 lumens',
        quantity: 120,
        unitPrice: 145.00,
        extendedPrice: 17400.00,
        commissionRate: 0.08,
        commissionAmount: 1392.00,
        quantityShipped: 120,
        quantityInvoiced: 120,
        quantityCredited: 0,
        isCancelled: false,
      },
    ],
    subtotal: 31650.00,
    freight: 450.00,
    total: 32100.00,
    totalCommission: 2532.00,
    insideRepId: 'REP-003',
    insideRepName: 'Mike Thompson',
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 50, commissionAmount: 1266.00 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 50, commissionAmount: 1266.00 },
    ],
    poNumber: 'PO-TC-2024-1234',
    createdAt: '2024-10-15T09:00:00Z',
    createdBy: 'Mike Thompson',
    updatedAt: '2024-10-24T14:30:00Z',
  },
  {
    id: 'ORD-002',
    orderNumber: 'SO-2024-0002',
    manufacturerId: 'MFG-002',
    manufacturerName: 'Hubbell Lighting',
    customerId: 'CUST-002',
    customerName: 'Miller Electric',
    jobId: 'JOB-002',
    jobName: 'Medical Center Expansion',
    status: 'open',
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: '2024-11-20',
    requestedShipDate: '2024-12-15',
    lineItems: [
      {
        id: 'OLI-002-1',
        lineNumber: 1,
        productId: 'PROD-003',
        partNumber: 'LNC4-40-4K',
        description: '4ft LED Strip Light, 4000K',
        quantity: 200,
        unitPrice: 125.00,
        extendedPrice: 25000.00,
        commissionRate: 0.10,
        commissionAmount: 2500.00,
        quantityShipped: 0,
        quantityInvoiced: 0,
        quantityCredited: 0,
        isCancelled: false,
      },
      {
        id: 'OLI-002-2',
        lineNumber: 2,
        productId: 'PROD-004',
        partNumber: 'DERA-LED-2X2',
        description: '2x2 LED Recessed Troffer',
        quantity: 80,
        unitPrice: 165.00,
        extendedPrice: 13200.00,
        commissionRate: 0.10,
        commissionAmount: 1320.00,
        quantityShipped: 0,
        quantityInvoiced: 0,
        quantityCredited: 0,
        isCancelled: false,
      },
    ],
    subtotal: 38200.00,
    freight: 575.00,
    total: 38775.00,
    totalCommission: 3820.00,
    insideRepId: 'REP-005',
    insideRepName: 'David Park',
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 60, commissionAmount: 2292.00 },
      { salesRepId: 'REP-005', salesRepName: 'David Park', splitPercentage: 40, commissionAmount: 1528.00 },
    ],
    poNumber: 'PO-ME-2024-5678',
    createdAt: '2024-11-20T10:30:00Z',
    createdBy: 'David Park',
    updatedAt: '2024-11-20T10:30:00Z',
  },
  {
    id: 'ORD-003',
    orderNumber: 'SO-2024-0003',
    manufacturerId: 'MFG-003',
    manufacturerName: 'Eaton Lighting',
    customerId: 'CUST-003',
    customerName: 'Hensel Phelps',
    jobId: 'JOB-003',
    jobName: 'University Science Building',
    status: 'partial_shipped',
    fulfillmentStatus: 'in_progress',
    billingStatus: 'partial_invoiced',
    commissionStatus: 'accruing',
    orderDate: '2024-11-01',
    requestedShipDate: '2024-11-20',
    actualShipDate: '2024-11-18',
    lineItems: [
      {
        id: 'OLI-003-1',
        lineNumber: 1,
        productId: 'PROD-005',
        partNumber: 'WPLED-150',
        description: 'LED Wall Pack, 150W equivalent',
        quantity: 40,
        unitPrice: 195.00,
        extendedPrice: 7800.00,
        commissionRate: 0.09,
        commissionAmount: 702.00,
        quantityShipped: 40,
        quantityInvoiced: 40,
        quantityCredited: 0,
        isCancelled: false,
      },
      {
        id: 'OLI-003-2',
        lineNumber: 2,
        productId: 'PROD-006',
        partNumber: 'AFL-LED-200W',
        description: 'LED Area Flood Light, 200W',
        quantity: 25,
        unitPrice: 425.00,
        extendedPrice: 10625.00,
        commissionRate: 0.09,
        commissionAmount: 956.25,
        quantityShipped: 15,
        quantityInvoiced: 0,
        quantityCredited: 0,
        isCancelled: false,
      },
    ],
    subtotal: 18425.00,
    freight: 325.00,
    total: 18750.00,
    totalCommission: 1658.25,
    insideRepId: 'REP-003',
    insideRepName: 'Mike Thompson',
    splitRates: [
      { salesRepId: 'REP-004', salesRepName: 'Emily Rodriguez', splitPercentage: 50, commissionAmount: 829.13 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 50, commissionAmount: 829.12 },
    ],
    poNumber: 'PO-HP-2024-9012',
    createdAt: '2024-11-01T08:15:00Z',
    createdBy: 'Mike Thompson',
    updatedAt: '2024-11-18T16:45:00Z',
  },
  {
    id: 'ORD-004',
    orderNumber: 'SO-2024-0004',
    manufacturerId: 'MFG-006',
    manufacturerName: 'RAB Lighting',
    customerId: 'CUST-005',
    customerName: 'Summit Electric',
    jobId: 'JOB-004',
    jobName: 'Retail Plaza Renovation',
    status: 'shipped',
    fulfillmentStatus: 'completed',
    billingStatus: 'invoiced',
    commissionStatus: 'accruing',
    orderDate: '2024-11-05',
    requestedShipDate: '2024-11-12',
    actualShipDate: '2024-11-10',
    lineItems: [
      {
        id: 'OLI-004-1',
        lineNumber: 1,
        productId: 'PROD-007',
        partNumber: 'WPLED26',
        description: 'Full Cutoff LED Wall Pack, 26W',
        quantity: 60,
        unitPrice: 165.00,
        extendedPrice: 9900.00,
        commissionRate: 0.12,
        commissionAmount: 1188.00,
        quantityShipped: 60,
        quantityInvoiced: 60,
        quantityCredited: 0,
        isCancelled: false,
      },
      {
        id: 'OLI-004-2',
        lineNumber: 2,
        productId: 'PROD-008',
        partNumber: 'FFLED18',
        description: 'LED Flood Light, 18W',
        quantity: 30,
        unitPrice: 89.00,
        extendedPrice: 2670.00,
        commissionRate: 0.12,
        commissionAmount: 320.40,
        quantityShipped: 30,
        quantityInvoiced: 30,
        quantityCredited: 0,
        isCancelled: false,
      },
    ],
    subtotal: 12570.00,
    freight: 185.00,
    total: 12755.00,
    totalCommission: 1508.40,
    insideRepId: 'REP-005',
    insideRepName: 'David Park',
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 70, commissionAmount: 1055.88 },
      { salesRepId: 'REP-005', salesRepName: 'David Park', splitPercentage: 30, commissionAmount: 452.52 },
    ],
    poNumber: 'PO-SE-2024-3456',
    createdAt: '2024-11-05T11:00:00Z',
    createdBy: 'David Park',
    updatedAt: '2024-11-10T09:30:00Z',
  },
  {
    id: 'ORD-005',
    orderNumber: 'SO-2024-0005',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    customerId: 'CUST-004',
    customerName: 'Skanska USA',
    jobId: 'JOB-005',
    jobName: 'Airport Terminal B',
    status: 'draft',
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: '2024-12-05',
    requestedShipDate: '2025-01-15',
    lineItems: [
      {
        id: 'OLI-005-1',
        lineNumber: 1,
        productId: 'PROD-001',
        partNumber: 'LBL4-LP840',
        description: '4ft LED Low Bay, 4000K, 8000 lumens',
        quantity: 100,
        unitPrice: 285.00,
        extendedPrice: 28500.00,
        commissionRate: 0.08,
        commissionAmount: 2280.00,
        quantityShipped: 0,
        quantityInvoiced: 0,
        quantityCredited: 0,
        isCancelled: false,
      },
    ],
    subtotal: 28500.00,
    freight: 650.00,
    total: 29150.00,
    totalCommission: 2280.00,
    insideRepId: 'REP-003',
    insideRepName: 'Mike Thompson',
    splitRates: [
      { salesRepId: 'REP-002', salesRepName: 'Sarah Chen', splitPercentage: 50, commissionAmount: 1140.00 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 50, commissionAmount: 1140.00 },
    ],
    notes: 'Large project - may need multiple shipments',
    createdAt: '2024-12-05T14:00:00Z',
    createdBy: 'Mike Thompson',
    updatedAt: '2024-12-05T14:00:00Z',
  },
  {
    id: 'ORD-006',
    orderNumber: 'SO-2024-0006',
    manufacturerId: 'MFG-002',
    manufacturerName: 'Hubbell Lighting',
    customerId: 'CUST-006',
    customerName: 'McCarthy Building',
    jobId: 'JOB-006',
    jobName: 'Healthcare Campus Phase 2',
    status: 'open',
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: '2024-12-01',
    requestedShipDate: '2024-12-20',
    lineItems: [
      {
        id: 'OLI-006-1',
        lineNumber: 1,
        productId: 'PROD-004',
        partNumber: 'DERA-LED-2X2',
        description: '2x2 LED Recessed Troffer',
        quantity: 150,
        unitPrice: 165.00,
        extendedPrice: 24750.00,
        commissionRate: 0.10,
        commissionAmount: 2475.00,
        quantityShipped: 0,
        quantityInvoiced: 0,
        quantityCredited: 0,
        isCancelled: false,
      },
    ],
    subtotal: 24750.00,
    freight: 350.00,
    total: 25100.00,
    totalCommission: 2475.00,
    insideRepId: 'REP-003',
    insideRepName: 'Mike Thompson',
    splitRates: [
      { salesRepId: 'REP-004', salesRepName: 'Emily Rodriguez', splitPercentage: 60, commissionAmount: 1485.00 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 40, commissionAmount: 990.00 },
    ],
    poNumber: 'PO-MB-2024-7890',
    createdAt: '2024-12-01T09:45:00Z',
    createdBy: 'Mike Thompson',
    updatedAt: '2024-12-01T09:45:00Z',
  },
];

// -----------------------------------------------------------------------------
// Invoices
// -----------------------------------------------------------------------------

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2024-0001',
    orderId: 'ORD-001',
    orderNumber: 'SO-2024-0001',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    customerId: 'CUST-001',
    customerName: 'Turner Construction',
    status: 'paid',
    isLocked: true,
    invoiceDate: '2024-10-25',
    dueDate: '2024-11-24',
    paidDate: '2024-11-20',
    lineItems: [
      {
        id: 'ILI-001-1',
        orderLineItemId: 'OLI-001-1',
        lineNumber: 1,
        partNumber: 'LBL4-LP840',
        description: '4ft LED Low Bay, 4000K, 8000 lumens',
        quantity: 50,
        unitPrice: 285.00,
        amount: 14250.00,
        commissionRate: 0.08,
        commissionAmount: 1140.00,
      },
      {
        id: 'ILI-001-2',
        orderLineItemId: 'OLI-001-2',
        lineNumber: 2,
        partNumber: 'DERA-2X4-40L-840',
        description: '2x4 LED Troffer, 4000K, 4000 lumens',
        quantity: 120,
        unitPrice: 145.00,
        amount: 17400.00,
        commissionRate: 0.08,
        commissionAmount: 1392.00,
      },
    ],
    subtotal: 31650.00,
    freight: 450.00,
    total: 32100.00,
    totalCommission: 2532.00,
    amountPaid: 32100.00,
    amountCredited: 0,
    balance: 0,
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 50, commissionAmount: 1266.00 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 50, commissionAmount: 1266.00 },
    ],
    createdAt: '2024-10-25T10:00:00Z',
    createdBy: 'System',
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2024-0002',
    orderId: 'ORD-003',
    orderNumber: 'SO-2024-0003',
    manufacturerId: 'MFG-003',
    manufacturerName: 'Eaton Lighting',
    customerId: 'CUST-003',
    customerName: 'Hensel Phelps',
    status: 'open',
    isLocked: false,
    invoiceDate: '2024-11-19',
    dueDate: '2025-01-03',
    lineItems: [
      {
        id: 'ILI-002-1',
        orderLineItemId: 'OLI-003-1',
        lineNumber: 1,
        partNumber: 'WPLED-150',
        description: 'LED Wall Pack, 150W equivalent',
        quantity: 40,
        unitPrice: 195.00,
        amount: 7800.00,
        commissionRate: 0.09,
        commissionAmount: 702.00,
      },
    ],
    subtotal: 7800.00,
    freight: 150.00,
    total: 7950.00,
    totalCommission: 702.00,
    amountPaid: 0,
    amountCredited: 0,
    balance: 7950.00,
    splitRates: [
      { salesRepId: 'REP-004', salesRepName: 'Emily Rodriguez', splitPercentage: 50, commissionAmount: 351.00 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 50, commissionAmount: 351.00 },
    ],
    createdAt: '2024-11-19T11:30:00Z',
    createdBy: 'System',
  },
  {
    id: 'INV-003',
    invoiceNumber: 'INV-2024-0003',
    orderId: 'ORD-004',
    orderNumber: 'SO-2024-0004',
    manufacturerId: 'MFG-006',
    manufacturerName: 'RAB Lighting',
    customerId: 'CUST-005',
    customerName: 'Summit Electric',
    status: 'open',
    isLocked: false,
    invoiceDate: '2024-11-11',
    dueDate: '2024-12-11',
    lineItems: [
      {
        id: 'ILI-003-1',
        orderLineItemId: 'OLI-004-1',
        lineNumber: 1,
        partNumber: 'WPLED26',
        description: 'Full Cutoff LED Wall Pack, 26W',
        quantity: 60,
        unitPrice: 165.00,
        amount: 9900.00,
        commissionRate: 0.12,
        commissionAmount: 1188.00,
      },
      {
        id: 'ILI-003-2',
        orderLineItemId: 'OLI-004-2',
        lineNumber: 2,
        partNumber: 'FFLED18',
        description: 'LED Flood Light, 18W',
        quantity: 30,
        unitPrice: 89.00,
        amount: 2670.00,
        commissionRate: 0.12,
        commissionAmount: 320.40,
      },
    ],
    subtotal: 12570.00,
    freight: 185.00,
    total: 12755.00,
    totalCommission: 1508.40,
    amountPaid: 0,
    amountCredited: 0,
    balance: 12755.00,
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 70, commissionAmount: 1055.88 },
      { salesRepId: 'REP-005', salesRepName: 'David Park', splitPercentage: 30, commissionAmount: 452.52 },
    ],
    createdAt: '2024-11-11T09:15:00Z',
    createdBy: 'System',
  },
];

// -----------------------------------------------------------------------------
// Credits
// -----------------------------------------------------------------------------

export const mockCredits: Credit[] = [
  {
    id: 'CRD-001',
    creditNumber: 'CR-2024-0001',
    orderId: 'ORD-001',
    orderNumber: 'SO-2024-0001',
    invoiceId: 'INV-001',
    invoiceNumber: 'INV-2024-0001',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    customerId: 'CUST-001',
    customerName: 'Turner Construction',
    reasonCode: 'DAMAGED',
    reasonDescription: 'Damaged Goods',
    status: 'applied',
    lineItems: [
      {
        id: 'CLI-001-1',
        orderLineItemId: 'OLI-001-2',
        partNumber: 'DERA-2X4-40L-840',
        description: '2x4 LED Troffer - Damaged in transit',
        quantity: 5,
        unitPrice: 145.00,
        amount: 725.00,
        commissionDeduction: 58.00,
      },
    ],
    totalAmount: 725.00,
    totalCommissionDeduction: 58.00,
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 50, commissionAmount: -29.00 },
      { salesRepId: 'REP-003', salesRepName: 'Mike Thompson', splitPercentage: 50, commissionAmount: -29.00 },
    ],
    creditDate: '2024-11-05',
    appliedDate: '2024-11-20',
    notes: 'Customer reported 5 units damaged upon delivery',
    createdAt: '2024-11-05T14:20:00Z',
    createdBy: 'Mike Thompson',
  },
];

// -----------------------------------------------------------------------------
// Commission Checks
// -----------------------------------------------------------------------------

export const mockChecks: CommissionCheck[] = [
  {
    id: 'CHK-001',
    checkNumber: 'CK-2024-0001',
    salesRepId: 'REP-001',
    salesRepName: 'John Mitchell',
    commissionMonth: '2024-11',
    status: 'posted',
    postDate: '2024-11-30',
    createdDate: '2024-11-28',
    details: [
      {
        id: 'CHD-001-1',
        type: 'invoice',
        referenceId: 'INV-001',
        referenceNumber: 'INV-2024-0001',
        description: 'Turner Construction - Downtown Office Tower',
        amount: 1266.00,
        customerName: 'Turner Construction',
        orderNumber: 'SO-2024-0001',
      },
      {
        id: 'CHD-001-2',
        type: 'credit',
        referenceId: 'CRD-001',
        referenceNumber: 'CR-2024-0001',
        description: 'Credit - Damaged Goods',
        amount: -29.00,
        customerName: 'Turner Construction',
        orderNumber: 'SO-2024-0001',
      },
    ],
    invoicePayments: 1266.00,
    expenseAdjustments: 0,
    creditDeductions: 29.00,
    netAmount: 1237.00,
    createdBy: 'System',
  },
  {
    id: 'CHK-002',
    checkNumber: 'CK-2024-0002',
    salesRepId: 'REP-003',
    salesRepName: 'Mike Thompson',
    commissionMonth: '2024-11',
    status: 'posted',
    postDate: '2024-11-30',
    createdDate: '2024-11-28',
    details: [
      {
        id: 'CHD-002-1',
        type: 'invoice',
        referenceId: 'INV-001',
        referenceNumber: 'INV-2024-0001',
        description: 'Turner Construction - Downtown Office Tower',
        amount: 1266.00,
        customerName: 'Turner Construction',
        orderNumber: 'SO-2024-0001',
      },
      {
        id: 'CHD-002-2',
        type: 'credit',
        referenceId: 'CRD-001',
        referenceNumber: 'CR-2024-0001',
        description: 'Credit - Damaged Goods',
        amount: -29.00,
        customerName: 'Turner Construction',
        orderNumber: 'SO-2024-0001',
      },
    ],
    invoicePayments: 1266.00,
    expenseAdjustments: 0,
    creditDeductions: 29.00,
    netAmount: 1237.00,
    createdBy: 'System',
  },
];

// -----------------------------------------------------------------------------
// Expenses
// -----------------------------------------------------------------------------

export const mockExpenses: Expense[] = [
  {
    id: 'EXP-001',
    expenseNumber: 'EX-2024-0001',
    category: 'Bonus',
    categoryId: 'EXP-001',
    customerId: 'CUST-001',
    customerName: 'Turner Construction',
    manufacturerId: 'MFG-001',
    manufacturerName: 'Acuity Brands',
    description: 'Q4 Sales bonus - Turner project',
    amount: 500.00,
    status: 'open',
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 100, amount: 500.00 },
    ],
    expenseDate: '2024-12-01',
    createdAt: '2024-12-01T10:00:00Z',
    createdBy: 'Admin',
  },
  {
    id: 'EXP-002',
    expenseNumber: 'EX-2024-0002',
    category: 'SPIFF',
    categoryId: 'EXP-002',
    manufacturerId: 'MFG-006',
    manufacturerName: 'RAB Lighting',
    description: 'RAB Q4 SPIFF program',
    amount: 250.00,
    status: 'open',
    splitRates: [
      { salesRepId: 'REP-001', salesRepName: 'John Mitchell', splitPercentage: 60, amount: 150.00 },
      { salesRepId: 'REP-005', salesRepName: 'David Park', splitPercentage: 40, amount: 100.00 },
    ],
    expenseDate: '2024-12-05',
    notes: 'Per RAB SPIFF program for Summit Electric order',
    createdAt: '2024-12-05T11:30:00Z',
    createdBy: 'Admin',
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(order => order.id === id);
}

export function getOrdersByCustomer(customerId: string): Order[] {
  return mockOrders.filter(order => order.customerId === customerId);
}

export function getOrdersByManufacturer(manufacturerId: string): Order[] {
  return mockOrders.filter(order => order.manufacturerId === manufacturerId);
}

export function getOrdersBySalesRep(salesRepId: string): Order[] {
  return mockOrders.filter(order =>
    order.splitRates.some(sr => sr.salesRepId === salesRepId) ||
    order.insideRepId === salesRepId
  );
}

export function getInvoiceById(id: string): Invoice | undefined {
  return mockInvoices.find(invoice => invoice.id === id);
}

export function getInvoicesByOrder(orderId: string): Invoice[] {
  return mockInvoices.filter(invoice => invoice.orderId === orderId);
}

export function getCreditById(id: string): Credit | undefined {
  return mockCredits.find(credit => credit.id === id);
}

export function getCheckById(id: string): CommissionCheck | undefined {
  return mockChecks.find(check => check.id === id);
}

export function getChecksBySalesRep(salesRepId: string): CommissionCheck[] {
  return mockChecks.filter(check => check.salesRepId === salesRepId);
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find(product => product.id === id);
}

export function getProductsByManufacturer(manufacturerId: string): Product[] {
  return mockProducts.filter(product => product.manufacturerId === manufacturerId);
}

export function getManufacturerById(id: string): Manufacturer | undefined {
  return mockManufacturers.find(mfg => mfg.id === id);
}

export function getSalesRepById(id: string): SalesRep | undefined {
  return mockSalesReps.find(rep => rep.id === id);
}

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find(customer => customer.id === id);
}

// -----------------------------------------------------------------------------
// Calculation Helpers
// -----------------------------------------------------------------------------

export function calculateLineItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateCommission(amount: number, rate: number): number {
  return amount * rate;
}

export function calculateOrderTotals(lineItems: OrderLineItem[], freight: number = 0): {
  subtotal: number;
  total: number;
  totalCommission: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.extendedPrice, 0);
  const totalCommission = lineItems.reduce((sum, item) => sum + item.commissionAmount, 0);
  return {
    subtotal,
    total: subtotal + freight,
    totalCommission,
  };
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const nextNum = mockOrders.length + 1;
  return `SO-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const nextNum = mockInvoices.length + 1;
  return `INV-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export function generateCreditNumber(): string {
  const year = new Date().getFullYear();
  const nextNum = mockCredits.length + 1;
  return `CR-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export function generateCheckNumber(): string {
  const year = new Date().getFullYear();
  const nextNum = mockChecks.length + 1;
  return `CK-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export function generateExpenseNumber(): string {
  const year = new Date().getFullYear();
  const nextNum = mockExpenses.length + 1;
  return `EX-${year}-${nextNum.toString().padStart(4, '0')}`;
}

// -----------------------------------------------------------------------------
// Summary Statistics
// -----------------------------------------------------------------------------

export function getOrderSummaryStats(): OrderSummaryStats {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${now.getMonth().toString().padStart(2, '0')}`;

  const thisMonthOrders = mockOrders.filter(o => o.orderDate.startsWith(thisMonth));
  const lastMonthOrders = mockOrders.filter(o => o.orderDate.startsWith(lastMonth));

  return {
    totalOrders: mockOrders.length,
    openOrders: mockOrders.filter(o => o.status === 'open' || o.status === 'draft').length,
    shippedOrders: mockOrders.filter(o => o.status === 'shipped').length,
    totalValue: mockOrders.reduce((sum, o) => sum + o.total, 0),
    avgOrderValue: mockOrders.length > 0
      ? mockOrders.reduce((sum, o) => sum + o.total, 0) / mockOrders.length
      : 0,
    thisMonthValue: thisMonthOrders.reduce((sum, o) => sum + o.total, 0),
    lastMonthValue: lastMonthOrders.reduce((sum, o) => sum + o.total, 0),
    thisMonthCount: thisMonthOrders.length,
  };
}

export function getInvoiceSummaryStats(): InvoiceSummaryStats {
  const now = new Date();
  const overdueInvoices = mockInvoices.filter(i =>
    i.status === 'open' && new Date(i.dueDate) < now
  );

  return {
    totalInvoices: mockInvoices.length,
    openInvoices: mockInvoices.filter(i => i.status === 'open').length,
    paidInvoices: mockInvoices.filter(i => i.status === 'paid').length,
    totalValue: mockInvoices.reduce((sum, i) => sum + i.total, 0),
    totalOutstanding: mockInvoices
      .filter(i => i.status === 'open' || i.status === 'partial_paid')
      .reduce((sum, i) => sum + i.balance, 0),
    overdueCount: overdueInvoices.length,
    overdueValue: overdueInvoices.reduce((sum, i) => sum + i.balance, 0),
  };
}

export function getCommissionSummaryByRep(): CommissionSummary[] {
  const summaryMap = new Map<string, CommissionSummary>();

  // Initialize from sales reps
  mockSalesReps.forEach(rep => {
    summaryMap.set(rep.id, {
      salesRepId: rep.id,
      salesRepName: rep.name,
      pending: 0,
      accruing: 0,
      paid: 0,
      adjusted: 0,
      total: 0,
    });
  });

  // Sum from invoices
  mockInvoices.forEach(invoice => {
    invoice.splitRates.forEach(sr => {
      const summary = summaryMap.get(sr.salesRepId);
      if (summary) {
        if (invoice.status === 'paid') {
          summary.paid += sr.commissionAmount;
        } else {
          summary.accruing += sr.commissionAmount;
        }
        summary.total += sr.commissionAmount;
      }
    });
  });

  // Add pending from open orders not yet invoiced
  mockOrders.forEach(order => {
    if (order.billingStatus === 'not_invoiced') {
      order.splitRates.forEach(sr => {
        const summary = summaryMap.get(sr.salesRepId);
        if (summary) {
          summary.pending += sr.commissionAmount;
          summary.total += sr.commissionAmount;
        }
      });
    }
  });

  return Array.from(summaryMap.values());
}

export function getCommissionSummaryByManufacturer(): ManufacturerCommissionSummary[] {
  const summaryMap = new Map<string, ManufacturerCommissionSummary>();

  // Initialize from manufacturers
  mockManufacturers.forEach(mfg => {
    summaryMap.set(mfg.id, {
      manufacturerId: mfg.id,
      manufacturerName: mfg.name,
      totalSales: 0,
      totalCommission: 0,
      paidCommission: 0,
      pendingCommission: 0,
      orderCount: 0,
    });
  });

  // Sum from orders
  mockOrders.forEach(order => {
    const summary = summaryMap.get(order.manufacturerId);
    if (summary) {
      summary.totalSales += order.total;
      summary.totalCommission += order.totalCommission;
      summary.orderCount += 1;

      if (order.commissionStatus === 'paid') {
        summary.paidCommission += order.totalCommission;
      } else {
        summary.pendingCommission += order.totalCommission;
      }
    }
  });

  return Array.from(summaryMap.values());
}
