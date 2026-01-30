export interface ParsedQuantityPricing {
  quantityLow: number;
  quantityHigh: number | null;
  unitPrice: number;
}

export interface ParsedCustomerPricing {
  customerName: string;
  customerPartNumber?: string;
  unitPrice: number;
  commissionRate: number;
}

export interface ParsedProduct {
  factoryPartNumber: string;
  description: string;
  unitPrice: number;
  upc: string;
  category?: string;
  defaultCommissionRate?: number;
  quantityPricing: ParsedQuantityPricing[];
  customerPricing: ParsedCustomerPricing[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  quantityPricing: number;
  customerPricingCreated: number;
  customerPricingUpdated: number;
  customersNotFound: string[];
  errors: Array<{ factoryPartNumber: string; error: string }>;
}
