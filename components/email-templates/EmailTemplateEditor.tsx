'use client';

import React, { useState, useMemo } from 'react';
import type {
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateTag,
  TemplateVariable,
  TemplateAttachment,
  AttachmentType,
  TemplateScope,
} from '../../lib/types/email-templates';
import {
  categoryLabels,
  tagLabels,
  tagColors,
  attachmentTypeLabels,
  commonVariables,
  insertVariable,
  extractVariables,
} from '../../lib/types/email-templates';

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  defaultCategory?: EmailTemplateCategory;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
}

const allCategories: EmailTemplateCategory[] = ['crm', 'quotes', 'orders', 'invoices', 'warehouse', 'shipping', 'follow-up', 'internal'];
const allTags: EmailTemplateTag[] = [
  'new-customer', 'existing-customer', 'manufacturer', 'distributor', 'contractor',
  'internal-team', 'urgent', 'reminder', 'confirmation', 'request', 'notification',
  'thank-you', 'follow-up', 'approval', 'rejection', 'status-update'
];
const attachmentTypes: AttachmentType[] = [
  'quote-pdf', 'order-confirmation-pdf', 'invoice-pdf', 'packing-slip-pdf',
  'pick-list-pdf', 'shipping-label-pdf', 'bill-of-lading', 'signed-bill-of-lading',
  'proof-of-delivery', 'spec-sheet', 'submittal', 'credit-memo-pdf',
  'commission-statement-pdf', 'custom'
];

type EditorTab = 'content' | 'variables' | 'attachments' | 'preview';

