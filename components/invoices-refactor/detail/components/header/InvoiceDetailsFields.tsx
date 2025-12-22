/**
 * InvoiceDetailsFields Component
 * Collapsible section with invoice detail form fields
 */

import React from 'react';
import type { Invoice } from '@/lib/types/rms';
import type { RepSplit } from '../../types';
import { formatDate } from '../../utils';
import { AVAILABLE_OUTSIDE_REPS, AVAILABLE_INSIDE_REPS } from '../../constants';
import { isOverdue } from '../../utils';

interface InvoiceDetailsFieldsProps {
  invoice: Invoice;
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
}

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
}: InvoiceDetailsFieldsProps) {
  const overdue = isOverdue(invoice);

  return (
    <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
      <button
        onClick={toggleHeaderFields}
        className="w-full flex items-center justify-between px-6 py-2 hover:bg-blue-100/30 transition-colors"
      >
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {showHeaderFields ? 'Invoice Details' : 'Show Invoice Details'}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-[var(--muted-foreground)] transition-transform ${
            showHeaderFields ? '' : 'rotate-180'
          }`}
        >
          <path
            d="M6 12l4-4 4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {showHeaderFields && (
        <div className="px-6 pb-4">
          {/* Row 1: Invoice Number, Sold To, Bill To, End User, Job, Payment Terms, Freight Terms */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Invoice Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoice.invoiceNumber}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Sold To Customer<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={invoice.customerName}
                  disabled={isConnectedToOrder}
                  className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none pr-8 ${
                    isConnectedToOrder
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white cursor-pointer'
                  }`}
                  onChange={() => {}}
                >
                  <option value={invoice.customerName}>
                    {invoice.customerName}
                  </option>
                  <option value="Turner Construction">Turner Construction</option>
                  <option value="Hensel Phelps">Hensel Phelps</option>
                  <option value="Skanska USA">Skanska USA</option>
                  <option value="DPR Construction">DPR Construction</option>
                  <option value="Clark Construction">Clark Construction</option>
                </select>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isConnectedToOrder
                      ? 'text-gray-400'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Bill To Customer<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={invoice.manufacturerName}
                  disabled={isConnectedToOrder}
                  className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none pr-8 ${
                    isConnectedToOrder
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white cursor-pointer'
                  }`}
                  onChange={() => {}}
                >
                  <option value={invoice.manufacturerName}>
                    {invoice.manufacturerName}
                  </option>
                  <option value="Graybar Electric">Graybar Electric</option>
                  <option value="HD Supply">HD Supply</option>
                  <option value="Ferguson Enterprises">Ferguson Enterprises</option>
                  <option value="Rexel USA">Rexel USA</option>
                </select>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isConnectedToOrder
                      ? 'text-gray-400'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                End User
              </label>
              <div className="relative">
                <select
                  value=""
                  disabled={isConnectedToOrder}
                  className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none pr-8 ${
                    isConnectedToOrder
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white cursor-pointer'
                  }`}
                  onChange={() => {}}
                >
                  <option value={invoice.customerName}>
                    {invoice.customerName}
                  </option>
                  <option value="Turner Construction">Turner Construction</option>
                  <option value="Hensel Phelps">Hensel Phelps</option>
                  <option value="Skanska USA">Skanska USA</option>
                </select>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isConnectedToOrder
                      ? 'text-gray-400'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="checkbox"
                  id="sameAsSoldTo"
                  defaultChecked
                  disabled={isConnectedToOrder}
                  className={`accent-[var(--primary)] ${
                    isConnectedToOrder ? 'opacity-50' : ''
                  }`}
                />
                <label
                  htmlFor="sameAsSoldTo"
                  className={`text-xs ${
                    isConnectedToOrder
                      ? 'text-gray-400'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  Same as Sold To
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Job
              </label>
              <input
                type="text"
                value=""
                placeholder="Job name"
                disabled={isConnectedToOrder}
                className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                  isConnectedToOrder
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-white'
                }`}
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value="Net 60"
                disabled={isConnectedToOrder}
                className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                  isConnectedToOrder
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-white'
                }`}
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Freight Terms
              </label>
              <input
                type="text"
                value="Prepaid & Add"
                disabled={isConnectedToOrder}
                className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                  isConnectedToOrder
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-white'
                }`}
                readOnly
              />
            </div>
          </div>

          {/* Row 2: Dates and Reps */}
          <div className="grid grid-cols-7 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Invoice Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDate(invoice.invoiceDate)}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]"
                >
                  <rect x="3" y="4" width="14" height="14" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h14" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Due Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDate(invoice.dueDate)}
                  className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                    overdue ? 'text-red-600' : ''
                  }`}
                  readOnly
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]"
                >
                  <rect x="3" y="4" width="14" height="14" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h14" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Entry Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    invoice.entryDate
                      ? formatDate(invoice.entryDate)
                      : 'mm/dd/yyyy'
                  }
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]"
                >
                  <rect x="3" y="4" width="14" height="14" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h14" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Paid Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    invoice.paidDate ? formatDate(invoice.paidDate) : 'mm/dd/yyyy'
                  }
                  className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                    invoice.paidDate ? 'text-green-600' : ''
                  }`}
                  readOnly
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]"
                >
                  <rect x="3" y="4" width="14" height="14" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h14" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                PO Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Enter PO #"
                disabled={isConnectedToOrder}
                className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                  isConnectedToOrder
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Outside Rep
              </label>
              <div className="relative">
                <select
                  value={invoiceOutsideRep}
                  disabled={isConnectedToOrder}
                  onChange={(e) => {
                    setInvoiceOutsideRep(e.target.value);
                    if (!e.target.value) {
                      setSplitOutsideCommission(false);
                      setOutsideRepSplits([]);
                    }
                  }}
                  className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none pr-8 ${
                    isConnectedToOrder
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white cursor-pointer'
                  }`}
                >
                  <option value="">Select Rep...</option>
                  {AVAILABLE_OUTSIDE_REPS.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isConnectedToOrder
                      ? 'text-gray-400'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {invoiceOutsideRep && !isConnectedToOrder && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="splitOutsideCommissionInvoice"
                    checked={splitOutsideCommission}
                    onChange={(e) => {
                      setSplitOutsideCommission(e.target.checked);
                      if (e.target.checked) {
                        const rep = AVAILABLE_OUTSIDE_REPS.find(
                          (r) => r.id === invoiceOutsideRep
                        );
                        if (rep) {
                          setOutsideRepSplits([
                            {
                              repId: rep.id,
                              repName: rep.name,
                              percentage: 100,
                            },
                          ]);
                        }
                        openOutsideRepModal();
                      } else {
                        setOutsideRepSplits([]);
                      }
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <label
                    htmlFor="splitOutsideCommissionInvoice"
                    className="text-xs text-[var(--muted-foreground)] cursor-pointer"
                  >
                    Split
                  </label>
                  {splitOutsideCommission && outsideRepSplits.length > 0 && (
                    <button
                      onClick={openOutsideRepModal}
                      className="text-xs text-[var(--primary)] hover:underline ml-1"
                    >
                      ({outsideRepSplits.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Inside Rep
              </label>
              <div className="relative">
                <select
                  value={invoiceInsideRep}
                  disabled={isConnectedToOrder}
                  onChange={(e) => {
                    setInvoiceInsideRep(e.target.value);
                    if (!e.target.value) {
                      setSplitInsideCommission(false);
                      setInsideRepSplits([]);
                    }
                  }}
                  className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none pr-8 ${
                    isConnectedToOrder
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white cursor-pointer'
                  }`}
                >
                  <option value="">Select Rep...</option>
                  {AVAILABLE_INSIDE_REPS.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isConnectedToOrder
                      ? 'text-gray-400'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {invoiceInsideRep && !isConnectedToOrder && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="splitInsideCommissionInvoice"
                    checked={splitInsideCommission}
                    onChange={(e) => {
                      setSplitInsideCommission(e.target.checked);
                      if (e.target.checked) {
                        const rep = AVAILABLE_INSIDE_REPS.find(
                          (r) => r.id === invoiceInsideRep
                        );
                        if (rep) {
                          setInsideRepSplits([
                            {
                              repId: rep.id,
                              repName: rep.name,
                              percentage: 100,
                            },
                          ]);
                        }
                        openInsideRepModal();
                      } else {
                        setInsideRepSplits([]);
                      }
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <label
                    htmlFor="splitInsideCommissionInvoice"
                    className="text-xs text-[var(--muted-foreground)] cursor-pointer"
                  >
                    Split
                  </label>
                  {splitInsideCommission && insideRepSplits.length > 0 && (
                    <button
                      onClick={openInsideRepModal}
                      className="text-xs text-[var(--primary)] hover:underline ml-1"
                    >
                      ({insideRepSplits.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

