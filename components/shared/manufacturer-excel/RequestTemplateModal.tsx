/**
 * RequestTemplateModal
 * Collects factory name and template file for manufacturer Excel requests
 */

'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import { ENTITY_TYPE_LABELS } from '@/components/shared/excel-builder/types';

interface RequestTemplateModalProps {
  entityType: PDFEntityType;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestTemplateModal({ entityType, isOpen, onClose }: RequestTemplateModalProps) {
  const [factoryName, setFactoryName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFactoryName('');
      setFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      alert('Please attach the manufacturer template file.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    const messageLines = [
      'Request Manufacturer Excel Template',
      `Entity: ${ENTITY_TYPE_LABELS[entityType]}`,
      `Factory: ${factoryName}`,
    ];
    formData.append('message', messageLines.join('\n'));

    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      formData.append('accessToken', accessToken);
    }

    formData.append('files', file);

    try {
      const res = await fetch('/api/send-report-request', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send request');
      }

      alert('Request sent successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      alert(`Error sending request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Request Template</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manufacturer Excel template request</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Factory name</label>
            <input
              type="text"
              value={factoryName}
              onChange={(event) => setFactoryName(event.target.value)}
              placeholder="Ammo International"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template file (.xlsx)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full text-sm"
                required
              />
              {file && (
                <p className="text-xs text-gray-500 mt-2">Attached: {file.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestTemplateModal;
