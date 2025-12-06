/**
 * Add Link Modal Component for Contacts
 * Allows users to link entities (Companies, Jobs) to a Contact
 * Uses server-side search for real-time filtering
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useCRMJobsByContact,
  useCreateCRMLink,
} from '../../hooks/useCRMApi';
import { useJobSearch, useCompanySearch, type JobSearchResult, type CompanySearchResult } from '../../notes/api';
import type { CRMEntityType } from '../../lib/crm-graphql';

type LinkEntityType = 'COMPANY' | 'JOB';

interface AddLinkModalProps {
  isOpen: boolean;
  contactId: string;
  currentCompanyId?: string; // The contact's current associated company
  initialEntityType?: LinkEntityType;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLinkModal({
  isOpen,
  contactId,
  currentCompanyId,
  initialEntityType = 'COMPANY',
  onClose,
  onSuccess
}: AddLinkModalProps) {
  const [entityType, setEntityType] = useState<LinkEntityType>(initialEntityType);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens with a new initialEntityType
  useEffect(() => {
    if (isOpen) {
      setEntityType(initialEntityType);
      setSelectedEntityId('');
      setSearchTerm('');
    }
  }, [isOpen, initialEntityType]);

  // Fetch companies using server-side search - pass searchTerm directly, hook handles everything
  const { data: searchedCompanies = [], isLoading: companiesLoading } = useCompanySearch(searchTerm, isOpen);

  // Fetch jobs using server-side search - pass searchTerm directly, hook handles everything
  const { data: searchedJobs = [], isLoading: jobsLoading } = useJobSearch(searchTerm, isOpen);

  // Fetch already linked jobs for this contact
  const { data: linkedJobs = [] } = useCRMJobsByContact(contactId);

  // Create link mutation
  const createLinkMutation = useCreateCRMLink();

  // Get IDs of already linked entities
  const linkedJobIds = useMemo(() => new Set(linkedJobs.map(j => j.id)), [linkedJobs]);

  // Filter entities - both companies and jobs use server-side search, just exclude already linked
  const filteredEntities = useMemo(() => {
    if (entityType === 'COMPANY') {
      // Companies are already filtered by server-side search
      return searchedCompanies.filter((company: CompanySearchResult) => {
        // Exclude the currently associated company
        if (currentCompanyId && company.id === currentCompanyId) return false;
        return true;
      });
    } else {
      // Jobs are already filtered by server-side search
      return searchedJobs.filter((job: JobSearchResult) => {
        // Exclude already linked jobs
        if (linkedJobIds.has(job.id)) return false;
        return true;
      });
    }
  }, [entityType, searchedCompanies, searchedJobs, currentCompanyId, linkedJobIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntityId) return;

    try {
      await createLinkMutation.mutateAsync({
        sourceEntityType: 'CONTACT' as CRMEntityType,
        sourceEntityId: contactId,
        targetEntityType: entityType as CRMEntityType,
        targetEntityId: selectedEntityId,
      });

      // Reset and close
      setSelectedEntityId('');
      setSearchTerm('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create link:', error);
    }
  };

  const handleEntityTypeChange = (type: LinkEntityType) => {
    setEntityType(type);
    setSelectedEntityId('');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  const isLoading = entityType === 'COMPANY' ? companiesLoading : jobsLoading;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={onClose}>
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Link Entity</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Entity Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Entity Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEntityTypeChange('COMPANY')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    entityType === 'COMPANY'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => handleEntityTypeChange('JOB')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    entityType === 'JOB'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  Job
                </button>
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Search {entityType === 'COMPANY' ? 'Companies' : 'Jobs'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={entityType === 'COMPANY' ? 'Search by company name...' : 'Search by job name...'}
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Entity List */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select {entityType === 'COMPANY' ? 'Company' : 'Job'}
              </label>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-[var(--muted-foreground)]">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Loading...</span>
                    </div>
                  </div>
                ) : filteredEntities.length === 0 ? (
                  <div className="p-4 text-center text-[var(--muted-foreground)]">
                    {searchTerm ? 'No results found' : `No ${entityType === 'COMPANY' ? 'companies' : 'jobs'} available`}
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {filteredEntities.map((entity: any) => {
                      const isSelected = selectedEntityId === entity.id;
                      const displayName = entityType === 'COMPANY'
                        ? entity.name
                        : (entity.jobName || entity.name);
                      const subtitle = entityType === 'COMPANY'
                        ? entity.companySourceType
                        : (entity.statusName || entity.jobType || '');

                      return (
                        <button
                          key={entity.id}
                          type="button"
                          onClick={() => setSelectedEntityId(entity.id)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isSelected
                              ? 'bg-[var(--primary)]/10 border-l-4 border-[var(--primary)]'
                              : 'hover:bg-[var(--muted)]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-[var(--foreground)]">{displayName}</p>
                              {subtitle && (
                                <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
                              )}
                            </div>
                            {isSelected && (
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--primary)]">
                                <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedEntityId || createLinkMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createLinkMutation.isPending && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              Link {entityType === 'COMPANY' ? 'Company' : 'Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
