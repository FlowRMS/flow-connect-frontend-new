/**
 * Contact Related Entities Component
 * Displays jobs and companies related to a contact with add/delete link functionality
 */

'use client';

import React, { useState } from 'react';
import type { Contact } from '../types';
import { 
  useCRMJobsByContact, 
  useCRMCompany,
  useDeleteCRMLinkByEntities 
} from '../../hooks/useCRMApi';
import type { Job as APIJob, Company as APICompany, EntityType } from '../../lib/crm-graphql';
import { AddLinkModal } from '../modals/AddLinkModal';

// ============================================================================
// Types
// ============================================================================

interface ContactRelatedEntitiesProps {
  contact: Contact;
  onJobClick?: (job: APIJob) => void;
  onCompanyClick?: (company: APICompany) => void;
}

type LinkEntityType = 'COMPANY' | 'JOB';

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Job Card Component
 */
function JobCard({ 
  job,
  onUnlink,
  isUnlinking,
  onClick 
}: { 
  job: APIJob;
  onUnlink: () => void;
  isUnlinking: boolean;
  onClick?: () => void;
}) {
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower.includes('done')) return 'bg-green-100 text-green-700';
    if (statusLower.includes('active') || statusLower.includes('in progress')) return 'bg-blue-100 text-blue-700';
    if (statusLower.includes('pending') || statusLower.includes('backlog')) return 'bg-yellow-100 text-yellow-700';
    if (statusLower.includes('cancelled') || statusLower.includes('closed')) return 'bg-gray-100 text-gray-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group">
      <div 
        className={`flex-1 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-medium text-[var(--foreground)]">
            {job.jobName || 'Unnamed Job'}
          </h4>
          {job.jobType && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
              {job.jobType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
          {job.status?.name && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(job.status.name)}`}>
              {job.status.name}
            </span>
          )}
          {job.startDate && <span>Start: {job.startDate}</span>}
        </div>
      </div>

      {/* Unlink Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUnlink();
        }}
        disabled={isUnlinking}
        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
        title="Unlink job"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

/**
 * Company Info Card Component
 */
function CompanyInfoCard({
  companyId,
  companyName,
  onClick
}: {
  companyId: string;
  companyName: string;
  onClick?: (company: APICompany) => void;
}) {
  const { data: company, isLoading, error } = useCRMCompany(companyId);

  if (isLoading) {
    return (
      <div className="p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)] animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">{companyName || 'Unknown Company'}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Unable to load details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClick?.(company)}
      className={`p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Company Icon */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Company Name & Type */}
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[var(--foreground)] truncate">
              {company.name}
            </h4>
            {company.companySourceType && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                company.companySourceType === 'MANUFACTURER' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
              </span>
            )}
          </div>

          {/* Contact Details */}
          <div className="mt-2 space-y-1">
            {company.phone && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{company.phone}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="truncate">{company.website}</span>
              </div>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        {onClick && (
          <svg className="w-5 h-5 text-[var(--muted-foreground)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-3 border border-[var(--border)] rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ContactRelatedEntities({ 
  contact,
  onJobClick,
  onCompanyClick 
}: ContactRelatedEntitiesProps) {
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<LinkEntityType>('COMPANY');

  // Fetch jobs for this contact
  const { 
    data: jobs = [], 
    isLoading: jobsLoading, 
    error: jobsError,
    refetch: refetchJobs 
  } = useCRMJobsByContact(contact.id);

  // Delete link mutation
  const deleteLinkMutation = useDeleteCRMLinkByEntities();

  // Open modal with specific entity type
  const openAddLinkModal = (entityType: LinkEntityType) => {
    setAddLinkEntityType(entityType);
    setShowAddLinkModal(true);
  };

  // Handle unlinking an entity
  const handleUnlink = async (entityType: 'COMPANY' | 'JOB', entityId: string) => {
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: 'CONTACT' as EntityType,
        sourceEntityId: contact.id,
        targetEntityType: entityType as EntityType,
        targetEntityId: entityId,
      });
      // Refetch to update the UI
      if (entityType === 'JOB') {
        refetchJobs();
      }
    } catch (error) {
      console.error('Failed to unlink entity:', error);
    }
  };

  // Handle successful link creation
  const handleLinkSuccess = () => {
    refetchJobs();
  };

  return (
    <>
      {/* Associated Company */}
      {contact.companyId && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Associated Company</h2>
          </div>
          <div className="p-6">
            <CompanyInfoCard 
              companyId={contact.companyId}
              companyName={contact.company}
              onClick={onCompanyClick}
            />
          </div>
        </div>
      )}

      {/* No company linked */}
      {!contact.companyId && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Associated Company</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-4 text-[var(--muted-foreground)]">
              <p className="text-sm">No company linked</p>
            </div>
          </div>
        </div>
      )}

      {/* Related Jobs */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Related Jobs</h2>
            {!jobsLoading && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                {jobs.length}
              </span>
            )}
          </div>
          <button 
            onClick={() => openAddLinkModal('JOB')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
            </svg>
            Link Job
          </button>
        </div>
        <div className="p-6">
          {jobsLoading ? (
            <LoadingSkeleton />
          ) : jobsError ? (
            <div className="text-center py-8 text-red-600">
              <p className="text-sm">Failed to load jobs</p>
              <button 
                onClick={() => refetchJobs()}
                className="mt-2 text-sm text-[var(--primary)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-4 text-[var(--muted-foreground)]">
              <p className="text-sm">No jobs linked</p>
              <button
                onClick={() => openAddLinkModal('JOB')}
                className="mt-2 text-sm text-[var(--primary)] hover:underline"
              >
                + Add a job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job}
                  onUnlink={() => handleUnlink('JOB', job.id)}
                  isUnlinking={deleteLinkMutation.isPending}
                  onClick={onJobClick ? () => onJobClick(job) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        contactId={contact.id}
        currentCompanyId={contact.companyId}
        initialEntityType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />
    </>
  );
}
