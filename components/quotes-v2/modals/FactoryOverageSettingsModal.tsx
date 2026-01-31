'use client';

import React, { useState, useEffect } from 'react';
import { useFactory, useUpdateFactoryOverageSettings, type OverageType } from '@/components/warehouse/api/useFactoriesApi';
import { useQueryClient } from '@tanstack/react-query';

interface FactoryOverageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryId: string | null;
  factoryName?: string;
}

export function FactoryOverageSettingsModal({
  isOpen,
  onClose,
  factoryId,
  factoryName,
}: FactoryOverageSettingsModalProps) {
  const [formData, setFormData] = useState({
    overageAllowed: false,
    overageType: 'BY_LINE' as OverageType,
    repOverageShare: '100.00',
  });

  const queryClient = useQueryClient();
  const { data: factory, isLoading: isLoadingFactory, refetch } = useFactory(factoryId || '');
  const updateOverageSettings = useUpdateFactoryOverageSettings();

  // Refetch factory data when modal opens to ensure fresh data
  useEffect(() => {
    if (isOpen && factoryId) {
      refetch();
    }
  }, [isOpen, factoryId, refetch]);

  useEffect(() => {
    if (factory) {
      setFormData({
        overageAllowed: factory.overageAllowed ?? false,
        overageType: factory.overageType ?? 'BY_LINE',
        repOverageShare: factory.repOverageShare ?? '100.00',
      });
    }
  }, [factory]);

  if (!isOpen || !factoryId) return null;

  const handleSave = async () => {
    try {
      await updateOverageSettings.mutateAsync({
        id: factoryId,
        input: formData,
      });
      // Invalidate factory cache to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ['factories'] });
      onClose();
    } catch (error) {
      console.error('Failed to update overage settings:', error);
    }
  };

  const isLoading = isLoadingFactory || updateOverageSettings.isPending;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Overage Settings</h2>
              <p className="text-sm text-gray-500 truncate max-w-[300px]">
                {factoryName || factory?.title || 'Manufacturer'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {isLoadingFactory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Overage Allowed Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Overage Allowed</label>
                    <p className="text-xs text-gray-500">Enable overage calculations for this manufacturer</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, overageAllowed: !formData.overageAllowed })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      formData.overageAllowed ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.overageAllowed ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Overage Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overage Type</label>
                  <select
                    value={formData.overageType}
                    onChange={(e) => setFormData({ ...formData, overageType: e.target.value as OverageType })}
                    disabled={!formData.overageAllowed}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      !formData.overageAllowed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="BY_LINE">By Line Item</option>
                    <option value="BY_TOTAL">By Quote Total</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.overageType === 'BY_LINE'
                      ? 'Calculate overage on each line item individually'
                      : 'Calculate overage on the total quote amount'}
                  </p>
                </div>

                {/* Rep Overage Share */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rep Overage Share</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.repOverageShare}
                      onChange={(e) => setFormData({ ...formData, repOverageShare: e.target.value })}
                      disabled={!formData.overageAllowed}
                      className={`flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        !formData.overageAllowed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Percentage of overage that goes to the rep (0-100%)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {updateOverageSettings.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FactoryOverageSettingsModal;
