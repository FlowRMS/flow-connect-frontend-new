/**
 * Create Quote from Takeoff Modal Component
 *
 * BLOCKED: This feature cannot work because:
 * 1. The GraphQL gateway doesn't expose quote mutations (createQuote doesn't exist)
 * 2. Customer search is broken due to WorkOS/Keycloak incompatibility
 *
 * See blockers.md for details.
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { ParsedItem } from '../types';

interface CreateQuoteFromTakeoffModalProps {
  isOpen: boolean;
  takeoffId: string;
  takeoffName: string;
  clientName?: string;
  crossedItems: ParsedItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStep = 'select-items' | 'input';

export function CreateQuoteFromTakeoffModal({
  isOpen,
  takeoffName,
  clientName,
  crossedItems,
  onClose,
}: CreateQuoteFromTakeoffModalProps) {
  const [step, setStep] = useState<ModalStep>(crossedItems.length > 0 ? 'select-items' : 'input');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [manualClientName, setManualClientName] = useState(clientName || '');
  const [error, setError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(crossedItems.map(item => item.id)));

  const allSelected = selectedItemIds.size === crossedItems.length && crossedItems.length > 0;
  const noneSelected = selectedItemIds.size === 0;

  if (!isOpen) return null;

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(crossedItems.map(item => item.id)));
    }
  };

  const handleProceedToInput = () => {
    if (noneSelected) {
      setError('Please select at least one item');
      return;
    }
    setError(null);
    setStep('input');
  };

  const handleCloseAndReset = () => {
    setStep(crossedItems.length > 0 ? 'select-items' : 'input');
    setQuoteNumber('');
    setManualClientName(clientName || '');
    setError(null);
    setSelectedItemIds(new Set(crossedItems.map(item => item.id)));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {step === 'select-items' ? (
          <>
            {/* Header - Select Items */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Items for Quote</h3>
                  <p className="text-sm text-gray-500">Choose which crossed items to include</p>
                </div>
              </div>
            </div>

            {/* Body - Line Items Selection */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                {/* Select All Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <button
                    onClick={handleToggleAll}
                    className="flex items-center gap-3 group"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      allSelected
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 group-hover:border-green-400'
                    }`}>
                      {allSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {!allSelected && selectedItemIds.size > 0 && (
                        <div className="w-2 h-0.5 bg-gray-400 rounded"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {allSelected ? 'Deselect All' : 'Select All'} ({crossedItems.length} items)
                    </span>
                  </button>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-green-600">{selectedItemIds.size}</span> selected
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  {crossedItems.map((item, index) => {
                    const isSelected = selectedItemIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">
                                {item.crossedPartNumber || item.partNumber || 'Unknown Product'}
                              </span>
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                                {item.crossedManufacturer || 'Our Company'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {item.crossedDescription || item.description}
                            </p>
                            <div className="text-xs text-gray-400">
                              Original: {item.manufacturer} - {item.partNumber}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-sm font-bold ${isSelected ? 'text-green-600' : 'text-gray-900'}`}>
                              Qty: {item.quantity || 1}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedItemIds.size} items selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseAndReset}
                    className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToInput}
                    disabled={noneSelected}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Quote</h3>
                  <p className="text-sm text-gray-500">From Takeoff: {takeoffName}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex-shrink-0 space-y-4">
              {/* Selected items summary */}
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{selectedItemIds.size} crossed items selected</span>
                  </div>
                  <button
                    onClick={() => setStep('select-items')}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Edit Selection
                  </button>
                </div>
              </div>

              {/* Client Name (Manual Entry) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualClientName}
                  onChange={(e) => {
                    setManualClientName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter client name..."
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                    error && !manualClientName.trim() ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>

              {/* Quote Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => {
                    setQuoteNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter quote number..."
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                    error && !quoteNumber.trim() ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>

              {/* Feature Blocked Warning */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Feature temporarily unavailable
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Quote creation from takeoffs requires backend updates. Please create the quote manually in the Quotes section using the information above.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between flex-shrink-0">
              <button
                onClick={() => setStep('select-items')}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back
              </button>
              <button
                onClick={handleCloseAndReset}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm font-medium hover:from-gray-700 hover:to-gray-800 transition-all"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
