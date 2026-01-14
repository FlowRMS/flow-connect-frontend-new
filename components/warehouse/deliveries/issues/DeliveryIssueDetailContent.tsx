'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchDeliveryById,
  fetchDeliveryIssueById,
  fetchFactoryById,
  fetchShippingCarriers,
  fetchWarehouses,
  mapDeliveryToShipment,
  mapIssueFromDelivery,
  updateDeliveryIssue,
} from '../../api/warehouseDeliveriesApi';
import { fetchUserById } from '@/components/lib/api/search';
import {
  DeliveryIssue,
  DeliveryIssueActivity,
  DeliveryIssueActivityType,
  deliveryIssueStatusColors,
  deliveryIssueStatusLabels,
  deliveryIssueTypeColors,
  deliveryIssueTypeLabels,
  IncomingShipment,
} from '@/lib/types/warehouse';

interface DeliveryIssueDetailContentProps {
  issueId: string;
}

export default function DeliveryIssueDetailContent({ issueId }: DeliveryIssueDetailContentProps) {
  const router = useRouter();
  const [issue, setIssue] = useState<DeliveryIssue | null>(null);
  const [shipment, setShipment] = useState<IncomingShipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportedByName, setReportedByName] = useState('');
  const [communicatedByName, setCommunicatedByName] = useState('');
  const [resolvedByName, setResolvedByName] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [communicationNotes, setCommunicationNotes] = useState(issue?.communicationNotes || '');
  const [resolutionNotes, setResolutionNotes] = useState(issue?.resolutionNotes || '');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isActive = true;

    const loadIssue = async () => {
      setIsLoading(true);
      try {
        const issueData = await fetchDeliveryIssueById(issueId);
        if (!issueData) {
          if (isActive) {
            setIssue(null);
            setShipment(null);
          }
          return;
        }

        const delivery = await fetchDeliveryById(issueData.deliveryId);
        if (!delivery) {
          if (isActive) {
            setIssue(null);
            setShipment(null);
          }
          return;
        }

        const [warehousesData, carriersData, vendor, reporter] = await Promise.all([
          fetchWarehouses(),
          fetchShippingCarriers(true),
          fetchFactoryById(delivery.vendorId),
          issueData.createdById ? fetchUserById(issueData.createdById) : Promise.resolve(null),
        ]);

        const warehouseMap = new Map(warehousesData.map((warehouse) => [warehouse.id, warehouse]));
        const carrierMap = new Map(carriersData.map((carrier) => [carrier.id, carrier]));
        const factoryMap = new Map(
          vendor ? [[vendor.id, vendor]] : []
        );

        const mappedIssue = mapIssueFromDelivery(issueData, delivery, warehouseMap, factoryMap);
        const mappedShipment = mapDeliveryToShipment(delivery, warehouseMap, factoryMap, carrierMap);

        if (!isActive) return;

        setIssue(mappedIssue);
        setShipment(mappedShipment);
        setCommunicationNotes(mappedIssue.communicationNotes || '');
        setResolutionNotes(mappedIssue.resolutionNotes || '');
        const isUuid = (value?: string | null) =>
          Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
        const reporterName =
          reporter?.fullName ||
          [reporter?.firstName, reporter?.lastName].filter(Boolean).join(' ').trim() ||
          reporter?.email ||
          mappedIssue.reportedBy ||
          'Unknown';
        setReportedByName(isUuid(reporterName) ? 'Unknown' : reporterName);
        const resolveUserName = async (value?: string | null) => {
          if (!value) return '';
          if (!isUuid(value)) return value;
          const user = await fetchUserById(value);
          return (
            user?.fullName ||
            [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
            user?.email ||
            value
          );
        };
        const communicatorName = await resolveUserName(mappedIssue.communicatedBy || undefined);
        setCommunicatedByName(communicatorName);
        const resolverName = await resolveUserName(mappedIssue.resolvedBy || undefined);
        setResolvedByName(resolverName);
        const initialNotes: Record<string, string> = {};
        mappedIssue.items.forEach((item) => {
          initialNotes[item.id] = item.notes || '';
        });
        setItemNotes(initialNotes);
      } catch (error) {
        console.error('Failed to load delivery issue', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadIssue();

    return () => {
      isActive = false;
    };
  }, [issueId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-[var(--muted-foreground)]">Loading issue details...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-[var(--foreground)]">Issue Not Found</h2>
          <p className="text-[var(--muted-foreground)] mt-1">The delivery issue you are looking for does not exist.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const buildIssueInput = (current: DeliveryIssue, overrides: Partial<DeliveryIssue>) => {
    const item = current.items[0];
    return {
      deliveryId: current.shipmentId,
      deliveryItemId: item?.id || '',
      issueType: item?.issueType || 'OTHER',
      customIssueType: item?.customIssueType || null,
      qty: item?.quantity || 0,
      status: overrides.status || current.status,
      description: item?.description || null,
      notes: overrides.notes ?? current.notes ?? null,
      communicatedAt: overrides.communicatedAt ?? current.communicatedAt ?? null,
    };
  };

  const handleMarkCommunicated = async () => {
    if (!issue) return;
    setIsUpdatingStatus(true);
    setCommunicationMessage(null);
    setActionMessage(null);
    const nowIso = new Date().toISOString();
    try {
      await updateDeliveryIssue(issue.id, buildIssueInput(issue, {
        status: 'COMMUNICATED',
        communicatedAt: nowIso,
        notes: communicationNotes || issue.notes || null,
      }));
      setIssue({
        ...issue,
        status: 'COMMUNICATED',
        communicatedAt: nowIso,
        communicationNotes,
      });
      updateCachedIssue({
        id: issue.id,
        status: 'COMMUNICATED',
        communicatedAt: nowIso,
        communicationNotes,
      });
      setCommunicatedByName(communicatedByName || 'Current User');
      setCommunicationMessage({ type: 'success', text: 'Marked as communicated.' });
    } catch (error) {
      console.error('Failed to mark issue communicated', error);
      setCommunicationMessage({ type: 'error', text: 'Failed to mark as communicated.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!issue) return;
    setIsUpdatingStatus(true);
    setResolutionMessage(null);
    setActionMessage(null);
    try {
      await updateDeliveryIssue(issue.id, buildIssueInput(issue, {
        status: 'RESOLVED',
        notes: resolutionNotes || issue.notes || null,
      }));
      setIssue({
        ...issue,
        status: 'RESOLVED',
        resolutionNotes,
      });
      updateCachedIssue({
        id: issue.id,
        status: 'RESOLVED',
        resolutionNotes,
      });
      setResolvedByName(resolvedByName || 'Current User');
      setResolutionMessage({ type: 'success', text: 'Marked as resolved.' });
    } catch (error) {
      console.error('Failed to resolve issue', error);
      setResolutionMessage({ type: 'error', text: 'Failed to mark as resolved.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClose = async () => {
    if (!issue) return;
    setIsUpdatingStatus(true);
    setActionMessage(null);
    try {
      await updateDeliveryIssue(issue.id, buildIssueInput(issue, { status: 'CLOSED' }));
      setIssue({ ...issue, status: 'CLOSED' });
      updateCachedIssue({ id: issue.id, status: 'CLOSED' });
      setActionMessage({ type: 'success', text: 'Issue closed.' });
    } catch (error) {
      console.error('Failed to close issue', error);
      setActionMessage({ type: 'error', text: 'Failed to close issue.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReopen = async () => {
    if (!issue) return;
    setIsUpdatingStatus(true);
    setActionMessage(null);
    try {
      await updateDeliveryIssue(issue.id, buildIssueInput(issue, { status: 'OPEN', communicatedAt: null }));
      setIssue({
        ...issue,
        status: 'OPEN',
        communicatedAt: undefined,
        communicatedBy: undefined,
        communicationMethod: undefined,
        communicationNotes: undefined,
        resolvedAt: undefined,
        resolvedBy: undefined,
        resolutionType: undefined,
        resolutionNotes: undefined,
        creditAmount: undefined,
        replacementShipmentId: undefined,
      });
      updateCachedIssue({
        id: issue.id,
        status: 'OPEN',
        communicatedAt: undefined,
        communicatedBy: undefined,
        communicationMethod: undefined,
        communicationNotes: undefined,
        resolvedAt: undefined,
        resolvedBy: undefined,
        resolutionType: undefined,
        resolutionNotes: undefined,
        creditAmount: undefined,
        replacementShipmentId: undefined,
      });
      setCommunicatedByName('');
      setResolvedByName('');
      setActionMessage({ type: 'success', text: 'Issue reopened.' });
    } catch (error) {
      console.error('Failed to reopen issue', error);
      setActionMessage({ type: 'error', text: 'Failed to reopen issue.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const newActivity: DeliveryIssueActivity = {
      id: `act-${Date.now()}`,
      type: 'NOTE_ADDED',
      timestamp: new Date().toISOString(),
      createdBy: 'Current User',
      content: newNote.trim(),
    };

    const currentActivities = issue.activities || [];
    const updated = updateDeliveryIssue(issue.id, {
      activities: [...currentActivities, newActivity],
    });

    if (updated) {
      setIssue(updated);
      setNewNote('');
    }
  };

  const handleSaveItemNote = (itemId: string) => {
    const noteContent = itemNotes[itemId]?.trim();
    if (!noteContent) return;

    // Update the item's notes
    const updatedItems = issue.items.map(item =>
      item.id === itemId ? { ...item, notes: noteContent } : item
    );

    // Add to activity feed
    const newActivity: DeliveryIssueActivity = {
      id: `act-${Date.now()}`,
      type: 'ITEM_NOTE_ADDED',
      timestamp: new Date().toISOString(),
      createdBy: 'Current User',
      content: noteContent,
      metadata: {
        itemId,
      },
    };

    const currentActivities = issue.activities || [];
    const updated = updateDeliveryIssue(issue.id, {
      items: updatedItems,
      activities: [...currentActivities, newActivity],
    });

    if (updated) {
      setIssue(updated);
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getActivityIcon = (type: DeliveryIssueActivityType) => {
    switch (type) {
      case 'CREATED':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
        );
      case 'COMMUNICATED':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
        );
      case 'RESOLVED':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        );
      case 'CLOSED':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
        );
      case 'REOPENED':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </div>
        );
      case 'NOTE_ADDED':
      case 'ITEM_NOTE_ADDED':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
        );
    }
  };

  const getActivityTitle = (activity: DeliveryIssueActivity) => {
    switch (activity.type) {
      case 'CREATED':
        return 'Issue Created';
      case 'COMMUNICATED':
        const method = activity.metadata?.method === 'EMAIL' ? 'via Email' :
                       activity.metadata?.method === 'PHONE' ? 'via Phone' :
                       activity.metadata?.method === 'PORTAL' ? 'via Portal' : '';
        return `Vendor Communicated ${method}`;
      case 'RESOLVED':
        return activity.metadata?.resolutionType ?
          `Resolved - ${activity.metadata.resolutionType.replace(/_/g, ' ')}` :
          'Issue Resolved';
      case 'CLOSED':
        return 'Issue Closed';
      case 'REOPENED':
        return 'Issue Reopened';
      case 'NOTE_ADDED':
        return 'Note Added';
      case 'ITEM_NOTE_ADDED':
        const item = issue.items.find(i => i.id === activity.metadata?.itemId);
        return `Note Added to Item: ${item?.partNumber || 'Unknown'}`;
      default:
        return 'Activity';
    }
  };

  const generateEmailContent = () => {
    const itemsList = issue.items.map(item =>
      `- ${item.partNumber} (${item.productName}): ${deliveryIssueTypeLabels[item.issueType]} - Qty: ${item.quantity}${item.description ? ` - ${item.description}` : ''}`
    ).join('\n');

    return `Subject: Delivery Issue Report - ${issue.poNumber}

Dear ${issue.vendorContact || 'Vendor'},

We are writing to report issues with a recent delivery received at ${issue.warehouseName}.

PO Number: ${issue.poNumber}
Issue Reference: ${issue.issueNumber}
Date Received: ${formatDate(issue.reportedAt)}

Issues Found:
${itemsList}

Total Affected Quantity: ${issue.totalAffectedQuantity} units

Please advise on how you would like to proceed with this matter. We are available to provide photos or additional documentation as needed.

Best regards,
${issue.warehouseName}`;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{issue.issueNumber}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded ${deliveryIssueStatusColors[issue.status]}`}>
                {deliveryIssueStatusLabels[issue.status]}
              </span>
            </div>
            <p className="text-[var(--muted-foreground)]">
              Reported on {formatDate(issue.reportedAt)} by {reportedByName || issue.reportedBy}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {issue.status === 'CLOSED' && (
            <button
              onClick={handleReopen}
              disabled={isUpdatingStatus}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUpdatingStatus ? 'Saving...' : 'Reopen Issue'}
            </button>
          )}
          {issue.status === 'RESOLVED' && (
            <button
              onClick={handleClose}
              disabled={isUpdatingStatus}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUpdatingStatus ? 'Saving...' : 'Close Issue'}
            </button>
          )}
        </div>
      </div>
      {actionMessage && (
        <div className={`text-sm ${
          actionMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Affected Items */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h2 className="font-medium text-[var(--foreground)]">Affected Items ({issue.items.length})</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {issue.items.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{item.partNumber}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">{item.productName}</div>
                      {item.description && (
                        <div className="text-sm text-[var(--muted-foreground)] mt-1 italic">{item.description}</div>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <button
                        onClick={() => toggleItemExpanded(item.id)}
                        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        title="Add note"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${deliveryIssueTypeColors[item.issueType]}`}>
                          {deliveryIssueTypeLabels[item.issueType]}
                        </span>
                        <div className="text-lg font-bold text-[var(--foreground)] mt-1">{item.quantity} units</div>
                      </div>
                    </div>
                  </div>

                  {/* Item notes display */}
                  {item.notes && !expandedItems.has(item.id) && (
                    <div className="mt-2 ml-14 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600 mt-0.5 flex-shrink-0">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p className="text-sm text-purple-700">{item.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Expanded note input */}
                  {expandedItems.has(item.id) && (
                    <div className="mt-3 ml-14">
                      <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/20">
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Note for {item.partNumber}
                        </label>
                        <textarea
                          value={itemNotes[item.id] || ''}
                          onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Add a note about this item..."
                          rows={2}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => toggleItemExpanded(item.id)}
                            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveItemNote(item.id)}
                            disabled={!itemNotes[item.id]?.trim()}
                            className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)] flex justify-between">
              <span className="font-medium text-[var(--foreground)]">Total Affected</span>
              <span className="font-bold text-[var(--foreground)]">{issue.totalAffectedQuantity} units</span>
            </div>
          </div>

          {/* Communication Section */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
              <h2 className="font-medium text-[var(--foreground)]">Vendor Communication</h2>
              {issue.status === 'OPEN' && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Send Email to Vendor
                </button>
              )}
            </div>
            <div className="p-4 space-y-4">
              {communicationMessage && (
                <div className={`text-sm ${
                  communicationMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {communicationMessage.text}
                </div>
              )}
              {issue.communicatedAt ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="font-medium">Communicated on {formatDate(issue.communicatedAt)}</span>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    By: {communicatedByName || issue.communicatedBy || 'N/A'} via {issue.communicationMethod || 'N/A'}
                  </div>
                  {issue.communicationNotes && (
                    <div className="p-3 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)]">
                      {issue.communicationNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Issue has not yet been communicated to the vendor.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Communication Notes
                    </label>
                    <textarea
                      value={communicationNotes}
                      onChange={(e) => setCommunicationNotes(e.target.value)}
                      placeholder="Add notes about communication with vendor..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  </div>
                  <button
                    onClick={handleMarkCommunicated}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Mark as Communicated'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Section */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h2 className="font-medium text-[var(--foreground)]">Resolution</h2>
            </div>
            <div className="p-4 space-y-4">
              {issue.resolvedAt ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="font-medium">Resolved on {formatDate(issue.resolvedAt)}</span>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    By: {resolvedByName || issue.resolvedBy || 'N/A'}
                  </div>
                  {issue.resolutionType && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--muted-foreground)]">Resolution Type:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        {issue.resolutionType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {issue.creditAmount && (
                    <div className="text-sm text-[var(--foreground)]">
                      Credit Amount: <span className="font-medium">${issue.creditAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {issue.resolutionNotes && (
                    <div className="p-3 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)]">
                      {issue.resolutionNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Issue has not yet been resolved.
                  </p>
                  {resolutionMessage && (
                    <div className={`text-sm ${
                      resolutionMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {resolutionMessage.text}
                    </div>
                  )}
                  {issue.status === 'COMMUNICATED' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Resolution Notes
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Describe how the issue was resolved..."
                          rows={3}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <button
                        onClick={handleMarkResolved}
                        disabled={isUpdatingStatus}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        {isUpdatingStatus ? 'Saving...' : 'Mark as Resolved'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed Section */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h2 className="font-medium text-[var(--foreground)]">Activity Feed</h2>
            </div>
            <div className="p-4">
              {/* Add Note Input */}
              <div className="mb-4 pb-4 border-b border-[var(--border)]">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      rows={2}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                {(issue.activities || [])
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {getActivityIcon(activity.type)}
                        {index < (issue.activities?.length || 0) - 1 && (
                          <div className="w-0.5 flex-1 bg-[var(--border)] mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-[var(--foreground)]">
                            {getActivityTitle(activity)}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          by {activity.createdBy}
                        </div>
                        {activity.content && (
                          <div className="mt-2 p-2 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)]">
                            {activity.content}
                          </div>
                        )}
                        {activity.metadata?.creditAmount && (
                          <div className="mt-1 text-sm text-green-600 font-medium">
                            Credit: ${activity.metadata.creditAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                {(!issue.activities || issue.activities.length === 0) && (
                  <div className="text-center py-6 text-[var(--muted-foreground)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-50">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p className="text-sm">No activity yet</p>
                    <p className="text-xs mt-1">Add a note to start the activity feed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Original Delivery Info */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h2 className="font-medium text-[var(--foreground)]">Original Delivery</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-xs text-[var(--muted-foreground)]">PO Number</span>
                <div className="font-medium text-[var(--foreground)]">{issue.poNumber}</div>
              </div>
              {shipment && (
                <>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)]">Tracking Number</span>
                    <div className="font-medium text-[var(--foreground)]">{shipment.trackingNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)]">Carrier</span>
                    <div className="font-medium text-[var(--foreground)]">{shipment.carrier || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)]">ETA</span>
                    <div className="font-medium text-[var(--foreground)]">{formatDate(shipment.eta)}</div>
                  </div>
                </>
              )}
              <Link
                href={`/warehouse/deliveries/${issue.shipmentId}`}
                className="block w-full px-3 py-2 text-center text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
              >
                View Delivery Details
              </Link>
            </div>
          </div>

          {/* Vendor Info */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h2 className="font-medium text-[var(--foreground)]">Vendor Information</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-xs text-[var(--muted-foreground)]">Vendor Name</span>
                <div className="font-medium text-[var(--foreground)]">{issue.vendorName}</div>
              </div>
              {issue.vendorContact && (
                <div>
                  <span className="text-xs text-[var(--muted-foreground)]">Contact</span>
                  <div className="font-medium text-[var(--foreground)]">{issue.vendorContact}</div>
                </div>
              )}
              {issue.vendorEmail && (
                <div>
                  <span className="text-xs text-[var(--muted-foreground)]">Email</span>
                  <a
                    href={`mailto:${issue.vendorEmail}`}
                    className="font-medium text-[var(--primary)] hover:underline block"
                  >
                    {issue.vendorEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Info */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h2 className="font-medium text-[var(--foreground)]">Warehouse</h2>
            </div>
            <div className="p-4">
              <div className="font-medium text-[var(--foreground)]">{issue.warehouseName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-medium text-[var(--foreground)]">Email to Vendor</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">To:</label>
                <input
                  type="email"
                  value={issue.vendorEmail || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email Content:</label>
                <textarea
                  value={generateEmailContent()}
                  readOnly
                  rows={15}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm font-mono"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Copy to clipboard
                  navigator.clipboard.writeText(generateEmailContent());
                  alert('Email content copied to clipboard!');
                }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  // Open mailto link
                  const subject = encodeURIComponent(`Delivery Issue Report - ${issue.poNumber}`);
                  const body = encodeURIComponent(generateEmailContent().replace(/^Subject:.*\n\n/, ''));
                  window.open(`mailto:${issue.vendorEmail}?subject=${subject}&body=${body}`);
                  setShowEmailModal(false);
                  handleMarkCommunicated();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Open in Email Client
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
  const updateCachedIssue = (patch: Partial<DeliveryIssue> & { id: string }) => {
    try {
      const raw = sessionStorage.getItem('warehouseDeliveryIssuesCache');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { warehouseId?: string; issues?: DeliveryIssue[] };
      if (!Array.isArray(parsed.issues)) return;
      const issues = parsed.issues.map((item) => (item.id === patch.id ? { ...item, ...patch } : item));
      sessionStorage.setItem('warehouseDeliveryIssuesCache', JSON.stringify({ ...parsed, issues }));
    } catch {
      // Ignore cache update failures.
    }
  };
