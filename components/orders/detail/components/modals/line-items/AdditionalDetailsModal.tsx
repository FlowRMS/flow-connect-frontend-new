/**
 * AdditionalDetailsModal Component
 * Modal for editing additional line item details (3-dots menu)
 * Matches quotes-v2 AdditionalDetailsModalV2 functionality
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { OrderLineItem } from '@/lib/types/rms';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { useCustomerSearch } from '../../../../api';

interface AdditionalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineItem: OrderLineItem | null;
  onSave: (updates: Partial<OrderLineItem>) => void;
  showEndUserPerLine?: boolean;
}

export function AdditionalDetailsModal({
  isOpen,
  onClose,
  lineItem,
  onSave,
  showEndUserPerLine = false,
}: AdditionalDetailsModalProps) {
  const [formData, setFormData] = useState({
    endUserId: '',
    endUserName: '',
    commissionDiscountPercent: 0,
    commissionDiscountAmount: 0,
    lineDiscountPercent: 0,
    lineDiscountAmount: 0,
    leadTime: '',
    note: '',
  });

  // End user search
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(
    endUserSearchTerm,
    endUserSearchEnabled && showEndUserPerLine
  );

  const endUserOptions = useMemo(() => {
    return (endUserCustomers || []).map(c => ({
      id: c.id,
      label: c.companyName,
    }));
  }, [endUserCustomers]);

  useEffect(() => {
    if (lineItem) {
      setFormData({
        endUserId: (lineItem as any).endUserId || '',
        endUserName: (lineItem as any).endUserName || '',
        commissionDiscountPercent: (lineItem as any).commissionDiscountPercent || 0,
        commissionDiscountAmount: (lineItem as any).commissionDiscountAmount || 0,
        lineDiscountPercent: (lineItem as any).lineDiscountPercent || 0,
        lineDiscountAmount: (lineItem as any).lineDiscountAmount || 0,
        leadTime: (lineItem as any).leadTime || '',
        note: (lineItem as any).note || '',
      });
    }
  }, [lineItem]);

  if (!isOpen || !lineItem) return null;

  const handleSave = () => {
    onSave(formData as any);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Additional Details</h2>
              <p className="text-sm text-gray-500 truncate max-w-[300px]">
                {lineItem.partNumber} - {lineItem.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* End User */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">End User</label>
              {showEndUserPerLine ? (
                <SearchableDropdownV2
                  value={formData.endUserId}
                  displayValue={formData.endUserName}
                  onChange={(id, label) => {
                    setFormData({
                      ...formData,
                      endUserId: id,
                      endUserName: label,
                    });
                  }}
                  options={endUserOptions}
                  placeholder="Search end user..."
                  onSearch={(term) => {
                    setEndUserSearchTerm(term);
                    setEndUserSearchEnabled(true);
                  }}
                  isLoading={isEndUserLoading}
                />
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value="Set at order level"
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    (Header setting)
                  </span>
                </div>
              )}
            </div>

            {/* Commission Discount % */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Commission Discount %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.commissionDiscountPercent}
                  onChange={(e) => setFormData({ ...formData, commissionDiscountPercent: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            {/* Commission Discount $ */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Commission Discount $</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.commissionDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, commissionDiscountAmount: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Line Discount % */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Line Discount %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.lineDiscountPercent}
                  onChange={(e) => setFormData({ ...formData, lineDiscountPercent: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            {/* Line Discount $ */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Line Discount $</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.lineDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, lineDiscountAmount: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Lead Time */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Lead Time</label>
              <input
                type="text"
                value={formData.leadTime}
                onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                placeholder="e.g. 2-3 weeks"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdditionalDetailsModal;
