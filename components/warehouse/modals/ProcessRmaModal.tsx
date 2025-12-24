'use client';

import React, { useState } from 'react';
import { Rma, RmaStatus, rmaStatusLabels, rmaReasonLabels } from '@/lib/types/warehouse';
import { mockBins } from '@/lib/data/warehouse-mock';

interface ProcessRmaModalProps {
  rma: Rma;
  onClose: () => void;
  onComplete: () => void;
}

type Resolution = 'refund' | 'replace' | 'restock' | 'dispose';
type ItemCondition = 'good' | 'damaged' | 'defective' | 'missing';

interface ItemInspection {
  productId: string;
  productName: string;
  quantity: number;
  condition: ItemCondition;
  canRestock: boolean;
  binId: string;
  notes: string;
}

export default function ProcessRmaModal({ rma, onClose, onComplete }: ProcessRmaModalProps) {
  const [step, setStep] = useState<'inspect' | 'resolve'>('inspect');
  const [resolution, setResolution] = useState<Resolution>('refund');
  const [inspections, setInspections] = useState<ItemInspection[]>(
    rma.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      condition: 'good',
      canRestock: true,
      binId: '',
      notes: '',
    }))
  );
  const [refundAmount, setRefundAmount] = useState(rma.totalValue);
  const [internalNotes, setInternalNotes] = useState('');

  const handleConditionChange = (index: number, condition: ItemCondition) => {
    setInspections(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        condition,
        canRestock: condition === 'good',
      } : item
    ));
  };

  const handleRestockChange = (index: number, canRestock: boolean) => {
    setInspections(prev => prev.map((item, i) =>
      i === index ? { ...item, canRestock } : item
    ));
  };

  const handleBinChange = (index: number, binId: string) => {
    setInspections(prev => prev.map((item, i) =>
      i === index ? { ...item, binId } : item
    ));
  };

  const handleNotesChange = (index: number, notes: string) => {
    setInspections(prev => prev.map((item, i) =>
      i === index ? { ...item, notes } : item
    ));
  };

  const restockableItems = inspections.filter(i => i.canRestock);
  const allRestockBinsAssigned = restockableItems.every(i => i.binId || !i.canRestock);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSubmit = () => {
    if (step === 'inspect') {
      setStep('resolve');
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Process RMA</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {rma.rmaNumber} - {rma.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'inspect' ? 'text-[var(--primary)]' : 'text-green-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'inspect' ? 'bg-[var(--primary)] text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 'resolve' ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Inspect Items</span>
            </div>
            <div className="flex-1 h-px bg-[var(--border)]" />
            <div className={`flex items-center gap-2 ${step === 'resolve' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'resolve' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Resolve & Complete</span>
            </div>
          </div>
        </div>

        {/* RMA Info Summary */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted-foreground)]">Original Order:</span>
              <span className="ml-2 font-medium text-[var(--foreground)]">{rma.originalOrderNumber}</span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Reason:</span>
              <span className="ml-2 font-medium text-[var(--foreground)]">{rmaReasonLabels[rma.reason]}</span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Requested:</span>
              <span className="ml-2 font-medium text-[var(--foreground)]">{formatDate(rma.requestedDate)}</span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Value:</span>
              <span className="ml-2 font-medium text-[var(--foreground)]">${rma.totalValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'inspect' ? (
            <div className="space-y-4">
              <h3 className="font-medium text-[var(--foreground)]">Inspect Returned Items</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Examine each item and record its condition. Mark items that can be restocked.
              </p>

              <div className="space-y-4 mt-4">
                {inspections.map((item, index) => (
                  <div key={item.productId} className="border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{item.productName}</h4>
                        <p className="text-sm text-[var(--muted-foreground)]">Qty: {item.quantity}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        item.condition === 'good' ? 'bg-green-100 text-green-700' :
                        item.condition === 'damaged' ? 'bg-red-100 text-red-700' :
                        item.condition === 'defective' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Condition
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) => handleConditionChange(index, e.target.value as ItemCondition)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        >
                          <option value="good">Good - Like New</option>
                          <option value="damaged">Damaged</option>
                          <option value="defective">Defective</option>
                          <option value="missing">Missing/Not Received</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleNotesChange(index, e.target.value)}
                          placeholder="Inspection notes"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                    </div>

                    {item.condition === 'good' && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-[var(--foreground)]">
                            Restock this item?
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRestockChange(index, !item.canRestock)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              item.canRestock ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                item.canRestock ? 'left-6' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>

                        {item.canRestock && (
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                              Restock to Bin
                            </label>
                            <select
                              value={item.binId}
                              onChange={(e) => handleBinChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            >
                              <option value="">Select bin location</option>
                              {mockBins.map((bin) => (
                                <option key={bin.id} value={bin.id}>
                                  Bin {bin.letterCode}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Inspection Summary */}
              <div>
                <h3 className="font-medium text-[var(--foreground)] mb-3">Inspection Summary</h3>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Condition</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {inspections.map((item) => {
                        const bin = mockBins.find(b => b.id === item.binId);
                        return (
                          <tr key={item.productId}>
                            <td className="px-4 py-2 text-sm text-[var(--foreground)]">{item.productName}</td>
                            <td className="px-4 py-2 text-sm text-[var(--foreground)]">{item.quantity}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                item.condition === 'good' ? 'bg-green-100 text-green-700' :
                                item.condition === 'damaged' ? 'bg-red-100 text-red-700' :
                                item.condition === 'defective' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--foreground)]">
                              {item.canRestock && bin ? `Restock to Bin ${bin.letterCode}` : 'Dispose/Write-off'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resolution */}
              <div>
                <h3 className="font-medium text-[var(--foreground)] mb-3">Resolution</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setResolution('refund')}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      resolution === 'refund'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        resolution === 'refund' ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                      }`}>
                        {resolution === 'refund' && (
                          <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--foreground)]">Issue Refund</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Return money to customer</div>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => setResolution('replace')}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      resolution === 'replace'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        resolution === 'replace' ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                      }`}>
                        {resolution === 'replace' && (
                          <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--foreground)]">Send Replacement</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Ship new items to customer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Amount (if refund selected) */}
              {resolution === 'refund' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Refund Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-[var(--foreground)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={rma.totalValue}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      className="w-40 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      of ${rma.totalValue.toLocaleString()} original value
                    </span>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes about this return (internal use only)"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={step === 'inspect' ? onClose : () => setStep('inspect')}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            {step === 'inspect' ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={step === 'inspect' && !allRestockBinsAssigned}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'inspect' ? 'Continue to Resolution' : 'Complete RMA'}
          </button>
        </div>
      </div>
    </div>
  );
}
