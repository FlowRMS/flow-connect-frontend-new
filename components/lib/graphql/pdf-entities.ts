/**
 * PDF Entity Queries
 * GraphQL queries for fetching complete entity data for PDF generation
 */

import { crmGraphQLRequest } from './client';

// ==========================================
// Type Definitions
// ==========================================

export interface PDFBalance {
  id: string;
  quantity: number;
  subtotal: number;
  total: number;
  discount: number;
  discountRate: number;
  commission?: number;
  commissionRate?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  shippingBalance?: number;
  freightChargeBalance?: number;
  cancelledBalance?: number;
  paidBalance?: number;
}

export interface PDFUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  inside: boolean;
  outside: boolean;
}

export interface PDFCustomer {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

export interface PDFFactory {
  id: string;
  title: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  paymentTerms?: string;
  freightTerms?: string;
  leadTime?: string;
  baseCommissionRate?: number;
  commissionDiscountRate?: number;
  overallDiscountRate?: number;
  additionalInformation?: string;
}

export interface PDFProduct {
  id: string;
  factoryPartNumber?: string;
  description?: string;
  unitPrice?: number;
  leadTime?: string;
  upc?: string;
  minOrderQty?: number;
  defaultCommissionRate?: number;
  commissionDiscountRate?: number;
  unitPriceDiscountRate?: number;
  defaultDivisor?: number;
}

export interface PDFJob {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  additionalInformation?: string;
  structuralDetails?: string;
  structuralInformation?: string;
  tags?: string[];
}

export interface PDFSplitRate {
  id: string;
  userId: string;
  splitRate: string;
  position: number;
  user?: PDFUser;
}

export interface PDFUom {
  id: string;
  title: string;
  divisionFactor?: number;
  description?: string;
}

// Pre-Opportunity Types
export interface PDFPreOpportunityDetail {
  id: string;
  itemNumber: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  discount: number;
  discountRate: number;
  leadTime?: string;
  factoryId?: string;
  factory?: PDFFactory;
  productId?: string;
  product?: PDFProduct;
  endUserId?: string;
}

export interface PDFPreOpportunity {
  id: string;
  entityNumber: string;
  entityDate: string;
  customerRef?: string;
  status: string;
  paymentTerms?: string;
  freightTerms?: string;
  expDate?: string;
  reviseDate?: string;
  acceptDate?: string;
  tags?: string[];
  createdAt: string;
  createdById?: string;
  createdBy?: PDFUser;
  soldToCustomerId?: string;
  soldToCustomer?: PDFCustomer;
  billToCustomerId?: string;
  billToCustomer?: PDFCustomer;
  billToCustomerAddressId?: string;
  soldToCustomerAddressId?: string;
  jobId?: string;
  job?: PDFJob;
  balance?: PDFBalance;
  details: PDFPreOpportunityDetail[];
}

// Quote Types
export interface PDFQuoteDetail {
  id: string;
  itemNumber: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  discount: number;
  discountRate: number;
  commission?: number;
  commissionRate?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  totalLineCommission?: number;
  leadTime?: string;
  note?: string;
  status?: string;
  factoryId?: string;
  factory?: PDFFactory;
  productId?: string;
  product?: PDFProduct;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  endUserId?: string;
  uom?: PDFUom;
  insideSplitRates?: PDFSplitRate[];
  outsideSplitRates?: PDFSplitRate[];
}

export interface PDFQuote {
  id: string;
  quoteNumber: string;
  entityDate: string;
  customerRef?: string;
  status: string;
  pipelineStage?: string;
  paymentTerms?: string;
  freightTerms?: string;
  expDate?: string;
  reviseDate?: string;
  acceptDate?: string;
  blanket?: boolean;
  published?: boolean;
  creationType?: string;
  versionOf?: string;
  url?: string;
  duplicatedFrom?: string;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  factoryPerLineItem?: boolean;
  endUserPerLineItem?: boolean;
  createdAt: string;
  createdById?: string;
  createdBy?: PDFUser;
  soldToCustomerId?: string;
  soldToCustomer?: PDFCustomer;
  billToCustomerId?: string;
  billToCustomer?: PDFCustomer;
  jobId?: string;
  job?: PDFJob;
  balanceId?: string;
  balance?: PDFBalance;
  details: PDFQuoteDetail[];
}

// Order Types
export interface PDFOrderDetail {
  id: string;
  itemNumber: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  discount: number;
  discountRate: number;
  commission?: number;
  commissionRate?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  totalLineCommission?: number;
  leadTime?: string;
  note?: string;
  status?: string;
  shippingBalance?: number;
  cancelledBalance?: number;
  freightCharge?: number;
  productId?: string;
  product?: PDFProduct;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  endUserId?: string;
  uom?: PDFUom;
  insideSplitRates?: PDFSplitRate[];
  outsideSplitRates?: PDFSplitRate[];
}

export interface PDFOrder {
  id: string;
  orderNumber: string;
  entityDate: string;
  status: string;
  headerStatus?: string;
  orderType?: string;
  freightTerms?: string;
  shippingTerms?: string;
  markNumber?: string;
  factSoNumber?: string;
  dueDate?: string;
  projectedShipDate?: string;
  shipDate?: string;
  published?: boolean;
  creationType?: string;
  url?: string;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  endUserPerLineItem?: boolean;
  createdAt: string;
  createdById?: string;
  createdBy?: PDFUser;
  soldToCustomerId?: string;
  soldToCustomer?: PDFCustomer;
  billToCustomerId?: string;
  billToCustomer?: PDFCustomer;
  factoryId?: string;
  factory?: PDFFactory;
  quoteId?: string;
  jobId?: string;
  job?: PDFJob;
  balanceId?: string;
  balance?: PDFBalance;
  details: PDFOrderDetail[];
}

// Invoice Types
export interface PDFInvoiceDetail {
  id: string;
  itemNumber: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  discount: number;
  discountRate: number;
  commission?: number;
  commissionRate?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  totalLineCommission?: number;
  leadTime?: string;
  note?: string;
  status?: string;
  invoicedBalance?: number;
  divisionFactor?: number;
  productId?: string;
  product?: PDFProduct;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  endUserId?: string;
  uomId?: string;
  uom?: PDFUom;
  orderDetailId?: string;
  outsideSplitRates?: PDFSplitRate[];
}

export interface PDFInvoice {
  id: string;
  invoiceNumber: string;
  entityDate: string;
  status: string;
  dueDate?: string;
  locked?: boolean;
  published?: boolean;
  creationType?: string;
  url?: string;
  createdAt: string;
  createdById?: string;
  createdBy?: PDFUser;
  orderId?: string;
  order?: {
    id: string;
    orderNumber: string;
    entityDate?: string;
    status?: string;
    soldToCustomerId?: string;
    billToCustomerId?: string;
    factoryId?: string;
    freightTerms?: string;
    shippingTerms?: string;
    quoteId?: string;
    markNumber?: string;
  };
  factory?: PDFFactory;
  balanceId?: string;
  balance?: PDFBalance;
  details: PDFInvoiceDetail[];
}

// Check Types
export interface PDFCheckDetail {
  id: string;
  checkId: string;
  appliedAmount?: number;
  invoiceId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    entityDate?: string;
    status?: string;
    dueDate?: string;
    locked?: boolean;
    order?: {
      id: string;
      orderNumber: string;
      entityDate?: string;
      status?: string;
      soldToCustomerId?: string;
      billToCustomerId?: string;
    };
  };
  creditId?: string;
  credit?: {
    id: string;
    creditNumber: string;
    entityDate?: string;
    status?: string;
    creditType?: string;
    reason?: string;
    orderId?: string;
    order?: {
      id: string;
      orderNumber: string;
    };
  };
  adjustmentId?: string;
  adjustment?: {
    id: string;
    adjustmentNumber: string;
    entityDate?: string;
    status?: string;
    amount?: number;
    reason?: string;
    factoryId?: string;
    factory?: PDFFactory;
    customer?: PDFCustomer;
  };
}

