export interface ProductCategoryBase {
  id: string;
  title: string;
  commissionRate?: number;
  factoryId?: string;
}

export interface ProductCategory extends ProductCategoryBase {
  parent?: ProductCategoryBase;
  grandparent?: ProductCategoryBase;
}

export interface ProductUom {
  id: string;
  title: string;
  description?: string;
  divisionFactor?: number;
}

export interface Factory {
  id: string;
  title: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: number;
  commissionDiscountRate?: number;
  email?: string;
  externalPaymentTerms?: string;
  freightDiscountType?: string;
  freightTerms?: string;
  leadTime?: string;
  logoId?: string;
  overallDiscountRate?: number;
  paymentTerms?: string;
  phone?: string;
  published?: boolean;
}

export interface Product {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  approvalNeeded: boolean;
  published: boolean;
  category?: ProductCategory;
  uom?: ProductUom;
  factory?: Factory;
}

export interface ProductLandingPage {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  approvalNeeded: boolean;
  published: boolean;
  categoryTitle?: string;
  uomTitle?: string;
  factoryTitle?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface ProductSearchResult {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  approvalNeeded: boolean;
  published: boolean;
  approvalComments?: string;
  approvalDate?: string;
  commissionDiscountRate?: number;
  defaultDivisor?: number;
  leadTime?: string;
  minOrderQty?: number;
  tags?: string[];
  unitPriceDiscountRate?: number;
  upc?: string;
}

export interface CreateProductInput {
  factoryId: string;
  factoryPartNumber: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  productUomId: string;
  productCategoryId?: string;
  published?: boolean;
  approvalNeeded?: boolean;
  description?: string;
}

export interface UpdateProductInput {
  factoryId: string;
  factoryPartNumber?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  productUomId?: string;
  productCategoryId?: string;
  published?: boolean;
  approvalNeeded?: boolean;
  description?: string;
}

export interface CreateProductCategoryInput {
  title: string;
  factoryId?: string;
  commissionRate?: number;
  parentId?: string;
  grandparentId?: string;
}

export interface UpdateProductCategoryInput {
  title?: string;
  factoryId?: string;
  commissionRate?: number;
  parentId?: string;
  grandparentId?: string;
}

export interface CreateProductUomInput {
  title: string;
  divisionFactor?: number;
  description?: string;
}

export interface UpdateProductUomInput {
  title?: string;
  divisionFactor?: number;
  description?: string;
}

export interface ProductLiteResponse {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  approvalNeeded: boolean;
  published: boolean;
}

export interface CustomerLiteResponse {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

export interface ProductCpn {
  id: string;
  productId: string;
  customerId: string;
  customerPartNumber: string;
  unitPrice: number;
  commissionRate: number;
  product?: ProductLiteResponse;
  customer?: CustomerLiteResponse;
}

export interface ProductCpnInput {
  productId: string;
  customerId: string;
  customerPartNumber: string;
  unitPrice: string;
  commissionRate: string;
}

export interface ProductQuantityPricing {
  id: string;
  productId: string;
  quantityLow: number;
  quantityHigh: number;
  unitPrice: number;
}

export interface ProductQuantityPricingInput {
  productId: string;
  quantityLow: string;
  quantityHigh: string;
  unitPrice: string;
}

export interface ProductLandingPageFilter {
  operator: string;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface ProductLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedProductsResult {
  records: ProductLandingPage[];
  total: number;
}

export interface FactorySearchResult {
  id: string;
  title: string;
  accountNumber?: string;
  published?: boolean;
}

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

export interface QuantityPricingImportInput {
  quantityLow: string;
  quantityHigh: string | null;
  unitPrice: string;
}

export interface CustomerPricingImportInput {
  customerName: string;
  customerPartNumber?: string;
  unitPrice: string;
  commissionRate: string;
}

export interface ProductImportItemInput {
  factoryPartNumber: string;
  unitPrice: string;
  description?: string;
  upc?: string;
  category?: string;
  defaultCommissionRate?: string;
  quantityPricing?: QuantityPricingImportInput[];
  customerPricing?: CustomerPricingImportInput[];
}

export interface ProductImportInput {
  factoryId: string;
  products: ProductImportItemInput[];
}

export interface ProductImportError {
  factoryPartNumber: string;
  error: string;
}

export interface ProductImportResult {
  success: boolean;
  productsCreated: number;
  productsUpdated: number;
  quantityPricingCreated: number;
  customerPricingCreated: number;
  customerPricingUpdated: number;
  errors: ProductImportError[];
  message: string;
  customersNotFound: string[];
}
