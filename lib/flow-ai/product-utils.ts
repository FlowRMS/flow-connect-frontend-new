export interface QuantityPricing {
  quantityLow: number | string;
  quantityHigh?: number | string | null;
  unitPrice: number | string;
}

export interface CustomerPricing {
  customerName: string;
  customerPartNumber?: string;
  unitPrice: number | string;
  commissionRate: number | string;
}

export interface NormalizedProduct {
  factoryPartNumber: string;
  description: string;
  unitPrice: number;
  upc: string;
  category: string;
  defaultCommissionRate?: number;
  quantityPricing: QuantityPricing[];
  customerPricing: CustomerPricing[];
}

const FACTORY_PATTERNS: Record<string, RegExp[]> = {
  esa: [/\besa\b/i, /\bessalpha\b/i, /\besa\s*fabrication\b/i, /\besafab\b/i],
  kps: [/\bkps\b/i, /\bkeypart\b/i, /\bkey[-\s]?part\b/i, /\bkps\s*industries\b/i],
};

export function detectFactoryFromPrompt(prompt: string): string | null {
  for (const [factory, patterns] of Object.entries(FACTORY_PATTERNS)) {
    if (patterns.some((p) => p.test(prompt))) {
      return factory;
    }
  }
  return null;
}

export function looksLikeProduct(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const product = obj as Record<string, unknown>;
  return (
    'factoryPartNumber' in product ||
    'partNumber' in product ||
    'sku' in product ||
    'part_number' in product ||
    'factory_part_number' in product ||
    'SAP_MATERIAL_NUMBER' in product ||
    'sap_material_number' in product ||
    'SKU_NUMBER' in product ||
    'sku_number' in product ||
    'product_id' in product ||
    'PRODUCT_ID' in product
  );
}

export function isProductImportJson(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  // Check for direct products array
  if (Array.isArray(obj.products) && obj.products.length > 0) {
    if (looksLikeProduct(obj.products[0])) return true;
  }

  // Check for output_file + preview_products structure (streaming)
  if (obj.output_file && Array.isArray(obj.preview_products) && obj.preview_products.length > 0) {
    if (looksLikeProduct(obj.preview_products[0])) return true;
  }

  // Check for output_file + preview_rows structure (KPS streaming)
  if (obj.output_file && Array.isArray(obj.preview_rows) && obj.preview_rows.length > 0) {
    if (looksLikeProduct(obj.preview_rows[0])) return true;
  }

  // Check for nested result.products
  const result = obj.result as Record<string, unknown> | undefined;
  if (result && Array.isArray(result.products) && result.products.length > 0) {
    if (looksLikeProduct(result.products[0])) return true;
  }

  // Check for nested data.products
  const dataObj = obj.data as Record<string, unknown> | undefined;
  if (dataObj && Array.isArray(dataObj.products) && dataObj.products.length > 0) {
    if (looksLikeProduct(dataObj.products[0])) return true;
  }

  // Check if data itself is an array of products
  if (Array.isArray(data) && data.length > 0) {
    if (looksLikeProduct(data[0])) return true;
  }

  return false;
}

export function normalizeProduct(product: unknown): NormalizedProduct {
  if (!product || typeof product !== 'object') {
    return {
      factoryPartNumber: '',
      description: '',
      unitPrice: 0,
      upc: '',
      category: '',
      quantityPricing: [],
      customerPricing: [],
    };
  }

  const p = product as Record<string, unknown>;

  const factoryPartNumber =
    (p.factoryPartNumber as string) ||
    (p.partNumber as string) ||
    (p.part_number as string) ||
    (p.factory_part_number as string) ||
    (p.SAP_MATERIAL_NUMBER as string) ||
    (p.sap_material_number as string) ||
    (p.SKU_NUMBER as string) ||
    (p.sku_number as string) ||
    (p.sku as string) ||
    (p.product_id as string) ||
    (p.PRODUCT_ID as string) ||
    '';

  const description =
    (p.description as string) ||
    (p.DESCRIPTION as string) ||
    (p.product_name as string) ||
    (p.PRODUCT_NAME as string) ||
    (p.name as string) ||
    '';

  const rawPrice =
    p.unitPrice || p.unit_price || p.US_MSRP || p.us_msrp || p.msrp || p.MSRP || p.price || 0;
  const unitPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice) || '0');

  return {
    factoryPartNumber,
    description,
    unitPrice,
    upc: (p.upc as string) || (p.UPC as string) || '',
    category: (p.category as string) || (p.CATEGORY as string) || '',
    defaultCommissionRate: p.defaultCommissionRate as number | undefined,
    quantityPricing: (p.quantityPricing as QuantityPricing[]) || (p.quantity_pricing as QuantityPricing[]) || [],
    customerPricing: (p.customerPricing as CustomerPricing[]) || (p.customer_pricing as CustomerPricing[]) || [],
  };
}