export interface PDFCheck {
  id: string;
  checkNumber: string;
  entityDate: string;
  status: string;
  commissionMonth?: string;
  enteredCommissionAmount?: number;
  postDate?: string;
  url?: string;
  creationType?: string;
  createdAt: string;
  createdById?: string;
  createdBy?: PDFUser;
  factoryId?: string;
  factory?: PDFFactory;
  details: PDFCheckDetail[];
}

// Entity Types Union
export type PDFEntityType = 'PRE_OPPORTUNITIES' | 'QUOTES' | 'ORDERS' | 'INVOICES' | 'CHECKS';
export type PDFEntityData = PDFPreOpportunity | PDFQuote | PDFOrder | PDFInvoice | PDFCheck;

// ==========================================
// GraphQL Queries
// ==========================================

const PRE_OPPORTUNITY_PDF_QUERY = `
  query GetPreOpportunityForPDF($entityId: UUID!) {
    entity(entityId: $entityId, sourceType: PRE_OPPORTUNITIES) {
      ... on PreOpportunityResponse {
        id
        entityNumber
        entityDate
        customerRef
        status
        paymentTerms
        freightTerms
        expDate
        reviseDate
        acceptDate
        tags
        createdAt
        createdById
        createdBy {
          id
          email
          firstName
          lastName
          fullName
          role
          inside
          outside
        }
        soldToCustomerId
        billToCustomerId
        billToCustomerAddressId
        soldToCustomerAddressId
        jobId
        job {
          id
          jobName
          jobType
          description
          startDate
          endDate
          additionalInformation
          structuralDetails
          structuralInformation
          tags
        }
        balance {
          id
          quantity
          subtotal
          total
          discount
          discountRate
        }
        details {
          id
          itemNumber
          quantity
          unitPrice
          subtotal
          total
          discount
          discountRate
          leadTime
          factoryId
          factory {
            id
            title
            email
            phone
            accountNumber
            paymentTerms
            freightTerms
            leadTime
            baseCommissionRate
          }
          productId
          product {
            id
            factoryPartNumber
            description
            unitPrice
            leadTime
            upc
            minOrderQty
          }
          endUserId
        }
      }
    }
  }
`;

