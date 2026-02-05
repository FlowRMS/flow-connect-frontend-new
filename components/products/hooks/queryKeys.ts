import type { ProductLandingPageFilter, ProductLandingPageOrderBy } from '../api';

export const productQueryKeys = {
  all: ['products'] as const,

  // Products
  products: () => [...productQueryKeys.all, 'list'] as const,
  productLandingPages: (filters?: ProductLandingPageFilter[], orderBy?: ProductLandingPageOrderBy[]) =>
    [...productQueryKeys.all, 'landingPages', { filters, orderBy }] as const,
  product: (id: string) => [...productQueryKeys.all, 'detail', id] as const,
  productSearch: (searchTerm?: string, factoryId?: string, categoryIds?: string[]) =>
    [...productQueryKeys.all, 'search', { searchTerm, factoryId, categoryIds }] as const,

  // UOMs
  uoms: () => [...productQueryKeys.all, 'uoms'] as const,

  // Categories
  categories: (factoryId?: string) => [...productQueryKeys.all, 'categories', { factoryId }] as const,
  categorySearch: (searchTerm: string, factoryId: string) =>
    [...productQueryKeys.all, 'categorySearch', { searchTerm, factoryId }] as const,

  // Factories
  factorySearch: (searchTerm: string) =>
    [...productQueryKeys.all, 'factorySearch', { searchTerm }] as const,

  // CPNs (Customer Part Numbers)
  cpns: (productId: string) => [...productQueryKeys.all, 'cpns', productId] as const,
  cpn: (id: string) => [...productQueryKeys.all, 'cpn', id] as const,

  // Customer Search
  customerSearch: (searchTerm: string) =>
    [...productQueryKeys.all, 'customerSearch', { searchTerm }] as const,

  // Quantity Pricing
  quantityPricing: (productId: string) => [...productQueryKeys.all, 'quantityPricing', productId] as const,
  quantityPricingItem: (id: string) => [...productQueryKeys.all, 'quantityPricingItem', id] as const,
};
