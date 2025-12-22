/**
 * OrderDetailsFields Component
 * Collapsible section with order detail form fields
 */

'use client';

import React from 'react';
import { Order } from '@/lib/types/rms';
import { formatDate } from '../../utils';
import { AVAILABLE_OUTSIDE_REPS, AVAILABLE_INSIDE_REPS } from '../../constants';
import { RepSplit } from '../../types';

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
}: OrderDetailsFieldsProps) {
  const availableOutsideReps = AVAILABLE_OUTSIDE_REPS;
  const availableInsideReps = AVAILABLE_INSIDE_REPS;

  return (
    <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
      <button
        onClick={toggleHeaderFields}
        className="w-full flex items-center justify-between px-6 py-2 hover:bg-blue-100/30 transition-colors"
      >
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {showHeaderFields ? 'Order Details' : 'Show Order Details'}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-[var(--muted-foreground)] transition-transform ${showHeaderFields ? '' : 'rotate-180'}`}
        >
          <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {showHeaderFields && (
        <div className="px-6 pb-4">
          {/* Row 1: Order Number, Factory, Sold To Customer, Bill To Customer, Order Date, Due Date */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Order Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={order.orderNumber}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Factory<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={order.manufacturerName}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  onChange={() => {}}
                >
                  <option value={order.manufacturerName}>{order.manufacturerName}</option>
                  <option value="ERMCO">ERMCO</option>
                  <option value="Acuity Brands">Acuity Brands</option>
                  <option value="Eaton">Eaton</option>
                  <option value="Schneider Electric">Schneider Electric</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Sold To Customer<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={order.customerName}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  onChange={() => {}}
                >
                  <option value={order.customerName}>{order.customerName}</option>
                  <option value="Turner Construction">Turner Construction</option>
                  <option value="Hensel Phelps">Hensel Phelps</option>
                  <option value="Skanska USA">Skanska USA</option>
                  <option value="DPR Construction">DPR Construction</option>
                  <option value="Clark Construction">Clark Construction</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Bill To Customer<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value=""
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  onChange={() => {}}
                >
                  <option value="">Select...</option>
                  <option value="Graybar Electric">Graybar Electric</option>
                  <option value="HD Supply">HD Supply</option>
                  <option value="Ferguson Enterprises">Ferguson Enterprises</option>
                  <option value="Rexel USA">Rexel USA</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Order Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDate(order.orderDate)}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <rect x="3" y="4" width="14" height="14" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h14"/>
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
                  value={order.dueDate ? formatDate(order.dueDate) : 'mm/dd/yyyy'}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <rect x="3" y="4" width="14" height="14" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h14"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Order Type, Job, Shipping Terms, Payment Terms, Mark #, Projected Ship Date */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Order Type<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value="NORMAL"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  onChange={() => {}}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="RUSH">RUSH</option>
                  <option value="BLANKET">BLANKET</option>
                  <option value="STOCK">STOCK</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Job
              </label>
              <input
                type="text"
                value={order.jobName || ''}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Shipping Terms
              </label>
              <input
                type="text"
                value=""
                placeholder=""
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value="30"
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Mark #
              </label>
              <input
                type="text"
                value=""
                placeholder=""
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Projected Ship Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={order.shipDate ? formatDate(order.shipDate) : order.requestedShipDate ? formatDate(order.requestedShipDate) : ''}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <rect x="3" y="4" width="14" height="14" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h14"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Row 3: SO Number, Outside Rep, Inside Rep */}
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                SO Number
              </label>
              <input
                type="text"
                value={order.factorySoNumber || ''}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Outside Rep
              </label>
              <div className="relative">
                <select
                  value={orderOutsideRep}
                  onChange={(e) => {
                    setOrderOutsideRep(e.target.value);
                    if (!e.target.value) {
                      setSplitOutsideCommission(false);
                      setOutsideRepSplits([]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                >
                  <option value="">Select Rep...</option>
                  {availableOutsideReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {orderOutsideRep && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="splitOutsideCommission"
                    checked={splitOutsideCommission}
                    onChange={(e) => {
                      setSplitOutsideCommission(e.target.checked);
                      if (e.target.checked) {
                        const rep = availableOutsideReps.find(r => r.id === orderOutsideRep);
                        if (rep) {
                          setOutsideRepSplits([{ repId: rep.id, repName: rep.name, percentage: 100 }]);
                        }
                        openOutsideRepModal();
                      } else {
                        setOutsideRepSplits([]);
                      }
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <label htmlFor="splitOutsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
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
                  value={orderInsideRep}
                  onChange={(e) => {
                    setOrderInsideRep(e.target.value);
                    if (!e.target.value) {
                      setSplitInsideCommission(false);
                      setInsideRepSplits([]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                >
                  <option value="">Select Rep...</option>
                  {availableInsideReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {orderInsideRep && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="splitInsideCommission"
                    checked={splitInsideCommission}
                    onChange={(e) => {
                      setSplitInsideCommission(e.target.checked);
                      if (e.target.checked) {
                        const rep = availableInsideReps.find(r => r.id === orderInsideRep);
                        if (rep) {
                          setInsideRepSplits([{ repId: rep.id, repName: rep.name, percentage: 100 }]);
                        }
                        openInsideRepModal();
                      } else {
                        setInsideRepSplits([]);
                      }
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <label htmlFor="splitInsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
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
