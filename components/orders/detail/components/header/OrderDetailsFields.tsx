/**
 * OrderDetailsFields Component
 * Collapsible section with order detail form fields
 * Uses SearchableDropdownV2 for all searchable fields
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Order } from '@/lib/types/rms';
import { formatDate } from '../../utils';
import { RepSplit } from '../../types';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';
import { CustomSelect } from '@/components/tasks/components/CustomSelect';
import {
  useCustomerSearch,
  useFactorySearch,
  useUserSearch,
  useJobSearch,
} from '../../../api';
import { useAutoPopulateReps, RepSplitRate } from '@/components/shared/hooks/useAutoPopulateReps';

// ComingSoonBadge component for unsupported features
function ComingSoonBadge({ inline = false }: { inline?: boolean }) {
  return (
    <span className={`text-[10px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded uppercase ${inline ? 'ml-1' : ''}`}>
      Soon
    </span>
  );
}

interface OrderDetailsFieldsProps {
  order: Order;
  showHeaderFields: boolean;
  toggleHeaderFields: () => void;
  orderOutsideRep: string;
  setOrderOutsideRep: (value: string) => void;
  splitOutsideCommission: boolean;
  setSplitOutsideCommission: (value: boolean) => void;
  outsideRepSplits: RepSplit[];
  setOutsideRepSplits: (splits: RepSplit[]) => void;
  openOutsideRepModal: () => void;
  orderInsideRep: string;
  setOrderInsideRep: (value: string) => void;
  splitInsideCommission: boolean;
  setSplitInsideCommission: (value: boolean) => void;
  insideRepSplits: RepSplit[];
  setInsideRepSplits: (splits: RepSplit[]) => void;
  openInsideRepModal: () => void;
  // New props for field updates
  onUpdateOrder?: (updates: Partial<Order>) => void;
  isCreateMode?: boolean;
  // Settings for per-line-item fields
  showEndUserPerLine?: boolean;
  showOutsideRepPerLine?: boolean;
  showInsideRepPerLine?: boolean;
  // Callbacks for auto-populating reps at line item level
  onAutoPopulateOutsideRepsToLineItems?: (reps: RepSplitRate[]) => void;
  onAutoPopulateInsideRepsToLineItems?: (reps: RepSplitRate[]) => void;
}

export function OrderDetailsFields({
  order,
  showHeaderFields,
  toggleHeaderFields,
  orderOutsideRep,
  setOrderOutsideRep,
  splitOutsideCommission,
  setSplitOutsideCommission,
  outsideRepSplits,
  setOutsideRepSplits,
  openOutsideRepModal,
  orderInsideRep,
  setOrderInsideRep,
  splitInsideCommission,
  setSplitInsideCommission,
  insideRepSplits,
  setInsideRepSplits,
  openInsideRepModal,
  onUpdateOrder,
  isCreateMode = false,
  showEndUserPerLine = false,
  showOutsideRepPerLine = false,
  showInsideRepPerLine = false,
  onAutoPopulateOutsideRepsToLineItems,
  onAutoPopulateInsideRepsToLineItems,
}: OrderDetailsFieldsProps) {
  // Auto-populate reps hook
  const {
    fetchOutsideRepsFromCustomer,
    fetchInsideRepsFromFactory,
  } = useAutoPopulateReps();
  // Search states
  const [soldToSearchTerm, setSoldToSearchTerm] = useState('');
  const [soldToSearchEnabled, setSoldToSearchEnabled] = useState(false);
  const [billToSearchTerm, setBillToSearchTerm] = useState('');
  const [billToSearchEnabled, setBillToSearchEnabled] = useState(false);
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [factorySearchEnabled, setFactorySearchEnabled] = useState(false);
  const [outsideRepSearchTerm, setOutsideRepSearchTerm] = useState('');
  const [outsideRepSearchEnabled, setOutsideRepSearchEnabled] = useState(false);
  const [insideRepSearchTerm, setInsideRepSearchTerm] = useState('');
  const [insideRepSearchEnabled, setInsideRepSearchEnabled] = useState(false);
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobSearchEnabled, setJobSearchEnabled] = useState(false);

  // End user same as sold to checkbox state
  // Initialize to false - user must explicitly check it (matching quotes behavior)
  const [endUserSameAsSoldTo, setEndUserSameAsSoldTo] = useState(false);

  // Bill to same as sold to checkbox state
  // Initialize to false - user must explicitly check it (matching quotes behavior)
  const [billToSameAsSoldTo, setBillToSameAsSoldTo] = useState(false);

  // Update the checkbox when order changes - check both directions
  useEffect(() => {
    const endUserId = (order as any).endUserId;
    const customerId = order.customerId;
    if (endUserId && customerId && endUserId === customerId) {
      setEndUserSameAsSoldTo(true);
    } else {
      setEndUserSameAsSoldTo(false);
    }
  }, [(order as any).endUserId, order.customerId]);

  // Update bill to checkbox when order changes - check both directions
  useEffect(() => {
    const billToCustomerId = (order as any).billToCustomerId;
    const customerId = order.customerId;
    if (billToCustomerId && customerId && billToCustomerId === customerId) {
      setBillToSameAsSoldTo(true);
    } else {
      setBillToSameAsSoldTo(false);
    }
  }, [(order as any).billToCustomerId, order.customerId]);

  // Search hooks
  const { data: soldToCustomers, isLoading: isSoldToLoading } = useCustomerSearch(soldToSearchTerm, soldToSearchEnabled);
  const { data: billToCustomers, isLoading: isBillToLoading } = useCustomerSearch(billToSearchTerm, billToSearchEnabled);
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(endUserSearchTerm, endUserSearchEnabled);
  const { data: factories, isLoading: isFactoryLoading } = useFactorySearch(factorySearchTerm, factorySearchEnabled);
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(outsideRepSearchTerm, { isInside: false, isOutside: true }, outsideRepSearchEnabled);
  const { data: insideReps, isLoading: isInsideRepLoading } = useUserSearch(insideRepSearchTerm, { isInside: true, isOutside: false }, insideRepSearchEnabled);
  const { data: jobs, isLoading: isJobLoading } = useJobSearch(jobSearchTerm, jobSearchEnabled);

  // Transform search results to dropdown options
  const soldToOptions = useMemo(() => {
    return (soldToCustomers || []).map(c => ({
      id: c.id,
      label: c.companyName,
      sublabel: c.isParent ? 'Parent Company' : undefined,
    }));
  }, [soldToCustomers]);

  const billToOptions = useMemo(() => {
    return (billToCustomers || []).map(c => ({
      id: c.id,
      label: c.companyName,
      sublabel: c.isParent ? 'Parent Company' : undefined,
    }));
  }, [billToCustomers]);

  const endUserOptions = useMemo(() => {
    return (endUserCustomers || []).map(c => ({
      id: c.id,
      label: c.companyName,
      sublabel: c.isParent ? 'Parent Company' : undefined,
    }));
  }, [endUserCustomers]);

  const factoryOptions = useMemo(() => {
    return (factories || []).map(f => ({
      id: f.id,
      label: f.title,
      sublabel: f.accountNumber,
    }));
  }, [factories]);

  const outsideRepOptions = useMemo(() => {
    return (outsideReps || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
    }));
  }, [outsideReps]);

  const insideRepOptions = useMemo(() => {
    return (insideReps || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
    }));
  }, [insideReps]);

  const jobOptions = useMemo(() => {
    return (jobs || []).map(j => ({
      id: j.id,
      label: j.jobName,
      sublabel: j.jobType || undefined,
    }));
  }, [jobs]);

  // Field update handlers
  const handleFieldUpdate = (field: keyof Order, value: unknown) => {
    if (onUpdateOrder) {
      onUpdateOrder({ [field]: value });
    }
  };

  // Auto-populate inside reps from factory (called when factory changes)
  const autoPopulateInsideReps = async (factoryId: string) => {
    const reps = await fetchInsideRepsFromFactory(factoryId);
    if (reps.length === 0) return;

    if (showInsideRepPerLine) {
      // Per line item mode - populate all line items
      onAutoPopulateInsideRepsToLineItems?.(reps);
    } else {
      // Header level mode - populate header fields
      const primaryRep = reps[0];
      setOrderInsideRep(primaryRep.userId);
      handleFieldUpdate('insideRepId', primaryRep.userId);
      handleFieldUpdate('insideRepName', primaryRep.userName);

      if (reps.length > 1) {
        // Multiple reps - enable split commission
        setSplitInsideCommission(true);
        const defaultPercentage = Math.floor(100 / reps.length);
        setInsideRepSplits(reps.map((r, idx) => {
          const parsed = parseInt(r.splitRate, 10);
          return {
            repId: r.userId || '',
            repName: r.userName || '',
            percentage: !isNaN(parsed) ? parsed : (idx === reps.length - 1 ? 100 - (defaultPercentage * (reps.length - 1)) : defaultPercentage),
          };
        }));
        openInsideRepModal();
      } else {
        setSplitInsideCommission(false);
        setInsideRepSplits([]);
      }
    }
  };

  // Auto-populate outside reps from end user (called when end user changes)
  const autoPopulateOutsideReps = async (endUserId: string) => {
    const reps = await fetchOutsideRepsFromCustomer(endUserId);
    if (reps.length === 0) return;

    if (showOutsideRepPerLine) {
      // Per line item mode - populate all line items
      onAutoPopulateOutsideRepsToLineItems?.(reps);
    } else {
      // Header level mode - populate header fields
      const primaryRep = reps[0];
      setOrderOutsideRep(primaryRep.userId);
      handleFieldUpdate('outsideRepId' as keyof Order, primaryRep.userId);
      handleFieldUpdate('outsideRepName' as keyof Order, primaryRep.userName);

      if (reps.length > 1) {
        // Multiple reps - enable split commission
        setSplitOutsideCommission(true);
        const defaultPercentage = Math.floor(100 / reps.length);
        setOutsideRepSplits(reps.map((r, idx) => {
          const parsed = parseInt(r.splitRate, 10);
          return {
            repId: r.userId || '',
            repName: r.userName || '',
            percentage: !isNaN(parsed) ? parsed : (idx === reps.length - 1 ? 100 - (defaultPercentage * (reps.length - 1)) : defaultPercentage),
          };
        }));
        openOutsideRepModal();
      } else {
        setSplitOutsideCommission(false);
        setOutsideRepSplits([]);
      }
    }
  };

  return (
    <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
      <button
        onClick={toggleHeaderFields}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-blue-100/50 transition-colors group"
      >
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {showHeaderFields ? 'Order Details' : 'Show Order Details'}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${showHeaderFields ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>
          <span className="text-xs font-medium">{showHeaderFields ? 'Collapse' : 'Expand'}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform ${showHeaderFields ? '' : 'rotate-180'}`}
          >
            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      {showHeaderFields && (
        <div className="px-6 pb-4">
          {/* Row 1: Order Number, Factory, Sold To Customer, Bill To Customer, End User (if header level), Order Date */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Order Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={order.orderNumber}
                onChange={(e) => handleFieldUpdate('orderNumber', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Manufacturer<span className="text-red-500">*</span>
              </label>
              <SearchableDropdownV2
                value={order.manufacturerId || ''}
                displayValue={order.manufacturerName}
                onChange={(id, label) => {
                  handleFieldUpdate('manufacturerId', id);
                  handleFieldUpdate('manufacturerName', label);
                  setFactorySearchEnabled(false);
                  // Auto-populate inside reps from factory
                  if (id) {
                    autoPopulateInsideReps(id);
                  }
                }}
                options={factoryOptions}
                placeholder="Select Manufacturer..."
                isLoading={isFactoryLoading}
                onSearch={(query) => {
                  setFactorySearchTerm(query);
                  setFactorySearchEnabled(true);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Sold To Customer<span className="text-red-500">*</span>
              </label>
              <SearchableDropdownV2
                value={order.customerId || ''}
                displayValue={order.customerName}
                onChange={(id, label) => {
                  handleFieldUpdate('customerId', id);
                  handleFieldUpdate('customerName', label);
                  setSoldToSearchEnabled(false);
                  // If "Same as sold to" is checked, update end user too and auto-populate outside reps
                  if (endUserSameAsSoldTo) {
                    handleFieldUpdate('endUserId' as keyof Order, id);
                    handleFieldUpdate('endUserName' as keyof Order, label);
                    // Auto-populate outside reps from end user (which is same as sold to in this case)
                    if (id) {
                      autoPopulateOutsideReps(id);
                    }
                  }
                  // If "Same as sold to" is checked for bill to, update bill to too
                  if (billToSameAsSoldTo) {
                    handleFieldUpdate('billToCustomerId' as keyof Order, id);
                    handleFieldUpdate('billToCustomerName' as keyof Order, label);
                  }
                }}
                options={soldToOptions}
                placeholder="Select Customer..."
                isLoading={isSoldToLoading}
                onSearch={(query) => {
                  setSoldToSearchTerm(query);
                  setSoldToSearchEnabled(true);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Bill To Customer
              </label>
              <SearchableDropdownV2
                value={(order as any).billToCustomerId || ''}
                displayValue={(order as any).billToCustomerName}
                onChange={(id, label) => {
                  handleFieldUpdate('billToCustomerId' as keyof Order, id);
                  handleFieldUpdate('billToCustomerName' as keyof Order, label);
                  setBillToSearchEnabled(false);
                }}
                options={billToOptions}
                placeholder="Select Bill To..."
                isLoading={isBillToLoading}
                onSearch={(query) => {
                  setBillToSearchTerm(query);
                  setBillToSearchEnabled(true);
                }}
                disabled={billToSameAsSoldTo}
              />
              <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billToSameAsSoldTo}
                  onChange={(e) => {
                    setBillToSameAsSoldTo(e.target.checked);
                    if (e.target.checked && order.customerId) {
                      handleFieldUpdate('billToCustomerId' as keyof Order, order.customerId);
                      handleFieldUpdate('billToCustomerName' as keyof Order, order.customerName);
                    }
                  }}
                  className="w-3 h-3 accent-[var(--primary)]"
                />
                <span className="text-xs text-[var(--muted-foreground)]">Same as sold to</span>
              </label>
            </div>

            {/* End User - always show in header (when showEndUserPerLine is false, it's header level) */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                End User
              </label>
              {!showEndUserPerLine ? (
                <>
                  <SearchableDropdownV2
                    value={(order as any).endUserId || ''}
                    displayValue={(order as any).endUserName || ''}
                    onChange={(id, label) => {
                      handleFieldUpdate('endUserId' as keyof Order, id);
                      handleFieldUpdate('endUserName' as keyof Order, label);
                      setEndUserSearchEnabled(false);
                      // Auto-populate outside reps from end user
                      if (id) {
                        autoPopulateOutsideReps(id);
                      }
                    }}
                    options={endUserOptions}
                    placeholder="Select End User..."
                    isLoading={isEndUserLoading}
                    onSearch={(query) => {
                      setEndUserSearchTerm(query);
                      setEndUserSearchEnabled(true);
                    }}
                    disabled={endUserSameAsSoldTo}
                  />
                  <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={endUserSameAsSoldTo}
                      onChange={(e) => {
                        setEndUserSameAsSoldTo(e.target.checked);
                        if (e.target.checked && order.customerId) {
                          handleFieldUpdate('endUserId' as keyof Order, order.customerId);
                          handleFieldUpdate('endUserName' as keyof Order, order.customerName);
                          // Auto-populate outside reps from end user (which is same as sold to)
                          autoPopulateOutsideReps(order.customerId);
                        }
                      }}
                      className="w-3 h-3 accent-[var(--primary)]"
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">Same as sold to</span>
                  </label>
                </>
              ) : (
                <input
                  type="text"
                  value="Per Line Item"
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-gray-400 cursor-not-allowed"
                  disabled
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Order Date<span className="text-red-500">*</span>
              </label>
              <StyledDatePicker
                selected={parseDateString(order.orderDate)}
                onChange={(date) => handleFieldUpdate('orderDate', formatDateToString(date))}
                placeholder="Select date..."
                className="!py-2 !px-3 !rounded-md !text-sm"
              />
            </div>
          </div>

          {/* Row 2: Order Type, Shipping Terms, Payment Terms, Mark #, Projected Ship Date, Job */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Order Type<span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={(order as any).orderType || 'NORMAL'}
                onChange={(value) => handleFieldUpdate('orderType' as keyof Order, value)}
                options={[
                  { value: 'NORMAL', label: 'Normal' },
                  { value: 'BLANKET', label: 'Blanket' },
                  { value: 'RELEASE', label: 'Release' },
                  { value: 'TAG', label: 'Tag' },
                ]}
                className="!py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Shipping Terms
              </label>
              <input
                type="text"
                value={(order as any).shippingTerms || ''}
                onChange={(e) => handleFieldUpdate('shippingTerms' as keyof Order, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Payment Terms <ComingSoonBadge inline />
              </label>
              <input
                type="text"
                value={(order as any).paymentTerms || ''}
                className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Mark #
              </label>
              <input
                type="text"
                value={(order as any).markNumber || ''}
                onChange={(e) => handleFieldUpdate('markNumber' as keyof Order, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Projected Ship Date
              </label>
              <StyledDatePicker
                selected={parseDateString(order.requestedShipDate || order.shipDate)}
                onChange={(date) => handleFieldUpdate('requestedShipDate', formatDateToString(date))}
                placeholder="Select date..."
                className="!py-2 !px-3 !rounded-md !text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Job
              </label>
              <SearchableDropdownV2
                value={(order as any).jobId || ''}
                displayValue={(order as any).jobName || ''}
                onChange={(id, label) => {
                  handleFieldUpdate('jobId' as keyof Order, id);
                  handleFieldUpdate('jobName' as keyof Order, label);
                  setJobSearchEnabled(false);
                }}
                options={jobOptions}
                placeholder="Select Job..."
                isLoading={isJobLoading}
                onSearch={(query) => {
                  setJobSearchTerm(query);
                  setJobSearchEnabled(true);
                }}
              />
            </div>
          </div>

          {/* Row 3: Manufacturer SO Number, Outside Rep, Inside Rep, Quote Reference, Freight Terms, Due Date */}
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Manufacturer SO Number
              </label>
              <input
                type="text"
                value={order.factorySoNumber || ''}
                onChange={(e) => handleFieldUpdate('factorySoNumber', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Outside Rep
              </label>
              {showOutsideRepPerLine ? (
                <input
                  type="text"
                  value="Per line item"
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-gray-400 cursor-not-allowed"
                  disabled
                />
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SearchableDropdownV2
                        value={orderOutsideRep}
                        displayValue={outsideRepOptions.find(r => r.id === orderOutsideRep)?.label || outsideRepSplits.find(r => r.repId === orderOutsideRep)?.repName || (order as any).outsideRepName}
                        onChange={(id, label) => {
                          setOrderOutsideRep(id);
                          handleFieldUpdate('outsideRepId' as keyof Order, id);
                          handleFieldUpdate('outsideRepName' as keyof Order, label);
                          if (!id) {
                            setSplitOutsideCommission(false);
                            setOutsideRepSplits([]);
                          }
                        }}
                        options={outsideRepOptions}
                        placeholder="Select Rep..."
                        isLoading={isOutsideRepLoading}
                        onSearch={(query) => {
                          setOutsideRepSearchTerm(query);
                          setOutsideRepSearchEnabled(true);
                        }}
                      />
                    </div>
                    {splitOutsideCommission && (
                      <button
                        onClick={openOutsideRepModal}
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        Split
                        {outsideRepSplits.length > 1 && (
                          <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            +{outsideRepSplits.length - 1}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  {orderOutsideRep && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="splitOutsideCommission"
                        checked={splitOutsideCommission}
                        onChange={(e) => {
                          setSplitOutsideCommission(e.target.checked);
                          if (e.target.checked) {
                            const rep = outsideRepOptions.find(r => r.id === orderOutsideRep);
                            if (rep) {
                              setOutsideRepSplits([{ repId: rep.id, repName: rep.label, percentage: 100 }]);
                            }
                            openOutsideRepModal();
                          } else {
                            setOutsideRepSplits([]);
                          }
                        }}
                        className="accent-[var(--primary)]"
                      />
                      <label htmlFor="splitOutsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                        Split commission
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Inside Rep
              </label>
              {showInsideRepPerLine ? (
                <input
                  type="text"
                  value="Per line item"
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-gray-400 cursor-not-allowed"
                  disabled
                />
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SearchableDropdownV2
                        value={orderInsideRep}
                        displayValue={insideRepOptions.find(r => r.id === orderInsideRep)?.label || insideRepSplits.find(r => r.repId === orderInsideRep)?.repName || (order as any).insideRepName || order.insideRepName}
                        onChange={(id, label) => {
                          setOrderInsideRep(id);
                          handleFieldUpdate('insideRepId', id);
                          handleFieldUpdate('insideRepName', label);
                          if (!id) {
                            setSplitInsideCommission(false);
                            setInsideRepSplits([]);
                          }
                        }}
                        options={insideRepOptions}
                        placeholder="Select Rep..."
                        isLoading={isInsideRepLoading}
                        onSearch={(query) => {
                          setInsideRepSearchTerm(query);
                          setInsideRepSearchEnabled(true);
                        }}
                      />
                    </div>
                    {splitInsideCommission && (
                      <button
                        onClick={openInsideRepModal}
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        Split
                        {insideRepSplits.length > 1 && (
                          <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            +{insideRepSplits.length - 1}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  {orderInsideRep && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="splitInsideCommission"
                        checked={splitInsideCommission}
                        onChange={(e) => {
                          setSplitInsideCommission(e.target.checked);
                          if (e.target.checked) {
                            const rep = insideRepOptions.find(r => r.id === orderInsideRep);
                            if (rep) {
                              setInsideRepSplits([{ repId: rep.id, repName: rep.label, percentage: 100 }]);
                            }
                            openInsideRepModal();
                          } else {
                            setInsideRepSplits([]);
                          }
                        }}
                        className="accent-[var(--primary)]"
                      />
                      <label htmlFor="splitInsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                        Split commission
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Quote Reference <ComingSoonBadge inline />
              </label>
              <input
                type="text"
                value={order.quoteId || ''}
                className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Freight Terms
              </label>
              <input
                type="text"
                value={(order as any).freightTerms || ''}
                onChange={(e) => handleFieldUpdate('freightTerms' as keyof Order, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Due Date<span className="text-red-500">*</span>
              </label>
              <StyledDatePicker
                selected={parseDateString(order.dueDate)}
                onChange={(date) => handleFieldUpdate('dueDate', formatDateToString(date))}
                placeholder="Select date..."
                className="!py-2 !px-3 !rounded-md !text-sm"
              />
            </div>
          </div>

          {/* Row 4: Published checkbox */}
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(order as any).published !== false}
                onChange={(e) => handleFieldUpdate('published' as keyof Order, e.target.checked)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    // Move focus to the first line item cell instead of other elements
                    const firstLineItemCell = document.querySelector('tbody tr[data-item-id] td button:not([title="Remove line item"]):not([title="More options"])');
                    if (firstLineItemCell) {
                      e.preventDefault();
                      (firstLineItemCell as HTMLElement).focus();
                    }
                  }
                }}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Published</span>
              <span className="text-xs text-[var(--muted-foreground)]">(Order is visible and active)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
