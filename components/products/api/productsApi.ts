/**
 * Products API Module
 * Complete implementation of Products GraphQL API endpoints
 * Includes Products, Product Categories, and Product UOMs
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Types
// ============================================================================

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
  category?: ProductCategory;
  uom?: ProductUom;
  factory?: { id: string; title: string };
}

// Input Types
export interface CreateProductInput {
  factoryId: string;
  factoryPartNumber: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  productUomId: string; // Required by schema
  productCategoryId?: string;
  published?: boolean;
  approvalNeeded?: boolean;
  description?: string;
}

export interface UpdateProductInput {
  factoryId: string; // Required by schema
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

// ============================================================================
// Product CPN (Customer Part Number) Types
// ============================================================================

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

// ============================================================================
// Product Quantity Pricing Types
// ============================================================================

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

// Filter and Pagination Types
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

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_PRODUCT_BY_ID = `
  query FindProductById($id: UUID!) {
    product(id: $id) {
      approvalNeeded
      category {
        commissionRate
        factoryId
        id
        title
        parent {
          id
          title
          commissionRate
          factoryId
        }
        grandparent {
          id
          title
          commissionRate
          factoryId
        }
      }
      defaultCommissionRate
      description
      factory {
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        externalPaymentTerms
        email
        freightDiscountType
        freightTerms
        id
        leadTime
        logoId
        overallDiscountRate
        paymentTerms
        phone
        published
        title
      }
      factoryPartNumber
      id
      published
      unitPrice
      uom {
        description
        divisionFactor
        id
        title
      }
    }
  }
`;

const PRODUCT_UOMS = `
  query ProductUoms {
    productUoms {
      id
      title
      description
      divisionFactor
    }
  }
`;

const PRODUCT_CATEGORIES = `
  query ProductCategories($factoryId: UUID, $grandparentId: UUID, $parentId: UUID) {
    productCategories(factoryId: $factoryId, grandparentId: $grandparentId, parentId: $parentId) {
      commissionRate
      factoryId
      id
      title
      parent {
        id
        title
        commissionRate
        factoryId
      }
      grandparent {
        id
        title
        commissionRate
        factoryId
      }
    }
  }
`;

const PRODUCT_CATEGORY_SEARCH = `
  query ProductCategorySearch($searchTerm: String!, $factoryId: UUID!, $limit: Int) {
    productCategorySearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
      commissionRate
      factoryId
      id
      title
      parent {
        id
        title
        commissionRate
        factoryId
      }
      grandparent {
        id
        title
        commissionRate
        factoryId
      }
    }
  }
`;

const PRODUCT_SEARCH = `
  query ProductSearch($searchTerm: String!, $factoryId: UUID, $limit: Int) {
    productSearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
      id
      factoryPartNumber
      description
      unitPrice
      defaultCommissionRate
      approvalNeeded
      published
      category {
        id
        title
        commissionRate
        factoryId
        parent {
          id
          title
          commissionRate
          factoryId
        }
        grandparent {
          id
          title
          commissionRate
          factoryId
        }
      }
      uom {
        id
        title
        description
        divisionFactor
      }
      factory {
        id
        title
      }
    }
  }
`;

const PRODUCT_LANDING_PAGES = `
  query ProductLandingPages($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: PRODUCTS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on ProductLandingPage {
          id
          approvalNeeded
          categoryTitle
          createdAt
          createdBy
          defaultCommissionRate
          description
          factoryPartNumber
          factoryTitle
          published
          unitPrice
          uomTitle
        }
      }
      total
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_PRODUCT = `
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      factoryPartNumber
      unitPrice
      defaultCommissionRate
      approvalNeeded
      description
      published
      category {
        id
        title
        commissionRate
        factoryId
        parent {
          id
          title
          commissionRate
          factoryId
        }
        grandparent {
          id
          title
          commissionRate
          factoryId
        }
      }
      uom {
        id
        title
        description
        divisionFactor
      }
      factory {
        id
        title
      }
    }
  }
`;

const UPDATE_PRODUCT = `
  mutation UpdateProduct($id: UUID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      factoryPartNumber
      unitPrice
      defaultCommissionRate
      approvalNeeded
      description
      published
      category {
        id
        title
        commissionRate
        factoryId
        parent {
          id
          title
          commissionRate
          factoryId
        }
        grandparent {
          id
          title
          commissionRate
          factoryId
        }
      }
      uom {
        id
        title
        description
        divisionFactor
      }
      factory {
        id
        title
      }
    }
  }
`;

const DELETE_PRODUCT = `
  mutation DeleteProduct($id: UUID!) {
    deleteProduct(id: $id)
  }
`;

const CREATE_PRODUCT_CATEGORY = `
  mutation CreateProductCategory($input: ProductCategoryInput!) {
    createProductCategory(input: $input) {
      id
      title
      commissionRate
      factoryId
      parent {
        id
        title
        commissionRate
        factoryId
      }
      grandparent {
        id
        title
        commissionRate
        factoryId
      }
    }
  }
`;

const UPDATE_PRODUCT_CATEGORY = `
  mutation UpdateProductCategory($id: UUID!, $input: ProductCategoryInput!) {
    updateProductCategory(id: $id, input: $input) {
      id
      title
      commissionRate
      factoryId
      parent {
        id
        title
        commissionRate
        factoryId
      }
      grandparent {
        id
        title
        commissionRate
        factoryId
      }
    }
  }
`;

const DELETE_PRODUCT_CATEGORY = `
  mutation DeleteProductCategory($id: UUID!) {
    deleteProductCategory(id: $id)
  }
`;

const CREATE_PRODUCT_UOM = `
  mutation CreateProductUom($input: ProductUomInput!) {
    createProductUom(input: $input) {
      id
      title
      description
      divisionFactor
    }
  }
`;

const UPDATE_PRODUCT_UOM = `
  mutation UpdateProductUom($id: UUID!, $input: ProductUomInput!) {
    updateProductUom(id: $id, input: $input) {
      id
      title
      description
      divisionFactor
    }
  }
`;

const DELETE_PRODUCT_UOM = `
  mutation DeleteProductUom($id: UUID!) {
    deleteProductUom(id: $id)
  }
`;

// ============================================================================
// GraphQL - Product CPN (Customer Part Numbers)
// ============================================================================

const FIND_PRODUCT_CPN_BY_ID = `
  query FindProductCpnById($id: UUID!) {
    findProductCpnById(id: $id) {
      id
      productId
      customerId
      customerPartNumber
      unitPrice
      commissionRate
      product {
        id
        factoryPartNumber
        description
        unitPrice
        defaultCommissionRate
        approvalNeeded
        published
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
`;

const LIST_PRODUCT_CPNS_BY_PRODUCT_ID = `
  query ListProductCpnsByProductId($productId: UUID!) {
    listProductCpnsByProductId(productId: $productId) {
      id
      productId
      customerId
      customerPartNumber
      unitPrice
      commissionRate
      product {
        id
        factoryPartNumber
        description
        unitPrice
        defaultCommissionRate
        approvalNeeded
        published
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
`;

const CREATE_PRODUCT_CPN = `
  mutation CreateProductCpn($input: ProductCpnInput!) {
    createProductCpn(input: $input) {
      id
      productId
      customerId
      customerPartNumber
      unitPrice
      commissionRate
      product {
        id
        factoryPartNumber
        description
        unitPrice
        defaultCommissionRate
        approvalNeeded
        published
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
`;

const UPDATE_PRODUCT_CPN = `
  mutation UpdateProductCpn($id: UUID!, $input: ProductCpnInput!) {
    updateProductCpn(id: $id, input: $input) {
      id
      productId
      customerId
      customerPartNumber
      unitPrice
      commissionRate
      product {
        id
        factoryPartNumber
        description
        unitPrice
        defaultCommissionRate
        approvalNeeded
        published
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
`;

const DELETE_PRODUCT_CPN = `
  mutation DeleteProductCpn($id: UUID!) {
    deleteProductCpn(id: $id)
  }
`;

// ============================================================================
// GraphQL - Product Quantity Pricing
// ============================================================================

const FIND_PRODUCT_QUANTITY_PRICING_BY_ID = `
  query FindProductQuantityPricingById($id: UUID!) {
    findProductQuantityPricingById(id: $id) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

const LIST_PRODUCT_QUANTITY_PRICING_BY_PRODUCT_ID = `
  query ListProductQuantityPricingByProductId($productId: UUID!) {
    listProductQuantityPricingByProductId(productId: $productId) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

const CREATE_PRODUCT_QUANTITY_PRICING = `
  mutation CreateProductQuantityPricing($input: ProductQuantityPricingInput!) {
    createProductQuantityPricing(input: $input) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

const UPDATE_PRODUCT_QUANTITY_PRICING = `
  mutation UpdateProductQuantityPricing($id: UUID!, $input: ProductQuantityPricingInput!) {
    updateProductQuantityPricing(id: $id, input: $input) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

const DELETE_PRODUCT_QUANTITY_PRICING = `
  mutation DeleteProductQuantityPricing($id: UUID!) {
    deleteProductQuantityPricing(id: $id)
  }
`;

// ============================================================================
// API Functions - Products
// ============================================================================

/**
 * Fetch products using findLandingPages endpoint with pagination
 */
