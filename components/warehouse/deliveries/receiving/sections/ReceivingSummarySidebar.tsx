import React, { useEffect, useMemo, useState } from 'react';
import AssignmentPanel from '@/components/warehouse/AssignmentPanel';
import DocumentsSection from '@/components/warehouse/DocumentsSection';
import type { AssignedUser, AssignedUserRole, AttachedDocument, IncomingShipment } from '@/lib/types/warehouse';
import { getFilePresignedUrl } from '@/components/lib/graphql/files';
import type { DeliveryDiscrepancy, WarehouseUser } from '../types';

interface ReceivingSummarySidebarProps {
  totalExpected: number;
  totalReceived: number;
  totalDamaged: number;
  totalVariance: number;
  shipment: IncomingShipment;
  formatDateTime: (dateStr?: string) => string;
  discrepancies: DeliveryDiscrepancy[];
  resolvedManagers: AssignedUser[];
  resolvedWorkers: AssignedUser[];
  availableManagers: WarehouseUser[];
  availableWorkers: WarehouseUser[];
  onAddAssignment: (userId: string, role: AssignedUserRole) => Promise<void> | void;
  onRemoveAssignment: (assignmentId: string, role: AssignedUserRole) => Promise<void> | void;
  attachedDocuments: AttachedDocument[];
  onAddDocument: (doc: Omit<AttachedDocument, 'id'>) => Promise<void> | void;
  onRemoveDocument: (documentId: string) => Promise<void> | void;
  isEditable: boolean;
}

export default function ReceivingSummarySidebar({
  totalExpected,
  totalReceived,
  totalDamaged,
  totalVariance,
  shipment,
  formatDateTime,
  discrepancies,
  resolvedManagers,
  resolvedWorkers,
  availableManagers,
  availableWorkers,
  onAddAssignment,
  onRemoveAssignment,
  attachedDocuments,
  onAddDocument,
  onRemoveDocument,
  isEditable,
}: ReceivingSummarySidebarProps) {
  const [resolvedDocUrls, setResolvedDocUrls] = useState<Record<string, string>>({});
  const isDirectUrl = (url: string) => url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:');

  useEffect(() => {
    let isActive = true;

    const loadPresignedUrls = async () => {
      const candidates = attachedDocuments.filter(
        (doc) =>
          doc.fileId &&
          !isDirectUrl(doc.fileUrl) &&
          !resolvedDocUrls[doc.id]
      );

      if (!candidates.length) {
        return;
      }

      const results = await Promise.all(
        candidates.map(async (doc) => {
          const url = await getFilePresignedUrl(doc.fileId as string);
          return url ? { id: doc.id, url } : null;
        })
      );

      if (!isActive) {
        return;
      }

      const updates = results.filter(Boolean) as { id: string; url: string }[];
      if (!updates.length) {
        return;
      }

      setResolvedDocUrls((prev) => {
        const next = { ...prev };
        updates.forEach(({ id, url }) => {
          next[id] = url;
        });
        return next;
      });
    };

    void loadPresignedUrls();

    return () => {
      isActive = false;
    };
  }, [attachedDocuments, resolvedDocUrls]);

  const resolvedDocuments = useMemo(
    () =>
      attachedDocuments.map((doc) => {
        const resolvedUrl = resolvedDocUrls[doc.id];
        if (isDirectUrl(doc.fileUrl)) {
          return doc;
        }
        if (resolvedUrl) {
          return {
            ...doc,
            fileUrl: resolvedUrl,
          };
        }
        if (doc.fileId) {
          return {
            ...doc,
            fileUrl: '',
            mimeType: 'application/octet-stream',
            thumbnailUrl: undefined,
          };
        }
        return {
          ...doc,
        };
      }),
    [attachedDocuments, resolvedDocUrls]
  );

  return (
    <div className="space-y-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Receiving Summary</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Expected</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">{totalExpected} units</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Received</span>
            <span className="text-sm font-semibold text-green-600">{totalReceived} units</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Damaged</span>
            <span className={`text-sm font-semibold ${totalDamaged > 0 ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
              {totalDamaged} units
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">Variance</span>
            <span className={`text-sm font-semibold ${
              totalVariance === 0 ? 'text-green-600' :
              totalVariance > 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {totalVariance > 0 ? '+' : ''}{totalVariance} units
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Timestamps</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Created</label>
            <p className="text-sm font-medium">{formatDateTime(shipment.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Last Updated</label>
            <p className="text-sm font-medium">{formatDateTime(shipment.updatedAt)}</p>
          </div>
          {shipment.receivedAt && (
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Received</label>
              <p className="text-sm font-medium">{formatDateTime(shipment.receivedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {discrepancies.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="text-sm font-semibold text-red-800">Discrepancies ({discrepancies.length})</h3>
          </div>
          <div className="space-y-1">
            {discrepancies.slice(0, 3).map((disc) => (
              <div key={disc.id} className="text-xs text-red-700">
                &#x2022; {disc.type}: {disc.description}
              </div>
            ))}
            {discrepancies.length > 3 && (
              <div className="text-xs text-red-600 font-medium">
                +{discrepancies.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      <AssignmentPanel
        assignedManagers={resolvedManagers}
        assignedWorkers={resolvedWorkers}
        availableManagers={availableManagers}
        availableWorkers={availableWorkers}
        warehouseId={shipment.warehouseId}
        onAddAssignment={onAddAssignment}
        onRemoveAssignment={onRemoveAssignment}
        isEditable={isEditable}
      />

      <DocumentsSection
        documents={resolvedDocuments}
        onAddDocument={onAddDocument}
        onRemoveDocument={onRemoveDocument}
        isEditable={isEditable}
      />
    </div>
  );
}