export function getProductPartNumber(product: unknown): string {
  if (!product || typeof product !== 'object') return 'Unknown';
  const p = product as Record<string, unknown>;
  return (
    (p.factoryPartNumber as string) ||
    (p.partNumber as string) ||
    (p.sku as string) ||
    (p.part_number as string) ||
    (p.factory_part_number as string) ||
    (p.SAP_MATERIAL_NUMBER as string) ||
    (p.sap_material_number as string) ||
    (p.SKU_NUMBER as string) ||
    (p.sku_number as string) ||
    (p.product_id as string) ||
    (p.PRODUCT_ID as string) ||
    'Unknown'
  );
}

export function getProductDescription(product: unknown): string {
  if (!product || typeof product !== 'object') return 'No description';
  const p = product as Record<string, unknown>;
  return (
    (p.description as string) ||
    (p.DESCRIPTION as string) ||
    (p.product_name as string) ||
    (p.PRODUCT_NAME as string) ||
    (p.name as string) ||
    'No description'
  );
}

export function getProductPrice(product: unknown): number {
  if (!product || typeof product !== 'object') return 0;
  const p = product as Record<string, unknown>;
  const price = p.unitPrice || p.unit_price || p.US_MSRP || p.us_msrp || p.msrp || p.MSRP || p.price || 0;
  return typeof price === 'number' ? price : parseFloat(String(price) || '0');
}

export interface ExtractedProducts {
  products: unknown[];
  isStreaming: boolean;
  totalCount: number;
}

export function extractProducts(data: unknown): ExtractedProducts {
  if (!data || typeof data !== 'object') {
    return { products: [], isStreaming: false, totalCount: 0 };
  }

  const obj = data as Record<string, unknown>;

  // Check for direct products array
  if (Array.isArray(obj.products) && obj.products.length > 0) {
    const isStreaming = !!obj.output_file;
    const total = (obj.total_products as number) || (obj.total_rows as number) || (obj.row_count as number) || obj.products.length;
    return { products: obj.products, isStreaming, totalCount: total };
  }

  // Check for output_file + preview_products structure (streaming)
  if (obj.output_file && Array.isArray(obj.preview_products) && obj.preview_products.length > 0) {
    const total = (obj.total_products as number) || obj.preview_products.length;
    return { products: obj.preview_products, isStreaming: true, totalCount: total };
  }

  // Check for output_file + preview_rows structure (KPS streaming)
  if (obj.output_file && Array.isArray(obj.preview_rows) && obj.preview_rows.length > 0) {
    const total = (obj.row_count as number) || obj.preview_rows.length;
    return { products: obj.preview_rows, isStreaming: true, totalCount: total };
  }

  // Check for nested result.products
  const result = obj.result as Record<string, unknown> | undefined;
  if (result && Array.isArray(result.products) && result.products.length > 0) {
    const total = (result.total_products as number) || (result.total_rows as number) || result.products.length;
    return { products: result.products, isStreaming: !!result.output_file, totalCount: total };
  }

  // Check for nested data.products
  const dataObj = obj.data as Record<string, unknown> | undefined;
  if (dataObj && Array.isArray(dataObj.products) && dataObj.products.length > 0) {
    const total = (dataObj.total_products as number) || (dataObj.total_rows as number) || dataObj.products.length;
    return { products: dataObj.products, isStreaming: !!dataObj.output_file, totalCount: total };
  }

  // Check if data itself is an array of products
  if (Array.isArray(data) && data.length > 0 && looksLikeProduct(data[0])) {
    return { products: data, isStreaming: false, totalCount: data.length };
  }

  return { products: [], isStreaming: false, totalCount: 0 };
}
