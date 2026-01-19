/**
 * Save Prompt Modal Component
 * Modal for saving a prompt as a template
 */

'use client';

import React from 'react';

interface SavePromptModalProps {
  isOpen: boolean;
  promptInstructions: string;
  savePromptName: string;
  savePromptDescription: string;
  isSavingPrompt: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function SavePromptModal({
  isOpen,
  promptInstructions,
  savePromptName,
  savePromptDescription,
  isSavingPrompt,
  onNameChange,
  onDescriptionChange,
  onSave,
  onClose,
}: SavePromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Save as Prompt</h3>
          <p className="text-sm text-gray-500 mt-1">Save this prompt to reuse it later</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={savePromptName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., LED Driver Cross Search"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={savePromptDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description of what this prompt does"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-24 overflow-y-auto">
              {promptInstructions}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSavingPrompt}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!savePromptName.trim() || isSavingPrompt}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSavingPrompt && <LoadingSpinner />}
            {isSavingPrompt ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