const QUOTE_PDF_QUERY = `
  query GetQuoteForPDF($entityId: UUID!) {
    entity(entityId: $entityId, sourceType: QUOTES) {
      ... on QuoteResponse {
        id
        quoteNumber
        entityDate
        customerRef
        status
        pipelineStage
        paymentTerms
        freightTerms
        expDate
        reviseDate
        acceptDate
        blanket
        published
        creationType
        versionOf
        url
        duplicatedFrom
        insidePerLineItem
        outsidePerLineItem
        factoryPerLineItem
        endUserPerLineItem
        createdAt
        createdById
        createdBy {
          id
          email
          firstName
          lastName
          fullName
          role
          inside
          outside
        }
        soldToCustomerId
        soldToCustomer {
          id
          companyName
          isParent
          parentId
          published
        }
        billToCustomerId
        billToCustomer {
          id
          companyName
          isParent
          parentId
          published
        }
        balanceId
        balance {
          id
          quantity
          subtotal
          total
          discount
          discountRate
          commission
          commissionRate
          commissionDiscount
          commissionDiscountRate
        }
        details {
          id
          itemNumber
          quantity
          unitPrice
          subtotal
          total
          discount
          discountRate
          commission
          commissionRate
          commissionDiscount
          commissionDiscountRate
          totalLineCommission
          leadTime
          note
          status
          factoryId
          productId
          product {
            id
            factoryPartNumber
            description
            unitPrice
            leadTime
            upc
            minOrderQty
            defaultCommissionRate
            commissionDiscountRate
            unitPriceDiscountRate
            defaultDivisor
          }
          productNameAdhoc
          productDescriptionAdhoc
          endUserId
          uom {
            id
            title
            divisionFactor
            description
          }
          insideSplitRates {
            id
            userId
            splitRate
            position
          }
          outsideSplitRates {
            id
            userId
            splitRate
            position
          }
        }
      }
    }
  }
`;

