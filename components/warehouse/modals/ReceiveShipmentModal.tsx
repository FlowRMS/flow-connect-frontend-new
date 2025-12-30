'use client';

import React, { useState } from 'react';
import { IncomingShipment } from '@/lib/types/warehouse';
import { mockBins } from '@/lib/data/warehouse-mock';

interface ReceiveShipmentModalProps {
  shipment: IncomingShipment;
  onClose: () => void;
  onComplete: () => void;
}

interface SerialEntry {
  serial: string;
  condition: 'good' | 'damaged';
}

interface LineItemReceive {
  productId: string;
  productName: string;
  partNumber: string;
  expectedQty: number;
  receivedQty: number;
  binId: string;
  condition: 'good' | 'damaged' | 'missing';
  notes: string;
  lotNumber: string;
  expirationDate: string;
  trackSerials: boolean;
  serialNumbers: SerialEntry[];
}

export default function ReceiveShipmentModal({ shipment, onClose, onComplete }: ReceiveShipmentModalProps) {
  const [lineItems, setLineItems] = useState<LineItemReceive[]>(
    shipment.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      partNumber: item.partNumber,
      expectedQty: item.expectedQuantity,
      receivedQty: item.expectedQuantity,
      binId: '',
      condition: 'good',
      notes: '',
      lotNumber: '',
      expirationDate: '',
      trackSerials: false,
      serialNumbers: [],
    }))
  );
  const [step, setStep] = useState<'receive' | 'confirm'>('receive');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [serialInput, setSerialInput] = useState<Record<number, string>>({});

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

  const handleLotNumberChange = (index: number, lotNumber: string) => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, lotNumber } : item
    ));
  };

  const handleExpirationDateChange = (index: number, expirationDate: string) => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, expirationDate } : item
    ));
  };

  const handleToggleSerialTracking = (index: number) => {
    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, trackSerials: !item.trackSerials, serialNumbers: [] } : item
    ));
  };

  const handleAddSerial = (index: number) => {
    const serial = serialInput[index]?.trim();
    if (!serial) return;

    const item = lineItems[index];
    // Check for duplicates
    if (item.serialNumbers.some(s => s.serial === serial)) {
      alert('This serial number has already been added');
      return;
    }

    setLineItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        serialNumbers: [...item.serialNumbers, { serial, condition: 'good' }],
        receivedQty: item.serialNumbers.length + 1
      } : item
    ));
    setSerialInput(prev => ({ ...prev, [index]: '' }));
  };

  const handleRemoveSerial = (itemIndex: number, serialIndex: number) => {
    setLineItems(prev => prev.map((item, i) =>
      i === itemIndex ? {
        ...item,
        serialNumbers: item.serialNumbers.filter((_, si) => si !== serialIndex),
        receivedQty: item.serialNumbers.length - 1
      } : item
    ));
  };

  const handleSerialConditionChange = (itemIndex: number, serialIndex: number, condition: 'good' | 'damaged') => {
    setLineItems(prev => prev.map((item, i) =>
      i === itemIndex ? {
        ...item,
        serialNumbers: item.serialNumbers.map((s, si) =>
          si === serialIndex ? { ...s, condition } : s
        )
      } : item
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Receive Delivery</h2>
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
                  <div key={item.productId} className="border border-[var(--border)] rounded-lg overflow-hidden">
                    {/* Item Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-[var(--muted)]/20 transition-colors"
                      onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-[var(--foreground)]">{item.productName}</h4>
                            {item.lotNumber && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                Lot: {item.lotNumber}
                              </span>
                            )}
                            {item.trackSerials && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                                {item.serialNumbers.length} serials
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {item.partNumber} · Expected: {item.expectedQty} units
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            item.condition === 'good' ? 'bg-green-100 text-green-700' :
                            item.condition === 'damaged' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                          </div>
                          <svg
                            className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${expandedItem === index ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedItem === index && (
                      <div className="border-t border-[var(--border)] p-4 bg-[var(--muted)]/10">
                        {/* Basic Fields Row */}
                        <div className="grid grid-cols-4 gap-4">
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
                              disabled={item.trackSerials}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {item.trackSerials && (
                              <p className="text-xs text-[var(--muted-foreground)] mt-1">Auto-calculated from serials</p>
                            )}
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
                              disabled={item.trackSerials}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
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

                        {/* Lot/Expiration Row */}
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                              Lot Number
                            </label>
                            <input
                              type="text"
                              value={item.lotNumber}
                              onChange={(e) => handleLotNumberChange(index, e.target.value)}
                              placeholder="Enter lot #"
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                              Expiration Date
                            </label>
                            <input
                              type="date"
                              value={item.expirationDate}
                              onChange={(e) => handleExpirationDateChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                          </div>
                          <div className="col-span-2 flex items-end">
                            <button
                              type="button"
                              onClick={() => handleToggleSerialTracking(index)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                                item.trackSerials
                                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {item.trackSerials ? 'Serial Tracking Enabled' : 'Enable Serial Tracking'}
                            </button>
                          </div>
                        </div>

                        {/* Serial Numbers Section */}
                        {item.trackSerials && (
                          <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-sm font-medium text-[var(--foreground)]">
                                Serial Numbers ({item.serialNumbers.length}/{item.expectedQty})
                              </h5>
                              {item.serialNumbers.length < item.expectedQty && (
                                <span className="text-xs text-yellow-600">
                                  {item.expectedQty - item.serialNumbers.length} remaining
                                </span>
                              )}
                            </div>

                            {/* Serial Input */}
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="text"
                                value={serialInput[index] || ''}
                                onChange={(e) => setSerialInput(prev => ({ ...prev, [index]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSerial(index);
                                  }
                                }}
                                placeholder="Scan or enter serial number..."
                                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSerial(index)}
                                className="px-3 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                              >
                                Add
                              </button>
                            </div>

                            {/* Serial List */}
                            {item.serialNumbers.length > 0 && (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {item.serialNumbers.map((serial, serialIndex) => (
                                  <div
                                    key={serialIndex}
                                    className="flex items-center justify-between px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-medium text-[var(--muted-foreground)] w-6">
                                        #{serialIndex + 1}
                                      </span>
                                      <span className="font-mono text-sm text-[var(--foreground)]">
                                        {serial.serial}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={serial.condition}
                                        onChange={(e) => handleSerialConditionChange(index, serialIndex, e.target.value as 'good' | 'damaged')}
                                        className="px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                                      >
                                        <option value="good">Good</option>
                                        <option value="damaged">Damaged</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSerial(index, serialIndex)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collapsed Summary Row */}
                    {expandedItem !== index && (
                      <div className="px-4 py-2 bg-[var(--muted)]/20 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                        <span>Qty: <strong className="text-[var(--foreground)]">{item.receivedQty}</strong></span>
                        <span>·</span>
                        <span>Bin: <strong className="text-[var(--foreground)]">{item.binId ? mockBins.find(b => b.id === item.binId)?.letterCode || '-' : 'Not assigned'}</strong></span>
                        {item.lotNumber && (
                          <>
                            <span>·</span>
                            <span>Lot: <strong className="text-[var(--foreground)]">{item.lotNumber}</strong></span>
                          </>
                        )}
                      </div>
                    )}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Lot/Serial</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {lineItems.map((item) => {
                      const variance = item.receivedQty - item.expectedQty;
                      const bin = mockBins.find(b => b.id === item.binId);
                      const damagedSerials = item.serialNumbers.filter(s => s.condition === 'damaged').length;
                      return (
                        <tr key={item.productId}>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                            <div>{item.productName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{item.partNumber}</div>
                          </td>
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
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {item.lotNumber && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                  Lot: {item.lotNumber}
                                </span>
                              )}
                              {item.expirationDate && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                                  Exp: {new Date(item.expirationDate).toLocaleDateString()}
                                </span>
                              )}
                              {item.trackSerials && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                                  {item.serialNumbers.length} serials
                                </span>
                              )}
                              {!item.lotNumber && !item.expirationDate && !item.trackSerials && (
                                <span className="text-[var(--muted-foreground)]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {item.trackSerials ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  {item.serialNumbers.length - damagedSerials} Good
                                </span>
                                {damagedSerials > 0 && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                    {damagedSerials} Damaged
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.condition === 'good' ? 'bg-green-100 text-green-700' :
                                item.condition === 'damaged' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                              </span>
                            )}
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
                      <td colSpan={3}></td>
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
