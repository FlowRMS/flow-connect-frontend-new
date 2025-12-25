/**
 * Products API Module
 * Complete implementation of Products GraphQL API endpoints
 * Includes Products, Product Categories, and Product UOMs
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  inside?: boolean;
  lastName?: string;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface SplitRate {
  id: string;
  factoryId: string;
  position: number;
  splitRate: string;
  user?: User;
}

export interface ProductCategory {
  id: string;
  title: string;
  commissionRate?: number;
  factoryId?: string;
}

export interface ProductUom {
  id: string;
  title: string;
  description?: string;
  multiply: boolean;
  multiplyBy?: number;
}

export interface Factory {
  id: string;
  title: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: number;
  commissionDiscountRate?: number;
  createdBy?: User;
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
  splitRates?: SplitRate[];
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
  factoryId: string;
  commissionRate?: number;
  parentId?: string;
  grandparentId?: string;
}

export interface UpdateProductCategoryInput {
  title?: string;
  commissionRate?: number;
  parentId?: string;
  grandparentId?: string;
}

export interface CreateProductUomInput {
  title: string;
  description?: string;
  multiply: boolean;
  multiplyBy?: number;
}

export interface UpdateProductUomInput {
  title?: string;
  description?: string;
  multiply?: boolean;
  multiplyBy?: number;
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
    findProductById(id: $id) {
      approvalNeeded
      category {
        commissionRate
        factoryId
        id
        title
      }
      defaultCommissionRate
      description
      factory {
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        createdBy {
          authProviderId
          enabled
          email
          firstName
          fullName
          id
          inside
          lastName
          outside
          role
          username
        }
        email
        externalPaymentTerms
        freightDiscountType
        freightTerms
        id
        leadTime
        logoId
        overallDiscountRate
        paymentTerms
        phone
        published
        splitRates {
          factoryId
          id
          position
          splitRate
          user {
            authProviderId
            email
            enabled
            firstName
            fullName
            id
            inside
            lastName
            outside
            role
            username
          }
        }
        title
      }
      factoryPartNumber
      id
      published
      unitPrice
      uom {
        description
        id
        multiply
        multiplyBy
        title
      }
    }
  }
`;

const PRODUCT_UOMS = `
  query ProductUoms {
    productUoms {
      description
      id
      multiply
      multiplyBy
      title
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
      }
      uom {
        id
        title
        description
        multiply
        multiplyBy
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
      }
      uom {
        id
        title
        description
        multiply
        multiplyBy
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
      }
      uom {
        id
        title
        description
        multiply
        multiplyBy
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
      multiply
      multiplyBy
    }
  }
`;

const UPDATE_PRODUCT_UOM = `
  mutation UpdateProductUom($id: UUID!, $input: ProductUomInput!) {
    updateProductUom(id: $id, input: $input) {
      id
      title
      description
      multiply
      multiplyBy
    }
  }
`;

const DELETE_PRODUCT_UOM = `
  mutation DeleteProductUom($id: UUID!) {
    deleteProductUom(id: $id)
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
  const response = await crmGraphQLRequest<{ findProductById: Product }>({
    query: FIND_PRODUCT_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product');
  }

  return response.data?.findProductById || null;
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