const ORDER_PDF_QUERY = `
  query GetOrderForPDF($entityId: UUID!) {
    entity(entityId: $entityId, sourceType: ORDERS) {
      ... on OrderResponse {
        id
        orderNumber
        entityDate
        status
        headerStatus
        orderType
        freightTerms
        shippingTerms
        markNumber
        factSoNumber
        dueDate
        projectedShipDate
        shipDate
        published
        creationType
        url
        insidePerLineItem
        outsidePerLineItem
        endUserPerLineItem
        createdAt
        createdById
        createdBy {
          id
          email
          firstName
          lastName
          fullName
          role
          inside
          outside
        }
        soldToCustomerId
        soldToCustomer {
          id
          companyName
          isParent
          parentId
          published
        }
        billToCustomerId
        billToCustomer {
          id
          companyName
          isParent
          parentId
          published
        }
        factoryId
        factory {
          id
          title
          email
          phone
          accountNumber
          paymentTerms
          freightTerms
          leadTime
          baseCommissionRate
          commissionDiscountRate
          overallDiscountRate
          additionalInformation
        }
        quoteId
        job {
          id
          jobName
          jobType
          description
          startDate
          endDate
          additionalInformation
          structuralDetails
          structuralInformation
          tags
        }
        balanceId
        balance {
          id
          quantity
          subtotal
          total
          discount
          discountRate
          commission
          commissionRate
          commissionDiscount
          commissionDiscountRate
          shippingBalance
          freightChargeBalance
          cancelledBalance
        }
        details {
          id
          itemNumber
          quantity
          unitPrice
          subtotal
          total
          discount
          discountRate
          commission
          commissionRate
          commissionDiscount
          commissionDiscountRate
          totalLineCommission
          leadTime
          note
          status
          shippingBalance
          cancelledBalance
          freightCharge
          productId
          product {
            id
            factoryPartNumber
            description
            unitPrice
            leadTime
            upc
            minOrderQty
            defaultCommissionRate
            commissionDiscountRate
            unitPriceDiscountRate
            defaultDivisor
          }
          productNameAdhoc
          productDescriptionAdhoc
          endUserId
          uom {
            id
            title
            divisionFactor
            description
          }
          insideSplitRates {
            id
            userId
            splitRate
            position
          }
          outsideSplitRates {
            id
            userId
            splitRate
            position
          }
        }
      }
    }
  }
`;

const INVOICE_PDF_QUERY = `
  query GetInvoiceForPDF($entityId: UUID!) {
    entity(entityId: $entityId, sourceType: INVOICES) {
      ... on InvoiceResponse {
        id
        invoiceNumber
        entityDate
        status
        dueDate
        locked
        published
        creationType
        url
        createdAt
        createdById
        createdBy {
          id
          email
          firstName
          lastName
          fullName
          role
          inside
          outside
        }
        orderId
        order {
          id
          orderNumber
          entityDate
          status
          soldToCustomerId
          billToCustomerId
          factoryId
          freightTerms
          shippingTerms
          quoteId
          markNumber
        }
        factory {
          id
          title
          email
          phone
          accountNumber
          paymentTerms
          freightTerms
          leadTime
          baseCommissionRate
          commissionDiscountRate
          overallDiscountRate
          additionalInformation
        }
        balanceId
        balance {
          id
          quantity
          subtotal
          total
          discount
          discountRate
          commission
          commissionRate
          commissionDiscount
          commissionDiscountRate
          paidBalance
        }
        details {
          id
          itemNumber
          quantity
          unitPrice
          subtotal
          total
          discount
          discountRate
          commission
          commissionRate
          commissionDiscount
          commissionDiscountRate
          totalLineCommission
          leadTime
          note
          status
          invoicedBalance
          divisionFactor
          productId
          product {
            id
            factoryPartNumber
            description
            unitPrice
            leadTime
            upc
            minOrderQty
            defaultCommissionRate
            commissionDiscountRate
            unitPriceDiscountRate
            defaultDivisor
          }
          productNameAdhoc
          productDescriptionAdhoc
          endUserId
          uomId
          uom {
            id
            title
            divisionFactor
            description
          }
          orderDetailId
          outsideSplitRates {
            id
            userId
            splitRate
            position
            user {
              id
              email
              firstName
              lastName
              fullName
              role
              inside
              outside
            }
          }
        }
      }
    }
  }
`;

