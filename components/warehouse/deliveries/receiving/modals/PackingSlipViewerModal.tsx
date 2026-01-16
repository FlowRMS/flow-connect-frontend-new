import React, { useEffect, useState } from 'react';
import { getFilePresignedUrl } from '@/components/lib/graphql/files';
import type { LineItemReceive, ScannedPackingSlip } from '../types';

interface PackingSlipViewerModalProps {
  packingSlip: ScannedPackingSlip;
  lineItems: LineItemReceive[];
  onClose: () => void;
}

export default function PackingSlipViewerModal({
  packingSlip,
  lineItems,
  onClose,
}: PackingSlipViewerModalProps) {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(packingSlip.imageUrl || null);

  useEffect(() => {
    const currentUrl = packingSlip.imageUrl || '';
    const hasDirectUrl =
      currentUrl.startsWith('http') ||
      currentUrl.startsWith('data:') ||
      currentUrl.startsWith('blob:');

    if (hasDirectUrl) {
      setResolvedImageUrl(currentUrl);
      return;
    }

    if (packingSlip.fileId) {
      getFilePresignedUrl(packingSlip.fileId)
        .then((url) => {
          setResolvedImageUrl(url || null);
        })
        .catch(() => {
          setResolvedImageUrl(null);
        });
      return;
    }

    setResolvedImageUrl(currentUrl || null);
  }, [packingSlip.fileId, packingSlip.imageUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <div>
              <h3 className="font-medium text-[var(--foreground)]">{packingSlip.name}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Scanned {new Date(packingSlip.scannedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {resolvedImageUrl ? (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedImageUrl}
                alt={packingSlip.name}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-[var(--muted-foreground)]">No image available</p>
            </div>
          )}
          {packingSlip.lineItemIds.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Associated Items</h4>
              <div className="space-y-1">
                {packingSlip.lineItemIds.map((itemId) => {
                  const item = lineItems.find((lineItem) => lineItem.id === itemId);
                  return item ? (
                    <div key={itemId} className="flex items-center gap-3 p-2 bg-[var(--muted)]/30 rounded-lg">
                      <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                      <span className="text-sm text-[var(--muted-foreground)]">{item.productName}</span>
                      <span className="ml-auto text-sm text-green-600 font-medium">{item.receivedQty} received</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
