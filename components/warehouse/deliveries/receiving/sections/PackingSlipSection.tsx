import React from 'react';
import type { ShipmentStatus } from '@/lib/types/warehouse';
import type { PackingSlipDiscrepancy, PackingSlipLineItem } from '../types';

interface PackingSlipSectionProps {
  displayStatus: ShipmentStatus;
  packingSlipCaptured: boolean;
  packingSlipInputMode: 'scan' | 'manual' | null;
  packingSlipImage: string | null;
  isProcessingPackingSlip: boolean;
  isEditingPackingSlip?: boolean;
  packingSlipLineItems: PackingSlipLineItem[];
  packingSlipDiscrepancies: PackingSlipDiscrepancy[];
  onCameraCapture: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPackingSlip: () => void;
  onViewPackingSlip?: () => void;
  onEditPackingSlip?: () => void;
  setPackingSlipInputMode: (mode: 'scan' | 'manual' | null) => void;
  setPackingSlipCaptured: (value: boolean) => void;
  setPackingSlipLineItems: React.Dispatch<React.SetStateAction<PackingSlipLineItem[]>>;
  setPackingSlipDiscrepancies: React.Dispatch<React.SetStateAction<PackingSlipDiscrepancy[]>>;
  onAddPackingSlipLine: () => void;
  onConfirmManualPackingSlip: (lines: PackingSlipLineItem[]) => void | Promise<void>;
}

