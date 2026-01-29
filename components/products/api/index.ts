// Types
export type {
  ProductCategoryBase,
  ProductCategory,
  ProductUom,
  Factory,
  Product,
  ProductLandingPage,
  ProductSearchResult,
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  CreateProductUomInput,
  UpdateProductUomInput,
  ProductLiteResponse,
  CustomerLiteResponse,
  ProductCpn,
  ProductCpnInput,
  ProductQuantityPricing,
  ProductQuantityPricingInput,
  ProductLandingPageFilter,
  ProductLandingPageOrderBy,
  PaginationParams,
  PaginatedProductsResult,
  FactorySearchResult,
  CustomerSearchResult,
  QuantityPricingImportInput,
  CustomerPricingImportInput,
  ProductImportItemInput,
  ProductImportInput,
  ProductImportError,
  ProductImportResult,
} from './types/productTypes';

// Product API Functions
export {
  fetchProductsWithPagination,
  fetchProducts,
  fetchProductById,
  searchProductsApi,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchAllProductIds,
} from './functions/productApi';

// Product UOM API Functions
export {
  fetchProductUoms,
  createProductUom,
  updateProductUom,
  deleteProductUom,
} from './functions/productUomApi';

// Product Category API Functions
export {
  fetchProductCategories,
  searchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from './functions/productCategoryApi';

// Product CPN API Functions
export {
  fetchProductCpnById,
  listProductCpnsByProductId,
  createProductCpn,
  updateProductCpn,
  deleteProductCpn,
} from './functions/productCpnApi';

// Product Quantity Pricing API Functions
export {
  fetchProductQuantityPricingById,
  listProductQuantityPricingByProductId,
  createProductQuantityPricing,
  updateProductQuantityPricing,
  deleteProductQuantityPricing,
} from './functions/productQuantityPricingApi';

// Product Import API Functions
export { importProducts } from './functions/productImportApi';

// Search API Functions
export { searchFactories, searchCustomers } from './functions/searchApi';

// Hooks
export * from './useProductsApi';
