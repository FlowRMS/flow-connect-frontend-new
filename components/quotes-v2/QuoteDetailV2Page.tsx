'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { QuoteV2, LineItemV2, NoteV2, TaskV2, QuoteSettingsV2, ColumnConfig, Quote } from './types';
import {
  transformQuoteToQuoteV2,
  transformQuoteDetailToLineItemV2,
  createEmptyQuoteV2,
  mapUIStageToAPIFields,
  transformLineItemV2ToDetailInput,
} from './types';
import { QuoteDetailHeaderV2 } from './components/QuoteDetailHeaderV2';
import { LineItemsTabV2 } from './tabs/LineItemsTabV2';
import { NotesTabV2 } from './tabs/NotesTabV2';
import { TasksTabV2 } from './tabs/TasksTabV2';
import { ActivityTabV2 } from './tabs/ActivityTabV2';
import { LinkedObjectsTabV2 } from './tabs/LinkedObjectsTabV2';
import { VersionsTabV2 } from './tabs/VersionsTabV2';
import { SettingsTabV2 } from './tabs/SettingsTabV2';
import { ColumnsConfigModalV2 } from './modals/ColumnsConfigModalV2';
import { AdditionalDetailsModalV2 } from './modals/AdditionalDetailsModalV2';
import {
  defaultQuoteSettingsV2,
  defaultColumnConfigV2,
  mockNotesV2,
  mockTasksV2,
  mockActivitiesV2,
  mockLinkedObjectsV2,
  mockVersionsV2,
} from './data/mockData';
import {
  useQuoteV2,
  useCreateQuoteV2,
  useUpdateQuoteV2,
  useDeleteQuoteV2,
  useDuplicateQuoteV2,
} from './api/quotesV2Api';
import { searchUsers } from '../quotes/api/quotesApi';
import { quoteToasts } from '../lib/toast';

type TabType = 'lineItems' | 'notes' | 'tasks' | 'activity' | 'linkedObjects' | 'versions' | 'settings';

interface QuoteDetailV2PageProps {
  quoteId: string | null;
  onBack: () => void;
  isNew?: boolean;
}

