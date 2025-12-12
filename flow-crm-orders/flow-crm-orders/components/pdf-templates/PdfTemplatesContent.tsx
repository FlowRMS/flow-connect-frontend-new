'use client';

import React, { useState, useMemo } from 'react';
import { mockPdfTemplates, duplicateTemplate } from '../../lib/data/pdf-templates-mock';
import type { PdfTemplate, TemplateType } from '../../lib/types/pdf-templates';
import { templateTypeLabels, templateTypeColors } from '../../lib/types/pdf-templates';
import PdfTemplateBuilder from './PdfTemplateBuilder';

type ViewMode = 'grid' | 'list';

export default function PdfTemplatesContent() {
  const [templates, setTemplates] = useState<PdfTemplate[]>(mockPdfTemplates);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<TemplateType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PdfTemplate | null>(null);

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesType = filterType === 'all' || template.type === filterType;
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [templates, filterType, searchQuery]);

  const handleDuplicate = (template: PdfTemplate) => {
    const newTemplate = duplicateTemplate(template, `${template.name} (Copy)`);
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleDelete = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isSystem) {
      alert('System templates cannot be deleted.');
      return;
    }
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleSetDefault = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setTemplates(prev => prev.map(t => {
      if (t.type === template.type) {
        return { ...t, isDefault: t.id === templateId };
      }
      return t;
    }));
  };

  const handleEdit = (template: PdfTemplate) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowBuilder(true);
  };

  const templateTypes: (TemplateType | 'all')[] = ['all', 'quote', 'order', 'invoice', 'submittal', 'check', 'credit'];

  const handleSaveTemplate = (savedTemplate: PdfTemplate) => {
    setTemplates(prev => {
      const existingIndex = prev.findIndex(t => t.id === savedTemplate.id);
      if (existingIndex >= 0) {
        const newTemplates = [...prev];
        newTemplates[existingIndex] = savedTemplate;
        return newTemplates;
      } else {
        return [...prev, savedTemplate];
      }
    });
    setShowBuilder(false);
    setEditingTemplate(null);
  };

  if (showBuilder) {
    return (
      <PdfTemplateBuilder
        template={editingTemplate || undefined}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowBuilder(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">PDF Templates</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage templates for quotes, orders, invoices, and other documents
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Create Template
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TemplateType | 'all')}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            {templateTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : templateTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-[var(--card)] shadow-sm' : 'hover:bg-[var(--card)]/50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--card)] shadow-sm' : 'hover:bg-[var(--card)]/50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-[var(--muted)] rounded-xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No templates found</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filter.' : 'Get started by creating your first template.'}
            </p>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Create Template
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template)}
                onDuplicate={() => handleDuplicate(template)}
                onDelete={() => handleDelete(template.id)}
                onSetDefault={() => handleSetDefault(template.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <TemplateListItem
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template)}
                onDuplicate={() => handleDuplicate(template)}
                onDelete={() => handleDelete(template.id)}
                onSetDefault={() => handleSetDefault(template.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Template Card Component (Grid View)
function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: {
  template: PdfTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Preview Area */}
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
        <div className="absolute inset-4 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M16 13H8M16 17H8M10 9H8"/>
          </svg>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Edit Template
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--foreground)] truncate">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${templateTypeColors[template.type]}`}>
                {templateTypeLabels[template.type]}
              </span>
              {template.isDefault && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                  Default
                </span>
              )}
              {template.isSystem && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                  System
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { onDuplicate(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Duplicate
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => { onSetDefault(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                  {!template.isSystem && (
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {template.description && (
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{template.description}</p>
        )}
      </div>
    </div>
  );
}

// Template List Item Component (List View)
function TemplateListItem({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: {
  template: PdfTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--foreground)]">{template.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${templateTypeColors[template.type]}`}>
              {templateTypeLabels[template.type]}
            </span>
            {template.isDefault && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                Default
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{template.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">
          {template.modules.filter(m => m.config.visible).length} modules
        </span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onDuplicate(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Duplicate
                </button>
                {!template.isDefault && (
                  <button
                    onClick={() => { onSetDefault(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Set as Default
                  </button>
                )}
                {!template.isSystem && (
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
