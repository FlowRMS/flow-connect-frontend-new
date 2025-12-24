'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  mockWarehouses,
  getWarehouseFactories,
  mockInventory,
  mockSections,
  addCycleCount,
  autoGenerateCycleCount,
  getItemsNotRecentlyCounted,
  getFastMovingItems,
  getAClassItems,
  getItemsBelowThreshold,
} from '@/lib/data/warehouse-mock';
import {
  CycleCountType,
  CycleCountPriority,
  CycleCountTriggerType,
  cycleCountTypeLabels,
  cycleCountPriorityLabels,
  cycleCountTriggerTypeLabels,
  cycleCountTriggerTypeDescriptions,
} from '@/lib/types/warehouse';

type StepId = 'trigger' | 'basic' | 'scope' | 'schedule' | 'review';

interface Step {
  id: StepId;
  name: string;
  description: string;
}

const steps: Step[] = [
  { id: 'trigger', name: 'Creation Method', description: 'How to create' },
  { id: 'basic', name: 'Basic Info', description: 'Name and type' },
  { id: 'scope', name: 'Count Scope', description: 'What to count' },
  { id: 'schedule', name: 'Schedule', description: 'When and who' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

// Trigger type icons
const triggerTypeIcons: Record<CycleCountTriggerType, React.ReactNode> = {
  MANUAL: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  FAST_MOVING: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  RANDOM_A_ITEMS: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  ),
  ON_DEMAND: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  BY_MANUFACTURER: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18"/>
      <path d="M5 21V7l8-4v18"/>
      <path d="M19 21V11l-6-4"/>
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/>
    </svg>
  ),
  LOW_QUANTITY: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  SCHEDULED: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
};

