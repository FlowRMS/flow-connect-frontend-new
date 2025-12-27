#!/usr/bin/env python3
"""
Move UI-only state inside LinesTab component to reduce QuotesContent.tsx size.
"""

# Read LinesTab
lines_tab_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab.tsx"
quotes_content_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

# States that should be internal to LinesTab
internal_states = '''
  // Internal UI states (moved from parent)
  const [productSearchOpen, setProductSearchOpen] = useState<string | null>(null);
  const [productSearchField, setProductSearchField] = useState<'partNumber' | 'customerPartNumber' | 'description' | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [manufacturerDropdown, setManufacturerDropdown] = useState<string | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');

  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [overageModalTab, setOverageModalTab] = useState<'percentage' | 'targetPrice' | 'targetMargin'>('percentage');
  const [overageInputPercent, setOverageInputPercent] = useState('');
  const [overageInputTargetPrice, setOverageInputTargetPrice] = useState('');
  const [overageInputTargetMargin, setOverageInputTargetMargin] = useState('');

  const [showCopyPriceModal, setShowCopyPriceModal] = useState<'l1' | 'l2' | 'l3' | null>(null);
  const [showPriceLookupModal, setShowPriceLookupModal] = useState<string | null>(null);
  const [priceLookupTargetPrice, setPriceLookupTargetPrice] = useState('');

  const [showMinOverageModal, setShowMinOverageModal] = useState(false);
  const [minOverageInput, setMinOverageInput] = useState('');

  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [autoCalcMode, setAutoCalcMode] = useState<'overage' | 'commission'>('overage');
  const [autoCalcTargetOverage, setAutoCalcTargetOverage] = useState('');
  const [autoCalcTargetCommission, setAutoCalcTargetCommission] = useState('');

  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());

  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState('');

  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  const [lineItemRepDropdown, setLineItemRepDropdown] = useState<string | null>(null);
  const [lineItemRepSearch, setLineItemRepSearch] = useState('');
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  const [lineItemInsideRepDropdown, setLineItemInsideRepDropdown] = useState<string | null>(null);
  const [lineItemInsideRepSearch, setLineItemInsideRepSearch] = useState('');
  const [showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal] = useState(false);
  const [lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget] = useState<string | null>(null);
  const [lineItemInsideRepSplits, setLineItemInsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);

  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductForLineItem, setCreateProductForLineItem] = useState<string | null>(null);
  const [createProductInitialData, setCreateProductInitialData] = useState({ partNumber: '', description: '' });

  const [repSplitModalItem, setRepSplitModalItem] = useState<LineItem | null>(null);

  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);

  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const [editingCell, setEditingCell] = useState<{ itemId: string; column: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);

  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);

  // Filter products based on search query
  const getFilteredProducts = useCallback(() => {
    if (!productSearchQuery.trim()) return productCatalog;
    const query = productSearchQuery.toLowerCase();
    return productCatalog.filter(p =>
      p.partNumber.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.manufacturer.toLowerCase().includes(query)
    );
  }, [productCatalog, productSearchQuery]);

  // Add a new product to the catalog
  const handleAddProduct = useCallback(() => {
    if (!newProductData.partNumber.trim()) return;
    const newProduct = {
      id: `product-${Date.now()}`,
      partNumber: newProductData.partNumber.trim(),
      description: newProductData.description.trim(),
      manufacturer: newProductData.manufacturer.trim(),
      basePrice: newProductData.basePrice,
    };
    setProductCatalog(prev => [...prev, newProduct]);
    setNewProductData({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
    setShowCreateProduct(false);
  }, [newProductData, setProductCatalog]);

  // Helper functions for columns
  const handleSort = useCallback((col: ColumnKey) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleFilterChange = useCallback((col: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [col]: value }));
  }, []);

  const startEditing = useCallback((itemId: string, column: ColumnKey, currentValue: string) => {
    setEditingCell({ itemId, column });
    setEditValue(currentValue);
  }, []);

  const getItemValue = useCallback((item: LineItem, column: ColumnKey): string => {
    switch (column) {
      case 'overage': return item.overagePercent.toFixed(1);
      case 'l1': return item.level1Price.toFixed(2);
      case 'l2': return item.level2Price.toFixed(2);
      case 'l3': return item.level3Price.toFixed(2);
      default: return '';
    }
  }, []);

'''

# Add useRef import
with open(lines_tab_path, 'r', encoding='utf-8') as f:
    lines_content = f.read()

# Add useRef to import
lines_content = lines_content.replace(
    "import React, { useState, useCallback, useMemo } from 'react';",
    "import React, { useState, useCallback, useMemo, useRef } from 'react';"
)

# Find where to insert the internal states - after "const router = useRouter();"
lines_content = lines_content.replace(
    "  const router = useRouter();\n\n  // Local state for section management",
    "  const router = useRouter();\n" + internal_states + "\n  // Local state for section management"
)

with open(lines_tab_path, 'w', encoding='utf-8') as f:
    f.write(lines_content)

print(f"Updated LinesTab.tsx to include internal states")

# Now count the lines
line_count = lines_content.count('\n') + 1
print(f"LinesTab.tsx now has {line_count} lines")
