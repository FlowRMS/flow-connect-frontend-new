/**
 * Templates Modal Component
 * Modal for browsing and selecting prompt templates
 */

'use client';

import React from 'react';
import type { CrossPromptTemplate } from '../../lib/graphql/product-crosses';

interface TemplatesModalProps {
  isOpen: boolean;
  templates: CrossPromptTemplate[];
  filteredTemplates: CrossPromptTemplate[];
  isLoadingTemplates: boolean;
  templateSearchQuery: string;
  deletingTemplateId: string | null;
  onSearchChange: (value: string) => void;
  onSelectTemplate: (template: CrossPromptTemplate) => void;
  onDeleteTemplate: (e: React.MouseEvent, templateId: string) => void;
  onClose: () => void;
}

export function TemplatesModal({
  isOpen,
  filteredTemplates,
  isLoadingTemplates,
  templateSearchQuery,
  deletingTemplateId,
  onSearchChange,
  onSelectTemplate,
  onDeleteTemplate,
  onClose,
}: TemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Prompt Templates</h3>
            <p className="text-sm text-gray-500">Browse and apply saved search prompt templates</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <input
            type="text"
            placeholder="Search templates..."
            value={templateSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4"
          />

          {isLoadingTemplates ? (
            <LoadingState />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState hasSearchQuery={!!templateSearchQuery} />
          ) : (
            <TemplatesList
              templates={filteredTemplates}
              deletingTemplateId={deletingTemplateId}
              onSelectTemplate={onSelectTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-12 text-center text-gray-500">
      <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading templates...
    </div>
  );
}

function EmptyState({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  return (
    <div className="py-12 text-center text-gray-500">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-gray-300">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0018 0V5" />
        <path d="M3 12a9 3 0 0018 0" />
      </svg>
      <p className="text-sm font-medium">No templates found</p>
      <p className="text-xs text-gray-400 mt-1">
        {hasSearchQuery ? 'Try a different search term' : 'Create your first template using "Save as Prompt"'}
      </p>
    </div>
  );
}

function TemplatesList({
  templates,
  deletingTemplateId,
  onSelectTemplate,
  onDeleteTemplate,
}: {
  templates: CrossPromptTemplate[];
  deletingTemplateId: string | null;
  onSelectTemplate: (template: CrossPromptTemplate) => void;
  onDeleteTemplate: (e: React.MouseEvent, templateId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Saved Templates</h4>
      {templates.map(template => (
        <div
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{template.name}</div>
              {template.description && (
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              )}
              <div className="text-xs text-gray-400 mt-2 line-clamp-2">{template.prompt}</div>
            </div>
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <div className="text-xs text-gray-400">Used {template.timesUsed} times</div>
              <button
                onClick={(e) => onDeleteTemplate(e, template.id)}
                disabled={deletingTemplateId === template.id}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete template"
              >
                {deletingTemplateId === template.id ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
