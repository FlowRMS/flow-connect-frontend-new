'use client';

import React, { useState } from 'react';
import type { QuoteV2, LineItemV2, NoteV2, TaskV2, ActivityV2, VersionV2, QuoteSettingsV2, ColumnConfig } from './types';
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
  mockLineItemsV2,
  mockNotesV2,
  mockTasksV2,
  mockActivitiesV2,
  mockVersionsV2,
  defaultQuoteSettingsV2,
  defaultColumnConfigV2,
} from './data/mockData';

type TabType = 'lineItems' | 'notes' | 'tasks' | 'activity' | 'linkedObjects' | 'versions' | 'settings';

interface QuoteDetailV2Props {
  quote: QuoteV2;
  onBack: () => void;
}

export function QuoteDetailV2({ quote: initialQuote, onBack }: QuoteDetailV2Props) {
  // Quote state
  const [quote, setQuote] = useState<QuoteV2>(initialQuote);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('lineItems');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemV2[]>(
    mockLineItemsV2.filter((li) => li.quoteId === initialQuote.id)
  );

  // Other data states
  const [notes, setNotes] = useState<NoteV2[]>(mockNotesV2);
  const [tasks, setTasks] = useState<TaskV2[]>(mockTasksV2);
  const [settings, setSettings] = useState<QuoteSettingsV2>(defaultQuoteSettingsV2);

  // Column configuration
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(defaultColumnConfigV2);

  // Modal states
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showAdditionalDetailsModal, setShowAdditionalDetailsModal] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<LineItemV2 | null>(null);

  const handleQuoteChange = (updates: Partial<QuoteV2>) => {
    setQuote((prev) => ({ ...prev, ...updates }));
  };

  const handleOpenAdditionalDetails = (item: LineItemV2) => {
    setSelectedLineItem(item);
    setShowAdditionalDetailsModal(true);
  };

  const handleSaveAdditionalDetails = (updates: Partial<LineItemV2>) => {
    if (selectedLineItem) {
      setLineItems((prev) =>
        prev.map((li) => (li.id === selectedLineItem.id ? { ...li, ...updates } : li))
      );
    }
  };

  const handleRevertToVersion = (versionNumber: number) => {
    // In a real app, this would fetch the version data from the API
    console.log('Reverting to version:', versionNumber);
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'lineItems', label: 'Line Items', count: lineItems.length },
    { key: 'notes', label: 'Notes' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'activity', label: 'Activity' },
    { key: 'linkedObjects', label: 'Linked Objects' },
    { key: 'versions', label: 'Versions' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <QuoteDetailHeaderV2
        quote={quote}
        onQuoteChange={handleQuoteChange}
        onBack={onBack}
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
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'lineItems' && (
          <LineItemsTabV2
            lineItems={lineItems}
            onLineItemsChange={setLineItems}
            onOpenColumnsModal={() => setShowColumnsModal(true)}
            onOpenAdditionalDetails={handleOpenAdditionalDetails}
            columnConfig={columnConfig}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTabV2 notes={notes} onNotesChange={setNotes} />
        )}

        {activeTab === 'tasks' && (
          <TasksTabV2 tasks={tasks} onTasksChange={setTasks} />
        )}

        {activeTab === 'activity' && (
          <ActivityTabV2 activities={mockActivitiesV2} />
        )}

        {activeTab === 'linkedObjects' && (
          <LinkedObjectsTabV2 quoteId={quote.id} />
        )}

        {activeTab === 'versions' && (
          <VersionsTabV2
            versions={mockVersionsV2}
            currentVersion={quote.version}
            onRevertToVersion={handleRevertToVersion}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTabV2 settings={settings} onSettingsChange={setSettings} />
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
        settings={settings}
      />
    </div>
  );
}

export default QuoteDetailV2;