const CHECK_PDF_QUERY = `
  query GetCheckForPDF($entityId: UUID!) {
    entity(entityId: $entityId, sourceType: CHECKS) {
      ... on CheckResponse {
        id
        checkNumber
        entityDate
        status
        commissionMonth
        enteredCommissionAmount
        postDate
        url
        creationType
        createdAt
        createdById
        factoryId
        factory {
          id
          title
          email
          phone
          accountNumber
          paymentTerms
          freightTerms
          leadTime
          baseCommissionRate
          commissionDiscountRate
          overallDiscountRate
          additionalInformation
        }
        details {
          id
          checkId
          appliedAmount
          invoiceId
          invoice {
            id
            invoiceNumber
            entityDate
            status
            dueDate
            locked
            order {
              id
              orderNumber
              entityDate
              status
              soldToCustomerId
              billToCustomerId
            }
          }
          creditId
          credit {
            id
            creditNumber
            entityDate
            status
            creditType
            reason
            orderId
            order {
              id
              orderNumber
            }
          }
          adjustmentId
          adjustment {
            id
            adjustmentNumber
            entityDate
            status
            amount
            reason
            factoryId
            factory {
              id
              title
              email
              phone
              accountNumber
            }
            customer {
              id
              companyName
              isParent
              parentId
              published
            }
          }
        }
      }
    }
  }
`;

// ==========================================
// Fetch Functions
// ==========================================

/**
 * Fetch Pre-Opportunity data for PDF generation
 */
export async function fetchPreOpportunityForPDF(entityId: string): Promise<PDFPreOpportunity | null> {
  const response = await crmGraphQLRequest<{ entity: PDFPreOpportunity | null }>({
    query: PRE_OPPORTUNITY_PDF_QUERY,
    variables: { entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunity for PDF');
  }

  return response.data?.entity || null;
}

/**
 * Fetch Quote data for PDF generation
 */
export async function fetchQuoteForPDF(entityId: string): Promise<PDFQuote | null> {
  const response = await crmGraphQLRequest<{ entity: PDFQuote | null }>({
    query: QUOTE_PDF_QUERY,
    variables: { entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch quote for PDF');
  }

  return response.data?.entity || null;
}

/**
 * Fetch Order data for PDF generation
 */
export async function fetchOrderForPDF(entityId: string): Promise<PDFOrder | null> {
  const response = await crmGraphQLRequest<{ entity: PDFOrder | null }>({
    query: ORDER_PDF_QUERY,
    variables: { entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch order for PDF');
  }

  return response.data?.entity || null;
}

/**
 * Fetch Invoice data for PDF generation
 */
export async function fetchInvoiceForPDF(entityId: string): Promise<PDFInvoice | null> {
  const response = await crmGraphQLRequest<{ entity: PDFInvoice | null }>({
    query: INVOICE_PDF_QUERY,
    variables: { entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch invoice for PDF');
  }

  return response.data?.entity || null;
}

/**
 * Fetch Check data for PDF generation
 */
export async function fetchCheckForPDF(entityId: string): Promise<PDFCheck | null> {
  const response = await crmGraphQLRequest<{ entity: PDFCheck | null }>({
    query: CHECK_PDF_QUERY,
    variables: { entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch check for PDF');
  }

  return response.data?.entity || null;
}

/**
 * Generic fetch function for any entity type
 */
export async function fetchEntityForPDF(
  entityId: string,
  entityType: PDFEntityType
): Promise<PDFEntityData | null> {
  switch (entityType) {
    case 'PRE_OPPORTUNITIES':
      return fetchPreOpportunityForPDF(entityId);
    case 'QUOTES':
      return fetchQuoteForPDF(entityId);
    case 'ORDERS':
      return fetchOrderForPDF(entityId);
    case 'INVOICES':
      return fetchInvoiceForPDF(entityId);
    case 'CHECKS':
      return fetchCheckForPDF(entityId);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
