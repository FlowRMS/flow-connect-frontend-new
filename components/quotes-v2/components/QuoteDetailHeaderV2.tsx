'use client';

import React, { useState } from 'react';
import type { QuoteV2, QuoteV2Stage } from '../types';
import { SearchableDropdownV2 } from './SearchableDropdownV2';
import { customerOptions, repOptions } from '../data/mockData';

interface QuoteDetailHeaderV2Props {
  quote: QuoteV2;
  onQuoteChange: (updates: Partial<QuoteV2>) => void;
  onBack: () => void;
}

const stageOptions: QuoteV2Stage[] = ['Draft', 'Review', 'Sent', 'Negotiating', 'Won', 'Lost'];

function getStageBadgeClass(stage: QuoteV2Stage): string {
  switch (stage) {
    case 'Draft':
      return 'bg-gray-500';
    case 'Review':
      return 'bg-blue-500';
    case 'Sent':
      return 'bg-purple-500';
    case 'Negotiating':
      return 'bg-yellow-500';
    case 'Won':
      return 'bg-green-500';
    case 'Lost':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function QuoteDetailHeaderV2({ quote, onQuoteChange, onBack }: QuoteDetailHeaderV2Props) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'overage'>('simple');

  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field: 'quoteDate' | 'expirationDate' | 'revisedDate' | 'acceptDate', value: string) => {
    onQuoteChange({ [field]: value });
  };

  return (
    <div className="flex-shrink-0">
      {/* Top Header Row */}
      <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M10 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Quote Number */}
          <h1 className="text-xl font-semibold text-gray-900">{quote.quoteNumber}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Actions
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5h14M3 10h14M3 15h7" strokeLinecap="round" />
                    </svg>
                    Create Order
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="14" height="14" rx="2" />
                      <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
                    </svg>
                    Duplicate Quote
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Stage Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStageMenu(!showStageMenu)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${getStageBadgeClass(quote.stage)}`}
            >
              {quote.stage}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showStageMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStageMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {stageOptions.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => {
                        onQuoteChange({ stage });
                        setShowStageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${quote.stage === stage ? 'bg-gray-50' : ''}`}
                    >
                      <span>{stage}</span>
                      {quote.stage === stage && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-indigo-600">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Version Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowVersionMenu(!showVersionMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              v{quote.version}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showVersionMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowVersionMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {[1, 2, 3].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        onQuoteChange({ version: v });
                        setShowVersionMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${quote.version === v ? 'bg-gray-50' : ''}`}
                    >
                      v{v}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowViewModeMenu(!showViewModeMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
              </svg>
              {viewMode === 'simple' ? 'Simple View' : 'Overage View'}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showViewModeMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewModeMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => { setViewMode('overage'); setShowViewModeMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${viewMode === 'overage' ? 'bg-gray-50' : ''}`}
                  >
                    Overage View
                  </button>
                  <button
                    onClick={() => { setViewMode('simple'); setShowViewModeMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${viewMode === 'simple' ? 'bg-gray-50' : ''}`}
                  >
                    Simple View
                  </button>
                </div>
              </>
            )}
          </div>

          {/* PDF Button */}
          <button className="flex items-center gap-1 px-4 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" rx="2" />
              <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
            </svg>
            PDF
          </button>

          {/* Save Button with Dropdown */}
          <div className="relative">
            <div className="flex">
              <button className="px-4 py-1.5 text-sm text-white bg-green-500 hover:bg-green-600 rounded-l-lg transition-colors">
                Save
              </button>
              <button
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                className="px-2 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-r-lg border-l border-green-400 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {showSaveMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSaveMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                    Save
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                    </svg>
                    Save as New Version
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Summary Bar */}
      <div className="flex items-center justify-end gap-6 px-6 py-2 text-sm border-b border-gray-200 bg-gray-50">
        <div>
          <span className="text-gray-500">Base Price:</span>
          <span className="ml-2 font-semibold">${quote.basePrice.toLocaleString()}</span>
        </div>
        <div className="border-l border-gray-300 h-4" />
        <div>
          <span className="text-gray-500">Sell Price:</span>
          <span className="ml-2 font-semibold">${quote.sellPrice.toLocaleString()}</span>
        </div>
        <div className="border-l border-gray-300 h-4" />
        <div>
          <span className="text-gray-500">Commission:</span>
          <span className="ml-2 font-semibold text-green-600">${quote.commission.toLocaleString()}</span>
        </div>
      </div>

      {/* Quote Details Section */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quote Details</h2>

        {/* Row 1 */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Number*</label>
            <input
              type="text"
              value={quote.quoteNumber}
              onChange={(e) => onQuoteChange({ quoteNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Type</label>
            <SearchableDropdownV2
              value={quote.quoteType}
              displayValue={quote.quoteType}
              onChange={(id) => onQuoteChange({ quoteType: id as 'NORMAL' | 'SPECIAL' | 'BLANKET' })}
              options={[
                { id: 'NORMAL', label: 'NORMAL' },
                { id: 'SPECIAL', label: 'SPECIAL' },
                { id: 'BLANKET', label: 'BLANKET' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sold To Customer*</label>
            <SearchableDropdownV2
              value={quote.soldToCustomerId}
              displayValue={quote.soldToCustomerName}
              onChange={(id, label) => onQuoteChange({ soldToCustomerId: id, soldToCustomerName: label })}
              options={customerOptions.map((c) => ({ id: c.id, label: c.name }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bill To Customer*</label>
            <SearchableDropdownV2
              value={quote.billToCustomerId}
              displayValue={quote.billToCustomerName}
              onChange={(id, label) => onQuoteChange({ billToCustomerId: id, billToCustomerName: label })}
              options={customerOptions.map((c) => ({ id: c.id, label: c.name }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Job</label>
            <input
              type="text"
              value={quote.jobName}
              onChange={(e) => onQuoteChange({ jobName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment Terms</label>
            <input
              type="text"
              value={quote.paymentTerms}
              onChange={(e) => onQuoteChange({ paymentTerms: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Freight Terms</label>
            <input
              type="text"
              value={quote.freightTerms}
              onChange={(e) => onQuoteChange({ freightTerms: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-7 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Date*</label>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(quote.quoteDate)}
                onChange={(e) => handleDateChange('quoteDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expiration Date*</label>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(quote.expirationDate)}
                onChange={(e) => handleDateChange('expirationDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Revised Date</label>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(quote.revisedDate || '')}
                onChange={(e) => handleDateChange('revisedDate', e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Accept Date</label>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(quote.acceptDate || '')}
                onChange={(e) => handleDateChange('acceptDate', e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Outside Rep</label>
            <SearchableDropdownV2
              value={quote.outsideRepId || ''}
              displayValue={quote.outsideRepName || 'Select Rep...'}
              onChange={(id, label) => onQuoteChange({ outsideRepId: id, outsideRepName: label })}
              options={repOptions.map((r) => ({ id: r.id, label: r.name }))}
              placeholder="Select Rep..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inside Rep</label>
            <SearchableDropdownV2
              value={quote.insideRepId || ''}
              displayValue={quote.insideRepName || 'Select Rep...'}
              onChange={(id, label) => onQuoteChange({ insideRepId: id, insideRepName: label })}
              options={repOptions.map((r) => ({ id: r.id, label: r.name }))}
              placeholder="Select Rep..."
            />
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}

export default QuoteDetailHeaderV2;
