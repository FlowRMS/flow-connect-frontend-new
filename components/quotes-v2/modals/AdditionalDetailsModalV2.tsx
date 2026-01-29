'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { LineItemV2, QuoteSettingsV2 } from '../types';
import { SearchableDropdownV2 } from '../components/SearchableDropdownV2';
import { useCustomerSearch, useUserSearch } from '../../quotes/api/useQuotesApi';
import { fetchUserById } from '../../lib/api/search';
import { useAutoPopulateReps } from '@/components/shared/hooks/useAutoPopulateReps';

// Commission split rep interface
interface CommissionSplitRep {
  id: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

interface AdditionalDetailsModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  lineItem: LineItemV2 | null;
  onSave: (updates: Partial<LineItemV2>) => void;
  onLiveUpdate?: (updates: Partial<LineItemV2>) => void;
  settings?: QuoteSettingsV2;
}

export function AdditionalDetailsModalV2({
  isOpen,
  onClose,
  lineItem,
  onSave,
  onLiveUpdate,
  settings,
}: AdditionalDetailsModalV2Props) {
  const [formData, setFormData] = useState({
    endUserId: '',
    endUserName: '',
    commissionDiscountPercent: 0,
    commissionDiscountAmount: 0,
    lineDiscountPercent: 0,
    lineDiscountAmount: 0,
    leadTime: '',
  });

  // Inside/Outside rep state for line item level
  const [insideSplitReps, setInsideSplitReps] = useState<CommissionSplitRep[]>([]);
  const [outsideSplitReps, setOutsideSplitReps] = useState<CommissionSplitRep[]>([]);

  // Auto-populate reps hook
  const { fetchOutsideRepsFromCustomer } = useAutoPopulateReps();

  // Search states
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);
  const [insideRepSearchTerm, setInsideRepSearchTerm] = useState('');
  const [insideRepSearchEnabled, setInsideRepSearchEnabled] = useState(false);
  const [outsideRepSearchTerm, setOutsideRepSearchTerm] = useState('');
  const [outsideRepSearchEnabled, setOutsideRepSearchEnabled] = useState(false);

  // API hooks
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(
    endUserSearchTerm,
    endUserSearchEnabled && !!settings?.specifyEndUserPerLine
  );
  const { data: insideReps, isLoading: isInsideRepLoading } = useUserSearch(
    insideRepSearchTerm,
    true, // isInside
    insideRepSearchEnabled && !!settings?.insideRepAtLineLevel,
    false // isOutside
  );
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(
    outsideRepSearchTerm,
    false, // isInside
    outsideRepSearchEnabled && !!settings?.outsideRepAtLineLevel,
    true // isOutside
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
      label: u.fullName || `${u.firstName} ${u.lastName}`,
      sublabel: u.email,
      fullName: u.fullName,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }, [insideReps]);

  const outsideRepOptions = useMemo(() => {
    return (outsideReps || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName} ${u.lastName}`,
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
        endUserName: lineItem.endUserName || '',
        commissionDiscountPercent: lineItem.commissionDiscountPercent || 0,
        commissionDiscountAmount: lineItem.commissionDiscountAmount || 0,
        lineDiscountPercent: lineItem.lineDiscountPercent || 0,
        lineDiscountAmount: lineItem.lineDiscountAmount || 0,
        leadTime: lineItem.leadTime || '',
      });

      // Initialize inside split reps from line item
      if (lineItem.insideSplitRates && lineItem.insideSplitRates.length > 0) {
        // Fetch user names for inside reps by their IDs
        Promise.all(
          lineItem.insideSplitRates.map(async (rep, idx) => {
            // If userName is already stored, use it
            if (rep.userName) {
              return {
                id: rep.id || crypto.randomUUID(),
                userId: rep.userId || '',
                userName: rep.userName,
                splitRate: rep.splitRate || '100',
                position: rep.position || idx + 1,
              };
            }
            // Otherwise fetch by ID
            if (rep.userId) {
              const user = await fetchUserById(rep.userId);
              return {
                id: rep.id || crypto.randomUUID(),
                userId: rep.userId,
                userName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
                splitRate: rep.splitRate || '100',
                position: rep.position || idx + 1,
              };
            }
            return {
              id: rep.id || crypto.randomUUID(),
              userId: '',
              userName: 'Unknown',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            };
          })
        )
          .then((repsWithNames) => setInsideSplitReps(repsWithNames))
          .catch(() => {
            setInsideSplitReps(lineItem.insideSplitRates!.map((rep, idx) => ({
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: rep.userName || 'Unknown',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            })));
          });
      } else {
        setInsideSplitReps([]);
      }

      // Initialize outside split reps from line item
      if (lineItem.outsideSplitRates && lineItem.outsideSplitRates.length > 0) {
        // Fetch user names for outside reps by their IDs
        Promise.all(
          lineItem.outsideSplitRates.map(async (rep, idx) => {
            // If userName is already stored, use it
            if (rep.userName) {
              return {
                id: rep.id || crypto.randomUUID(),
                userId: rep.userId || '',
                userName: rep.userName,
                splitRate: rep.splitRate || '100',
                position: rep.position || idx + 1,
              };
            }
            // Otherwise fetch by ID
            if (rep.userId) {
              const user = await fetchUserById(rep.userId);
              return {
                id: rep.id || crypto.randomUUID(),
                userId: rep.userId,
                userName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
                splitRate: rep.splitRate || '100',
                position: rep.position || idx + 1,
              };
            }
            return {
              id: rep.id || crypto.randomUUID(),
              userId: '',
              userName: 'Unknown',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            };
          })
        )
          .then((repsWithNames) => setOutsideSplitReps(repsWithNames))
          .catch(() => {
            setOutsideSplitReps(lineItem.outsideSplitRates!.map((rep, idx) => ({
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: rep.userName || 'Unknown',
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
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
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
    const updates: Partial<LineItemV2> = {
      ...formData,
    };

    // Add inside/outside split rates if per-line-item is enabled
    if (settings?.insideRepAtLineLevel && insideSplitReps.length > 0) {
      updates.insideSplitRates = insideSplitReps.map((r, idx) => ({
        id: r.id,
        userId: r.userId,
        splitRate: r.splitRate,
        position: idx + 1,
      }));
    }

    if (settings?.outsideRepAtLineLevel && outsideSplitReps.length > 0) {
      updates.outsideSplitRates = outsideSplitReps.map((r, idx) => ({
        id: r.id,
        userId: r.userId,
        splitRate: r.splitRate,
        position: idx + 1,
      }));
    }

    if (settings?.specifyEndUserPerLine) {
      updates.endUserId = formData.endUserId;
      updates.endUserName = formData.endUserName;
    }

    onSave(updates);
    onClose();
  };

  const outsideSplitTotal = outsideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0);

  // Validate split totals - inside rep percentages are auto-calculated, so always valid
  const isInsideSplitValid = true;
  const isOutsideSplitValid = !settings?.outsideRepAtLineLevel || outsideSplitReps.length === 0 || outsideSplitTotal === 100;

  // Validate End User - only check if per-line-item is enabled
  const isEndUserValid = !settings?.specifyEndUserPerLine || (formData.endUserId && formData.endUserId.trim() !== '');

  const canSave = isInsideSplitValid && isOutsideSplitValid && isEndUserValid;

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
            {settings?.specifyEndUserPerLine && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">End User</label>
                <SearchableDropdownV2
                  value={formData.endUserId}
                  displayValue={formData.endUserName}
                  onChange={async (id, label) => {
                    setFormData({
                      ...formData,
                      endUserId: id,
                      endUserName: label,
                    });
                    // Auto-populate outside reps from end user when both end user per line item
                    // AND outside rep per line item are enabled
                    if (id && settings?.outsideRepAtLineLevel) {
                      const reps = await fetchOutsideRepsFromCustomer(id);
                      if (reps.length > 0) {
                        // Convert to the format expected by this modal
                        const newOutsideSplitReps = reps.map((rep, idx) => ({
                          id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
                          userId: rep.userId,
                          userName: rep.userName,
                          splitRate: rep.splitRate,
                          position: idx + 1,
                        }));
                        setOutsideSplitReps(newOutsideSplitReps);
                      }
                    }
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
            {settings?.insideRepAtLineLevel && (
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
                        {/* Percentage is auto-calculated, hidden from UI */}
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
            {settings?.outsideRepAtLineLevel && (
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

            {/* Line Discount - moved above Commission Discount */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Line Discount</label>
              {/* Warning about $ amount discounts */}
              <div className="flex items-start gap-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-700">
                  Using % for discounts is recommended. $ amounts may cause decimal variances in calculations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.lineDiscountPercent || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '');
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      e.target.value = value;
                    }
                    const lineDiscountPct = parseFloat(e.target.value) || 0;
                    // Calculate like API does:
                    // 1. Line discount $ = subtotal (sellTotal) × lineDiscountPercent
                    const sellTotal = lineItem?.sellTotal || 0;
                    const lineDiscountAmount = Math.round((sellTotal * lineDiscountPct) / 100 * 10000) / 10000;
                    // 2. Discounted total = subtotal - line discount
                    const discountedTotal = sellTotal - lineDiscountAmount;
                    // 3. Commission = discounted total × commissionRate (NOT original subtotal!)
                    const commissionRate = lineItem?.commissionPercent || 0;
                    const newCommission = discountedTotal * (commissionRate / 100);
                    // 4. Recalculate commission discount based on new commission
                    const commDiscountPct = formData.commissionDiscountPercent || 0;
                    const newCommissionDiscountAmount = Math.round((newCommission * commDiscountPct) / 100 * 10000) / 10000;

                    setFormData({
                      ...formData,
                      lineDiscountPercent: Math.round(lineDiscountPct * 100) / 100,
                      lineDiscountAmount: lineDiscountAmount,
                      commissionDiscountAmount: newCommissionDiscountAmount,
                    });
                    // Live update with all calculated values
                    onLiveUpdate?.({
                      lineDiscountPercent: Math.round(lineDiscountPct * 100) / 100,
                      lineDiscountAmount: lineDiscountAmount,
                      commission: newCommission,
                      commissionDiscountAmount: newCommissionDiscountAmount,
                    });
                  }}
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-gray-400 mx-2">=</span>
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.lineDiscountAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '');
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      e.target.value = value;
                    }
                    const dollarAmount = parseFloat(e.target.value) || 0;
                    const sellTotal = lineItem?.sellTotal || 0;
                    // Calculate percentage from dollar amount
                    const lineDiscountPct = sellTotal > 0 ? (dollarAmount / sellTotal) * 100 : 0;
                    // Calculate commission on discounted total
                    const discountedTotal = sellTotal - dollarAmount;
                    const commissionRate = lineItem?.commissionPercent || 0;
                    const newCommission = discountedTotal * (commissionRate / 100);
                    // Recalculate commission discount
                    const commDiscountPct = formData.commissionDiscountPercent || 0;
                    const newCommissionDiscountAmount = Math.round((newCommission * commDiscountPct) / 100 * 10000) / 10000;

                    setFormData({
                      ...formData,
                      lineDiscountPercent: Math.round(lineDiscountPct * 10000) / 10000,
                      lineDiscountAmount: dollarAmount,
                      commissionDiscountAmount: newCommissionDiscountAmount,
                    });
                    onLiveUpdate?.({
                      lineDiscountPercent: Math.round(lineDiscountPct * 10000) / 10000,
                      lineDiscountAmount: dollarAmount,
                      commission: newCommission,
                      commissionDiscountAmount: newCommissionDiscountAmount,
                    });
                  }}
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Commission Discount */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Commission Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.commissionDiscountPercent || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '');
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      e.target.value = value;
                    }
                    const commDiscountPct = parseFloat(e.target.value) || 0;
                    // Calculate commission on DISCOUNTED total like API does
                    const sellTotal = lineItem?.sellTotal || 0;
                    const lineDiscountPct = formData.lineDiscountPercent || 0;
                    const lineDiscountAmount = Math.round((sellTotal * lineDiscountPct) / 100 * 10000) / 10000;
                    const discountedTotal = sellTotal - lineDiscountAmount;
                    const commissionRate = lineItem?.commissionPercent || 0;
                    const commission = discountedTotal * (commissionRate / 100);
                    // Now calculate commission discount based on the new commission
                    const commissionDiscountAmount = Math.round((commission * commDiscountPct) / 100 * 10000) / 10000;

                    setFormData({
                      ...formData,
                      commissionDiscountPercent: Math.round(commDiscountPct * 100) / 100,
                      commissionDiscountAmount: commissionDiscountAmount,
                    });
                    // Live update - send both percentage and calculated amount
                    onLiveUpdate?.({
                      commissionDiscountPercent: Math.round(commDiscountPct * 100) / 100,
                      commissionDiscountAmount: commissionDiscountAmount,
                    });
                  }}
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-gray-400 mx-2">=</span>
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.commissionDiscountAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '');
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      e.target.value = value;
                    }
                    const dollarAmount = parseFloat(e.target.value) || 0;
                    // Calculate commission on DISCOUNTED total
                    const sellTotal = lineItem?.sellTotal || 0;
                    const lineDiscountPct = formData.lineDiscountPercent || 0;
                    const lineDiscountAmount = Math.round((sellTotal * lineDiscountPct) / 100 * 10000) / 10000;
                    const discountedTotal = sellTotal - lineDiscountAmount;
                    const commissionRate = lineItem?.commissionPercent || 0;
                    const commission = discountedTotal * (commissionRate / 100);
                    // Calculate percentage from dollar amount
                    const commDiscountPct = commission > 0 ? (dollarAmount / commission) * 100 : 0;

                    setFormData({
                      ...formData,
                      commissionDiscountPercent: Math.round(commDiscountPct * 10000) / 10000,
                      commissionDiscountAmount: dollarAmount,
                    });
                    onLiveUpdate?.({
                      commissionDiscountPercent: Math.round(commDiscountPct * 10000) / 10000,
                      commissionDiscountAmount: dollarAmount,
                    });
                  }}
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  placeholder="0"
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            {!canSave && (
              <div className="text-xs text-red-500 mb-2 text-center space-y-1">
                {!isInsideSplitValid && <p>Inside rep split percentages must total 100%</p>}
                {!isOutsideSplitValid && <p>Outside rep split percentages must total 100%</p>}
                {!isEndUserValid && <p>End User is required for this line item</p>}
              </div>
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

export default AdditionalDetailsModalV2;
