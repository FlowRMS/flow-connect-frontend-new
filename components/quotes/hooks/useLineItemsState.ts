'use client';

import { useState, useRef } from 'react';
import type { LineItem, ColumnKey } from '../types';
import { mockLineItems } from '../data';

// Product type for the catalog
export interface Product {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string;
  basePrice: number;
}

// Initial product catalog data
const initialProductCatalog: Product[] = [
  { id: 'prod-1', partNumber: 'LUM-4FT-LED', description: '4ft LED Linear Fixture', manufacturer: 'Acuity Brands', basePrice: 125 },
  { id: 'prod-2', partNumber: 'LUM-2X4-TRF', description: '2x4 LED Troffer Panel', manufacturer: 'Acuity Brands', basePrice: 185 },
  { id: 'prod-3', partNumber: 'DOW-6IN-REC', description: '6" Recessed Downlight', manufacturer: 'Cree Lighting', basePrice: 65 },
  { id: 'prod-4', partNumber: 'DOW-4IN-ADJ', description: '4" Adjustable Gimbal Downlight', manufacturer: 'Cree Lighting', basePrice: 85 },
  { id: 'prod-5', partNumber: 'EXT-WAL-PAK', description: 'LED Wall Pack 50W', manufacturer: 'RAB Lighting', basePrice: 145 },
  { id: 'prod-6', partNumber: 'EXT-FLD-100', description: 'LED Flood Light 100W', manufacturer: 'RAB Lighting', basePrice: 225 },
  { id: 'prod-7', partNumber: 'EXT-POL-150', description: 'LED Pole Light 150W', manufacturer: 'RAB Lighting', basePrice: 385 },
  { id: 'prod-8', partNumber: 'EMG-EXIT-RD', description: 'Exit Sign LED Red', manufacturer: 'Lithonia', basePrice: 45 },
  { id: 'prod-9', partNumber: 'EMG-EXIT-GR', description: 'Exit Sign LED Green', manufacturer: 'Lithonia', basePrice: 45 },
  { id: 'prod-10', partNumber: 'EMG-COMBO-1', description: 'Exit/Emergency Combo Unit', manufacturer: 'Lithonia', basePrice: 95 },
  { id: 'prod-11', partNumber: 'CTL-DIM-0-10', description: '0-10V Dimmer Switch', manufacturer: 'Lutron', basePrice: 55 },
  { id: 'prod-12', partNumber: 'CTL-OCC-PIR', description: 'PIR Occupancy Sensor', manufacturer: 'Lutron', basePrice: 75 },
  { id: 'prod-13', partNumber: 'CTL-DAY-SNR', description: 'Daylight Sensor', manufacturer: 'Lutron', basePrice: 85 },
  { id: 'prod-14', partNumber: 'HBY-UFO-150', description: 'UFO High Bay 150W', manufacturer: 'Cooper Lighting', basePrice: 275 },
  { id: 'prod-15', partNumber: 'HBY-LIN-200', description: 'Linear High Bay 200W', manufacturer: 'Cooper Lighting', basePrice: 325 },
];

export function useLineItemsState() {
  // ============================================
  // 1. Line items data state
  // ============================================
  const [quoteLineItems, setQuoteLineItems] = useState<LineItem[]>(mockLineItems);

  // ============================================
  // 2. Sorting state
  // ============================================
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ============================================
  // 3. Column filters state
  // ============================================
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);

  // ============================================
  // 4. Selected line items for bulk actions
  // ============================================
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());

  // ============================================
  // 5. Bulk actions menu state
  // ============================================
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);

  // ============================================
  // 6. Product search state
  // ============================================
  const [productCatalog, setProductCatalog] = useState<Product[]>(initialProductCatalog);
  const [productSearchOpen, setProductSearchOpen] = useState<string | null>(null); // lineItemId
  const [productSearchField, setProductSearchField] = useState<'partNumber' | 'customerPartNumber' | 'description' | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });

  // ============================================
  // 7. Dropdown position state for portals
  // ============================================
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // ============================================
  // 8. Expanded line items state
  // ============================================
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());

  // ============================================
  // 9. Line details modal state
  // ============================================
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  // ============================================
  // 10. handleSort function
  // ============================================
  const handleSort = (column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // ============================================
  // 11. handleFilterChange function
  // ============================================
  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // ============================================
  // 12. getFilteredProducts function
  // ============================================
  const getFilteredProducts = () => {
    if (!productSearchQuery.trim()) return productCatalog;
    const query = productSearchQuery.toLowerCase();
    return productCatalog.filter(p =>
      p.partNumber.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.manufacturer.toLowerCase().includes(query)
    );
  };

  // ============================================
  // 13. selectProductForLineItem function
  // ============================================
  const selectProductForLineItem = (itemId: string, product: Product) => {
    setQuoteLineItems(prev => prev.map(li =>
      li.id === itemId ? {
        ...li,
        productNumber: product.partNumber,
        description: product.description,
        basePrice: product.basePrice,
        sellPrice: product.basePrice, // Default sell to base
        manufacturers: [{
          ...li.manufacturers[0],
          name: product.manufacturer,
        }]
      } : li
    ));
    setProductSearchOpen(null);
    setProductSearchField(null);
    setProductSearchQuery('');
  };

  // ============================================
  // 14. createNewProduct function
  // ============================================
  const createNewProduct = (itemId: string) => {
    if (!newProductData.partNumber.trim() || !newProductData.description.trim()) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      partNumber: newProductData.partNumber.trim(),
      description: newProductData.description.trim(),
      manufacturer: newProductData.manufacturer.trim() || 'Unknown',
      basePrice: newProductData.basePrice || 0,
    };

    // Add to catalog
    setProductCatalog(prev => [...prev, newProduct]);

    // Update line item
    selectProductForLineItem(itemId, newProduct);

    // Reset form
    setNewProductData({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
    setShowCreateProduct(false);
  };

  // Return all state and functions
  return {
    // 1. Line items data
    quoteLineItems,
    setQuoteLineItems,

    // 2. Sorting
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,

    // 3. Filtering
    columnFilters,
    setColumnFilters,
    activeFilterColumn,
    setActiveFilterColumn,

    // 4. Selection
    selectedLineItems,
    setSelectedLineItems,

    // 5. Bulk actions menu
    showBulkActionsMenu,
    setShowBulkActionsMenu,

    // 6. Product search
    productCatalog,
    setProductCatalog,
    productSearchOpen,
    setProductSearchOpen,
    productSearchField,
    setProductSearchField,
    productSearchQuery,
    setProductSearchQuery,
    showCreateProduct,
    setShowCreateProduct,
    newProductData,
    setNewProductData,

    // 7. Dropdown position for portal
    dropdownPosition,
    setDropdownPosition,
    productDropdownRef,

    // 8. Expanded items
    expandedLineItems,
    setExpandedLineItems,

    // 9. Line details modal
    showLineDetailsModal,
    setShowLineDetailsModal,
    lineDetailsModalItem,
    setLineDetailsModalItem,

    // 10-14. Functions
    handleSort,
    handleFilterChange,
    getFilteredProducts,
    selectProductForLineItem,
    createNewProduct,
  };
}