export default function PackingSlipSection({
  displayStatus,
  packingSlipCaptured,
  packingSlipInputMode,
  packingSlipImage,
  isProcessingPackingSlip,
  isEditingPackingSlip = false,
  packingSlipLineItems,
  packingSlipDiscrepancies,
  onCameraCapture,
  onImageUpload,
  onClearPackingSlip,
  onViewPackingSlip,
  onEditPackingSlip,
  setPackingSlipInputMode,
  setPackingSlipCaptured,
  setPackingSlipLineItems,
  setPackingSlipDiscrepancies,
  onAddPackingSlipLine,
  onConfirmManualPackingSlip,
}: PackingSlipSectionProps) {
  return (
    <>
      {displayStatus === 'ARRIVED' && !packingSlipCaptured && (
        <div className="bg-[var(--card)] rounded-lg border-2 border-blue-400 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Packing Slip Capture</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Scan or photograph the manufacturer packing slip</p>
              </div>
            </div>
            {isProcessingPackingSlip && (
              <div className="flex items-center gap-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-medium">Processing packing slip...</span>
              </div>
            )}
          </div>

          {!packingSlipInputMode && !packingSlipImage && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={onCameraCapture}
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-sm font-medium text-blue-700">Take Photo</span>
                <span className="text-xs text-[var(--muted-foreground)]">Use camera</span>
              </button>

              <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium text-blue-700">Upload Image</span>
                <span className="text-xs text-[var(--muted-foreground)]">From device</span>
                <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
              </label>

              <button
                onClick={() => setPackingSlipInputMode('manual')}
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span className="text-sm font-medium text-blue-700">Enter Manually</span>
                <span className="text-xs text-[var(--muted-foreground)]">Add line items</span>
              </button>
            </div>
          )}

          {packingSlipImage && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Uploaded Packing Slip</span>
                <button onClick={onClearPackingSlip} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={packingSlipImage} alt="Packing Slip" className="w-full max-h-64 object-contain" />
              </div>
            </div>
          )}

          {packingSlipInputMode === 'manual' && !packingSlipImage && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[var(--foreground)]">Manual Entry</span>
                <button
                  onClick={() => setPackingSlipInputMode(null)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Back to options
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase">Line Items from Packing Slip</h4>
                  <button
                    onClick={onAddPackingSlipLine}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Line
                  </button>
                </div>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--muted)]/30">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Part #</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Status</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {packingSlipLineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--muted)]/10">
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={item.partNumber}
                              onChange={(e) => {
                                setPackingSlipLineItems((prev) =>
                                  prev.map((line) =>
                                    line.id === item.id ? { ...line, partNumber: e.target.value } : line
                                  )
                                );
                              }}
                              className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                              placeholder="Part number"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                setPackingSlipLineItems((prev) =>
                                  prev.map((line) =>
                                    line.id === item.id ? { ...line, description: e.target.value } : line
                                  )
                                );
                              }}
                              className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                setPackingSlipLineItems((prev) =>
                                  prev.map((line) =>
                                    line.id === item.id ? { ...line, quantity: parseInt(e.target.value) || 0 } : line
                                  )
                                );
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-20 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-1">
                            {item.matched ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                Matched
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600">Pending</span>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            {packingSlipLineItems.length > 1 && (
                              <button
                                onClick={() => {
                                  setPackingSlipLineItems((prev) => prev.filter((line) => line.id !== item.id));
                                }}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setPackingSlipInputMode(null);
                    setPackingSlipLineItems([]);
                  }}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (packingSlipLineItems.length > 0 && packingSlipLineItems.some((line) => line.partNumber || line.description)) {
                      void onConfirmManualPackingSlip(packingSlipLineItems);
                      setPackingSlipCaptured(true);
                      setPackingSlipInputMode(null);
                    }
                  }}
                  disabled={packingSlipLineItems.length === 0 || !packingSlipLineItems.some((line) => line.partNumber || line.description)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Confirm Packing Slip
                </button>
              </div>
            </div>
          )}

          {packingSlipDiscrepancies.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h4 className="text-sm font-semibold text-red-800">Discrepancies Found</h4>
              </div>
              <p className="text-xs text-red-700 mb-3">
                The following differences were detected between the packing slip and the expected shipment:
              </p>
              <div className="space-y-2">
                {packingSlipDiscrepancies.map((disc, index) => (
                  <div
                    key={`${disc.field}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      disc.resolved ? 'bg-green-50 border border-green-200' : 'bg-white border border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--foreground)]">{disc.field}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="text-[var(--muted-foreground)]">
                          Expected: <span className="font-medium text-green-700">{disc.expected}</span>
                        </span>
                        <span className="text-[var(--muted-foreground)]">
                          Actual: <span className="font-medium text-red-700">{disc.actual}</span>
                        </span>
                      </div>
                    </div>
                    {disc.resolved ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setPackingSlipDiscrepancies((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, resolved: true } : item))
                          );
                        }}
                        className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {packingSlipDiscrepancies.every((disc) => disc.resolved) && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <button
                    onClick={() => {
                      setPackingSlipDiscrepancies([]);
                      setPackingSlipCaptured(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Proceed with Acknowledged Discrepancies
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {packingSlipCaptured && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">Packing Slip Captured</span>
                  <span className="text-sm text-blue-700">
                    {packingSlipImage ? '(Image uploaded)' : `(${packingSlipLineItems.length} line items)`}
                  </span>
                </div>
                {packingSlipDiscrepancies.length > 0 && (
                  <span className="text-xs text-amber-600">
                    {packingSlipDiscrepancies.filter((disc) => disc.resolved).length} discrepanc
                    {packingSlipDiscrepancies.filter((disc) => disc.resolved).length === 1 ? 'y' : 'ies'} acknowledged
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(packingSlipImage || onViewPackingSlip) && (
                <button
                  onClick={() => {
                    if (packingSlipImage && packingSlipImage.startsWith('data:')) {
                      window.open(packingSlipImage, '_blank');
                      return;
                    }
                    onViewPackingSlip?.();
                  }}
                  disabled={isEditingPackingSlip}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  {isEditingPackingSlip ? 'Updating...' : 'View Image'}
                </button>
              )}
              <button
                onClick={onEditPackingSlip}
                disabled={isEditingPackingSlip}
                className="text-xs text-blue-600 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isEditingPackingSlip ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