export function QuoteDetailV2Page({ quoteId, onBack, isNew = false }: QuoteDetailV2PageProps) {
  // API hooks
  const { data: apiQuote, isLoading, error } = useQuoteV2(quoteId);
  const createQuoteMutation = useCreateQuoteV2();
  const updateQuoteMutation = useUpdateQuoteV2();
  const deleteQuoteMutation = useDeleteQuoteV2();
  const duplicateQuoteMutation = useDuplicateQuoteV2();

  // Quote state
  const [quote, setQuote] = useState<QuoteV2>(createEmptyQuoteV2());
  const [hasChanges, setHasChanges] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('lineItems');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemV2[]>([]);

  // Other data states (Coming soon - using mock data)
  const [notes, setNotes] = useState<NoteV2[]>(mockNotesV2);
  const [tasks, setTasks] = useState<TaskV2[]>(mockTasksV2);
  const [settings, setSettings] = useState<QuoteSettingsV2>(defaultQuoteSettingsV2);

  // Column configuration
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(defaultColumnConfigV2);

  // Modal states
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showAdditionalDetailsModal, setShowAdditionalDetailsModal] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<LineItemV2 | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Transform API data to UI format when it loads
  useEffect(() => {
    if (apiQuote && !isNew) {
      const transformedQuote = transformQuoteToQuoteV2(apiQuote);
      setQuote(transformedQuote);

      // Transform line items
      if (apiQuote.details) {
        const transformedLineItems = apiQuote.details.map((detail) =>
          transformQuoteDetailToLineItemV2(detail, apiQuote.id)
        );
        setLineItems(transformedLineItems);
      }
      setHasChanges(false);

      // Fetch inside rep name if we have userId but no name
      if (transformedQuote.insideRepId && !transformedQuote.insideRepName) {
        // Search for the user to get their name
        searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
          .then((users) => {
            const matchingUser = users.find((u) => u.id === transformedQuote.insideRepId);
            if (matchingUser?.fullName) {
              setQuote((prev) => ({ ...prev, insideRepName: matchingUser.fullName || '' }));
            }
          })
          .catch((err) => {
            console.error('Failed to fetch inside rep name:', err);
          });
      }
    }
  }, [apiQuote, isNew]);

  const handleQuoteChange = useCallback((updates: Partial<QuoteV2>) => {
    setQuote((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleLineItemsChange = useCallback((items: LineItemV2[]) => {
    setLineItems(items);
    setHasChanges(true);
  }, []);

  const handleOpenAdditionalDetails = useCallback((item: LineItemV2) => {
    setSelectedLineItem(item);
    setShowAdditionalDetailsModal(true);
  }, []);

  const handleSaveAdditionalDetails = useCallback((updates: Partial<LineItemV2>) => {
    if (selectedLineItem) {
      setLineItems((prev) =>
        prev.map((li) => (li.id === selectedLineItem.id ? { ...li, ...updates } : li))
      );
      setHasChanges(true);
    }
  }, [selectedLineItem]);

  const handleRevertToVersion = useCallback((versionNumber: number) => {
    // Coming soon - no API endpoint for version revert
    console.log('Reverting to version:', versionNumber);
  }, []);

  // Helper to check if string is a valid UUID
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Build API input from current state
  const buildQuoteInput = useCallback(() => {
    const stageMapping = mapUIStageToAPIFields(quote.stage);

    return {
      id: quote.id || undefined,
      quoteNumber: quote.quoteNumber,
      entityDate: quote.quoteDate,
      soldToCustomerId: quote.soldToCustomerId,
      billToCustomerId: quote.billToCustomerId || undefined,
      status: stageMapping.status || 'OPEN' as const,
      pipelineStage: stageMapping.pipelineStage,
      published: quote.published ?? false,
      creationType: quote.creationType || 'MANUAL' as const,
      blanket: quote.blanket ?? false,
      acceptDate: quote.acceptDate || undefined,
      customerRef: quote.customerRef || undefined,
      expDate: quote.expirationDate || undefined,
      freightTerms: quote.freightTerms || undefined,
      paymentTerms: quote.paymentTerms || undefined,
      reviseDate: quote.revisedDate || undefined,
      details: lineItems.map((li, index) => ({
        ...transformLineItemV2ToDetailInput(li),
        itemNumber: li.itemNumber ?? index + 1,
      })),
      insideReps: quote.insideReps?.map((rep) => ({
        // Only include id if it's a valid UUID (existing from API)
        ...(rep.id && isValidUUID(rep.id) ? { id: rep.id } : {}),
        userId: rep.userId || '',
        splitRate: rep.splitRate || '100',
        position: rep.position,
      })),
    };
  }, [quote, lineItems]);

  const handleSave = useCallback(async () => {
    if (!quote.quoteNumber || !quote.soldToCustomerId) {
      setSaveError('Quote Number and Sold To Customer are required');
      quoteToasts.updateError('Quote Number and Sold To Customer are required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const input = buildQuoteInput();

      if (isNew || !quote.id) {
        const result = await createQuoteMutation.mutateAsync(input);
        quoteToasts.createSuccess(quote.quoteNumber);
        // Navigate to the new quote
        window.location.href = `/quotes-v2/${result.id}`;
      } else {
        await updateQuoteMutation.mutateAsync(input);
        setHasChanges(false);
        quoteToasts.updateSuccess(quote.quoteNumber);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save quote';
      setSaveError(errorMessage);
      if (isNew || !quote.id) {
        quoteToasts.createError(errorMessage);
      } else {
        quoteToasts.updateError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  }, [quote, isNew, buildQuoteInput, createQuoteMutation, updateQuoteMutation]);

  const handleDelete = useCallback(async () => {
    if (!quote.id) return;

    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      await deleteQuoteMutation.mutateAsync(quote.id);
      quoteToasts.deleteSuccess(quote.quoteNumber);
      onBack();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quote';
      setSaveError(errorMessage);
      quoteToasts.deleteError(errorMessage);
    }
  }, [quote.id, quote.quoteNumber, deleteQuoteMutation, onBack]);

  const handleDuplicate = useCallback(async () => {
    if (!quote.id) return;

    const newQuoteNumber = prompt('Enter new quote number:', `${quote.quoteNumber}-COPY`);
    if (!newQuoteNumber) return;

    try {
      const result = await duplicateQuoteMutation.mutateAsync({
        sourceQuoteId: quote.id,
        newQuoteNumber,
      });
      quoteToasts.duplicateSuccess(newQuoteNumber);
      window.location.href = `/quotes-v2/${result.id}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate quote';
      setSaveError(errorMessage);
      quoteToasts.duplicateError(errorMessage);
    }
  }, [quote.id, quote.quoteNumber, duplicateQuoteMutation]);

  const tabs: { key: TabType; label: string; count?: number; comingSoon?: boolean }[] = useMemo(() => [
    { key: 'lineItems', label: 'Line Items', count: lineItems.length },
    { key: 'notes', label: 'Notes', comingSoon: true },
    { key: 'tasks', label: 'Tasks', comingSoon: true },
    { key: 'activity', label: 'Activity', comingSoon: true },
    { key: 'linkedObjects', label: 'Linked Objects', comingSoon: true },
    { key: 'versions', label: 'Versions', comingSoon: true },
    { key: 'settings', label: 'Settings', comingSoon: true },
  ], [lineItems.length]);

  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading quote...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isNew) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load quote: {error.message}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Save Error Banner */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <QuoteDetailHeaderV2
        quote={quote}
        onQuoteChange={handleQuoteChange}
        onBack={onBack}
        onSave={handleSave}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        isSaving={isSaving}
        hasChanges={hasChanges}
        isNew={isNew}
        lineItems={lineItems}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {tab.count}
              </span>
            )}
            {tab.comingSoon && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px] uppercase">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'lineItems' && (
          <LineItemsTabV2
            lineItems={lineItems}
            onLineItemsChange={handleLineItemsChange}
            onOpenColumnsModal={() => setShowColumnsModal(true)}
            onOpenAdditionalDetails={handleOpenAdditionalDetails}
            columnConfig={columnConfig}
            quoteId={quote.id}
          />
        )}

        {activeTab === 'notes' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Notes functionality is not yet available via API.
              </p>
            </div>
            <NotesTabV2 notes={notes} onNotesChange={setNotes} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Tasks functionality is not yet available via API.
              </p>
            </div>
            <TasksTabV2 tasks={tasks} onTasksChange={setTasks} />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Activity feed is not yet available via API.
              </p>
            </div>
            <ActivityTabV2 activities={mockActivitiesV2} />
          </div>
        )}

        {activeTab === 'linkedObjects' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Linked Objects functionality is not yet available via API.
              </p>
            </div>
            <LinkedObjectsTabV2 linkedObjects={mockLinkedObjectsV2} />
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Version history is not yet available via API.
              </p>
            </div>
            <VersionsTabV2
              versions={mockVersionsV2}
              currentVersion={quote.version}
              onRevertToVersion={handleRevertToVersion}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Quote settings are not yet available via API.
              </p>
            </div>
            <SettingsTabV2 settings={settings} onSettingsChange={setSettings} />
          </div>
        )}
      </div>

      {/* Modals */}
      <ColumnsConfigModalV2
        isOpen={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        columnConfig={columnConfig}
        onColumnConfigChange={setColumnConfig}
      />

      <AdditionalDetailsModalV2
        isOpen={showAdditionalDetailsModal}
        onClose={() => setShowAdditionalDetailsModal(false)}
        lineItem={selectedLineItem}
        onSave={handleSaveAdditionalDetails}
      />
    </div>
  );
}

export default QuoteDetailV2Page;
