/**
 * Pre-Opportunity Line Items Component
 */

import React from 'react';
import type { PreOpportunity, PreOpportunityDetail } from '../types';
import { formatCurrency } from '../utils';

interface PreOpportunityLineItemsProps {
  preOpp: PreOpportunity;
}

export function PreOpportunityLineItems({ preOpp }: PreOpportunityLineItemsProps) {
  const totalSubtotal = preOpp.details.reduce((sum, detail) => sum + detail.subtotal, 0);
  const totalDiscount = preOpp.details.reduce((sum, detail) => sum + detail.discount, 0);
  const grandTotal = preOpp.balance?.total || totalSubtotal - totalDiscount;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
        <span className="text-sm text-gray-500">{preOpp.details.length} items</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {preOpp.details.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No line items
                </td>
              </tr>
            ) : (
              preOpp.details.map((detail) => (
                <tr key={detail.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{detail.itemNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{detail.product.factoryPartNumber}</div>
                    <div className="text-xs text-gray-500">Factory: {detail.product.factoryId}</div>
                    {detail.leadTime && (
                      <div className="text-xs text-blue-600">Lead Time: {detail.leadTime}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{detail.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(detail.unitPrice)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(detail.subtotal)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {detail.discount > 0 ? (
                      <span className="text-red-600">
                        -{formatCurrency(detail.discount)} ({detail.discountRate}%)
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(detail.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {preOpp.details.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-sm font-medium text-right text-gray-700">Subtotal:</td>
                <td></td>
                <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                  {formatCurrency(totalSubtotal)}
                </td>
              </tr>
              {totalDiscount > 0 && (
                <tr>
                  <td colSpan={4}></td>
                  <td className="px-4 py-3 text-sm font-medium text-right text-gray-700">Total Discount:</td>
                  <td></td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-red-600">
                    -{formatCurrency(totalDiscount)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-base font-bold text-right text-gray-900">Grand Total:</td>
                <td></td>
                <td className="px-4 py-3 text-lg font-bold text-right text-blue-600">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
