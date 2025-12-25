'use client';

import React from 'react';
import { useDeleteProduct, type ProductLandingPage } from '../api/useProductsApi';

interface DeleteProductModalProps {
  isOpen: boolean;
  product: ProductLandingPage | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteProductModal({ isOpen, product, onClose, onSuccess }: DeleteProductModalProps) {
  const deleteProductMutation = useDeleteProduct();

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProductMutation.mutateAsync(product.id);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Delete Product</h2>
              <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-[var(--foreground)]">
            Are you sure you want to delete the product{' '}
            <span className="font-semibold">{product.factoryPartNumber}</span>?
          </p>
          {product.description && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-700">
              This will permanently remove the product from your catalog. Any quotes, orders, or other records referencing this product may be affected.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 bg-[var(--muted)]/20">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteProductMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleteProductMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Product
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {deleteProductMutation.isError && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">
              {deleteProductMutation.error?.message || 'Failed to delete product. Please try again.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
