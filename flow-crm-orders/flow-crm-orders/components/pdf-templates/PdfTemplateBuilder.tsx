'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PdfTemplate, PdfModule, TemplateType, ModuleType, GlobalStyles } from '../../lib/types/pdf-templates';
import { moduleTypeLabels, templateTypeLabels, defaultGlobalStyles } from '../../lib/types/pdf-templates';
import { modulePaletteItems, getModulesForType } from '../../lib/data/pdf-templates-mock';
import BuilderCanvas from './BuilderCanvas';
import ModulePalette from './ModulePalette';
import ModuleEditor from './ModuleEditor';

interface PdfTemplateBuilderProps {
  template?: PdfTemplate;
  onSave: (template: PdfTemplate) => void;
  onCancel: () => void;
}

export default function PdfTemplateBuilder({
  template,
  onSave,
  onCancel,
}: PdfTemplateBuilderProps) {
  // Template state
  const [templateName, setTemplateName] = useState(template?.name || 'New Template');
  const [templateType, setTemplateType] = useState<TemplateType>(template?.type || 'quote');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [modules, setModules] = useState<PdfModule[]>(template?.modules || []);
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(template?.globalStyles || defaultGlobalStyles);

  // UI state
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showGlobalStyles, setShowGlobalStyles] = useState(false);

  // Available modules for current template type
  const availableModules = useMemo(() => getModulesForType(templateType), [templateType]);

  // Get selected module
  const selectedModule = useMemo(
    () => modules.find(m => m.id === selectedModuleId),
    [modules, selectedModuleId]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging from palette (new module)
    if (activeId.startsWith('palette-')) {
      const moduleType = activeId.replace('palette-', '') as ModuleType;
      const paletteItem = modulePaletteItems.find(m => m.type === moduleType);

      if (paletteItem) {
        const newModule: PdfModule = {
          id: `${moduleType}-${Date.now()}`,
          type: moduleType,
          position: modules.length,
          config: { ...paletteItem.defaultConfig },
        };

        // Insert at drop position
        if (overId === 'canvas-drop-zone') {
          setModules(prev => [...prev, newModule]);
        } else {
          const overIndex = modules.findIndex(m => m.id === overId);
          if (overIndex >= 0) {
            setModules(prev => {
              const newModules = [...prev];
              newModules.splice(overIndex, 0, newModule);
              return newModules.map((m, i) => ({ ...m, position: i }));
            });
          } else {
            setModules(prev => [...prev, newModule]);
          }
        }

        setSelectedModuleId(newModule.id);
      }
    } else {
      // Reordering existing modules
      const oldIndex = modules.findIndex(m => m.id === activeId);
      const newIndex = modules.findIndex(m => m.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setModules(prev => {
          const newModules = arrayMove(prev, oldIndex, newIndex);
          return newModules.map((m, i) => ({ ...m, position: i }));
        });
      }
    }
  }, [modules]);

  // Update module config
  const handleUpdateModule = useCallback((moduleId: string, config: PdfModule['config']) => {
    setModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, config } : m
    ));
  }, []);

  // Delete module
  const handleDeleteModule = useCallback((moduleId: string) => {
    setModules(prev => {
      const newModules = prev.filter(m => m.id !== moduleId);
      return newModules.map((m, i) => ({ ...m, position: i }));
    });
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
    }
  }, [selectedModuleId]);

  // Duplicate module
  const handleDuplicateModule = useCallback((moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      const newModule: PdfModule = {
        ...module,
        id: `${module.type}-${Date.now()}`,
        position: module.position + 1,
      };
      setModules(prev => {
        const index = prev.findIndex(m => m.id === moduleId);
        const newModules = [...prev];
        newModules.splice(index + 1, 0, newModule);
        return newModules.map((m, i) => ({ ...m, position: i }));
      });
      setSelectedModuleId(newModule.id);
    }
  }, [modules]);

  // Save template
  const handleSave = useCallback(() => {
    const newTemplate: PdfTemplate = {
      id: template?.id || `template-${Date.now()}`,
      name: templateName,
      type: templateType,
      description: templateDescription,
      isDefault: template?.isDefault || false,
      isSystem: false,
      modules,
      globalStyles,
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: template?.createdBy || 'Current User',
    };
    onSave(newTemplate);
  }, [template, templateName, templateType, templateDescription, modules, globalStyles, onSave]);

  // Get active item for drag overlay
  const activeModule = activeId ? modules.find(m => m.id === activeId) : null;
  const activePaletteItem = activeId?.startsWith('palette-')
    ? modulePaletteItems.find(m => `palette-${m.type}` === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-[var(--background)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--foreground)]"
                placeholder="Template Name"
              />
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                className="px-2 py-1 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                {(['quote', 'order', 'invoice', 'submittal', 'check', 'credit'] as TemplateType[]).map(type => (
                  <option key={type} value={type}>{templateTypeLabels[type]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGlobalStyles(!showGlobalStyles)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showGlobalStyles
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
              </svg>
              Styles
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Save Template
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Module Palette (Left) */}
          <div className="w-64 border-r border-[var(--border)] bg-[var(--card)] overflow-auto">
            <ModulePalette
              availableModules={availableModules}
              templateType={templateType}
            />
          </div>

          {/* Canvas (Center) */}
          <div className="flex-1 overflow-auto">
            <BuilderCanvas
              modules={modules}
              globalStyles={globalStyles}
              selectedModuleId={selectedModuleId}
              onSelectModule={setSelectedModuleId}
              onDeleteModule={handleDeleteModule}
              onDuplicateModule={handleDuplicateModule}
            />
          </div>

          {/* Module Editor (Right) */}
          <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] overflow-auto">
            {showGlobalStyles ? (
              <GlobalStylesEditor
                styles={globalStyles}
                onChange={setGlobalStyles}
              />
            ) : selectedModule ? (
              <ModuleEditor
                module={selectedModule}
                onChange={(config) => handleUpdateModule(selectedModule.id, config)}
                onDelete={() => handleDeleteModule(selectedModule.id)}
                onDuplicate={() => handleDuplicateModule(selectedModule.id)}
              />
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <path d="M12 3v18M3 12h18"/>
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Select a module to edit its properties, or drag a new module from the palette.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeModule && (
          <div className="bg-[var(--card)] border-2 border-[var(--primary)] rounded-lg p-3 shadow-xl opacity-90">
            <span className="text-sm font-medium">{moduleTypeLabels[activeModule.type]}</span>
          </div>
        )}
        {activePaletteItem && (
          <div className="bg-[var(--card)] border-2 border-[var(--primary)] rounded-lg p-3 shadow-xl opacity-90">
            <span className="text-sm font-medium">{activePaletteItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Global Styles Editor Component
function GlobalStylesEditor({
  styles,
  onChange,
}: {
  styles: GlobalStyles;
  onChange: (styles: GlobalStyles) => void;
}) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Global Styles</h3>

      <div className="space-y-4">
        {/* Colors */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={styles.primaryColor}
              onChange={(e) => onChange({ ...styles, primaryColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={styles.primaryColor}
              onChange={(e) => onChange({ ...styles, primaryColor: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={styles.secondaryColor}
              onChange={(e) => onChange({ ...styles, secondaryColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={styles.secondaryColor}
              onChange={(e) => onChange({ ...styles, secondaryColor: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
            />
          </div>
        </div>

        {/* Font */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Font Family</label>
          <select
            value={styles.fontFamily}
            onChange={(e) => onChange({ ...styles, fontFamily: e.target.value as GlobalStyles['fontFamily'] })}
            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
          >
            <option value="helvetica">Helvetica</option>
            <option value="times">Times</option>
            <option value="courier">Courier</option>
          </select>
        </div>

        {/* Font Sizes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Header Size</label>
            <input
              type="number"
              value={styles.headerFontSize}
              onChange={(e) => onChange({ ...styles, headerFontSize: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Body Size</label>
            <input
              type="number"
              value={styles.bodyFontSize}
              onChange={(e) => onChange({ ...styles, bodyFontSize: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
        </div>

        {/* Page Margins */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2">Page Margins (mm)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)]">Top</label>
              <input
                type="number"
                value={styles.pageMargins.top}
                onChange={(e) => onChange({ ...styles, pageMargins: { ...styles.pageMargins, top: Number(e.target.value) } })}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)]">Bottom</label>
              <input
                type="number"
                value={styles.pageMargins.bottom}
                onChange={(e) => onChange({ ...styles, pageMargins: { ...styles.pageMargins, bottom: Number(e.target.value) } })}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
              <input
                type="number"
                value={styles.pageMargins.left}
                onChange={(e) => onChange({ ...styles, pageMargins: { ...styles.pageMargins, left: Number(e.target.value) } })}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
              <input
                type="number"
                value={styles.pageMargins.right}
                onChange={(e) => onChange({ ...styles, pageMargins: { ...styles.pageMargins, right: Number(e.target.value) } })}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
