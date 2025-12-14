'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Mock product data based on the image structure
interface Product {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  manufacturer: string;
  basePrice: number;
  hasConfigurator: boolean;
  configurations?: ProductConfiguration[];
  // Configuration-related fields
  productType: 'base' | 'configured';
  baseProductId?: string;
  baseProductPartNumber?: string;
  // Document-specific flag
  isDocumentSpecific?: boolean;
}

interface ProductConfiguration {
  id: string;
  name: string;
  options: ConfigOption[];
}

interface ConfigOption {
  id: string;
  label: string;
  priceAdder?: number;
  default?: boolean;
}

// Mock products based on the image provided
const mockProducts: Product[] = [
  // Main ALF Products (While Supplies Last) - Base Products
  {
    id: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    partNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
    description: 'ALF Flexible Area Light, 60000Lm - 400W Max, 4 Level Wat',
    category: 'Area Lights',
    manufacturer: 'ALF',
    basePrice: 320.00,
    hasConfigurator: true,
    productType: 'base',
  },
  {
    id: 'ALF-LS600-T3-G1-FSK-PSC-SFD',
    partNumber: 'ALF LS600 T3 G1 FSK PSC SFD',
    description: 'ALF Flexible Area Light, 60000Lm - 400W Max, 4 Level Wat',
    category: 'Area Lights',
    manufacturer: 'ALF',
    basePrice: 317.00,
    hasConfigurator: true,
    productType: 'base',
  },
  {
    id: 'ALF-LS600-T3-G1-HVU-FSK',
    partNumber: 'ALF LS600 T3 G1 HVU FSK',
    description: 'ALF Flexible Area Light, 60000Lm - 400W Max, 4 Level Wat',
    category: 'Area Lights',
    manufacturer: 'ALF',
    basePrice: 390.00,
    hasConfigurator: true,
    productType: 'base',
  },
  // Configured Products (derived from base products)
  {
    id: 'ALF-LS600-T3-G1-FSK-PSC-ASR-CFG1',
    partNumber: 'ALF LS600 T3 G1 FSK PSC ASR-CFG1',
    description: 'ALF Flexible Area Light - 60W, Type III, 0-10V Dimming',
    category: 'Area Lights',
    manufacturer: 'ALF',
    basePrice: 345.00,
    hasConfigurator: false,
    productType: 'configured',
    baseProductId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    baseProductPartNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
    isDocumentSpecific: true,
  },
  {
    id: 'ALF-LS600-T3-G1-FSK-PSC-ASR-CFG2',
    partNumber: 'ALF LS600 T3 G1 FSK PSC ASR-CFG2',
    description: 'ALF Flexible Area Light - 80W, Type V, DALI Dimming',
    category: 'Area Lights',
    manufacturer: 'ALF',
    basePrice: 385.00,
    hasConfigurator: false,
    productType: 'configured',
    baseProductId: 'ALF-LS600-T3-G1-FSK-PSC-ASR',
    baseProductPartNumber: 'ALF LS600 T3 G1 FSK PSC ASR',
  },
  // Accessories
  {
    id: 'ALF-ASR',
    partNumber: 'ALF-ASR',
    description: 'Adjustable Square & Round Pole Mounting for ALF series, Dark Bronze',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 28.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'ALF-SFD',
    partNumber: 'ALF-SFD',
    description: 'Slipfitter Mounting for ALF Flexible, Dark Bronze',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 28.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'PC-2',
    partNumber: 'PC-2',
    description: 'Twist-lock Photocell with receptacle, AC 480V, 10-15 Lx On (Dusk), 30-40 Lx Off (Dawn)',
    category: 'Controls',
    manufacturer: 'ALF',
    basePrice: 42.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'ALF-M-EGS',
    partNumber: 'ALF-M-EGS',
    description: 'External Glare Shield for ALF Medium Area Light, Dark Bronze',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 10.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'ALF-L-EGS',
    partNumber: 'ALF-L-EGS',
    description: 'External Glare Shield for ALF Large Area Light, Dark Bronze',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 12.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'ALF-M-HGS',
    partNumber: 'ALF-M-HGS',
    description: 'External House Side Shield for ALF Medium Area Light, Dark Bronze',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 18.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'ALF-L-HGS',
    partNumber: 'ALF-L-HGS',
    description: 'External House Side Shield for ALF Large Area Light, Dark Bronze',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 23.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'ALF-BLS',
    partNumber: 'ALF-BLS',
    description: 'Backlight Control Shield for ALF Area Light, 1 pc for Medium Size, 2 pc for Large Size',
    category: 'Accessories',
    manufacturer: 'ALF',
    basePrice: 12.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'MS-DCE-09-L7-W',
    partNumber: 'MS-DCE-09-L7-W',
    description: 'Motion Sensor, DC, Fixture External, Daylight Harvest+PIR, 3.5mm Aux plug, with Built-in 39ft High bay Lens, Outdoor',
    category: 'Controls',
    manufacturer: 'ALF',
    basePrice: 23.00,
    hasConfigurator: false,
    productType: 'base',
  },
  {
    id: 'RM06',
    partNumber: 'RM06',
    description: 'Remote for MS-DCE-09-L7 / MS-DCE-09-L7-W',
    category: 'Controls',
    manufacturer: 'ALF',
    basePrice: 32.00,
    hasConfigurator: false,
    productType: 'base',
  },
];

