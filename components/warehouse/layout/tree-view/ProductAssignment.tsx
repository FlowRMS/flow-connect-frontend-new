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
  isSearching?: boolean;
  onToggleExpand: () => void;
  onShowProductSearch: (show: boolean) => void;
  onProductSearchChange: (query: string) => void;
  onAddProduct: (product: AvailableProduct) => void;
  onRemoveProduct: (productAssignmentId: string, productId: string) => void;
}

export default function ProductAssignment({
  locationId,
  depth,
  isExpanded,
  showProductSearch,
  productSearchQuery,
  filteredProducts,
  assignedProducts = [],
  isSearching = false,
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
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              autoFocus
            />
          </div>

          {/* Product List */}
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {isSearching ? (
              <div className="text-xs text-[var(--muted-foreground)] text-center py-2 flex items-center justify-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </div>
            ) : (
              <>
                {filteredProducts.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => onAddProduct(product)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    <div className="text-xs font-medium text-[var(--foreground)]">{product.name}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {product.partNumber}
                      {product.factoryName && ` • ${product.factoryName}`}
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && productSearchQuery.length >= 1 && (
                  <div className="text-xs text-[var(--muted-foreground)] text-center py-2">No products found</div>
                )}
                {productSearchQuery.length < 1 && (
                  <div className="text-xs text-[var(--muted-foreground)] text-center py-2">Start typing to search products</div>
                )}
              </>
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
          className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-[var(--muted)]/50 group"
          style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
        >
          <div className="p-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{LevelIcons.product}</div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--foreground)] truncate">{product.productName}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">{product.partNumber}</div>
          </div>
          {/* Delete Button - same style as location delete */}
          <button
            onClick={() => onRemoveProduct(product.id, product.productId)}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove product"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