export default function NewCycleCountContent() {
  const router = useRouter();
  const factories = useMemo(() => getWarehouseFactories(), []);
  const warehouses = useMemo(() => mockWarehouses, []);
  const sections = useMemo(() => mockSections, []);

  // Current step
  const [currentStep, setCurrentStep] = useState<StepId>('trigger');

  // Trigger type state
  const [triggerType, setTriggerType] = useState<CycleCountTriggerType>('MANUAL');
  const [quantityThreshold, setQuantityThreshold] = useState<number>(100);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [sampleSize, setSampleSize] = useState<number>(10);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CycleCountType>('PARTIAL');
  const [priority, setPriority] = useState<CycleCountPriority>('medium');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Scope state
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedFactories, setSelectedFactories] = useState<string[]>([]);
  const [abcClass, setAbcClass] = useState<'A' | 'B' | 'C' | ''>('');

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  // Preview stats for auto-generate options
  const eligibleItemsPreview = useMemo(() => {
    const notRecentlyCounted = getItemsNotRecentlyCounted(60);
    return {
      fastMoving: getFastMovingItems().filter(inv => notRecentlyCounted.some(nrc => nrc.id === inv.id)).length,
      aItems: getAClassItems().filter(inv => notRecentlyCounted.some(nrc => nrc.id === inv.id)).length,
      onDemand: notRecentlyCounted.slice(0, 10).length,
      lowQuantity: getItemsBelowThreshold(quantityThreshold).filter(inv => notRecentlyCounted.some(nrc => nrc.id === inv.id)).length,
      byManufacturer: selectedManufacturerId
        ? mockInventory.filter(inv => inv.factoryId === selectedManufacturerId && notRecentlyCounted.some(nrc => nrc.id === inv.id)).length
        : 0,
    };
  }, [quantityThreshold, selectedManufacturerId]);

  // Determine if this is an auto-generate flow
  const isAutoGenerate = triggerType !== 'MANUAL' && triggerType !== 'SCHEDULED';

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const search = productSearch.toLowerCase();
    return mockInventory
      .filter(p =>
        p.productName.toLowerCase().includes(search) ||
        p.partNumber.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [productSearch]);

  const handleAddProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts(prev => [...prev, productId]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleToggleFactory = (factoryId: string) => {
    setSelectedFactories(prev =>
      prev.includes(factoryId)
        ? prev.filter(id => id !== factoryId)
        : [...prev, factoryId]
    );
  };

  // For auto-generate, skip scope step
  const activeSteps = useMemo(() => {
    if (isAutoGenerate) {
      return steps.filter(s => s.id !== 'scope');
    }
    return steps;
  }, [isAutoGenerate]);

  const currentStepIndex = activeSteps.findIndex(s => s.id === currentStep);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'trigger':
        if (triggerType === 'BY_MANUFACTURER') {
          return selectedWarehouseId && selectedManufacturerId;
        }
        return selectedWarehouseId;
      case 'basic':
        if (isAutoGenerate) {
          return selectedWarehouseId; // Name will be auto-generated
        }
        return name.trim() && selectedWarehouseId;
      case 'scope':
        return true; // Scope is optional
      case 'schedule':
        return scheduledDate;
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, name, selectedWarehouseId, scheduledDate, triggerType, isAutoGenerate, selectedManufacturerId]);

  const handleNext = () => {
    if (!canProceed()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeSteps.length) {
      setCurrentStep(activeSteps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(activeSteps[prevIndex].id);
    }
  };

  const handleSubmit = useCallback(() => {
    let newCycleCount;

    if (isAutoGenerate) {
      // Use auto-generate function
      newCycleCount = autoGenerateCycleCount({
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouse?.name || '',
        triggerType,
        excludeRecentlyCountedDays: 60,
        quantityThreshold: triggerType === 'LOW_QUANTITY' ? quantityThreshold : undefined,
        manufacturerId: triggerType === 'BY_MANUFACTURER' ? selectedManufacturerId : undefined,
        sampleSize: triggerType === 'RANDOM_A_ITEMS' ? sampleSize : undefined,
        createdBy: 'Current User',
      });

      // Override with user-provided values if any
      if (name.trim()) newCycleCount.name = name;
      if (description.trim()) newCycleCount.description = description;
      if (assignedTo) {
        newCycleCount.assignedTo = assignedTo;
        newCycleCount.assignedToName = assignedTo === 'user-003' ? 'Mike Johnson' : assignedTo === 'user-004' ? 'Lisa Anderson' : undefined;
      }
      if (dueDate) newCycleCount.dueDate = new Date(dueDate).toISOString();
      if (notes) newCycleCount.notes = notes;
    } else {
      // Manual creation
      const scope: { sections?: string[]; products?: string[]; factories?: string[]; abcClass?: 'A' | 'B' | 'C' } = {};
      if (selectedSections.length > 0) scope.sections = selectedSections;
      if (selectedProducts.length > 0) scope.products = selectedProducts;
      if (selectedFactories.length > 0) scope.factories = selectedFactories;
      if (abcClass) scope.abcClass = abcClass;

      newCycleCount = addCycleCount({
        name,
        description: description || undefined,
        type,
        priority,
        status: 'DRAFT',
        triggerType,
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouse?.name || '',
        scope,
        scheduledDate: new Date(scheduledDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assignedTo: assignedTo || undefined,
        assignedToName: assignedTo === 'user-003' ? 'Mike Johnson' : assignedTo === 'user-004' ? 'Lisa Anderson' : undefined,
        lineItems: [],
        totalItems: 0,
        countedItems: 0,
        itemsWithVariance: 0,
        notes: notes || undefined,
        createdBy: 'Current User',
      });
    }

    router.push(`/warehouse/cycle-counts/${newCycleCount.id}`);
  }, [
    name, description, type, priority, selectedWarehouseId, selectedWarehouse,
    scheduledDate, dueDate, assignedTo, notes,
    selectedSections, selectedProducts, selectedFactories, abcClass, router,
    isAutoGenerate, triggerType, quantityThreshold, selectedManufacturerId, sampleSize
  ]);

  const getStepStatus = (stepId: StepId) => {
    const stepIndex = activeSteps.findIndex(s => s.id === stepId);
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-4">
          <Link
            href="/warehouse/cycle-counts"
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">New Cycle Count</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Create a new inventory cycle count
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {activeSteps.map((step, index) => {
            const status = getStepStatus(step.id);
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (status === 'completed') {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={status === 'upcoming'}
                  className={`flex items-center gap-3 ${status === 'upcoming' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'current' ? 'bg-[var(--primary)] text-white' :
                    'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}>
                    {status === 'completed' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">{step.description}</div>
                  </div>
                </button>
                {index < activeSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    getStepStatus(activeSteps[index + 1].id) !== 'upcoming' ? 'bg-green-500' : 'bg-[var(--border)]'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Step 0: Trigger Type Selection */}
          {currentStep === 'trigger' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">How do you want to create this count?</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Choose a creation method. Auto-generate options will exclude items counted in the last 60 days.
              </p>

              {/* Warehouse Selection - Required for all */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manual Selection */}
                <button
                  type="button"
                  onClick={() => setTriggerType('MANUAL')}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    triggerType === 'MANUAL'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${triggerType === 'MANUAL' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {triggerTypeIcons.MANUAL}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{cycleCountTriggerTypeLabels.MANUAL}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{cycleCountTriggerTypeDescriptions.MANUAL}</div>
                    </div>
                  </div>
                </button>

                {/* Fast-Moving Items */}
                <button
                  type="button"
                  onClick={() => setTriggerType('FAST_MOVING')}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    triggerType === 'FAST_MOVING'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${triggerType === 'FAST_MOVING' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {triggerTypeIcons.FAST_MOVING}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{cycleCountTriggerTypeLabels.FAST_MOVING}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{cycleCountTriggerTypeDescriptions.FAST_MOVING}</div>
                      <div className="text-xs text-[var(--primary)] mt-2 font-medium">{eligibleItemsPreview.fastMoving} items eligible</div>
                    </div>
                  </div>
                </button>

                {/* Random A-Items */}
                <button
                  type="button"
                  onClick={() => setTriggerType('RANDOM_A_ITEMS')}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    triggerType === 'RANDOM_A_ITEMS'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${triggerType === 'RANDOM_A_ITEMS' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {triggerTypeIcons.RANDOM_A_ITEMS}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{cycleCountTriggerTypeLabels.RANDOM_A_ITEMS}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{cycleCountTriggerTypeDescriptions.RANDOM_A_ITEMS}</div>
                      <div className="text-xs text-[var(--primary)] mt-2 font-medium">{eligibleItemsPreview.aItems} A-items eligible</div>
                    </div>
                  </div>
                </button>

                {/* On Demand */}
                <button
                  type="button"
                  onClick={() => setTriggerType('ON_DEMAND')}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    triggerType === 'ON_DEMAND'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${triggerType === 'ON_DEMAND' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {triggerTypeIcons.ON_DEMAND}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{cycleCountTriggerTypeLabels.ON_DEMAND}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{cycleCountTriggerTypeDescriptions.ON_DEMAND}</div>
                      <div className="text-xs text-[var(--primary)] mt-2 font-medium">{eligibleItemsPreview.onDemand} items ready</div>
                    </div>
                  </div>
                </button>

                {/* By Manufacturer */}
                <button
                  type="button"
                  onClick={() => setTriggerType('BY_MANUFACTURER')}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    triggerType === 'BY_MANUFACTURER'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${triggerType === 'BY_MANUFACTURER' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {triggerTypeIcons.BY_MANUFACTURER}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{cycleCountTriggerTypeLabels.BY_MANUFACTURER}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{cycleCountTriggerTypeDescriptions.BY_MANUFACTURER}</div>
                    </div>
                  </div>
                </button>

                {/* Low Quantity */}
                <button
                  type="button"
                  onClick={() => setTriggerType('LOW_QUANTITY')}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    triggerType === 'LOW_QUANTITY'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${triggerType === 'LOW_QUANTITY' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {triggerTypeIcons.LOW_QUANTITY}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{cycleCountTriggerTypeLabels.LOW_QUANTITY}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{cycleCountTriggerTypeDescriptions.LOW_QUANTITY}</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Additional Options for Specific Triggers */}
              {triggerType === 'BY_MANUFACTURER' && (
                <div className="mt-6 p-4 bg-[var(--muted)]/50 rounded-lg">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Select Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedManufacturerId}
                    onChange={(e) => setSelectedManufacturerId(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    <option value="">Select a manufacturer...</option>
                    {factories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  {selectedManufacturerId && (
                    <p className="mt-2 text-xs text-[var(--primary)]">
                      {eligibleItemsPreview.byManufacturer} items eligible for counting
                    </p>
                  )}
                </div>
              )}

              {triggerType === 'LOW_QUANTITY' && (
                <div className="mt-6 p-4 bg-[var(--muted)]/50 rounded-lg">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Quantity Threshold
                  </label>
                  <input
                    type="number"
                    value={quantityThreshold}
                    onChange={(e) => setQuantityThreshold(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Count items with total quantity below this threshold
                  </p>
                  <p className="mt-1 text-xs text-[var(--primary)]">
                    {eligibleItemsPreview.lowQuantity} items below threshold
                  </p>
                </div>
              )}

              {triggerType === 'RANDOM_A_ITEMS' && (
                <div className="mt-6 p-4 bg-[var(--muted)]/50 rounded-lg">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Sample Size
                  </label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(parseInt(e.target.value) || 10)}
                    min={1}
                    max={50}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Number of random A-items to include (max: {eligibleItemsPreview.aItems})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 'basic' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Monthly Full Count - December"
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Count Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as CycleCountType)}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      {(Object.keys(cycleCountTypeLabels) as CycleCountType[]).map(t => (
                        <option key={t} value={t}>{cycleCountTypeLabels[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Priority
                  </label>
                  <div className="flex gap-3">
                    {(Object.keys(cycleCountPriorityLabels) as CycleCountPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                          priority === p
                            ? p === 'high' ? 'bg-red-100 text-red-700 border-2 border-red-500' :
                              p === 'medium' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500' :
                              'bg-green-100 text-green-700 border-2 border-green-500'
                            : 'bg-[var(--muted)] text-[var(--foreground)] border-2 border-transparent hover:border-[var(--border)]'
                        }`}
                      >
                        {cycleCountPriorityLabels[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Scope */}
          {currentStep === 'scope' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Count Scope</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Define what should be included in this cycle count. Leave empty for a full warehouse count.
              </p>

              <div className="space-y-6">
                {/* Sections */}
                {type === 'PARTIAL' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                      Warehouse Sections
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sections.map(section => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => handleToggleSection(section.id)}
                          className={`p-4 rounded-lg text-left transition-colors border-2 ${
                            selectedSections.includes(section.id)
                              ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-[var(--muted)] border-transparent text-[var(--foreground)] hover:border-[var(--border)]'
                          }`}
                        >
                          <div className="font-medium">{section.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">
                            {section.description || 'No description'}
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedSections.length > 0 && (
                      <p className="mt-2 text-sm text-[var(--primary)]">
                        {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                {/* ABC Classification */}
                {type === 'ABC' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                      ABC Classification
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['A', 'B', 'C'] as const).map(cls => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setAbcClass(abcClass === cls ? '' : cls)}
                          className={`p-6 rounded-lg text-center transition-colors border-2 ${
                            abcClass === cls
                              ? 'bg-[var(--primary)]/10 border-[var(--primary)]'
                              : 'bg-[var(--muted)] border-transparent hover:border-[var(--border)]'
                          }`}
                        >
                          <div className="text-2xl font-bold text-[var(--foreground)]">{cls}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">
                            {cls === 'A' ? 'High Value' : cls === 'B' ? 'Medium Value' : 'Low Value'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {type === 'PRODUCT' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                      Specific Products
                    </label>
                    <div className="relative mb-3">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Search for products to add..."
                        className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-auto">
                          {filteredProducts.map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleAddProduct(product.productId)}
                              className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] text-sm border-b border-[var(--border)] last:border-0"
                            >
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{product.partNumber}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedProducts.length > 0 && (
                      <div className="space-y-2">
                        {selectedProducts.map(productId => {
                          const product = mockInventory.find(p => p.productId === productId);
                          return (
                            <div
                              key={productId}
                              className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg"
                            >
                              <div>
                                <div className="font-medium text-sm">{product?.productName}</div>
                                <div className="text-xs text-[var(--muted-foreground)]">{product?.partNumber}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(productId)}
                                className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Manufacturers */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                    Manufacturers (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {factories.map(factory => (
                      <button
                        key={factory.id}
                        type="button"
                        onClick={() => handleToggleFactory(factory.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedFactories.includes(factory.id)
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                      >
                        {factory.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 'schedule' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Schedule & Assignment</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Scheduled Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={scheduledDate}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Assign To
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    <option value="">Unassigned - Assign later</option>
                    <option value="user-003">Mike Johnson</option>
                    <option value="user-004">Lisa Anderson</option>
                  </select>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    You can assign someone later if needed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Notes / Instructions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions for this cycle count..."
                    rows={4}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Review Cycle Count</h2>
                <p className="text-sm text-[var(--muted-foreground)] mb-6">
                  Please review the details below before creating the cycle count.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Name</div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">{name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Type</div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">{cycleCountTypeLabels[type]}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Warehouse</div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">{selectedWarehouse?.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Priority</div>
                      <div className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        priority === 'high' ? 'bg-red-100 text-red-700' :
                        priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {cycleCountPriorityLabels[priority]}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Scheduled Date</div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">
                        {new Date(scheduledDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Assigned To</div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">
                        {assignedTo === 'user-003' ? 'Mike Johnson' :
                         assignedTo === 'user-004' ? 'Lisa Anderson' : 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  {description && (
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Description</div>
                      <div className="mt-1 text-sm text-[var(--foreground)]">{description}</div>
                    </div>
                  )}

                  {/* Scope Summary */}
                  <div className="pt-4 border-t border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Scope</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSections.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {selectedSections.length} Section{selectedSections.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {selectedProducts.length > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {selectedFactories.length > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {selectedFactories.length} Manufacturer{selectedFactories.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {abcClass && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          Class {abcClass}
                        </span>
                      )}
                      {selectedSections.length === 0 && selectedProducts.length === 0 &&
                       selectedFactories.length === 0 && !abcClass && (
                        <span className="text-sm text-[var(--muted-foreground)]">Full warehouse count</span>
                      )}
                    </div>
                  </div>

                  {notes && (
                    <div className="pt-4 border-t border-[var(--border)]">
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Notes</div>
                      <div className="mt-1 text-sm text-[var(--foreground)]">{notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-800">What happens next?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      After creating the cycle count, it will be in Draft status. You can then generate the count items
                      based on the scope you&apos;ve defined, assign it to a worker, and start the counting process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/warehouse/cycle-counts"
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </Link>

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 14l2 2 4-4"/>
                </svg>
                Create Cycle Count
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
