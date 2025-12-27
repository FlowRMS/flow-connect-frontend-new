'use client';

import React from 'react';
import type { Quote } from '../types';
import { SearchableDropdown } from './SearchableDropdown';
import {
  useCustomerSearchDropdown,
  useRepSearchDropdown,
} from '../hooks';

interface Rep {
  id: string;
  name: string;
}

interface CommissionSplit {
  repId: string;
  repName: string;
  percentage: number;
}

interface HeaderFieldsSectionProps {
  selectedQuote: Quote;
  setSelectedQuote: (quote: Quote) => void;
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  showHeaderFields: boolean;
  setShowHeaderFields: (show: boolean) => void;
  showEndUserPerLine: boolean;
  showCommissionSplits: boolean;
  showInsideRepSplits: boolean;
  endUserSameAsCustomer: boolean;
  setEndUserSameAsCustomer: (same: boolean) => void;
  headerEndUser: string;
  setHeaderEndUser: (endUser: string) => void;
  quoteOutsideRep: string;
  setQuoteOutsideRep: (rep: string) => void;
  quoteInsideRep: string;
  setQuoteInsideRep: (rep: string) => void;
  splitCommission: boolean;
  setSplitCommission: (split: boolean) => void;
  splitInsideCommission: boolean;
  setSplitInsideCommission: (split: boolean) => void;
  repCommissionSplits: CommissionSplit[];
  setRepCommissionSplits: (splits: CommissionSplit[]) => void;
  insideRepCommissionSplits: CommissionSplit[];
  setInsideRepCommissionSplits: (splits: CommissionSplit[]) => void;
  availableOutsideReps: Rep[];
  availableInsideReps: Rep[];
  setShowRepSplitsModal: (show: boolean) => void;
  setShowInsideRepSplitsModal: (show: boolean) => void;
}

