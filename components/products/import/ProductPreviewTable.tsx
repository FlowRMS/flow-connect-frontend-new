'use client';

import { useMemo } from 'react';
import type { ParsedProduct } from './types';
import { ProductRow } from './ProductRow';

interface ProductPreviewTableProps {
  products: ParsedProduct[];
  formatPrice: (price: number) => string;
}

export function ProductPreviewTable({ products, formatPrice }: ProductPreviewTableProps) {
  const stats = useMemo(() => {
    const totalQuantityPricingBands = products.reduce((sum, p) => sum + p.quantityPricing.length, 0);
    const totalCustomerPricing = products.reduce((sum, p) => sum + p.customerPricing.length, 0);
    const uniqueCustomers = new Set(products.flatMap(p => p.customerPricing.map(cp => cp.customerName))).size;
    return { totalQuantityPricingBands, totalCustomerPricing, uniqueCustomers };
  }, [products]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Preview ({products.length} products)
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {stats.totalQuantityPricingBands > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {stats.totalQuantityPricingBands} qty bands
            </span>
          )}
          {stats.totalCustomerPricing > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              {stats.totalCustomerPricing} customer prices ({stats.uniqueCustomers} customers)
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Click on a row to expand and see quantity pricing and customer pricing details
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-8 py-2 px-3"></th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Part Number</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Description</th>
              <th className="text-right py-2 px-3 font-medium text-gray-700">Base Price</th>
              <th className="text-center py-2 px-3 font-medium text-gray-700">Qty Pricing</th>
              <th className="text-center py-2 px-3 font-medium text-gray-700">Customer Pricing</th>
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 15).map((product, idx) => (
              <ProductRow
                key={idx}
                product={product}
                formatPrice={formatPrice}
              />
            ))}
          </tbody>
        </table>
      </div>

      {products.length > 15 && (
        <p className="mt-3 text-sm text-gray-500 text-center">
          ... and {products.length - 15} more products
        </p>
      )}
    </div>
  );
}
