/**
 * AdditionalDetailsModal Component for Invoices
 * Modal for editing additional line item details (3-dots menu)
 * Supports per-line-item end user, inside rep, and outside rep selection
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { InvoiceLineItem } from '../../../types';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { useCustomerSearch, useUserSearch } from '@/components/orders/api';

// Commission split rep interface
interface CommissionSplitRep {
  id: string;
  userId: string;
  userName: string;
  splitRate: number;
  position: number;
}

interface AdditionalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineItem: InvoiceLineItem | null;
  onSave: (updates: Partial<InvoiceLineItem>) => void;
}

export function AdditionalDetailsModal({
  isOpen,
  onClose,
  lineItem,
  onSave,
}: AdditionalDetailsModalProps) {
  const [formData, setFormData] = useState({
    endUserId: '',
    endUserName: '',
    commissionDiscountPercent: 0,
    commissionDiscountAmount: 0,
    discountPercent: 0,
    discountAmount: 0,
    leadTime: '',
    note: '',
  });

  // Outside rep state for line item level
  const [outsideSplitReps, setOutsideSplitReps] = useState<CommissionSplitRep[]>([]);

  // End user search
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(
    endUserSearchTerm,
    endUserSearchEnabled
  );

  // Outside rep search
  const [outsideRepSearchTerm, setOutsideRepSearchTerm] = useState('');
  const [outsideRepSearchEnabled, setOutsideRepSearchEnabled] = useState(false);
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(
    outsideRepSearchTerm,
    { isOutside: true },
    outsideRepSearchEnabled
  );

  const endUserOptions = useMemo(() => {
    return (endUserCustomers || []).map(c => ({
      id: c.id,
      label: c.companyName,
    }));
  }, [endUserCustomers]);

  const outsideRepOptions = useMemo(() => {
    return (outsideReps || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
      fullName: u.fullName,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }, [outsideReps]);

  useEffect(() => {
    if (lineItem) {
      setFormData({
        endUserId: lineItem.endUserId || '',
        endUserName: (lineItem as any).endUserName || '',
        commissionDiscountPercent: lineItem.commissionDiscountPercent || 0,
        commissionDiscountAmount: lineItem.commissionDiscount || 0,
        discountPercent: lineItem.discountPercent || 0,
        discountAmount: lineItem.discount || 0,
        leadTime: lineItem.leadTime || '',
        note: lineItem.note || '',
      });

      // Initialize outside split reps from line item
      if (lineItem.outsideSplitRates && lineItem.outsideSplitRates.length > 0) {
        const reps: CommissionSplitRep[] = lineItem.outsideSplitRates.map((rep, idx) => ({
          id: crypto.randomUUID(),
          userId: rep.userId || '',
          userName: rep.userName || '',
          splitRate: rep.splitRate || 0,
          position: rep.position || idx + 1,
        }));
        setOutsideSplitReps(reps);
      } else {
        setOutsideSplitReps([]);
      }
    }
  }, [lineItem]);

  if (!isOpen || !lineItem) return null;

  // Add rep to split commission
  const addRepToSplit = (rep: { id: string; fullName?: string; firstName?: string; lastName?: string }) => {
    const repName = rep.fullName || `${rep.firstName || ''} ${rep.lastName || ''}`.trim();

    const newRep: CommissionSplitRep = {
      id: crypto.randomUUID(),
      userId: rep.id,
      userName: repName,
      splitRate: 0,
      position: outsideSplitReps.length + 1,
    };

    const newReps = [...outsideSplitReps, newRep];
    // Auto-distribute percentages
    const splitRate = Math.floor(100 / newReps.length);
    const updatedReps = newReps.map((r, idx) => ({
      ...r,
      splitRate: idx === newReps.length - 1 ? (100 - (splitRate * (newReps.length - 1))) : splitRate,
    }));
    setOutsideSplitReps(updatedReps);
  };

  // Remove rep from split commission
  const removeRepFromSplit = (repId: string) => {
    const newReps = outsideSplitReps.filter(r => r.id !== repId);
    if (newReps.length > 0) {
      // Re-distribute percentages
      const splitRate = Math.floor(100 / newReps.length);
      const updatedReps = newReps.map((r, idx) => ({
        ...r,
        splitRate: idx === newReps.length - 1 ? (100 - (splitRate * (newReps.length - 1))) : splitRate,
        position: idx + 1,
      }));
      setOutsideSplitReps(updatedReps);
    } else {
      setOutsideSplitReps([]);
    }
  };

  // Update split rate for a rep
  const updateSplitRate = (repId: string, rate: number) => {
    setOutsideSplitReps(reps => reps.map(r => r.id === repId ? { ...r, splitRate: rate } : r));
  };

  const handleSave = () => {
    const updates: Partial<InvoiceLineItem> = {
      endUserId: formData.endUserId,
      commissionDiscountPercent: formData.commissionDiscountPercent,
      commissionDiscount: formData.commissionDiscountAmount,
      discountPercent: formData.discountPercent,
      discount: formData.discountAmount,
      leadTime: formData.leadTime,
      note: formData.note,
    };

    // Add outside split rates
    if (outsideSplitReps.length > 0) {
      updates.outsideSplitRates = outsideSplitReps.map((r, idx) => ({
        userId: r.userId,
        userName: r.userName,
        splitRate: r.splitRate,
        position: idx + 1,
      }));
    }

    onSave(updates);
    onClose();
  };

  const outsideSplitTotal = outsideSplitReps.reduce((sum, r) => sum + (r.splitRate || 0), 0);
  const isOutsideSplitValid = outsideSplitReps.length === 0 || outsideSplitTotal === 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Additional Details</h2>
              <p className="text-sm text-gray-500 truncate max-w-[350px]">
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
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {/* End User */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">End User</label>
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
            </div>

            {/* Outside Rep Commission Split */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <label className="text-sm font-medium text-gray-800">Outside Rep Commission Split</label>
              </div>

              {/* Rep list */}
              {outsideSplitReps.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {outsideSplitReps.map((rep) => (
                    <div key={rep.id} className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{rep.userName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rep.splitRate}
                          onChange={(e) => updateSplitRate(rep.id, parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <button
                        onClick={() => removeRepFromSplit(rep.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Remove rep"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-gray-500">Total:</span>
                    <span className={`font-medium ${outsideSplitTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {outsideSplitTotal}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">No outside reps assigned. Search below to add.</p>
              )}

              {/* Add rep search */}
              <SearchableDropdownV2
                value=""
                displayValue=""
                onChange={(id) => {
                  const rep = outsideReps?.find(r => r.id === id);
                  if (rep) {
                    addRepToSplit(rep);
                  }
                }}
                options={outsideRepOptions.filter(opt => !outsideSplitReps.some(r => r.userId === opt.id))}
                onSearch={(term) => {
                  setOutsideRepSearchTerm(term);
                  setOutsideRepSearchEnabled(true);
                }}
                isLoading={isOutsideRepLoading}
                placeholder="Search to add outside rep..."
              />
            </div>

            {/* Commission Discount % */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Commission Discount %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.commissionDiscountPercent}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    const commissionAmount = lineItem?.commission || 0;
                    const discountAmount = (commissionAmount * percent) / 100;
                    setFormData({
                      ...formData,
                      commissionDiscountPercent: percent,
                      commissionDiscountAmount: discountAmount,
                    });
                  }}
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
                  type="text"
                  value={(Number(formData.commissionDiscountAmount) || 0).toFixed(2)}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Line Discount % */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Line Discount %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    const extendedPrice = lineItem?.total || 0;
                    const discountAmount = (extendedPrice * percent) / 100;
                    setFormData({
                      ...formData,
                      discountPercent: percent,
                      discountAmount: discountAmount,
                    });
                  }}
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
                  type="text"
                  value={(Number(formData.discountAmount) || 0).toFixed(2)}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
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
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            {!isOutsideSplitValid && (
              <p className="text-xs text-red-500 mb-2 text-center">
                Split percentages must total 100%
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={!isOutsideSplitValid}
              className={`w-full px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                isOutsideSplitValid
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
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
