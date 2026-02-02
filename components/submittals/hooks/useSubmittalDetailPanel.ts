import { useState, useMemo, useEffect } from 'react';
import type {
  Submittal,
  SubmittalConfig,
  SpecSheet,
} from '../../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../../lib/types/submittals';
import {
  useSpecSheetSearchWithFactoryNames,
  useManufacturersWithSpecSheets,
  useHighlightVersions,
} from '../api/useSpecSheetsApi';
import { useRevisionWorkflow } from './useRevisionWorkflow';
import { useSubmittalSettings } from '../submittal-detail';
import { useSpecSheetHandlers } from './useSpecSheetHandlers';

type TabId = 'items' | 'stakeholders' | 'revisions' | 'settings';

interface UseSubmittalDetailPanelParams {
  submittal: Submittal;
  onUpdate?: (updates: Partial<Submittal>) => void;
  onResubmit?: (itemsToResubmit: string[]) => void;
  forceActiveTab?: TabId | null;
  onTabChanged?: () => void;
}

export function useSubmittalDetailPanel({
  submittal,
  onUpdate,
  onResubmit,
  forceActiveTab,
  onTabChanged,
}: UseSubmittalDetailPanelParams) {
  const [activeTab, setActiveTab] = useState<TabId>('items');

  useEffect(() => {
    if (forceActiveTab) {
      setActiveTab(forceActiveTab);
      onTabChanged?.();
    }
  }, [forceActiveTab, onTabChanged]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showSpecSheetPicker, setShowSpecSheetPicker] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [specSheetSearch, setSpecSheetSearch] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SubmittalConfig>(
    submittal.config || { ...defaultSubmittalConfig }
  );

  // Revision workflow hook
  const revisionWorkflow = useRevisionWorkflow({ submittal, onUpdate, onResubmit });

  // Settings hook
  const settings = useSubmittalSettings({ submittal, onUpdate });

  // Spec sheet picker state
  const [specSheetManufacturerId, setSpecSheetManufacturerId] = useState<string | null>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectedSpecSheetForHighlight, setSelectedSpecSheetForHighlight] = useState<string | null>(null);

  // API hooks for spec sheets
  const { data: manufacturers = [], isLoading: isLoadingManufacturers } = useManufacturersWithSpecSheets();
  const { data: specSheetsFromApi, isLoading: isLoadingSpecSheets } = useSpecSheetSearchWithFactoryNames({
    factoryId: specSheetManufacturerId || undefined,
    searchTerm: specSheetSearch || undefined,
    publishedOnly: false,
    limit: 50,
  }, showSpecSheetPicker);

  // Get highlight versions for the selected item's spec sheet
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return submittal.items.find(i => i.id === selectedItemId) || null;
  }, [selectedItemId, submittal.items]);

  const { data: highlightVersions = [], isLoading: isLoadingHighlightVersions } = useHighlightVersions(
    selectedSpecSheetForHighlight || selectedItem?.specSheetId || null
  );

  // Auto-select first manufacturer when picker opens
  useEffect(() => {
    if (showSpecSheetPicker && !specSheetManufacturerId && manufacturers.length > 0) {
      setSpecSheetManufacturerId(manufacturers[0].id);
    }
  }, [showSpecSheetPicker, specSheetManufacturerId, manufacturers]);

  const updateEditingConfig = (key: keyof SubmittalConfig, value: boolean) => {
    setEditingConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    onUpdate?.({ config: editingConfig });
    setShowConfigModal(false);
  };

  const handleOpenConfig = () => {
    setEditingConfig(submittal.config || { ...defaultSubmittalConfig });
    setShowConfigModal(true);
  };

  // Stats for the submittal
  const stats = useMemo(() => {
    const total = submittal.items.length;
    const ready = submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length;
    const needsHighlight = submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length;
    const missing = submittal.items.filter(i => i.matchStatus === 'no_match').length;
    return { total, ready, needsHighlight, missing };
  }, [submittal.items]);

  // Spec sheets from API
  const filteredSpecSheets: SpecSheet[] = specSheetsFromApi || [];

  // Matching spec sheet for selected item
  const selectedItemSpecSheet = useMemo(() => {
    if (!selectedItem?.specSheetId) return null;
    if (selectedItem.specSheet) {
      const specSheet = selectedItem.specSheet as SpecSheet;
      if (!specSheet.manufacturer && specSheet.factoryId) {
        const factory = manufacturers.find(m => m.id === specSheet.factoryId);
        return { ...specSheet, manufacturer: factory?.name || '' };
      }
      return specSheet;
    }
    const fromCurrent = filteredSpecSheets.find(s => s.id === selectedItem.specSheetId);
    if (fromCurrent) return fromCurrent;
    return null;
  }, [selectedItem?.specSheetId, selectedItem?.specSheet, filteredSpecSheets, manufacturers]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'items', label: 'Items', count: submittal.items.length },
    { id: 'stakeholders', label: 'Stakeholders' },
    { id: 'revisions', label: 'Revisions', count: submittal.revisions.length },
    { id: 'settings', label: 'Settings' },
  ];

  // Spec sheet handlers hook
  const specSheetHandlers = useSpecSheetHandlers({
    submittal,
    selectedItemId,
    selectedSpecSheetForHighlight,
    onUpdate,
    setShowSpecSheetPicker,
    setShowHighlightPicker,
    setSelectedSpecSheetForHighlight,
  });

  return {
    // Tab state
    activeTab,
    setActiveTab,
    tabs,

    // Item state
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    selectedItemSpecSheet,

    // Spec sheet picker
    showSpecSheetPicker,
    setShowSpecSheetPicker,
    specSheetSearch,
    setSpecSheetSearch,
    specSheetManufacturerId,
    setSpecSheetManufacturerId,
    manufacturers,
    isLoadingManufacturers,
    filteredSpecSheets,
    isLoadingSpecSheets,

    // Highlight picker
    showHighlightPicker,
    setShowHighlightPicker,
    highlightVersions,
    isLoadingHighlightVersions,

    // Upload modal
    showUploadModal,
    setShowUploadModal,

    // Config modal
    showConfigModal,
    setShowConfigModal,
    editingConfig,
    updateEditingConfig,
    handleSaveConfig,
    handleOpenConfig,

    // Stats
    stats,

    // Hooks
    revisionWorkflow,
    settings,
    specSheetHandlers,
  };
}

export type { TabId };
