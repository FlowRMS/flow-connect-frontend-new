/**
 * ProductRow Component
 * Individual product row in the products table
 */

import type { ProductLandingPage } from '../../../api';

interface ProductRowProps {
  product: ProductLandingPage;
  isSelected: boolean;
  onToggleSelection: (checked: boolean) => void;
  onProductClick: (product: ProductLandingPage) => void;
  onDelete: (productId: string) => void;
}

export function ProductRow({
  product,
  isSelected,
  onToggleSelection,
  onProductClick,
  onDelete,
}: ProductRowProps) {
  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format percentage (value is already stored as percentage, e.g., 2 for 2%)
  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return `${Number(value).toFixed(1)}%`;
  };

  return (
    <tr
      onClick={() => onProductClick(product)}
      className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
        isSelected ? 'bg-[var(--primary)]/5' : ''
      }`}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelection(e.target.checked)}
          className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer"
        />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-[var(--foreground)]">
          {product.factoryPartNumber}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-[var(--foreground)] line-clamp-2 max-w-xs">
          {product.description || '—'}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
          {product.factoryTitle || '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
          {product.categoryTitle || '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {formatCurrency(product.unitPrice)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm text-[var(--foreground)]">
          {formatPercentage(product.defaultCommissionRate)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {product.published ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Published
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Draft
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {product.approvalNeeded ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            Required
          </span>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(product.id);
          }}
          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
          title="Delete product"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}
