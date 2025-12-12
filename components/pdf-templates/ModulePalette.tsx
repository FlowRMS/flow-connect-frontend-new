'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ModulePaletteItem, TemplateType, ModuleType } from '../../lib/types/pdf-templates';

interface ModulePaletteProps {
  availableModules: ModulePaletteItem[];
  templateType: TemplateType;
}

// Icon mapping for module types
const moduleIcons: Record<ModuleType, React.ReactNode> = {
  'company-header': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 6h6M9 10h6M9 14h6M9 18h6"/>
    </svg>
  ),
  'document-title': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>
  ),
  'customer-info': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'job-info': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  'document-details': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
    </svg>
  ),
  'line-items-table': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  ),
  'pricing-summary': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  'totals-summary': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  'terms-conditions': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
  'notes': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
    </svg>
  ),
  'custom-text': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  'divider': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  'spacer': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h2M17 12h2"/>
    </svg>
  ),
  'footer': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 15h18"/>
    </svg>
  ),
  'transmittal-header': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  'stakeholder-list': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  'revision-history': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  'payment-info': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  'amount-due': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
};

export default function ModulePalette({ availableModules, templateType }: ModulePaletteProps) {
  // Group modules by category
  const layoutModules = availableModules.filter(m =>
    ['company-header', 'document-title', 'footer', 'divider', 'spacer'].includes(m.type)
  );
  const contentModules = availableModules.filter(m =>
    ['customer-info', 'job-info', 'document-details', 'line-items-table'].includes(m.type)
  );
  const summaryModules = availableModules.filter(m =>
    ['pricing-summary', 'totals-summary', 'amount-due', 'payment-info'].includes(m.type)
  );
  const textModules = availableModules.filter(m =>
    ['terms-conditions', 'notes', 'custom-text'].includes(m.type)
  );
  const otherModules = availableModules.filter(m =>
    ['transmittal-header', 'stakeholder-list', 'revision-history'].includes(m.type)
  );

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
        Modules
      </h3>

      <div className="space-y-4">
        {layoutModules.length > 0 && (
          <ModuleGroup title="Layout" modules={layoutModules} />
        )}
        {contentModules.length > 0 && (
          <ModuleGroup title="Content" modules={contentModules} />
        )}
        {summaryModules.length > 0 && (
          <ModuleGroup title="Summary" modules={summaryModules} />
        )}
        {textModules.length > 0 && (
          <ModuleGroup title="Text" modules={textModules} />
        )}
        {otherModules.length > 0 && (
          <ModuleGroup title="Other" modules={otherModules} />
        )}
      </div>
    </div>
  );
}

function ModuleGroup({ title, modules }: { title: string; modules: ModulePaletteItem[] }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">{title}</h4>
      <div className="space-y-1">
        {modules.map(module => (
          <DraggableModule key={module.type} module={module} />
        ))}
      </div>
    </div>
  );
}

function DraggableModule({ module }: { module: ModulePaletteItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${module.type}`,
    data: {
      type: 'palette-item',
      moduleType: module.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
        isDragging
          ? 'bg-[var(--primary)]/10 border border-[var(--primary)]'
          : 'hover:bg-[var(--muted)] border border-transparent'
      }`}
    >
      <div className="w-8 h-8 bg-[var(--muted)] rounded-lg flex items-center justify-center text-[var(--muted-foreground)]">
        {moduleIcons[module.type] || (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{module.name}</p>
        <p className="text-xs text-[var(--muted-foreground)] truncate">{module.description}</p>
      </div>
    </div>
  );
}
