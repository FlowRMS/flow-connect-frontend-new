/**
 * AI Generation Modal Component
 */

import React from 'react';
import type { AIContext } from '../types';

interface AIModalProps {
  show: boolean;
  context: AIContext;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}

export default function AIModal({
  show,
  context,
  prompt,
  onPromptChange,
  onGenerate,
  onClose,
}: AIModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {context === 'campaign' ? 'Generate Campaign with AI' : 'Generate Rule with AI'}
                </h2>
                <p className="text-sm text-gray-500">
                  Describe what you want to create and AI will build it for you
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {context === 'campaign'
              ? 'Describe your campaign goal and target audience'
              : 'Describe when this rule should trigger and what it should do'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={
              context === 'campaign'
                ? 'Example: Create a campaign to reach out to all electrical contractors in California who haven\'t been contacted in the last 6 months. Focus on our new energy-efficient lighting products.'
                : 'Example: When a new contact is added with the title "Project Manager" at a general contractor company, send them a welcome email introducing our building automation services.'
            }
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Be specific about your criteria, target audience, and desired outcome. The more detail you provide, the better AI can generate your {context === 'campaign' ? 'campaign' : 'rule'}.</span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={!prompt.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
