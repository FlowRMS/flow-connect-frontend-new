/**
 * StatementDetailPanel Component
 * Sleek sidebar panel for viewing statement details
 * Features: smooth animations, organized sections, and beautiful UI
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Statement, StatementDetail } from '../../../api';

interface StatementDetailPanelProps {
  statement: Statement | null;
  onClose: () => void;
  isLoading?: boolean;
}

const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const formatPercent = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return `${num.toFixed(2)}%`;
};

function DetailSection({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string | React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

function LineItemCard({ detail, index }: { detail: StatementDetail; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-50 rounded-lg p-4 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
            {detail.itemNumber || index + 1}
          </span>
          <span className="font-medium text-gray-900 text-sm">
            {detail.product?.factoryPartNumber || detail.productNameAdhoc || 'Product'}
          </span>
        </div>
        <span className="font-semibold text-emerald-600 text-sm">
          {formatCurrency(detail.total)}
        </span>
      </div>

      {detail.product?.description || detail.productDescriptionAdhoc ? (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {detail.product?.description || detail.productDescriptionAdhoc}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-gray-400 block">Qty</span>
          <span className="font-medium text-gray-700">{detail.quantity || '-'}</span>
        </div>
        <div>
          <span className="text-gray-400 block">Unit Price</span>
          <span className="font-medium text-gray-700">{formatCurrency(detail.unitPrice)}</span>
        </div>
        <div>
          <span className="text-gray-400 block">Commission</span>
          <span className="font-medium text-emerald-600">{formatCurrency(detail.commission)}</span>
        </div>
      </div>

      {detail.soldToCustomer && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-400">Sold To: </span>
          <span className="text-xs font-medium text-gray-700">{detail.soldToCustomer.companyName}</span>
        </div>
      )}

      {detail.endUser && (
        <div className="mt-1">
          <span className="text-xs text-gray-400">End User: </span>
          <span className="text-xs font-medium text-gray-700">{detail.endUser.companyName}</span>
        </div>
      )}

      {detail.note && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-400 block mb-1">Note</span>
          <p className="text-xs text-gray-600 italic">{detail.note}</p>
        </div>
      )}

      {detail.outsideSplitRates && detail.outsideSplitRates.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-400 block mb-2">Outside Split Rates</span>
          <div className="space-y-1">
            {detail.outsideSplitRates.map((split, idx) => (
              <div key={split.id || idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {split.user?.fullName || split.user?.email || 'User'}
                </span>
                <span className="font-medium text-purple-600">{formatPercent(split.splitRate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function StatementDetailPanel({ statement, onClose, isLoading }: StatementDetailPanelProps) {
  return (
    <AnimatePresence>
      {statement && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-[520px] bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 overflow-hidden shadow-2xl z-40"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-5 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <path d="M9 12h6M9 16h4"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {statement.statementNumber || `STM-${statement.id.substring(0, 8)}`}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {statement.factory?.title || 'Unknown Factory'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100%-88px)] p-6 space-y-5">
            {isLoading ? (
              <div className="space-y-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-gray-100" />
                      <div className="h-4 bg-gray-100 rounded w-24" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Overview Section */}
                <DetailSection
                  title="Overview"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8"/>
                    </svg>
                  }
                >
                  <InfoRow label="Statement Date" value={formatDate(statement.entityDate)} />
                  <InfoRow label="Factory" value={statement.factory?.title || '-'} />
                  <InfoRow label="Creation Type" value={
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      statement.creationType === 'MANUAL' ? 'bg-blue-100 text-blue-700' :
                      statement.creationType === 'IMPORT' ? 'bg-purple-100 text-purple-700' :
                      statement.creationType === 'API' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {statement.creationType || 'MANUAL'}
                    </span>
                  } />
                  <InfoRow label="Created" value={formatDate(statement.createdAt)} />
                  {statement.createdBy && (
                    <InfoRow label="Created By" value={typeof statement.createdBy === 'string' ? statement.createdBy : ''} />
                  )}
                </DetailSection>

                {/* Totals Section */}
                {statement.balance && (
                  <DetailSection
                    title="Totals"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                      </svg>
                    }
                  >
                    <InfoRow label="Quantity" value={statement.balance.quantity?.toString() || '-'} />
                    <InfoRow label="Subtotal" value={formatCurrency(statement.balance.subtotal)} />
                    <InfoRow label="Discount" value={formatCurrency(statement.balance.discount)} />
                    <InfoRow label="Total" value={formatCurrency(statement.balance.total)} highlight />
                    <div className="my-3 border-t border-gray-100" />
                    <InfoRow label="Commission Rate" value={formatPercent(statement.balance.commissionRate)} />
                    <InfoRow label="Commission Discount" value={formatCurrency(statement.balance.commissionDiscount)} />
                    <InfoRow label="Commission" value={formatCurrency(statement.balance.commission)} highlight />
                  </DetailSection>
                )}

                {/* Line Items Section */}
                {statement.details && statement.details.length > 0 && (
                  <DetailSection
                    title={`Line Items (${statement.details.length})`}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                      </svg>
                    }
                  >
                    <div className="space-y-3 -mx-1">
                      {statement.details.map((detail, index) => (
                        <LineItemCard key={detail.id || index} detail={detail} index={index} />
                      ))}
                    </div>
                  </DetailSection>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30">
                    Edit Statement
                  </button>
                  {statement.url && (
                    <a
                      href={statement.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9"/>
                        <path d="M9 11l7-7M12 4h4v4"/>
                      </svg>
                      Open PDF
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