export async function fetchProductsWithPagination(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy,
  pagination?: PaginationParams
): Promise<PaginatedProductsResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: ProductLandingPage[]; total: number };
  }>({
    query: PRODUCT_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch products');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch all products (no pagination)
 */
export async function fetchProducts(): Promise<ProductLandingPage[]> {
  const result = await fetchProductsWithPagination();
  return result.records;
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  const response = await crmGraphQLRequest<{ product: Product }>({
    query: FIND_PRODUCT_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product');
  }

  return response.data?.product || null;
}

/**
 * Search products with optional filters
 */
export async function searchProductsApi(
  searchTerm?: string,
  factoryId?: string,
  _productCategoryIds?: string[], // Kept for API compatibility but not used in query
  limit?: number
): Promise<ProductSearchResult[]> {
  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: PRODUCT_SEARCH,
    variables: {
      searchTerm: searchTerm || '', // Ensure non-null for GraphQL String!
      factoryId,
      limit: limit ?? 50,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await crmGraphQLRequest<{ createProduct: Product }>({
    query: CREATE_PRODUCT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product');
  }

  if (!response.data?.createProduct) {
    throw new Error('No product returned from create mutation');
  }

  return response.data.createProduct;
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const response = await crmGraphQLRequest<{ updateProduct: Product }>({
    query: UPDATE_PRODUCT,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product');
  }

  if (!response.data?.updateProduct) {
    throw new Error('No product returned from update mutation');
  }

  return response.data.updateProduct;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProduct: string }>({
    query: DELETE_PRODUCT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product');
  }

  return true;
}

// ============================================================================
// API Functions - Product UOMs
// ============================================================================

/**
 * Fetch all product UOMs
 */
export async function fetchProductUoms(): Promise<ProductUom[]> {
  const response = await crmGraphQLRequest<{ productUoms: ProductUom[] }>({
    query: PRODUCT_UOMS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product UOMs');
  }

  return response.data?.productUoms || [];
}

/**
 * Create a new product UOM
 */
export async function createProductUom(input: CreateProductUomInput): Promise<ProductUom> {
  const response = await crmGraphQLRequest<{ createProductUom: ProductUom }>({
    query: CREATE_PRODUCT_UOM,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product UOM');
  }

  if (!response.data?.createProductUom) {
    throw new Error('No UOM returned from create mutation');
  }

  return response.data.createProductUom;
}

/**
 * Update an existing product UOM
 */
export async function updateProductUom(id: string, input: UpdateProductUomInput): Promise<ProductUom> {
  const response = await crmGraphQLRequest<{ updateProductUom: ProductUom }>({
    query: UPDATE_PRODUCT_UOM,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product UOM');
  }

  if (!response.data?.updateProductUom) {
    throw new Error('No UOM returned from update mutation');
  }

  return response.data.updateProductUom;
}

/**
 * Delete a product UOM
 */
export async function deleteProductUom(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductUom: string }>({
    query: DELETE_PRODUCT_UOM,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product UOM');
  }

  return true;
}

// ============================================================================
// API Functions - Product Categories
// ============================================================================

/**
 * Fetch product categories
 */
export async function fetchProductCategories(
  factoryId?: string,
  parentId?: string,
  grandparentId?: string
): Promise<ProductCategory[]> {
  const response = await crmGraphQLRequest<{ productCategories: ProductCategory[] }>({
    query: PRODUCT_CATEGORIES,
    variables: { factoryId, parentId, grandparentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product categories');
  }

  return response.data?.productCategories || [];
}

/**
 * Search product categories
 */
export async function searchProductCategories(
  searchTerm: string,
  factoryId: string,
  limit?: number
): Promise<ProductCategory[]> {
  const response = await crmGraphQLRequest<{ productCategorySearch: ProductCategory[] }>({
    query: PRODUCT_CATEGORY_SEARCH,
    variables: { searchTerm, factoryId, limit: limit ?? 20 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search product categories');
  }

  return response.data?.productCategorySearch || [];
}

/**
 * Create a new product category
 */
export async function createProductCategory(input: CreateProductCategoryInput): Promise<ProductCategory> {
  const response = await crmGraphQLRequest<{ createProductCategory: ProductCategory }>({
    query: CREATE_PRODUCT_CATEGORY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product category');
  }

  if (!response.data?.createProductCategory) {
    throw new Error('No category returned from create mutation');
  }

  return response.data.createProductCategory;
}

/**
 * Update an existing product category
 */
export async function updateProductCategory(
  id: string,
  input: UpdateProductCategoryInput
): Promise<ProductCategory> {
  const response = await crmGraphQLRequest<{ updateProductCategory: ProductCategory }>({
    query: UPDATE_PRODUCT_CATEGORY,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product category');
  }

  if (!response.data?.updateProductCategory) {
    throw new Error('No category returned from update mutation');
  }

  return response.data.updateProductCategory;
}

/**
 * Delete a product category
 */
export async function deleteProductCategory(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductCategory: string }>({
    query: DELETE_PRODUCT_CATEGORY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product category');
  }

  return true;
}

// ============================================================================
// API Functions - Factory Search (for product creation)
// ============================================================================

export interface FactorySearchResult {
  id: string;
  title: string;
  accountNumber?: string;
  published?: boolean;
}

const SEARCH_FACTORIES = `
  query FactorySearch($searchTerm: String!, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, published: $published) {
      id
      title
      accountNumber
      published
    }
  }
`;

/**
 * Search factories
 */
export async function searchFactories(searchTerm: string, published?: boolean): Promise<FactorySearchResult[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactorySearchResult[] }>({
    query: SEARCH_FACTORIES,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

// ============================================================================
// API Functions - Product CPN (Customer Part Numbers)
// ============================================================================

/**
 * Fetch a single CPN by ID
 */
export async function fetchProductCpnById(id: string): Promise<ProductCpn | null> {
  const response = await crmGraphQLRequest<{ findProductCpnById: ProductCpn }>({
    query: FIND_PRODUCT_CPN_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product CPN');
  }

  return response.data?.findProductCpnById || null;
}

/**
 * List all CPNs for a product
 */
export async function listProductCpnsByProductId(productId: string): Promise<ProductCpn[]> {
  const response = await crmGraphQLRequest<{ listProductCpnsByProductId: ProductCpn[] }>({
    query: LIST_PRODUCT_CPNS_BY_PRODUCT_ID,
    variables: { productId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product CPNs');
  }

  return response.data?.listProductCpnsByProductId || [];
}

/**
 * Create a new product CPN
 */
export async function createProductCpn(input: ProductCpnInput): Promise<ProductCpn> {
  const response = await crmGraphQLRequest<{ createProductCpn: ProductCpn }>({
    query: CREATE_PRODUCT_CPN,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product CPN');
  }

  if (!response.data?.createProductCpn) {
    throw new Error('No CPN returned from create mutation');
  }

  return response.data.createProductCpn;
}

/**
 * Update an existing product CPN
 */
export async function updateProductCpn(id: string, input: ProductCpnInput): Promise<ProductCpn> {
  const response = await crmGraphQLRequest<{ updateProductCpn: ProductCpn }>({
    query: UPDATE_PRODUCT_CPN,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product CPN');
  }

  if (!response.data?.updateProductCpn) {
    throw new Error('No CPN returned from update mutation');
  }

  return response.data.updateProductCpn;
}

/**
 * Delete a product CPN
 */
export async function deleteProductCpn(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductCpn: boolean }>({
    query: DELETE_PRODUCT_CPN,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product CPN');
  }

  return true;
}

// ============================================================================
// API Functions - Customer Search (for CPN customer selection)
// ============================================================================

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  isParent: boolean;
  parentId?: string;
  published: boolean;
}

const SEARCH_CUSTOMERS = `
  query CustomerSearch($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
      isParent
      parentId
      published
    }
  }
`;

/**
 * Search customers for CPN creation
 */
export async function searchCustomers(searchTerm: string, published?: boolean): Promise<CustomerSearchResult[]> {
  const response = await crmGraphQLRequest<{ customerSearch: CustomerSearchResult[] }>({
    query: SEARCH_CUSTOMERS,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search customers');
  }

  return response.data?.customerSearch || [];
}

// ============================================================================
// API Functions - Product Quantity Pricing
// ============================================================================

/**
 * Fetch a single quantity pricing by ID
 */
export async function fetchProductQuantityPricingById(id: string): Promise<ProductQuantityPricing | null> {
  const response = await crmGraphQLRequest<{ findProductQuantityPricingById: ProductQuantityPricing }>({
    query: FIND_PRODUCT_QUANTITY_PRICING_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product quantity pricing');
  }

  return response.data?.findProductQuantityPricingById || null;
}

/**
 * List all quantity pricing tiers for a product
 */
export async function listProductQuantityPricingByProductId(productId: string): Promise<ProductQuantityPricing[]> {
  const response = await crmGraphQLRequest<{ listProductQuantityPricingByProductId: ProductQuantityPricing[] }>({
    query: LIST_PRODUCT_QUANTITY_PRICING_BY_PRODUCT_ID,
    variables: { productId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product quantity pricing');
  }

  return response.data?.listProductQuantityPricingByProductId || [];
}

/**
 * Create a new product quantity pricing tier
 */
export async function createProductQuantityPricing(input: ProductQuantityPricingInput): Promise<ProductQuantityPricing> {
  const response = await crmGraphQLRequest<{ createProductQuantityPricing: ProductQuantityPricing }>({
    query: CREATE_PRODUCT_QUANTITY_PRICING,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product quantity pricing');
  }

  if (!response.data?.createProductQuantityPricing) {
    throw new Error('No quantity pricing returned from create mutation');
  }

  return response.data.createProductQuantityPricing;
}

/**
 * Update an existing product quantity pricing tier
 */
export async function updateProductQuantityPricing(id: string, input: ProductQuantityPricingInput): Promise<ProductQuantityPricing> {
  const response = await crmGraphQLRequest<{ updateProductQuantityPricing: ProductQuantityPricing }>({
    query: UPDATE_PRODUCT_QUANTITY_PRICING,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product quantity pricing');
  }

  if (!response.data?.updateProductQuantityPricing) {
    throw new Error('No quantity pricing returned from update mutation');
  }

  return response.data.updateProductQuantityPricing;
}

/**
 * Delete a product quantity pricing tier
 */
export async function deleteProductQuantityPricing(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductQuantityPricing: boolean }>({
    query: DELETE_PRODUCT_QUANTITY_PRICING,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product quantity pricing');
  }

  return true;
}
