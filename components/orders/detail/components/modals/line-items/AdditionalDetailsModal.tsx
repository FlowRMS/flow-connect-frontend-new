/**
 * AdditionalDetailsModal Component
 * Modal for editing additional line item details (3-dots menu)
 * Supports per-line-item end user, inside rep, and outside rep selection
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { OrderLineItem } from '@/lib/types/rms';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { useCustomerSearch, useUserSearch } from '../../../../api';
import { searchUsers } from '@/components/quotes/api/quotesApi';

// Commission split rep interface
interface CommissionSplitRep {
  id: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

interface AdditionalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineItem: OrderLineItem | null;
  onSave: (updates: Partial<OrderLineItem>) => void;
  showEndUserPerLine?: boolean;
  showOutsideRepPerLine?: boolean;
  showInsideRepPerLine?: boolean;
}

export function AdditionalDetailsModal({
  isOpen,
  onClose,
  lineItem,
  onSave,
  showEndUserPerLine = false,
  showOutsideRepPerLine = false,
  showInsideRepPerLine = false,
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

  // Inside/Outside rep state for line item level
  const [insideSplitReps, setInsideSplitReps] = useState<CommissionSplitRep[]>([]);
  const [outsideSplitReps, setOutsideSplitReps] = useState<CommissionSplitRep[]>([]);

  // End user search
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(
    endUserSearchTerm,
    endUserSearchEnabled && showEndUserPerLine
  );

  // Inside rep search
  const [insideRepSearchTerm, setInsideRepSearchTerm] = useState('');
  const [insideRepSearchEnabled, setInsideRepSearchEnabled] = useState(false);
  const { data: insideReps, isLoading: isInsideRepLoading } = useUserSearch(
    insideRepSearchTerm,
    { isInside: true, isOutside: false },
    insideRepSearchEnabled && showInsideRepPerLine
  );

  // Outside rep search
  const [outsideRepSearchTerm, setOutsideRepSearchTerm] = useState('');
  const [outsideRepSearchEnabled, setOutsideRepSearchEnabled] = useState(false);
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(
    outsideRepSearchTerm,
    { isInside: false, isOutside: true },
    outsideRepSearchEnabled && showOutsideRepPerLine
  );

  const endUserOptions = useMemo(() => {
    return (endUserCustomers || []).map(c => ({
      id: c.id,
      label: c.companyName,
    }));
  }, [endUserCustomers]);

  const insideRepOptions = useMemo(() => {
    return (insideReps || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
      fullName: u.fullName,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }, [insideReps]);

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
        endUserId: (lineItem as any).endUserId || '',
        endUserName: (lineItem as any).endUserName || '',
        commissionDiscountPercent: (lineItem as any).commissionDiscountPercent || 0,
        commissionDiscountAmount: (lineItem as any).commissionDiscountAmount || 0,
        lineDiscountPercent: (lineItem as any).lineDiscountPercent || 0,
        lineDiscountAmount: (lineItem as any).lineDiscountAmount || 0,
        leadTime: (lineItem as any).leadTime || '',
        note: (lineItem as any).note || '',
      });

      // Initialize inside split reps from line item
      const insideSplitRates = (lineItem as any).insideSplitRates;
      if (insideSplitRates && insideSplitRates.length > 0) {
        // Fetch user names for inside reps
        searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
          .then((users) => {
            const repsWithNames: CommissionSplitRep[] = insideSplitRates.map((rep: any, idx: number) => {
              const matchingUser = users.find(u => u.id === rep.userId);
              return {
                id: rep.id || crypto.randomUUID(),
                userId: rep.userId || '',
                userName: matchingUser?.fullName || '',
                splitRate: rep.splitRate || '100',
                position: rep.position || idx + 1,
              };
            });
            setInsideSplitReps(repsWithNames);
          })
          .catch(() => {
            setInsideSplitReps(insideSplitRates.map((rep: any, idx: number) => ({
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: '',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            })));
          });
      } else {
        setInsideSplitReps([]);
      }

      // Initialize outside split reps from line item
      const outsideSplitRates = (lineItem as any).outsideSplitRates;
      if (outsideSplitRates && outsideSplitRates.length > 0) {
        // Fetch user names for outside reps
        searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 })
          .then((users) => {
            const repsWithNames: CommissionSplitRep[] = outsideSplitRates.map((rep: any, idx: number) => {
              const matchingUser = users.find(u => u.id === rep.userId);
              return {
                id: rep.id || crypto.randomUUID(),
                userId: rep.userId || '',
                userName: matchingUser?.fullName || '',
                splitRate: rep.splitRate || '100',
                position: rep.position || idx + 1,
              };
            });
            setOutsideSplitReps(repsWithNames);
          })
          .catch(() => {
            setOutsideSplitReps(outsideSplitRates.map((rep: any, idx: number) => ({
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: '',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            })));
          });
      } else {
        setOutsideSplitReps([]);
      }
    }
  }, [lineItem]);

  if (!isOpen || !lineItem) return null;

  // Add rep to split commission
  const addRepToSplit = (rep: { id: string; fullName?: string; firstName?: string; lastName?: string }, isInside: boolean) => {
    const repName = rep.fullName || `${rep.firstName || ''} ${rep.lastName || ''}`.trim();
    const targetReps = isInside ? insideSplitReps : outsideSplitReps;
    const setReps = isInside ? setInsideSplitReps : setOutsideSplitReps;

    const newRep: CommissionSplitRep = {
      id: crypto.randomUUID(),
      userId: rep.id,
      userName: repName,
      splitRate: '0',
      position: targetReps.length + 1,
    };

    const newReps = [...targetReps, newRep];
    // Auto-distribute percentages
    const splitRate = Math.floor(100 / newReps.length).toString();
    const updatedReps = newReps.map((r, idx) => ({
      ...r,
      splitRate: idx === newReps.length - 1 ? (100 - (parseInt(splitRate) * (newReps.length - 1))).toString() : splitRate,
    }));
    setReps(updatedReps);
  };

  // Remove rep from split commission
  const removeRepFromSplit = (repId: string, isInside: boolean) => {
    const targetReps = isInside ? insideSplitReps : outsideSplitReps;
    const setReps = isInside ? setInsideSplitReps : setOutsideSplitReps;

    const newReps = targetReps.filter(r => r.id !== repId);
    if (newReps.length > 0) {
      // Re-distribute percentages
      const splitRate = Math.floor(100 / newReps.length).toString();
      const updatedReps = newReps.map((r, idx) => ({
        ...r,
        splitRate: idx === newReps.length - 1 ? (100 - (parseInt(splitRate) * (newReps.length - 1))).toString() : splitRate,
        position: idx + 1,
      }));
      setReps(updatedReps);
    } else {
      setReps([]);
    }
  };

  // Update split rate for a rep
  const updateSplitRate = (repId: string, rate: string, isInside: boolean) => {
    const setReps = isInside ? setInsideSplitReps : setOutsideSplitReps;
    setReps(reps => reps.map(r => r.id === repId ? { ...r, splitRate: rate } : r));
  };

  const handleSave = () => {
    const updates: any = { ...formData };

    // Add inside/outside split rates if per-line-item is enabled
    if (showInsideRepPerLine && insideSplitReps.length > 0) {
      updates.insideSplitRates = insideSplitReps.map((r, idx) => ({
        id: r.id,
        userId: r.userId,
        splitRate: r.splitRate,
        position: idx + 1,
      }));
    }

    if (showOutsideRepPerLine && outsideSplitReps.length > 0) {
      updates.outsideSplitRates = outsideSplitReps.map((r, idx) => ({
        id: r.id,
        userId: r.userId,
        splitRate: r.splitRate,
        position: idx + 1,
      }));
    }

    onSave(updates);
    onClose();
  };

  const insideSplitTotal = insideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0);
  const outsideSplitTotal = outsideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0);

  // Validate split totals - only check if per-line-item is enabled AND reps are added
  const isInsideSplitValid = !showInsideRepPerLine || insideSplitReps.length === 0 || insideSplitTotal === 100;
  const isOutsideSplitValid = !showOutsideRepPerLine || outsideSplitReps.length === 0 || outsideSplitTotal === 100;
  const canSave = isInsideSplitValid && isOutsideSplitValid;

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
            {/* End User - only show when per-line-item is enabled */}
            {showEndUserPerLine && (
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
            )}

            {/* Inside Rep - only show when per-line-item is enabled */}
            {showInsideRepPerLine && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <label className="text-sm font-medium text-gray-800">Inside Rep Commission Split</label>
                </div>

                {/* Rep list */}
                {insideSplitReps.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {insideSplitReps.map((rep) => (
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
                            onChange={(e) => updateSplitRate(rep.id, e.target.value, true)}
                            className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <button
                          onClick={() => removeRepFromSplit(rep.id, true)}
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
                      <span className={`font-medium ${insideSplitTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {insideSplitTotal}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">No inside reps assigned. Search below to add.</p>
                )}

                {/* Add rep search */}
                <SearchableDropdownV2
                  value=""
                  displayValue=""
                  onChange={(id) => {
                    const rep = insideReps?.find(r => r.id === id);
                    if (rep) {
                      addRepToSplit(rep, true);
                    }
                  }}
                  options={insideRepOptions.filter(opt => !insideSplitReps.some(r => r.userId === opt.id))}
                  onSearch={(term) => {
                    setInsideRepSearchTerm(term);
                    setInsideRepSearchEnabled(true);
                  }}
                  isLoading={isInsideRepLoading}
                  placeholder="Search to add inside rep..."
                />
              </div>
            )}

            {/* Outside Rep - only show when per-line-item is enabled */}
            {showOutsideRepPerLine && (
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
                            onChange={(e) => updateSplitRate(rep.id, e.target.value, false)}
                            className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <button
                          onClick={() => removeRepFromSplit(rep.id, false)}
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
                      addRepToSplit(rep, false);
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
            )}

            {/* Commission Discount % */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Commission Discount %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.commissionDiscountPercent}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    // Calculate commission discount amount based on line item's commission amount
                    const commissionAmount = lineItem?.commissionAmount || 0;
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

            {/* Commission Discount $ (Read-only, calculated from %) */}
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
                  value={formData.lineDiscountPercent}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    // Calculate line discount amount based on line item's extended price
                    const extendedPrice = lineItem?.extendedPrice || 0;
                    const discountAmount = (extendedPrice * percent) / 100;
                    setFormData({
                      ...formData,
                      lineDiscountPercent: percent,
                      lineDiscountAmount: discountAmount,
                    });
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            {/* Line Discount $ (Read-only, calculated from %) */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Line Discount $</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="text"
                  value={(Number(formData.lineDiscountAmount) || 0).toFixed(2)}
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
            {!canSave && (
              <p className="text-xs text-red-500 mb-2 text-center">
                Split percentages must total 100%
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                canSave
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