const categories = ['All', 'Area Lights', 'Accessories', 'Controls'];
const manufacturers = ['All', 'ALF', 'Acuity', 'Philips', 'Cree'];

// Mock factories and categories for dropdowns
const mockFactories = [
  { id: 'southern-grounding', name: 'Southern Grounding' },
  { id: 'alf', name: 'ALF' },
  { id: 'acme', name: 'Acme Lighting' },
];

const mockCategoryList = [
  { id: 'area-lights', name: 'Area Lights' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'controls', name: 'Controls' },
  { id: 'ground-rod', name: 'GROUND ROD' },
];

const mockCustomers = [
  { id: 'a', name: 'A' },
  { id: 'acker-ec', name: 'ACKER EC' },
  { id: 'demo-plc', name: 'demoPLC 1755200792.651914' },
];

export default function ProductsContent() {
  const router = useRouter();
  const [products] = useState<Product[]>(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const stats = useMemo(() => {
    return {
      totalProducts: products.length,
      configurableProducts: products.filter(p => p.hasConfigurator).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedManufacturer !== 'All') {
      result = result.filter(p => p.manufacturer === selectedManufacturer);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.partNumber.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.manufacturer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, selectedCategory, selectedManufacturer, searchQuery]);

  const handleProductClick = (product: Product) => {
    // Navigate directly to the product edit page
    router.push(`/products/${product.id}/edit`);
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Products</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage your product catalog and configurations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Products</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.totalProducts}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">In catalog</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Active Products</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">{stats.activeProducts}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Available for sale</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Configurable</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.configurableProducts}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">With options</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Categories</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{categories.length - 1}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Product types</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
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
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              {manufacturers.map((mfr) => (
                <option key={mfr} value={mfr}>{mfr}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-[var(--muted-foreground)] mb-4">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Products Table */}
        <div className="flex-1 overflow-auto p-6 pt-0">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Part Number
              </div>
              <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Description
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Factory
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Category
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Type
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
                Doc Specific
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {filteredProducts.length === 0 ? (
                <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                  >
                    <div className="col-span-3">
                      <div className="font-medium text-[var(--foreground)]">{product.partNumber}</div>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <span className="text-sm text-[var(--foreground)] line-clamp-2">{product.description}</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-[var(--foreground)]">{product.manufacturer}</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-[var(--foreground)]">{product.category}</span>
                    </div>
                    <div className="col-span-1 flex items-center">
                      {product.productType === 'configured' ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                          Configured
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          Base
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {product.isDocumentSpecific ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">—</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
