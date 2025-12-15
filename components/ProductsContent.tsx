'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Column sort state
interface SortState {
  column: string;
  direction: SortDirection;
}

// Column filter state
interface ColumnFilter {
  column: string;
  value: string;
  type: 'text' | 'dropdown';
}

// Sortable/Filterable column header component
interface ColumnHeaderProps {
  label: string;
  columnKey: string;
  sortState: SortState | null;
  onSort: (column: string) => void;
  filterType: 'text' | 'dropdown';
  filterValue: string;
  onFilterChange: (column: string, value: string) => void;
  filterOptions?: string[];
  colSpan: number;
  textAlign?: 'left' | 'center';
}

function ColumnHeader({
  label,
  columnKey,
  sortState,
  onSort,
  filterType,
  filterValue,
  onFilterChange,
  filterOptions = [],
  colSpan,
  textAlign = 'left',
}: ColumnHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
        setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSorted = sortState?.column === columnKey;
  const sortDirection = isSorted ? sortState.direction : null;

  const filteredOptions = filterOptions.filter(opt =>
    opt.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className={`col-span-${colSpan} relative`} ref={filterRef}>
      <div className={`flex items-center gap-1 ${textAlign === 'center' ? 'justify-center' : ''}`}>
        <button
          onClick={() => onSort(columnKey)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
        >
          {label}
          <span className="flex flex-col">
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`${sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
            </svg>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`-mt-0.5 ${sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 8L0 4H8L4 8Z" fill="currentColor" />
            </svg>
          </span>
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`p-0.5 rounded hover:bg-[var(--muted)] transition-colors ${filterValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/60'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Filter Dropdown */}
      {showFilter && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[180px]">
          {filterType === 'text' ? (
            <div className="p-2">
              <input
                type="text"
                placeholder={`Filter ${label.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => onFilterChange(columnKey, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
                autoFocus
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => {
                    onFilterChange(columnKey, '');
                    setShowFilter(false);
                    setDropdownSearch('');
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${!filterValue ? 'bg-[var(--muted)] font-medium' : ''}`}
                >
                  All
                </button>
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onFilterChange(columnKey, option);
                      setShowFilter(false);
                      setDropdownSearch('');
                    }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${filterValue === option ? 'bg-[var(--muted)] font-medium' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mock product data based on the image structure
interface Product {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  parentCategory?: string;
  grandparentCategory?: string;
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
  // Warehouse consignment flag
  isWarehouseConsignment?: boolean;
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
    parentCategory: 'Outdoor Lighting',
    grandparentCategory: 'Lighting',
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
    parentCategory: 'Outdoor Lighting',
    grandparentCategory: 'Lighting',
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
    parentCategory: 'Outdoor Lighting',
    grandparentCategory: 'Lighting',
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
    parentCategory: 'Outdoor Lighting',
    grandparentCategory: 'Lighting',
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
    parentCategory: 'Outdoor Lighting',
    grandparentCategory: 'Lighting',
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
    parentCategory: 'Mounting',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Mounting',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Lighting Controls',
    grandparentCategory: 'Electronics',
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
    parentCategory: 'Shields',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Shields',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Shields',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Shields',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Shields',
    grandparentCategory: 'Hardware',
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
    parentCategory: 'Sensors',
    grandparentCategory: 'Electronics',
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
    parentCategory: 'Remotes',
    grandparentCategory: 'Electronics',
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

  // Column sorting state
  const [sortState, setSortState] = useState<SortState | null>(null);

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    partNumber: '',
    description: '',
    manufacturer: '',
    category: '',
    parentCategory: '',
    grandparentCategory: '',
    productType: '',
    isDocumentSpecific: '',
    isWarehouseConsignment: '',
  });

  // Get unique values for dropdown filters
  const filterOptions = useMemo(() => {
    return {
      manufacturer: [...new Set(products.map(p => p.manufacturer))].sort(),
      category: [...new Set(products.map(p => p.category))].sort(),
      parentCategory: [...new Set(products.map(p => p.parentCategory).filter(Boolean))].sort() as string[],
      grandparentCategory: [...new Set(products.map(p => p.grandparentCategory).filter(Boolean))].sort() as string[],
      productType: ['Base', 'Configured'],
      isDocumentSpecific: ['Yes', 'No'],
      isWarehouseConsignment: ['Yes', 'No'],
    };
  }, [products]);

  const stats = useMemo(() => {
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.productType === 'base').length,
      configurableProducts: products.filter(p => p.hasConfigurator).length,
    };
  }, [products]);

  // Handle sort toggle
  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev?.column !== column) {
        return { column, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null; // Reset to no sort
    });
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

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

    // Apply column filters
    if (columnFilters.partNumber) {
      const query = columnFilters.partNumber.toLowerCase();
      result = result.filter(p => p.partNumber.toLowerCase().includes(query));
    }
    if (columnFilters.description) {
      const query = columnFilters.description.toLowerCase();
      result = result.filter(p => p.description.toLowerCase().includes(query));
    }
    if (columnFilters.manufacturer) {
      result = result.filter(p => p.manufacturer === columnFilters.manufacturer);
    }
    if (columnFilters.category) {
      result = result.filter(p => p.category === columnFilters.category);
    }
    if (columnFilters.parentCategory) {
      result = result.filter(p => p.parentCategory === columnFilters.parentCategory);
    }
    if (columnFilters.grandparentCategory) {
      result = result.filter(p => p.grandparentCategory === columnFilters.grandparentCategory);
    }
    if (columnFilters.productType) {
      const isConfigured = columnFilters.productType === 'Configured';
      result = result.filter(p => (p.productType === 'configured') === isConfigured);
    }
    if (columnFilters.isDocumentSpecific) {
      const isDocSpecific = columnFilters.isDocumentSpecific === 'Yes';
      result = result.filter(p => (p.isDocumentSpecific ?? false) === isDocSpecific);
    }
    if (columnFilters.isWarehouseConsignment) {
      const isWarehouseConsign = columnFilters.isWarehouseConsignment === 'Yes';
      result = result.filter(p => (p.isWarehouseConsignment ?? false) === isWarehouseConsign);
    }

    // Apply sorting
    if (sortState) {
      result = [...result].sort((a, b) => {
        let aVal: string | boolean | undefined;
        let bVal: string | boolean | undefined;

        switch (sortState.column) {
          case 'partNumber':
            aVal = a.partNumber;
            bVal = b.partNumber;
            break;
          case 'description':
            aVal = a.description;
            bVal = b.description;
            break;
          case 'manufacturer':
            aVal = a.manufacturer;
            bVal = b.manufacturer;
            break;
          case 'category':
            aVal = a.category;
            bVal = b.category;
            break;
          case 'parentCategory':
            aVal = a.parentCategory ?? '';
            bVal = b.parentCategory ?? '';
            break;
          case 'grandparentCategory':
            aVal = a.grandparentCategory ?? '';
            bVal = b.grandparentCategory ?? '';
            break;
          case 'productType':
            aVal = a.productType;
            bVal = b.productType;
            break;
          case 'isDocumentSpecific':
            aVal = a.isDocumentSpecific ?? false;
            bVal = b.isDocumentSpecific ?? false;
            break;
          case 'isWarehouseConsignment':
            aVal = a.isWarehouseConsignment ?? false;
            bVal = b.isWarehouseConsignment ?? false;
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          const cmp = aVal === bVal ? 0 : aVal ? -1 : 1;
          return sortState.direction === 'asc' ? cmp : -cmp;
        }

        const aStr = String(aVal ?? '').toLowerCase();
        const bStr = String(bVal ?? '').toLowerCase();
        const cmp = aStr.localeCompare(bStr);
        return sortState.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [products, selectedCategory, selectedManufacturer, searchQuery, columnFilters, sortState]);

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
            <div className="overflow-x-auto">
              <div className="min-w-[1400px]">
                {/* Table Header */}
                <div className="grid gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
                  <ColumnHeader
                    label="Part Number"
                    columnKey="partNumber"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="text"
                    filterValue={columnFilters.partNumber}
                    onFilterChange={handleFilterChange}
                    colSpan={3}
                  />
                  <ColumnHeader
                    label="Description"
                    columnKey="description"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="text"
                    filterValue={columnFilters.description}
                    onFilterChange={handleFilterChange}
                    colSpan={3}
                  />
                  <ColumnHeader
                    label="Factory"
                    columnKey="manufacturer"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.manufacturer}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.manufacturer}
                    colSpan={2}
                  />
                  <ColumnHeader
                    label="Grandparent"
                    columnKey="grandparentCategory"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.grandparentCategory}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.grandparentCategory}
                    colSpan={2}
                  />
                  <ColumnHeader
                    label="Parent"
                    columnKey="parentCategory"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.parentCategory}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.parentCategory}
                    colSpan={2}
                  />
                  <ColumnHeader
                    label="Category"
                    columnKey="category"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.category}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.category}
                    colSpan={2}
                  />
                  <ColumnHeader
                    label="Type"
                    columnKey="productType"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.productType}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.productType}
                    colSpan={1}
                  />
                  <ColumnHeader
                    label="Doc Specific"
                    columnKey="isDocumentSpecific"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.isDocumentSpecific}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.isDocumentSpecific}
                    colSpan={2}
                    textAlign="center"
                  />
                  <ColumnHeader
                    label="Warehouse"
                    columnKey="isWarehouseConsignment"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.isWarehouseConsignment}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.isWarehouseConsignment}
                    colSpan={2}
                    textAlign="center"
                  />
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
                        className="grid gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
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
                          <span className="text-sm text-[var(--foreground)]">{product.grandparentCategory || '—'}</span>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className="text-sm text-[var(--foreground)]">{product.parentCategory || '—'}</span>
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
                        <div className="col-span-2 flex items-center justify-center">
                          {product.isDocumentSpecific ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          {product.isWarehouseConsignment ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-700">
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
        </div>
      </div>
    </main>
  );
}
