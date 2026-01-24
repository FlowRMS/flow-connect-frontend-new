'use client';

import React from 'react';
import type { BinAssignment } from './types';
import { useReceivingContext } from './context/ReceivingContext';

export default function ReceivingInterface() {
  const {
    // State
    lineItems,
    discrepancies,
    collapsedItems,
    itemSearchQuery,
    palletSessions,
    currentPalletNumber,
    scannedPackingSlips,
    warehouseBins,
    packingSlipLineItems,
    packingSlipCaptured,
    isProcessingPackingSlip,
    showSavePalletConfirm,
    isTransitioning,
    voiceSupported,
    isRecordingVoice,

    // Setters
    setItemSearchQuery,
    setCollapsedItems,
    setDiscrepancies,
    setShowSavePalletConfirm,
    setPackingSlipInputMode,
    setViewingPackingSlip,

    // Actions
    actions,

    // Computed
    computed,
  } = useReceivingContext();

  const {
    verifyItem: handleVerifyItem,
    unverifyItem: handleUnverifyItem,
    updateLineItem: handleUpdateLineItem,
    receiveAll: handleReceiveAll,
    oneClickPutAway: handleOneClickPutAway,
    savePallet: handleSavePallet,
    handleVoiceInput,
    completeReceiving: handleCompleteReceiving,
    cameraCapture: handleCameraCapture,
    packingSlipImageUpload: handlePackingSlipImageUpload,
    clearPackingSlip: handleClearPackingSlip,
  } = actions;

  const {
    totalReceived,
    totalExpected,
    totalIssues,
    allItemsVerified,
    getItemDiscrepancyTotals,
    getItemAdjustedReceived,
    getItemAccountedTotal,
    isNonPrimaryBin,
    getEmptyBins,
  } = computed;

  return (
    <div className="bg-[var(--card)] rounded-lg border-2 border-yellow-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-yellow-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Receiving Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {totalReceived} of {totalExpected} items received - {totalIssues > 0 ? `${totalIssues} with issues` : 'No issues reported'}
              {palletSessions.length > 0 && ` - ${palletSessions.length} pallet(s) saved`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save Pallet Button for incremental receiving */}
          {totalReceived > 0 && !allItemsVerified && (
            <button
              onClick={() => setShowSavePalletConfirm(true)}
              className="px-3 py-2 border border-amber-400 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-amber-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="22" height="5" rx="1"/>
                <path d="M1 8h22v11a2 2 0 01-2 2H3a2 2 0 01-2-2V8z"/>
              </svg>
              Save Pallet #{currentPalletNumber}
            </button>
          )}
          {allItemsVerified && (
            <button
              onClick={handleCompleteReceiving}
              disabled={isTransitioning}
              className={`px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              {isTransitioning ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Complete Receiving
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Packing Slip Capture Section */}
      {!packingSlipCaptured && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span className="text-sm font-medium text-blue-800">Scan Additional Packing Slips</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCameraCapture}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Camera
              </button>
              <label className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePackingSlipImageUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setPackingSlipInputMode('manual')}
                className="px-3 py-1.5 text-blue-600 text-sm font-medium hover:underline"
              >
                Enter Manually
              </button>
            </div>
          </div>
          {isProcessingPackingSlip && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processing packing slip...
            </div>
          )}
        </div>
      )}

      {/* Digital Packing Slip Display */}
      {packingSlipCaptured && packingSlipLineItems.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="text-sm font-medium text-green-800">Packing Slip Captured ({packingSlipLineItems.length} items)</span>
            </div>
            <button
              onClick={handleClearPackingSlip}
              className="text-xs text-green-600 hover:underline"
            >
              Clear & Rescan
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar with incremental tracking */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-2">
          <span>Receiving Progress</span>
          <span>{Math.round((totalReceived / totalExpected) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(totalReceived / totalExpected) * 100}%` }}
          />
        </div>
        {palletSessions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {palletSessions.map((session) => (
              <span key={session.id} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                Pallet #{session.palletNumber}: {session.items.reduce((sum, i) => sum + i.quantity, 0)} units
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Pallet Confirmation Modal */}
      {showSavePalletConfirm && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Save current progress as Pallet #{currentPalletNumber}?</p>
              <p className="text-xs text-amber-600 mt-1">You can continue receiving more items after saving.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavePalletConfirm(false)}
                className="px-3 py-1.5 text-sm text-amber-700 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePallet}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
              >
                Save Pallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar for quick filtering */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by part number or product name..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            {itemSearchQuery && (
              <button
                onClick={() => setItemSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          {/* Expand/Collapse All button */}
          <button
            onClick={() => {
              const allCollapsed = collapsedItems.size === lineItems.length;
              if (allCollapsed) {
                // Expand all
                setCollapsedItems(new Set());
              } else {
                // Collapse all
                setCollapsedItems(new Set(lineItems.map(li => li.id)));
              }
            }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {collapsedItems.size === lineItems.length ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                Expand All
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                Collapse All
              </>
            )}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {lineItems
          .filter((item) => {
            if (!itemSearchQuery) return true;
            const query = itemSearchQuery.toLowerCase();
            return (
              item.partNumber.toLowerCase().includes(query) ||
              item.productName.toLowerCase().includes(query)
            );
          })
          .map((lineItem) => {
          const isVerified = lineItem.verified;
          const isPutAway = lineItem.putAway;
          const itemDiscrepancies = getItemDiscrepancyTotals(lineItem.id);
          const adjustedReceived = getItemAdjustedReceived(lineItem);
          const accountedTotal = getItemAccountedTotal(lineItem);
          const hasDiscrepancy = itemDiscrepancies.total > 0;
          const isExpanded = !collapsedItems.has(lineItem.id);
          const hasNotes = lineItem.notes && lineItem.notes.trim().length > 0;
          const isNonPrimary = isNonPrimaryBin(lineItem);
          const remainingToReceive = Math.max(0, lineItem.expectedQty - accountedTotal);

          return (
            <div
              key={lineItem.id}
              className={`transition-colors ${isVerified ? 'bg-green-50' : isPutAway ? 'bg-blue-50' : 'hover:bg-[var(--muted)]/20'}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPutAway ? 'bg-blue-500' : isVerified ? 'bg-green-500' : 'bg-[var(--muted)]'
                }`}>
                  {isPutAway ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  ) : isVerified ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-[var(--muted-foreground)]">{lineItem.expectedQty}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    {hasDiscrepancy && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Issue
                      </span>
                    )}
                    {lineItem.lotNumber && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Lot: {lineItem.lotNumber}
                      </span>
                    )}
                    {/* Notes indicator */}
                    {hasNotes && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1" title={lineItem.notes}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Note
                      </span>
                    )}
                    {/* Packing slip link */}
                    {lineItem.packingSlipId && (() => {
                      const ps = scannedPackingSlips.find(p => p.id === lineItem.packingSlipId);
                      return ps ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPackingSlip(ps);
                          }}
                          className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1 hover:bg-green-200 transition-colors"
                          title={`View ${ps.name}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                          </svg>
                          {ps.name}
                        </button>
                      ) : null;
                    })()}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                  {lineItem.binId && (
                    <div className="flex items-center gap-1 mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className={`text-xs font-medium ${isNonPrimary ? 'text-orange-600' : 'text-amber-600'}`}>
                        Bin {warehouseBins.find(b => b.id === lineItem.binId)?.letterCode || lineItem.binId}
                        {isNonPrimary && (
                          <span className="ml-1 text-orange-500" title="Not the default bin for this item">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Show inline note preview */}
                  {hasNotes && (
                    <p className="text-xs text-purple-600 mt-1 truncate max-w-xs" title={lineItem.notes}>
                      {`"${lineItem.notes}"`}
                    </p>
                  )}
                </div>

                {/* Quantity display */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {adjustedReceived} / {lineItem.expectedQty}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {isVerified ? 'verified' : remainingToReceive > 0 ? `${remainingToReceive} remaining` : 'received'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newCollapsed = new Set(collapsedItems);
                      if (isExpanded) {
                        newCollapsed.add(lineItem.id);
                      } else {
                        newCollapsed.delete(lineItem.id);
                      }
                      setCollapsedItems(newCollapsed);
                    }}
                    className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    title="Expand details"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {!isVerified && (
                    <>
                      <button
                        onClick={() => handleReceiveAll(lineItem.id, lineItem.expectedQty)}
                        className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Receive All
                      </button>
                    </>
                  )}
                  {isVerified && !isPutAway && lineItem.binId && (
                    <button
                      onClick={() => handleOneClickPutAway(lineItem.id)}
                      className={`px-4 py-3 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                        isNonPrimary ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      title={isNonPrimary ? 'Put away to non-primary bin' : `Put away to Bin ${warehouseBins.find(b => b.id === lineItem.binId)?.letterCode}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                      Put Away {warehouseBins.find(b => b.id === lineItem.binId)?.letterCode}
                    </button>
                  )}
                  {isVerified && (
                    <button
                      onClick={() => handleUnverifyItem(lineItem.id)}
                      className="px-4 py-3 border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content - Compact Design */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] bg-[var(--muted)]/10">
                  <div className="ml-16 mt-3 space-y-3">
                    {/* Receiving Line - First row: Received, Lot #, Notes */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Received</label>
                        <input
                          type="number"
                          min="0"
                          value={lineItem.receivedQty}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { receivedQty: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Lot #</label>
                        <input
                          type="text"
                          value={lineItem.lotNumber}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { lotNumber: e.target.value })}
                          placeholder="Optional"
                          className="w-24 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Notes</label>
                        <input
                          type="text"
                          value={lineItem.notes}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { notes: e.target.value })}
                          placeholder="Optional notes..."
                          className="flex-1 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        {voiceSupported && (
                          <button
                            onClick={() => handleVoiceInput(lineItem.id)}
                            className={`p-1.5 rounded-lg text-sm transition-colors ${
                              isRecordingVoice === lineItem.id
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                            }`}
                            title={isRecordingVoice === lineItem.id ? 'Recording...' : 'Voice input'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                              <line x1="12" y1="19" x2="12" y2="23"/>
                              <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delivery Issues Section */}
                    <div className="space-y-2">
                      {/* Quick-add issue buttons */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">Delivery Issues:</span>
                        <div className="flex items-center gap-1">
                          {/* Damaged quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'damage');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-dmg`,
                                  lineItemId: lineItem.id,
                                  type: 'damage',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-orange-200 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                          >
                            + Damaged
                          </button>
                          {/* Missing quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'shortage');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-short`,
                                  lineItemId: lineItem.id,
                                  type: 'shortage',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-red-200 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            + Missing
                          </button>
                          {/* Overage quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'overage');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-over`,
                                  lineItemId: lineItem.id,
                                  type: 'overage',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-blue-200 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            + Overage
                          </button>
                          {/* Wrong Item quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'wrong_item');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-wrong`,
                                  lineItemId: lineItem.id,
                                  type: 'wrong_item',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-purple-200 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                          >
                            + Wrong Item
                          </button>
                          {/* Other/Custom issue type */}
                          <button
                            onClick={() => {
                              setDiscrepancies(prev => [...prev, {
                                id: `disc-${Date.now()}-other`,
                                lineItemId: lineItem.id,
                                type: 'other',
                                quantity: 1,
                                description: '',
                              }]);
                            }}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            + Other
                          </button>
                        </div>
                      </div>

                      {/* Existing delivery issues - styled like the main receiving row */}
                      {discrepancies.filter(d => d.lineItemId === lineItem.id).map(disc => (
                        <div key={disc.id} className="flex items-center gap-4">
                          {/* Type badge or editable input for 'other' */}
                          {disc.type === 'other' ? (
                            <input
                              type="text"
                              placeholder="Issue type..."
                              value={disc.customType || ''}
                              onChange={(e) => {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === disc.id ? { ...d, customType: e.target.value } : d
                                ));
                              }}
                              className="w-24 px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-[var(--muted-foreground)]/50"
                            />
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              disc.type === 'damage' ? 'bg-orange-100 text-orange-700' :
                              disc.type === 'shortage' ? 'bg-red-100 text-red-700' :
                              disc.type === 'overage' ? 'bg-blue-100 text-blue-700' :
                              disc.type === 'wrong_item' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {disc.type === 'damage' ? 'Damaged' :
                               disc.type === 'shortage' ? 'Missing' :
                               disc.type === 'overage' ? 'Overage' :
                               disc.type === 'wrong_item' ? 'Wrong Item' :
                               'Other'}
                            </span>
                          )}

                          {/* Quantity input - styled like main row */}
                          <input
                            type="number"
                            min="1"
                            value={disc.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setDiscrepancies(prev => prev.map(d =>
                                d.id === disc.id ? { ...d, quantity: val } : d
                              ));
                            }}
                            className="w-16 px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                          />

                          {/* Notes label and input - boxed style like other inputs */}
                          <span className="text-xs text-[var(--muted-foreground)]">Notes</span>
                          <input
                            type="text"
                            placeholder="Optional notes..."
                            value={disc.description}
                            onChange={(e) => {
                              setDiscrepancies(prev => prev.map(d =>
                                d.id === disc.id ? { ...d, description: e.target.value } : d
                              ));
                            }}
                            className="flex-1 px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-[var(--muted-foreground)]/50"
                          />

                          {/* Remove button */}
                          <button
                            onClick={() => setDiscrepancies(prev => prev.filter(d => d.id !== disc.id))}
                            className="text-[var(--muted-foreground)] hover:text-red-500 p-1 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Put-Away Row */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      {!lineItem.showAlternateLocations ? (
                        /* Simple Mode - Default bin with option to expand */
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Put-Away</label>
                          {lineItem.primaryBinId ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700">
                                Bin {warehouseBins.find(b => b.id === lineItem.primaryBinId)?.letterCode} (Default)
                              </span>
                              <span className="text-sm text-[var(--muted-foreground)]">
                                Qty: {Math.max(0, lineItem.receivedQty - lineItem.damagedQty)}
                              </span>
                            </div>
                          ) : warehouseBins.length > 0 ? (
                            <select
                              value=""
                              onChange={(e) => {
                                const selectedBinId = e.target.value;
                                handleUpdateLineItem(lineItem.id, {
                                  primaryBinId: selectedBinId,
                                  binId: selectedBinId,
                                });
                              }}
                              className="px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            >
                              <option value="">Select default bin</option>
                              {warehouseBins.map((bin) => (
                                <option key={bin.id} value={bin.id}>
                                  Bin {bin.letterCode}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-orange-600">No bins configured for this warehouse</span>
                          )}
                        </div>

                        {/* Split to Alternate Locations Button */}
                        <button
                            onClick={() => {
                              // Initialize bin assignments with the primary bin and all received quantity
                              const primaryAssignment: BinAssignment = {
                                id: `ba-${Date.now()}-primary`,
                                binId: lineItem.primaryBinId || '',
                                quantity: Math.max(0, lineItem.receivedQty - lineItem.damagedQty),
                                isPrimary: true,
                              };
                              handleUpdateLineItem(lineItem.id, {
                                showAlternateLocations: true,
                                binAssignments: [primaryAssignment],
                              });
                            }}
                            disabled={!lineItem.primaryBinId}
                            className={`px-3 py-1.5 text-xs border border-orange-300 text-orange-600 rounded-lg transition-colors flex items-center gap-1 ${
                              lineItem.primaryBinId ? 'hover:bg-orange-50' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5"/>
                            </svg>
                            Split to Alternate Locations
                          </button>

                          {/* Put-Away Button */}
                          <button
                            onClick={() => handleVerifyItem(lineItem.id)}
                            disabled={!lineItem.primaryBinId || lineItem.verified}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              lineItem.verified
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {lineItem.verified ? (
                                <path d="M20 6L9 17l-5-5"/>
                              ) : (
                                <>
                                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </>
                              )}
                            </svg>
                            {lineItem.verified ? 'Verified' : 'Verify Item'}
                          </button>
                        </div>
                      ) : (
                        /* Multi-Location Mode - Show all bin assignments */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--muted-foreground)]">Put-Away Locations</label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--muted-foreground)]">
                                Total: {lineItem.binAssignments.reduce((sum, ba) => sum + ba.quantity, 0)} / {lineItem.receivedQty - lineItem.damagedQty} units
                              </span>
                              <button
                                onClick={() => handleUpdateLineItem(lineItem.id, {
                                  showAlternateLocations: false,
                                  binId: lineItem.primaryBinId,
                                  binAssignments: [],
                                })}
                                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          {/* Bin Assignment Lines */}
                          <div className="space-y-2">
                            {lineItem.binAssignments.map((assignment, index) => (
                              <div key={assignment.id} className="flex items-center gap-3 bg-[var(--muted)]/30 p-2 rounded-lg">
                                <span className="text-xs font-medium text-[var(--muted-foreground)] w-24">
                                  {assignment.isPrimary ? 'Main Location' : `Alternate ${index}`}
                                </span>
                                <select
                                  value={assignment.binId}
                                  onChange={(e) => {
                                    const updated = lineItem.binAssignments.map(ba =>
                                      ba.id === assignment.id ? { ...ba, binId: e.target.value } : ba
                                    );
                                    handleUpdateLineItem(lineItem.id, { binAssignments: updated });
                                  }}
                                  className={`flex-1 max-w-xs px-2 py-1.5 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                                    assignment.isPrimary ? 'border-green-300' : 'border-orange-300'
                                  }`}
                                >
                                  <option value="">Select bin</option>
                                  {lineItem.primaryBinId && (
                                    <option value={lineItem.primaryBinId}>
                                      Bin {warehouseBins.find(b => b.id === lineItem.primaryBinId)?.letterCode} (Default)
                                    </option>
                                  )}
                                  <optgroup label="Empty Bins">
                                    {getEmptyBins().filter(b => b.id !== lineItem.primaryBinId).map((bin) => (
                                      <option key={bin.id} value={bin.id}>
                                        Bin {bin.letterCode} - Empty
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Available Bins">
                                    {warehouseBins.filter(b => b.id !== lineItem.primaryBinId && (b.currentQuantity ?? 0) > 0).map((bin) => (
                                      <option key={bin.id} value={bin.id}>
                                        Bin {bin.letterCode} ({bin.maxCapacity ? Math.round(((bin.currentQuantity ?? 0) / bin.maxCapacity) * 100) : 0}% full)
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-[var(--muted-foreground)]">Qty:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={lineItem.receivedQty - lineItem.damagedQty}
                                    value={assignment.quantity}
                                    onChange={(e) => {
                                      const updated = lineItem.binAssignments.map(ba =>
                                        ba.id === assignment.id ? { ...ba, quantity: parseInt(e.target.value) || 0 } : ba
                                      );
                                      handleUpdateLineItem(lineItem.id, { binAssignments: updated });
                                    }}
                                    className="w-20 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                  />
                                </div>
                                {/* Remove button (only for non-primary) */}
                                {!assignment.isPrimary && (
                                  <button
                                    onClick={() => {
                                      const updated = lineItem.binAssignments.filter(ba => ba.id !== assignment.id);
                                      handleUpdateLineItem(lineItem.id, { binAssignments: updated });
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"/>
                                      <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Add Another Location Button */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                const newAssignment: BinAssignment = {
                                  id: `ba-${Date.now()}`,
                                  binId: '',
                                  quantity: 0,
                                  isPrimary: false,
                                };
                                handleUpdateLineItem(lineItem.id, {
                                  binAssignments: [...lineItem.binAssignments, newAssignment],
                                });
                              }}
                              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              Add Another Location
                            </button>

                            {/* Confirm Put-Away Button */}
                            <button
                              onClick={() => {
                                // Validate all assignments have bins and total equals received
                                const totalAssigned = lineItem.binAssignments.reduce((sum, ba) => sum + ba.quantity, 0);
                                const expectedTotal = lineItem.receivedQty - lineItem.damagedQty;
                                if (totalAssigned !== expectedTotal) {
                                  alert(`Total assigned (${totalAssigned}) must equal received quantity (${expectedTotal})`);
                                  return;
                                }
                                if (lineItem.binAssignments.some(ba => !ba.binId)) {
                                  alert('Please select a bin for all locations');
                                  return;
                                }
                                // Set the primary bin and verify
                                const primaryBin = lineItem.binAssignments.find(ba => ba.isPrimary);
                                handleUpdateLineItem(lineItem.id, {
                                  binId: primaryBin?.binId || lineItem.binAssignments[0]?.binId || '',
                                });
                                handleVerifyItem(lineItem.id);
                              }}
                              disabled={
                                lineItem.verified ||
                                lineItem.binAssignments.length === 0 ||
                                lineItem.binAssignments.some(ba => !ba.binId)
                              }
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                lineItem.verified
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {lineItem.verified ? (
                                  <path d="M20 6L9 17l-5-5"/>
                                ) : (
                                  <>
                                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                                  </>
                                )}
                              </svg>
                              {lineItem.verified ? 'Verified' : 'Verify Item'}
                            </button>
                          </div>

                          {/* Warning if quantities don't match */}
                          {(() => {
                            const totalAssigned = lineItem.binAssignments.reduce((sum, ba) => sum + ba.quantity, 0);
                            const expectedTotal = lineItem.receivedQty - lineItem.damagedQty;
                            if (totalAssigned !== expectedTotal && lineItem.binAssignments.length > 0) {
                              return (
                                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                  </svg>
                                  <span>
                                    Assigned quantity ({totalAssigned}) does not match received quantity ({expectedTotal}).
                                    {totalAssigned < expectedTotal
                                      ? ` ${expectedTotal - totalAssigned} units remaining.`
                                      : ` ${totalAssigned - expectedTotal} units over-assigned.`}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  
  );
}
