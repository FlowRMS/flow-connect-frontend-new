'use client';

import React, { useState } from 'react';
import { IncomingShipment } from '@/lib/types/warehouse';
import { mockBins } from '@/lib/data/warehouse-mock';

interface ReceiveShipmentModalProps {
  shipment: IncomingShipment;
  onClose: () => void;
  onComplete: () => void;
}

interface LineItemReceive {
  productId: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  binId: string;
  condition: 'good' | 'damaged' | 'missing';
  notes: string;
}

export default function ReceiveShipmentModal({ shipment, onClose, onComplete }: ReceiveShipmentModalProps) {
  const [lineItems, setLineItems] = useState<LineItemReceive[]>(
    shipment.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      expectedQty: item.expectedQuantity,
      receivedQty: item.expectedQuantity,
      binId: '',
      condition: 'good',
      notes: '',
    }))
  );
  const [step, setStep] = useState<'receive' | 'confirm'>('receive');

  const handleQtyChange = (index: number, qty: number) => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, receivedQty: qty } : item
    ));
  };

  const handleBinChange = (index: number, binId: string) => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, binId } : item
    ));
  };

  const handleConditionChange = (index: number, condition: 'good' | 'damaged' | 'missing') => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, condition } : item
    ));
  };

  const handleNotesChange = (index: number, notes: string) => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, notes } : item
    ));
  };

  const totalExpected = lineItems.reduce((sum, item) => sum + item.expectedQty, 0);
  const totalReceived = lineItems.reduce((sum, item) => sum + item.receivedQty, 0);
  const allBinsAssigned = lineItems.every(item => item.binId);

  const handleSubmit = () => {
    if (step === 'receive') {
      setStep('confirm');
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Receive Shipment</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              PO: <span className="font-medium">{shipment.poNumber}</span> from {shipment.vendorName}
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
            <div className={`flex items-center gap-2 ${step === 'receive' ? 'text-[var(--primary)]' : 'text-green-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'receive' ? 'bg-[var(--primary)] text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 'confirm' ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Receive Items</span>
            </div>
            <div className="flex-1 h-px bg-[var(--border)]" />
            <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'confirm' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Confirm & Complete</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'receive' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[var(--foreground)]">Line Items</h3>
                <div className="text-sm text-[var(--muted-foreground)]">
                  Expected: {totalExpected} units | Receiving: {totalReceived} units
                </div>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.productId} className="border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-[var(--foreground)]">{item.productName}</h4>
                        <p className="text-sm text-[var(--muted-foreground)]">Expected: {item.expectedQty} units</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        item.condition === 'good' ? 'bg-green-100 text-green-700' :
                        item.condition === 'damaged' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Received Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.expectedQty * 2}
                          value={item.receivedQty}
                          onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Bin Location
                        </label>
                        <select
                          value={item.binId}
                          onChange={(e) => handleBinChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        >
                          <option value="">Select bin</option>
                          {mockBins.map((bin) => (
                            <option key={bin.id} value={bin.id}>
                              Bin {bin.letterCode}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Condition
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) => handleConditionChange(index, e.target.value as 'good' | 'damaged' | 'missing')}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        >
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                          <option value="missing">Missing</option>
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
                          placeholder="Optional notes"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                  Ready to Complete Receiving
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Please review the summary below and confirm to complete the receiving process.
                </p>
              </div>

              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expected</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Received</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Variance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Bin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {lineItems.map((item) => {
                      const variance = item.receivedQty - item.expectedQty;
                      const bin = mockBins.find(b => b.id === item.binId);
                      return (
                        <tr key={item.productId}>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.expectedQty}</td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.receivedQty}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={
                              variance === 0 ? 'text-green-600' :
                              variance > 0 ? 'text-blue-600' : 'text-red-600'
                            }>
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                            {bin ? `Bin ${bin.letterCode}` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.condition === 'good' ? 'bg-green-100 text-green-700' :
                              item.condition === 'damaged' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--muted)]/30">
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Total</td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{totalExpected}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{totalReceived}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <span className={
                          totalReceived - totalExpected === 0 ? 'text-green-600' :
                          totalReceived - totalExpected > 0 ? 'text-blue-600' : 'text-red-600'
                        }>
                          {totalReceived - totalExpected > 0 ? '+' : ''}{totalReceived - totalExpected}
                        </span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={step === 'receive' ? onClose : () => setStep('receive')}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            {step === 'receive' ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={step === 'receive' && !allBinsAssigned}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'receive' ? 'Continue to Confirm' : 'Complete Receiving'}
          </button>
        </div>
      </div>
    </div>
  );
}
