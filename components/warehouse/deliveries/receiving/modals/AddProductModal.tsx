import React, { useMemo, useState } from 'react';
import { useWarehouseProducts } from '@/components/warehouse/api/useWarehouseDeliveriesApi';

interface AddProductModalProps {
  vendorId: string;
  onClose: () => void;
  onAddProduct: (product: { id: string; name: string; partNumber: string }, quantity: number) => void;
  existingProductIds: string[];
}

export default function AddProductModal({
  vendorId,
  onClose,
  onAddProduct,
  existingProductIds,
}: AddProductModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; partNumber: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const {
    data: productResults = [],
    isLoading: isLoadingProducts,
    error: productsError,
  } = useWarehouseProducts(searchTerm, vendorId, 50);

  const products = useMemo(
    () =>
      productResults.map((product) => ({
        id: product.id,
        name: product.description || product.factoryPartNumber,
        partNumber: product.factoryPartNumber,
      })),
    [productResults]
  );

  const availableProducts = products.filter((product) => !existingProductIds.includes(product.id));
  const filteredProducts = availableProducts;

  const handleAdd = () => {
    if (selectedProduct && quantity > 0) {
      onAddProduct(selectedProduct, quantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-medium text-[var(--foreground)]">Add Expected Product</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-[var(--border)]">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingProducts ? (
            <div className="p-4 text-center text-[var(--muted-foreground)]">Searching products...</div>
          ) : productsError ? (
            <div className="p-4 text-center text-red-500">{productsError?.message || 'Error loading products'}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-[var(--muted-foreground)]">
              {searchTerm ? 'No products found' : 'No products found for this vendor'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'bg-[var(--primary)]/10 border border-[var(--primary)]'
                      : 'hover:bg-[var(--muted)] border border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm text-[var(--foreground)]">{product.partNumber}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{product.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--foreground)]">{selectedProduct.partNumber}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{selectedProduct.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--muted-foreground)]">Qty:</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  onFocus={(e) => e.target.select()}
                  className="w-20 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedProduct || quantity < 1}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}
