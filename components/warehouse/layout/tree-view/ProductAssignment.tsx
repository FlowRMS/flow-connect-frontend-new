'use client';

import React from 'react';
import type { AvailableProduct, ProductAssignment as ProductAssignmentType } from '../types';
import { LevelIcons } from '../constants';

interface ProductAssignmentProps {
  locationId: string;
  depth: number;
  isExpanded: boolean;
  showProductSearch: boolean;
  productSearchQuery: string;
  filteredProducts: AvailableProduct[];
  assignedProducts?: ProductAssignmentType[];
  onToggleExpand: () => void;
  onShowProductSearch: (show: boolean) => void;
  onProductSearchChange: (query: string) => void;
  onAddProduct: (product: AvailableProduct) => void;
  onRemoveProduct: (productAssignmentId: string) => void;
}

export default function ProductAssignment({
  locationId,
  depth,
  isExpanded,
  showProductSearch,
  productSearchQuery,
  filteredProducts,
  assignedProducts = [],
  onToggleExpand,
  onShowProductSearch,
  onProductSearchChange,
  onAddProduct,
  onRemoveProduct,
}: ProductAssignmentProps) {
  if (!isExpanded) return null;

  return (
    <div>
      {/* Product Search */}
      {showProductSearch && (
        <div
          className="mx-1 my-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
          style={{ marginLeft: `${(depth + 1) * 16 + 12}px` }}
        >
          {/* Search Input */}
          <div className="relative mb-2">
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search product name, part #, manufacturer..."
              value={productSearchQuery}
              onChange={(e) => onProductSearchChange(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-[var(--border)] rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Product List */}
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {filteredProducts.slice(0, 8).map((product) => (
              <button
                key={product.id}
                onClick={() => onAddProduct(product)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--accent)] transition-colors"
              >
                <div className="text-xs font-medium text-[var(--foreground)]">{product.name}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">
                  {product.partNumber}
                  {product.factoryName && ` • ${product.factoryName}`}
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-xs text-[var(--muted-foreground)] text-center py-2">No products found</div>
            )}
          </div>

          {/* Cancel Button */}
          <button
            onClick={() => onShowProductSearch(false)}
            className="mt-2 w-full text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Assigned Products */}
      {assignedProducts.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-2 py-0.5 px-1 mx-1 rounded hover:bg-[var(--accent)] group"
          style={{ marginLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <div className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{LevelIcons.product}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[var(--foreground)] truncate">{product.productName}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">{product.partNumber}</div>
          </div>
          <button
            onClick={() => onRemoveProduct(product.id)}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