export function HeaderFieldsSection({
  selectedQuote,
  setSelectedQuote,
  setQuotes,
  showHeaderFields,
  setShowHeaderFields,
  showEndUserPerLine,
  showCommissionSplits,
  showInsideRepSplits,
  endUserSameAsCustomer,
  setEndUserSameAsCustomer,
  headerEndUser,
  setHeaderEndUser,
  quoteOutsideRep,
  setQuoteOutsideRep,
  quoteInsideRep,
  setQuoteInsideRep,
  splitCommission,
  setSplitCommission,
  splitInsideCommission,
  setSplitInsideCommission,
  repCommissionSplits,
  setRepCommissionSplits,
  insideRepCommissionSplits,
  setInsideRepCommissionSplits,
  availableOutsideReps,
  availableInsideReps,
  setShowRepSplitsModal,
  setShowInsideRepSplitsModal,
}: HeaderFieldsSectionProps) {
  // Use API-connected search dropdowns
  const soldToSearch = useCustomerSearchDropdown();
  const billToSearch = useCustomerSearchDropdown();
  const endUserSearch = useCustomerSearchDropdown();
  const outsideRepSearch = useRepSearchDropdown(false); // isInside = false for outside reps
  const insideRepSearch = useRepSearchDropdown(true);   // isInside = true for inside reps

  return (
    <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
      <button
        onClick={() => setShowHeaderFields(!showHeaderFields)}
        className="w-full flex items-center justify-between px-6 py-2 hover:bg-blue-100/30 transition-colors"
      >
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {showHeaderFields ? 'Quote Details' : 'Show Quote Details'}
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
          {/* Row 1: Quote Number, Quote Type, Sold To, Bill To, End User (conditional), Job, Payment Terms, Freight Terms */}
          <div className={`grid gap-4 mb-4 ${!showEndUserPerLine ? 'grid-cols-8' : 'grid-cols-7'}`}>
            {/* Quote Number */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Quote Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={selectedQuote.id}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, id: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, id: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Quote Type */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Quote Type
              </label>
              <div className="relative">
                <select
                  value={selectedQuote.quoteType}
                  onChange={(e) => {
                    const newType = e.target.value as 'NORMAL' | 'TAG' | 'BLANKET' | 'STORM';
                    setSelectedQuote({ ...selectedQuote, quoteType: newType });
                    setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, quoteType: newType } : q));
                  }}
                  className={`w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8 ${
                    selectedQuote.quoteType === 'NORMAL' ? 'bg-white' : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="TAG">TAG</option>
                  <option value="BLANKET">BLANKET</option>
                  <option value="STORM">STORM</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Sold To Customer - Searchable Dropdown */}
            <SearchableDropdown
              value={selectedQuote.soldToCustomer}
              onChange={(id, label) => {
                setSelectedQuote({ ...selectedQuote, soldToCustomer: label });
                setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, soldToCustomer: label } : q));
              }}
              placeholder="Select customer..."
              label="Sold To Customer"
              required
              options={soldToSearch.options}
              isLoading={soldToSearch.isLoading}
              onSearch={soldToSearch.onSearch}
            />

            {/* Bill To Customer - Searchable Dropdown */}
            <SearchableDropdown
              value={selectedQuote.billToCustomer}
              onChange={(id, label) => {
                setSelectedQuote({ ...selectedQuote, billToCustomer: label });
                setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, billToCustomer: label } : q));
              }}
              placeholder="Select customer..."
              label="Bill To Customer"
              required
              options={billToSearch.options}
              isLoading={billToSearch.isLoading}
              onSearch={billToSearch.onSearch}
            />

            {/* End User - Only show if not per-line - Searchable Dropdown */}
            {!showEndUserPerLine && (
              <div>
                <SearchableDropdown
                  value={endUserSameAsCustomer ? selectedQuote.soldToCustomer : headerEndUser}
                  onChange={(id, label) => {
                    setHeaderEndUser(label);
                    if (label !== selectedQuote.soldToCustomer) {
                      setEndUserSameAsCustomer(false);
                    }
                  }}
                  placeholder="Select end user..."
                  label="End User"
                  disabled={endUserSameAsCustomer}
                  options={endUserSearch.options}
                  isLoading={endUserSearch.isLoading}
                  onSearch={endUserSearch.onSearch}
                />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={endUserSameAsCustomer}
                    onChange={(e) => {
                      setEndUserSameAsCustomer(e.target.checked);
                      if (e.target.checked) {
                        setHeaderEndUser(selectedQuote.soldToCustomer);
                      }
                    }}
                    className="w-3.5 h-3.5 accent-[var(--primary)]"
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">Same as Sold To</span>
                </label>
              </div>
            )}

            {/* Job */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Job
              </label>
              <input
                type="text"
                value={selectedQuote.jobName}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, jobName: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, jobName: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={selectedQuote.paymentTerms}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, paymentTerms: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, paymentTerms: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Net 30"
              />
            </div>

            {/* Freight Terms */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Freight Terms
              </label>
              <input
                type="text"
                value={selectedQuote.freightTerms}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, freightTerms: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, freightTerms: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="FOB Destination"
              />
            </div>
          </div>

          {/* Row 2: Quote Date, Expiration Date, Revised Date, Accept Date, Outside Rep, Inside Rep */}
          <div className={`grid gap-4 ${!showEndUserPerLine ? 'grid-cols-8' : 'grid-cols-7'}`}>
            {/* Quote Date */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Quote Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={selectedQuote.quoteDate}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, quoteDate: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, quoteDate: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Expiration Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={selectedQuote.expirationDate}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, expirationDate: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, expirationDate: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Revised Date */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Revised Date
              </label>
              <input
                type="date"
                value={selectedQuote.revisedDate}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, revisedDate: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, revisedDate: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Accept Date */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Accept Date
              </label>
              <input
                type="date"
                value={selectedQuote.acceptDate}
                onChange={(e) => {
                  setSelectedQuote({ ...selectedQuote, acceptDate: e.target.value });
                  setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, acceptDate: e.target.value } : q));
                }}
                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Outside Rep - Hidden when commission splits per line is enabled - Searchable Dropdown */}
            {!showCommissionSplits && (
              <div>
                <SearchableDropdown
                  value={quoteOutsideRep}
                  onChange={(id, label) => {
                    setQuoteOutsideRep(id);
                    if (!id) {
                      setSplitCommission(false);
                      setRepCommissionSplits([]);
                    }
                  }}
                  placeholder="Select Rep..."
                  label="Outside Rep"
                  options={outsideRepSearch.options}
                  isLoading={outsideRepSearch.isLoading}
                  onSearch={outsideRepSearch.onSearch}
                />
                {quoteOutsideRep && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitCommission"
                      checked={splitCommission}
                      onChange={(e) => {
                        setSplitCommission(e.target.checked);
                        if (e.target.checked) {
                          // Initialize with the selected rep at 100%
                          const rep = outsideRepSearch.options.find(r => r.id === quoteOutsideRep);
                          if (rep) {
                            setRepCommissionSplits([{ repId: rep.id, repName: rep.label, percentage: 100 }]);
                          }
                          setShowRepSplitsModal(true);
                        } else {
                          setRepCommissionSplits([]);
                        }
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <label htmlFor="splitCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      Split Commission
                    </label>
                    {splitCommission && repCommissionSplits.length > 0 && (
                      <button
                        onClick={() => setShowRepSplitsModal(true)}
                        className="text-xs text-[var(--primary)] hover:underline ml-1"
                      >
                        ({repCommissionSplits.length} reps)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inside Rep - Hidden when inside rep splits per line is enabled - Searchable Dropdown */}
            {!showInsideRepSplits && (
              <div>
                <SearchableDropdown
                  value={quoteInsideRep}
                  onChange={(id, label) => {
                    setQuoteInsideRep(id);
                    if (!id) {
                      setSplitInsideCommission(false);
                      setInsideRepCommissionSplits([]);
                    }
                  }}
                  placeholder="Select Rep..."
                  label="Inside Rep"
                  options={insideRepSearch.options}
                  isLoading={insideRepSearch.isLoading}
                  onSearch={insideRepSearch.onSearch}
                />
                {quoteInsideRep && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitInsideCommission"
                      checked={splitInsideCommission}
                      onChange={(e) => {
                        setSplitInsideCommission(e.target.checked);
                        if (e.target.checked) {
                          // Initialize with the selected rep at 100%
                          const rep = insideRepSearch.options.find(r => r.id === quoteInsideRep);
                          if (rep) {
                            setInsideRepCommissionSplits([{ repId: rep.id, repName: rep.label, percentage: 100 }]);
                          }
                          setShowInsideRepSplitsModal(true);
                        } else {
                          setInsideRepCommissionSplits([]);
                        }
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <label htmlFor="splitInsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      Split Commission
                    </label>
                    {splitInsideCommission && insideRepCommissionSplits.length > 0 && (
                      <button
                        onClick={() => setShowInsideRepSplitsModal(true)}
                        className="text-xs text-[var(--primary)] hover:underline ml-1"
                      >
                        ({insideRepCommissionSplits.length} reps)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
