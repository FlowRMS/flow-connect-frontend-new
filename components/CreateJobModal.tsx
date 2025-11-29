'use client';

import React, { useState, useEffect } from 'react';
import { useCRMJobStatuses, useCreateCRMJob } from './hooks/useCRMApi';
import { hasCRMTokens } from './lib/crm-auth';
import type { JobInput } from './lib/crm-graphql';
import { jobToasts } from './lib/toast';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateJobModal({ isOpen, onClose, onSuccess }: CreateJobModalProps) {
  const [formData, setFormData] = useState({
    jobName: '',
    statusId: '',
    jobType: '',
    description: '',
    startDate: '',
    endDate: '',
    requesterId: '',
    jobOwnerId: '',
    structuralInformation: '',
    structuralDetails: '',
    additionalInformation: '',
  });
  const [error, setError] = useState<string | null>(null);

  const isConnected = hasCRMTokens();
  const { data: statuses, isLoading: statusesLoading, error: statusesError } = useCRMJobStatuses();
  const createJobMutation = useCreateCRMJob();

  // Set default status when statuses load
  useEffect(() => {
    if (statuses && statuses.length > 0 && !formData.statusId) {
      setFormData(prev => ({ ...prev, statusId: statuses[0].id }));
    }
  }, [statuses, formData.statusId]);

  const buildJobInput = (): JobInput => {
    const optionalFields: (keyof typeof formData)[] = [
      'jobType', 'description', 'startDate', 'endDate', 
      'requesterId', 'jobOwnerId', 'structuralInformation', 
      'structuralDetails', 'additionalInformation'
    ];
    
    const optional = Object.fromEntries(
      optionalFields
        .filter(field => formData[field])
        .map(field => [field, formData[field]])
    );
    
    return {
      jobName: formData.jobName,
      statusId: formData.statusId,
      ...optional,
    };
  };

  const resetForm = () => {
    setFormData({
      jobName: '',
      statusId: statuses?.[0]?.id || '',
      jobType: '',
      description: '',
      startDate: '',
      endDate: '',
      requesterId: '',
      jobOwnerId: '',
      structuralInformation: '',
      structuralDetails: '',
      additionalInformation: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.jobName.trim()) {
      setError('Job name is required');
      return;
    }

    if (!formData.statusId) {
      setError('Status is required');
      return;
    }

    try {
      await createJobMutation.mutateAsync(buildJobInput());
      jobToasts.createSuccess(formData.jobName);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      jobToasts.createError(err instanceof Error ? err.message : undefined);
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Create New Job</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {!isConnected ? (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">CRM Not Connected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please configure your CRM API tokens in the Auth page to create jobs.
                  </p>
                  <a
                    href="/crm-auth"
                    className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:underline"
                  >
                    Go to Auth Settings →
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {statusesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Failed to load statuses: {statusesError.message}
              </div>
            )}

            {/* Job Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Job Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="jobName"
                value={formData.jobName}
                onChange={handleChange}
                placeholder="Enter job name"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="statusId"
                value={formData.statusId}
                onChange={handleChange}
                disabled={statusesLoading}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              >
                {statusesLoading ? (
                  <option>Loading statuses...</option>
                ) : (
                  statuses?.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Job Type
              </label>
              <input
                type="text"
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                placeholder="e.g., Commercial, Residential, Industrial"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter job description"
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Structural Information */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Structural Information
              </label>
              <textarea
                name="structuralInformation"
                value={formData.structuralInformation}
                onChange={handleChange}
                placeholder="Enter structural information"
                rows={2}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* Structural Details */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Structural Details
              </label>
              <textarea
                name="structuralDetails"
                value={formData.structuralDetails}
                onChange={handleChange}
                placeholder="Enter structural details"
                rows={2}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Additional Information
              </label>
              <textarea
                name="additionalInformation"
                value={formData.additionalInformation}
                onChange={handleChange}
                placeholder="Enter any additional information"
                rows={2}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createJobMutation.isPending || statusesLoading}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
