'use client';

import { useState } from 'react';
import type { ParsedProduct } from './types';

interface ProductRowProps {
  product: ParsedProduct;
  formatPrice: (price: number) => string;
}

export function ProductRow({ product, formatPrice }: ProductRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = product.quantityPricing.length > 0 || product.customerPricing.length > 0;

  return (
    <>
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <td className="py-3 px-3">
          {hasDetails && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </td>
        <td className="py-3 px-3 font-mono text-xs">{product.factoryPartNumber}</td>
        <td className="py-3 px-3 text-gray-600 max-w-xs">
          <div className="truncate" title={product.description}>
            {product.description || '-'}
          </div>
        </td>
        <td className="py-3 px-3 text-right font-medium">{formatPrice(product.unitPrice)}</td>
        <td className="py-3 px-3 text-center">
          {product.quantityPricing.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {product.quantityPricing.length} bands
            </span>
          )}
        </td>
        <td className="py-3 px-3 text-center">
          {product.customerPricing.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {product.customerPricing.length} customers
            </span>
          )}
        </td>
      </tr>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Quantity Pricing */}
              {product.quantityPricing.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Quantity Pricing
                  </h4>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Quantity Range</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.quantityPricing.map((qp, idx) => (
                          <tr key={idx} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700">
                              {qp.quantityHigh
                                ? `${qp.quantityLow} - ${qp.quantityHigh}`
                                : `${qp.quantityLow}+`}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">
                              {formatPrice(qp.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Customer Pricing */}
              {product.customerPricing.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Customer Pricing ({product.customerPricing.length})
                  </h4>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Customer</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Price</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Comm.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.customerPricing.slice(0, 20).map((cp, idx) => (
                          <tr key={idx} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700 truncate max-w-[200px]" title={cp.customerName}>
                              {cp.customerName}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">
                              {formatPrice(cp.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {(cp.commissionRate * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                        {product.customerPricing.length > 20 && (
                          <tr className="border-t border-gray-100 bg-gray-50">
                            <td colSpan={3} className="px-3 py-2 text-center text-gray-500 text-xs">
                              ... and {product.customerPricing.length - 20} more customers
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