export default function EmailTemplateEditor({ template, defaultCategory, onSave, onCancel }: EmailTemplateEditorProps) {
  const isEditing = !!template;

  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<EmailTemplateCategory>(template?.category || defaultCategory || 'crm');
  const [selectedTags, setSelectedTags] = useState<EmailTemplateTag[]>(template?.tags || []);
  const [scope, setScope] = useState<TemplateScope>(template?.scope || 'global');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [attachments, setAttachments] = useState<TemplateAttachment[]>(template?.attachments || []);

  // UI state
  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [variablePickerTarget, setVariablePickerTarget] = useState<'subject' | 'body'>('body');

  // Preview state
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});

  // Detect used variables from content
  const usedVariables = useMemo(() => {
    const subjectVars = extractVariables(subject);
    const bodyVars = extractVariables(body);
    return [...new Set([...subjectVars, ...bodyVars])];
  }, [subject, body]);

  // Get all available variables grouped by source
  const variableGroups = useMemo(() => {
    return Object.entries(commonVariables).map(([source, vars]) => ({
      source,
      label: source.charAt(0).toUpperCase() + source.slice(1),
      variables: vars,
    }));
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name.');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter an email subject.');
      return;
    }
    if (!body.trim()) {
      alert('Please enter email body content.');
      return;
    }

    // Build variables list from used variables
    const variables: TemplateVariable[] = usedVariables.map(key => {
      // Find variable definition from common variables
      for (const group of Object.values(commonVariables)) {
        const found = group.find(v => v.key === key);
        if (found) return found;
      }
      // If not found, create a custom variable
      return {
        key,
        label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        type: 'text' as const,
        required: false,
      };
    });

    const savedTemplate: EmailTemplate = {
      id: template?.id || `ET-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      tags: selectedTags,
      scope,
      subject: subject.trim(),
      body: body.trim(),
      variables,
      attachments,
      isSystem: template?.isSystem || false,
      isDefault: template?.isDefault || false,
      isActive: template?.isActive ?? true,
      createdBy: template?.createdBy || 'current-user',
      createdByName: template?.createdByName || 'Current User',
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: template?.usageCount || 0,
    };

    onSave(savedTemplate);
  };

  const toggleTag = (tag: EmailTemplateTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const insertVariableAtCursor = (variable: TemplateVariable) => {
    const placeholder = insertVariable(variable.key);
    if (variablePickerTarget === 'subject') {
      setSubject(prev => prev + placeholder);
    } else {
      setBody(prev => prev + placeholder);
    }
    setShowVariablePicker(false);
  };

  const addAttachment = (type: AttachmentType) => {
    const newAttachment: TemplateAttachment = {
      id: `att-${Date.now()}`,
      type,
      label: attachmentTypeLabels[type],
      required: false,
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const toggleAttachmentRequired = (id: string) => {
    setAttachments(prev => prev.map(a =>
      a.id === id ? { ...a, required: !a.required } : a
    ));
  };

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    let html = body;
    usedVariables.forEach(key => {
      const value = previewValues[key] || `[${key}]`;
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return html;
  }, [body, usedVariables, previewValues]);

  const previewSubject = useMemo(() => {
    let text = subject;
    usedVariables.forEach(key => {
      const value = previewValues[key] || `[${key}]`;
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return text;
  }, [subject, usedVariables, previewValues]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              {isEditing ? 'Edit Template' : 'Create Template'}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isEditing ? `Editing: ${template.name}` : 'Create a new email template'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border)] bg-[var(--card)]">
        {(['content', 'variables', 'attachments', 'preview'] as EditorTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'content' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-[var(--foreground)]">Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Quote Submission"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EmailTemplateCategory)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of when to use this template"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as TemplateScope)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    <option value="global">Global (visible to all)</option>
                    <option value="personal">Personal (only you)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? tagColors[tag]
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                      }`}
                    >
                      {tagLabels[tag]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Email Content */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-[var(--foreground)]">Email Content</h2>
                <button
                  onClick={() => { setVariablePickerTarget('body'); setShowVariablePicker(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Insert Variable
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Subject Line *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Quote {{quote_number}} for {{job_name}}"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <button
                    onClick={() => { setVariablePickerTarget('subject'); setShowVariablePicker(true); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    title="Insert variable"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 7 4 4 20 4 20 7"/>
                      <line x1="9" y1="20" x2="15" y2="20"/>
                      <line x1="12" y1="4" x2="12" y2="20"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email Body *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="<p>Dear {{contact_name}},</p>&#10;&#10;<p>Your email content here...</p>"
                  rows={16}
                  className="w-full px-3 py-2 text-sm font-mono border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-y"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Use HTML formatting. Variables: {"{{variable_name}}"}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Variables Used in Template</h2>

              {usedVariables.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No variables detected. Add variables using {"{{variable_name}}"} syntax in your subject or body.
                </p>
              ) : (
                <div className="space-y-2">
                  {usedVariables.map(key => {
                    // Find variable definition
                    let variable: TemplateVariable | undefined;
                    for (const group of Object.values(commonVariables)) {
                      variable = group.find(v => v.key === key);
                      if (variable) break;
                    }

                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <code className="px-2 py-0.5 bg-[var(--muted)] rounded text-sm font-mono">
                            {`{{${key}}}`}
                          </code>
                          <span className="text-sm text-[var(--foreground)]">
                            {variable?.label || key}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {variable?.source && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                              {variable.source}
                            </span>
                          )}
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {variable?.type || 'text'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Available Variables</h2>
              <div className="space-y-6">
                {variableGroups.map(group => (
                  <div key={group.source}>
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-2 capitalize">
                      {group.label} Variables
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.variables.map(v => (
                        <button
                          key={v.key}
                          onClick={() => {
                            setBody(prev => prev + insertVariable(v.key));
                          }}
                          className="px-2 py-1 text-xs font-mono bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded transition-colors"
                          title={v.description || v.label}
                        >
                          {`{{${v.key}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Template Attachments</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Define which attachments should be included with this email template.
              </p>

              {attachments.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                  No attachments configured.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {att.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                          <input
                            type="checkbox"
                            checked={att.required}
                            onChange={() => toggleAttachmentRequired(att.id)}
                            className="rounded border-[var(--border)]"
                          />
                          Required
                        </label>
                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Add Attachment Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {attachmentTypes.map(type => {
                    const alreadyAdded = attachments.some(a => a.type === type);
                    return (
                      <button
                        key={type}
                        onClick={() => !alreadyAdded && addAttachment(type)}
                        disabled={alreadyAdded}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          alreadyAdded
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                      >
                        {attachmentTypeLabels[type]}
                        {alreadyAdded && ' ✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Preview Values */}
            {usedVariables.length > 0 && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Preview Values</h2>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Enter sample values to see how your email will look.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {usedVariables.map(key => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={previewValues[key] || ''}
                        onChange={(e) => setPreviewValues(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Enter ${key}`}
                        className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Preview */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Subject:</div>
                <div className="text-sm font-medium text-[var(--foreground)]">{previewSubject || '(No subject)'}</div>
              </div>
              <div className="p-6">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-gray-400">(No content)</p>' }}
                />
              </div>
              {attachments.length > 0 && (
                <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/50">
                  <div className="text-xs text-[var(--muted-foreground)] mb-2">Attachments:</div>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 px-2 py-1 bg-[var(--card)] border border-[var(--border)] rounded text-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                        {att.label}
                        {att.required && <span className="text-red-500">*</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variable Picker Modal */}
      {showVariablePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-medium text-[var(--foreground)]">Insert Variable</h3>
              <button
                onClick={() => setShowVariablePicker(false)}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {variableGroups.map(group => (
                <div key={group.source}>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-2 capitalize">
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {group.variables.map(v => (
                      <button
                        key={v.key}
                        onClick={() => insertVariableAtCursor(v)}
                        className="flex items-center justify-between p-2 text-left bg-[var(--muted)]/50 hover:bg-[var(--muted)] rounded-lg transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium text-[var(--foreground)]">{v.label}</div>
                          <code className="text-xs text-[var(--muted-foreground)]">{`{{${v.key}}}`}</code>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{v.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
