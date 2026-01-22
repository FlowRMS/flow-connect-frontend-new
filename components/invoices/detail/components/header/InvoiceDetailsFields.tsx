/**
 * InvoiceDetailsFields Component
 * Collapsible section with invoice detail form fields
 * Uses SearchableDropdownV2 for all searchable fields including Order and Invoice search
 *
 * Layout:
 * - Row 0: Pre-populate options (Order/Invoice search)
 * - Row 1: Editable fields (Invoice #, Invoice Date, Due Date, Published)
 * - Row 2: Order-populated fields (read-only when connected) - Factory, Sold To, Bill To, End User, PO#
 * - Row 3: Order-populated fields cont. - Job, Payment Terms, Freight Terms, Shipping Terms, Reps
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Invoice } from '@/lib/types/rms';
import type { RepSplit, EditableInvoice } from '../../types';
import { formatDate } from '../../utils';
import { isOverdue } from '../../utils';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';
import {
  useCustomerSearch,
  useFactorySearch,
  useUserSearch,
  useJobSearch,
} from '@/components/orders/api';
import { useOrderSearch } from '@/components/orders/api';

interface InvoiceDetailsFieldsProps {
  invoice: EditableInvoice;
  showHeaderFields: boolean;
  toggleHeaderFields: () => void;
  isConnectedToOrder: boolean;
  poNumber: string;
  setPoNumber: (value: string) => void;
  invoiceOutsideRep: string;
  setInvoiceOutsideRep: (value: string) => void;
  splitOutsideCommission: boolean;
  setSplitOutsideCommission: (value: boolean) => void;
  outsideRepSplits: RepSplit[];
  setOutsideRepSplits: (splits: RepSplit[]) => void;
  openOutsideRepModal: () => void;
  invoiceInsideRep: string;
  setInvoiceInsideRep: (value: string) => void;
  splitInsideCommission: boolean;
  setSplitInsideCommission: (value: boolean) => void;
  insideRepSplits: RepSplit[];
  setInsideRepSplits: (splits: RepSplit[]) => void;
  openInsideRepModal: () => void;
  // New props for order selection
  onOrderSelect?: (orderId: string, orderNumber: string) => void;
  onUpdateInvoice?: (updates: Partial<EditableInvoice>) => void;
  isCreateMode?: boolean;
  isPaid?: boolean; // When true, all fields are read-only (PAID status)
}

// Read-only field styling
const readOnlyInputClass = 'w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-gray-100 text-gray-500 cursor-not-allowed';
const editableInputClass = 'w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white';

export function InvoiceDetailsFields({
  invoice,
  showHeaderFields,
  toggleHeaderFields,
  isConnectedToOrder,
  poNumber,
  setPoNumber,
  invoiceOutsideRep,
  setInvoiceOutsideRep,
  splitOutsideCommission,
  setSplitOutsideCommission,
  outsideRepSplits,
  setOutsideRepSplits,
  openOutsideRepModal,
  invoiceInsideRep,
  setInvoiceInsideRep,
  splitInsideCommission,
  setSplitInsideCommission,
  insideRepSplits,
  setInsideRepSplits,
  openInsideRepModal,
  onOrderSelect,
  onUpdateInvoice,
  isCreateMode = false,
  isPaid = false,
}: InvoiceDetailsFieldsProps) {
  const overdue = isOverdue(invoice);

  // When invoice is paid, all fields should be read-only
  const isReadOnly = isPaid || invoice.status === 'paid';

  // Per-line-item flags
  const outsidePerLineItem = (invoice as any).outsidePerLineItem || false;
  const insidePerLineItem = (invoice as any).insidePerLineItem || false;
  const endUserPerLineItem = (invoice as any).endUserPerLineItem || false;

  // Search states
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderSearchEnabled, setOrderSearchEnabled] = useState(false);
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

  // Search hooks
  const { data: orderResults, isLoading: isOrderSearchLoading } = useOrderSearch(orderSearchTerm, 20);
  const { data: soldToCustomers, isLoading: isSoldToLoading } = useCustomerSearch(soldToSearchTerm, soldToSearchEnabled);
  const { data: billToCustomers, isLoading: isBillToLoading } = useCustomerSearch(billToSearchTerm, billToSearchEnabled);
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(endUserSearchTerm, endUserSearchEnabled);
  const { data: factories, isLoading: isFactoryLoading } = useFactorySearch(factorySearchTerm, factorySearchEnabled);
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(outsideRepSearchTerm, { isInside: false, isOutside: true }, outsideRepSearchEnabled);
  const { data: insideReps, isLoading: isInsideRepLoading } = useUserSearch(insideRepSearchTerm, { isInside: true, isOutside: false }, insideRepSearchEnabled);
  const { data: jobs, isLoading: isJobsLoading } = useJobSearch(jobSearchTerm, jobSearchEnabled);

  // Transform search results to dropdown options
  const orderOptions = useMemo(() => {
    return (orderResults || []).map(o => ({
      id: o.id,
      label: o.orderNumber,
      sublabel: o.entityDate ? `Date: ${formatDate(o.entityDate)}` : undefined,
    }));
  }, [orderResults]);

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
      sublabel: j.description,
    }));
  }, [jobs]);

  // Field update handler
  const handleFieldUpdate = (field: keyof EditableInvoice, value: unknown) => {
    if (onUpdateInvoice) {
      onUpdateInvoice({ [field]: value });
    }
  };

  return (
    <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
      <button
        onClick={toggleHeaderFields}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-blue-100/50 transition-colors group"
      >
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {showHeaderFields ? 'Invoice Details' : 'Show Invoice Details'}
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
            <path
              d="M6 12l4-4 4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      {showHeaderFields && (
        <div className="px-6 pb-4">
          {/* Row 0: Order Pre-populate Dropdown */}
          <div className="grid grid-cols-6 gap-4 mb-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-indigo-700 mb-1">
                Pre-populate from Order
              </label>
              <SearchableDropdownV2
                value={invoice.orderId || ''}
                displayValue={invoice.orderNumber || ''}
                onChange={(id, label) => {
                  if (onOrderSelect) {
                    onOrderSelect(id, label);
                  }
                  setOrderSearchEnabled(false);
                }}
                options={orderOptions}
                placeholder="Search order by number..."
                isLoading={isOrderSearchLoading}
                onSearch={(query) => {
                  setOrderSearchTerm(query);
                  setOrderSearchEnabled(true);
                }}
              />
              <p className="text-xs text-indigo-600 mt-1">
                Select an order to pre-populate invoice details
              </p>
            </div>

            <div className="col-span-4 flex items-end justify-end">
              {isConnectedToOrder && (
                <div className="bg-green-100 text-green-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Connected to Order: {invoice.orderNumber}
                </div>
              )}
            </div>
          </div>

          {/* Row 1: Editable Invoice Fields */}
          {isReadOnly && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800">This invoice is <strong>PAID</strong> and cannot be edited.</span>
            </div>
          )}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Invoice Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoice.invoiceNumber}
                onChange={(e) => !isReadOnly && handleFieldUpdate('invoiceNumber', e.target.value)}
                className={isReadOnly ? readOnlyInputClass : editableInputClass}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Invoice Date<span className="text-red-500">*</span>
              </label>
              <StyledDatePicker
                selected={parseDateString(invoice.invoiceDate)}
                onChange={() => {}}
                className="!py-2 !px-3 !rounded-md !text-sm !bg-gray-100 !text-gray-500"
                disabled={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Due Date<span className="text-red-500">*</span>
              </label>
              <StyledDatePicker
                selected={parseDateString(invoice.dueDate)}
                onChange={(date) => !isReadOnly && handleFieldUpdate('dueDate', formatDateToString(date))}
                placeholder="Select date..."
                className={`!py-2 !px-3 !rounded-md !text-sm ${overdue ? '!text-red-600' : ''} ${isReadOnly ? '!bg-gray-100 !text-gray-500' : ''}`}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Published
              </label>
              <label className={`flex items-center gap-2 mt-2 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={invoice.published !== false}
                  onChange={(e) => !isReadOnly && handleFieldUpdate('published', e.target.checked)}
                  className={`w-4 h-4 accent-[var(--primary)] ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isReadOnly}
                />
                <span className="text-sm text-[var(--foreground)]">Active</span>
              </label>
            </div>
          </div>

          {/* Separator for Order-Populated Fields */}
          {(isConnectedToOrder || isReadOnly) && (
            <div className="flex items-center gap-2 mb-3 mt-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase">{isReadOnly ? 'Read-Only Fields' : 'Order-Populated Fields (Read-Only)'}</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}

          {/* Row 2: Order-Populated Fields - Factory, Customers */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Factory<span className="text-red-500">*</span>
              </label>
              <SearchableDropdownV2
                value={invoice.manufacturerId || ''}
                displayValue={invoice.manufacturerName || ''}
                onChange={(id, label) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('manufacturerId', id);
                    handleFieldUpdate('manufacturerName', label);
                  }
                  setFactorySearchEnabled(false);
                }}
                options={factoryOptions}
                placeholder="Select Factory..."
                isLoading={isFactoryLoading}
                onSearch={(query) => {
                  setFactorySearchTerm(query);
                  setFactorySearchEnabled(true);
                }}
                disabled={isConnectedToOrder || isReadOnly}
                className={(isConnectedToOrder || isReadOnly) ? 'opacity-60' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Sold To Customer<span className="text-red-500">*</span>
              </label>
              <SearchableDropdownV2
                value={invoice.customerId || ''}
                displayValue={invoice.customerName || ''}
                onChange={(id, label) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('customerId', id);
                    handleFieldUpdate('customerName', label);
                  }
                  setSoldToSearchEnabled(false);
                }}
                options={soldToOptions}
                placeholder="Select Customer..."
                isLoading={isSoldToLoading}
                onSearch={(query) => {
                  setSoldToSearchTerm(query);
                  setSoldToSearchEnabled(true);
                }}
                disabled={isConnectedToOrder || isReadOnly}
                className={(isConnectedToOrder || isReadOnly) ? 'opacity-60' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Bill To Customer
              </label>
              <SearchableDropdownV2
                value={(invoice as any).billToCustomerId || ''}
                displayValue={(invoice as any).billToCustomerName || ''}
                onChange={(id, label) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('billToCustomerId' as any, id);
                    handleFieldUpdate('billToCustomerName' as any, label);
                  }
                  setBillToSearchEnabled(false);
                }}
                options={billToOptions}
                placeholder="Select Bill To..."
                isLoading={isBillToLoading}
                onSearch={(query) => {
                  setBillToSearchTerm(query);
                  setBillToSearchEnabled(true);
                }}
                disabled={isConnectedToOrder || isReadOnly}
                className={(isConnectedToOrder || isReadOnly) ? 'opacity-60' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                End User
                {isConnectedToOrder && endUserPerLineItem && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">(Per Line Item)</span>
                )}
              </label>
              {isConnectedToOrder && endUserPerLineItem ? (
                <input
                  type="text"
                  value="Per Line Item"
                  readOnly
                  className={readOnlyInputClass}
                />
              ) : (
                <SearchableDropdownV2
                  value={(invoice as any).endUserId || ''}
                  displayValue={(invoice as any).endUserName || ''}
                  onChange={(id, label) => {
                    if (!isConnectedToOrder && !isReadOnly) {
                      handleFieldUpdate('endUserId' as any, id);
                      handleFieldUpdate('endUserName' as any, label);
                    }
                    setEndUserSearchEnabled(false);
                  }}
                  options={endUserOptions}
                  placeholder="Select End User..."
                  isLoading={isEndUserLoading}
                  onSearch={(query) => {
                    setEndUserSearchTerm(query);
                    setEndUserSearchEnabled(true);
                  }}
                  disabled={isConnectedToOrder || isReadOnly}
                  className={(isConnectedToOrder || isReadOnly) ? 'opacity-60' : ''}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                PO Number
              </label>
              <input
                type="text"
                value={(isConnectedToOrder || isReadOnly) ? ((invoice as any).poNumber || '') : poNumber}
                onChange={(e) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    setPoNumber(e.target.value);
                    handleFieldUpdate('poNumber' as any, e.target.value);
                  }
                }}
                placeholder="Enter PO #"
                className={(isConnectedToOrder || isReadOnly) ? readOnlyInputClass : editableInputClass}
                disabled={isConnectedToOrder || isReadOnly}
              />
            </div>
          </div>

          {/* Row 3: Order-Populated Fields - Job, Terms, Reps */}
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Job
              </label>
              <SearchableDropdownV2
                value={(invoice as any).jobId || ''}
                displayValue={(invoice as any).jobName || ''}
                onChange={(id, label) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('jobId' as any, id);
                    handleFieldUpdate('jobName' as any, label);
                  }
                  setJobSearchEnabled(false);
                }}
                options={jobOptions}
                placeholder="Select Job..."
                isLoading={isJobsLoading}
                onSearch={(query) => {
                  setJobSearchTerm(query);
                  setJobSearchEnabled(true);
                }}
                disabled={isConnectedToOrder || isReadOnly}
                className={(isConnectedToOrder || isReadOnly) ? 'opacity-60' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={(invoice as any).paymentTerms || ''}
                onChange={(e) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('paymentTerms' as any, e.target.value);
                  }
                }}
                placeholder="Net 60"
                className={(isConnectedToOrder || isReadOnly) ? readOnlyInputClass : editableInputClass}
                disabled={isConnectedToOrder || isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Freight Terms
              </label>
              <input
                type="text"
                value={(invoice as any).freightTerms || ''}
                onChange={(e) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('freightTerms' as any, e.target.value);
                  }
                }}
                placeholder="Prepaid & Add"
                className={(isConnectedToOrder || isReadOnly) ? readOnlyInputClass : editableInputClass}
                disabled={isConnectedToOrder || isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Shipping Terms
              </label>
              <input
                type="text"
                value={(invoice as any).shippingTerms || ''}
                onChange={(e) => {
                  if (!isConnectedToOrder && !isReadOnly) {
                    handleFieldUpdate('shippingTerms' as any, e.target.value);
                  }
                }}
                placeholder="FOB Destination"
                className={(isConnectedToOrder || isReadOnly) ? readOnlyInputClass : editableInputClass}
                disabled={isConnectedToOrder || isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Outside Rep
                {isConnectedToOrder && outsidePerLineItem && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">(Per Line Item)</span>
                )}
              </label>
              {/* Per Line Item mode - show "Per Line Item" text */}
              {isConnectedToOrder && outsidePerLineItem ? (
                <input
                  type="text"
                  value="Per Line Item"
                  readOnly
                  className={readOnlyInputClass}
                />
              ) : /* Connected to order but NOT per line item - show read-only reps from first line item */
              isConnectedToOrder && !outsidePerLineItem ? (
                <div>
                  {(() => {
                    const splitRates = (invoice as any).outsideSplitRates || [];
                    if (splitRates.length === 0) {
                      return (
                        <input
                          type="text"
                          value={(invoice as any).outsideRepName || '-'}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      );
                    } else if (splitRates.length === 1) {
                      return (
                        <input
                          type="text"
                          value={splitRates[0].userName || '-'}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      );
                    } else {
                      // Multiple reps - show names with percentages
                      const repDisplay = splitRates.map((r: any) => `${r.userName} (${r.splitRate}%)`).join(', ');
                      return (
                        <input
                          type="text"
                          value={repDisplay}
                          readOnly
                          title={repDisplay}
                          className={readOnlyInputClass}
                        />
                      );
                    }
                  })()}
                </div>
              ) : /* Read-only mode */
              isReadOnly ? (
                <input
                  type="text"
                  value={(invoice as any).outsideRepName || '-'}
                  readOnly
                  className={readOnlyInputClass}
                />
              ) : (
                /* Editable mode - not connected to order */
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableDropdownV2
                      value={invoiceOutsideRep}
                      displayValue={outsideRepOptions.find(r => r.id === invoiceOutsideRep)?.label || ''}
                      onChange={(id, label) => {
                        setInvoiceOutsideRep(id);
                        handleFieldUpdate('outsideRepId' as any, id);
                        handleFieldUpdate('outsideRepName' as any, label);
                        if (!id) {
                          setSplitOutsideCommission(false);
                          setOutsideRepSplits([]);
                        }
                        setOutsideRepSearchEnabled(false);
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
                      className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors whitespace-nowrap"
                    >
                      Split
                    </button>
                  )}
                </div>
              )}
              {invoiceOutsideRep && !isConnectedToOrder && !outsidePerLineItem && !isReadOnly && (
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="splitOutsideCommission"
                    checked={splitOutsideCommission}
                    onChange={(e) => {
                      setSplitOutsideCommission(e.target.checked);
                      if (e.target.checked) {
                        const rep = outsideRepOptions.find(r => r.id === invoiceOutsideRep);
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
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Inside Rep
                {isConnectedToOrder && insidePerLineItem && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">(Per Line Item)</span>
                )}
              </label>
              {/* Per Line Item mode - show "Per Line Item" text */}
              {isConnectedToOrder && insidePerLineItem ? (
                <input
                  type="text"
                  value="Per Line Item"
                  readOnly
                  className={readOnlyInputClass}
                />
              ) : /* Connected to order but NOT per line item - show read-only reps from first line item */
              isConnectedToOrder && !insidePerLineItem ? (
                <div>
                  {(() => {
                    const splitRates = (invoice as any).insideSplitRates || [];
                    if (splitRates.length === 0) {
                      return (
                        <input
                          type="text"
                          value={(invoice as any).insideRepName || '-'}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      );
                    } else if (splitRates.length === 1) {
                      return (
                        <input
                          type="text"
                          value={splitRates[0].userName || '-'}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      );
                    } else {
                      // Multiple reps - show names with percentages
                      const repDisplay = splitRates.map((r: any) => `${r.userName} (${r.splitRate}%)`).join(', ');
                      return (
                        <input
                          type="text"
                          value={repDisplay}
                          readOnly
                          title={repDisplay}
                          className={readOnlyInputClass}
                        />
                      );
                    }
                  })()}
                </div>
              ) : /* Read-only mode */
              isReadOnly ? (
                <input
                  type="text"
                  value={(invoice as any).insideRepName || '-'}
                  readOnly
                  className={readOnlyInputClass}
                />
              ) : (
                /* Editable mode - not connected to order */
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableDropdownV2
                      value={invoiceInsideRep}
                      displayValue={insideRepOptions.find(r => r.id === invoiceInsideRep)?.label || ''}
                      onChange={(id, label) => {
                        setInvoiceInsideRep(id);
                        handleFieldUpdate('insideRepId' as any, id);
                        handleFieldUpdate('insideRepName' as any, label);
                        if (!id) {
                          setSplitInsideCommission(false);
                          setInsideRepSplits([]);
                        }
                        setInsideRepSearchEnabled(false);
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
                      className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors whitespace-nowrap"
                    >
                      Split
                    </button>
                  )}
                </div>
              )}
              {invoiceInsideRep && !isConnectedToOrder && !insidePerLineItem && !isReadOnly && (
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="splitInsideCommission"
                    checked={splitInsideCommission}
                    onChange={(e) => {
                      setSplitInsideCommission(e.target.checked);
                      if (e.target.checked) {
                        const rep = insideRepOptions.find(r => r.id === invoiceInsideRep);
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
