'use client';

import React, { useState, useMemo } from 'react';
import { mockEmailTemplates, duplicateTemplate } from '../../lib/data/email-templates-mock';
import type { EmailTemplate, EmailTemplateCategory, EmailTemplateTag } from '../../lib/types/email-templates';
import { categoryLabels, categoryColors, tagLabels, tagColors } from '../../lib/types/email-templates';
import EmailTemplateEditor from './EmailTemplateEditor';

type ViewMode = 'grid' | 'list';
type FilterScope = 'all' | 'global' | 'personal';

const allCategories: EmailTemplateCategory[] = ['crm', 'quotes', 'orders', 'invoices', 'warehouse', 'shipping', 'follow-up', 'internal'];
const allTags: EmailTemplateTag[] = [
  'new-customer', 'existing-customer', 'manufacturer', 'distributor', 'contractor',
  'internal-team', 'urgent', 'reminder', 'confirmation', 'request', 'notification',
  'thank-you', 'follow-up', 'approval', 'rejection', 'status-update'
];

export default function EmailTemplatesContent() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<EmailTemplateCategory | 'all'>('all');
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [selectedTags, setSelectedTags] = useState<EmailTemplateTag[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplateCategory, setNewTemplateCategory] = useState<EmailTemplateCategory | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;

      // Scope filter
      const matchesScope = filterScope === 'all' || template.scope === filterScope;

      // Tags filter
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => template.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesScope && matchesTags;
    });
  }, [templates, searchQuery, filterCategory, filterScope, selectedTags]);

  // Group templates by category for display
  const templatesByCategory = useMemo(() => {
    const grouped: Record<EmailTemplateCategory, EmailTemplate[]> = {
      crm: [],
      quotes: [],
      orders: [],
      invoices: [],
      warehouse: [],
      shipping: [],
      'follow-up': [],
      internal: [],
    };
    filteredTemplates.forEach(t => {
      grouped[t.category].push(t);
    });
    return grouped;
  }, [filteredTemplates]);

  // Count templates per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    allCategories.forEach(cat => {
      counts[cat] = templates.filter(t => t.category === cat).length;
    });
    return counts;
  }, [templates]);

  const handleDuplicate = (template: EmailTemplate) => {
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
      if (t.category === template.category) {
        return { ...t, isDefault: t.id === templateId };
      }
      return t;
    }));
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleCreateNew = (category?: EmailTemplateCategory) => {
    setEditingTemplate(null);
    setNewTemplateCategory(category || null);
    setShowEditor(true);
  };

  const handleSaveTemplate = (savedTemplate: EmailTemplate) => {
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
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const toggleTag = (tag: EmailTemplateTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterScope('all');
    setSelectedTags([]);
  };

  if (showEditor) {
    return (
      <EmailTemplateEditor
        template={editingTemplate || undefined}
        defaultCategory={newTemplateCategory || undefined}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(null);
          setNewTemplateCategory(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Email Templates</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage email templates for quotes, orders, warehouse operations, and more
          </p>
        </div>
        <button
          onClick={() => handleCreateNew()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Create Template
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between">
          {/* Search and Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
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
                className="pl-9 pr-4 py-2 w-64 text-sm border border-[var(--border)] rounded-lg bg-white dark:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as EmailTemplateCategory | 'all')}
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-white dark:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="all">All Categories ({categoryCounts.all})</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]} ({categoryCounts[cat]})
                </option>
              ))}
            </select>

            {/* Scope Filter */}
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value as FilterScope)}
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-white dark:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="all">All Templates</option>
              <option value="global">Global Templates</option>
              <option value="personal">My Templates</option>
            </select>

            {/* Tags Filter Button */}
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                selectedTags.length > 0
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'border-[var(--border)] bg-white dark:bg-[var(--card)] hover:bg-gray-50 dark:hover:bg-[var(--muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showTagFilter ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Clear Filters */}
            {(searchQuery || filterCategory !== 'all' || filterScope !== 'all' || selectedTags.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-[var(--card)] shadow-sm' : 'hover:bg-[var(--card)]/50'}`}
              title="Grid View"
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
              title="List View"
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

        {/* Tags Filter Panel */}
        {showTagFilter && (
          <div className="flex flex-wrap gap-2 p-3 bg-[var(--muted)]/50 rounded-lg">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedTags.includes(tag)
                    ? tagColors[tag]
                    : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                {tagLabels[tag]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-[var(--muted)] rounded-xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No templates found</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {searchQuery || filterCategory !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first template.'}
            </p>
            <button
              onClick={() => handleCreateNew()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Create Template
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View - Grouped by Category
          <div className="space-y-8">
            {allCategories.map(category => {
              const categoryTemplates = templatesByCategory[category];
              if (categoryTemplates.length === 0) return null;

              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-lg ${categoryColors[category]}`}>
                      {categoryLabels[category]}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => handleCreateNew(category)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-md transition-colors"
                      title={`Add ${categoryLabels[category]} template`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                      </svg>
                      Add
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryTemplates.map(template => (
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
                </div>
              );
            })}
          </div>
        ) : (
          // List View
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
  template: EmailTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Header with title, badges, and menu */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--foreground)] truncate">{template.name}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
              {template.scope === 'personal' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                  Personal
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
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
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1">
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
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map(tag => (
              <span key={tag} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${tagColors[tag]}`}>
                {tagLabels[tag]}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Attachments indicator */}
        {template.attachments.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-[var(--muted-foreground)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
            {template.attachments.length} attachment{template.attachments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Preview Area - email content preview */}
      <div
        className="p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={onEdit}
      >
        <div className="text-xs text-[var(--muted-foreground)] mb-1">
          Subject:
        </div>
        <div className="text-sm font-medium text-[var(--foreground)] line-clamp-2 mb-2">
          {template.subject}
        </div>
        <div
          className="text-xs text-[var(--muted-foreground)] line-clamp-3"
          dangerouslySetInnerHTML={{
            __html: template.body.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...'
          }}
        />
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
  template: EmailTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-[var(--foreground)] truncate">{template.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[template.category]}`}>
              {categoryLabels[template.category]}
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
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
            {template.subject}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Tags */}
        <div className="hidden lg:flex items-center gap-1">
          {template.tags.slice(0, 2).map(tag => (
            <span key={tag} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${tagColors[tag]}`}>
              {tagLabels[tag]}
            </span>
          ))}
          {template.tags.length > 2 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
              +{template.tags.length - 2}
            </span>
          )}
        </div>

        {/* Attachments */}
        {template.attachments.length > 0 && (
          <div className="hidden md:flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
            {template.attachments.length}
          </div>
        )}

        {/* Menu */}
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
