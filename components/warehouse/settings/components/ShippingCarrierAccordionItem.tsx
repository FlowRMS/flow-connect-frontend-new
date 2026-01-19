'use client';

import { useState } from 'react';
import type { ShippingCarrier } from '../types';
import CarrierBasicInfo from './CarrierBasicInfo';
import CarrierAccountBilling from './CarrierAccountBilling';
import CarrierContactInfo from './CarrierContactInfo';
import CarrierServiceConfig from './CarrierServiceConfig';
import CarrierNotesSection from './CarrierNotesSection';

interface ShippingCarrierAccordionItemProps {
  carrier: ShippingCarrier;
  isExpanded: boolean;
  hasChanges?: boolean;
  onToggleExpansion: () => void;
  onUpdateCarrier: (updates: Partial<ShippingCarrier>) => void;
  onDeleteCarrier: () => void;
  onSaveCarrier?: () => Promise<void>;
}

export default function ShippingCarrierAccordionItem({
  carrier,
  isExpanded,
  hasChanges = false,
  onToggleExpansion,
  onUpdateCarrier,
  onDeleteCarrier,
  onSaveCarrier,
}: ShippingCarrierAccordionItemProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSaveCarrier) return;
    setIsSaving(true);
    try {
      await onSaveCarrier();
    } catch (error) {
      console.error('Failed to save carrier:', error);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Carrier Header - Clickable */}
      <div
        onClick={onToggleExpansion}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-lg ${carrier.isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-medium text-[var(--foreground)] flex items-center gap-2">
              {carrier.name}
              {carrier.code && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-mono">
                  {carrier.code}
                </span>
              )}
              {carrier.carrierType && (
                <span className={`px-1.5 py-0.5 text-xs rounded ${
                  carrier.carrierType === 'PARCEL'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {carrier.carrierType === 'PARCEL' ? 'Parcel' : 'Freight'}
                </span>
              )}
              {carrier.isActive ? (
                <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              {carrier.accountNumber ? `Account: ${carrier.accountNumber}` : 'No account configured'}
              {carrier.serviceTypes && carrier.serviceTypes.length > 0 && ` • ${carrier.serviceTypes.length} services`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {carrier.defaultServiceType && (
            <div className="text-sm text-[var(--muted-foreground)] hidden sm:block">
              Default: {carrier.defaultServiceType}
            </div>
          )}
          {/* Save button in header when there are changes */}
          {hasChanges && onSaveCarrier && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          )}
          <svg
            className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <CarrierBasicInfo carrier={carrier} onUpdate={onUpdateCarrier} />
              <CarrierAccountBilling carrier={carrier} onUpdate={onUpdateCarrier} />
              <CarrierContactInfo carrier={carrier} onUpdate={onUpdateCarrier} />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <CarrierServiceConfig carrier={carrier} onUpdate={onUpdateCarrier} />

              {/* API Integration - Placeholder */}
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  API Integration
                </h3>
                <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3">
                  <p className="text-xs text-[var(--muted-foreground)] text-center py-2">
                    API integration configuration coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section - Full Width */}
          <CarrierNotesSection carrier={carrier} onUpdate={onUpdateCarrier} />

          {/* Actions Footer */}
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <button
              onClick={onDeleteCarrier}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Carrier
            </button>

            {onSaveCarrier && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  hasChanges && !isSaving
                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
