/**
 * Company Related Entities Component
 * Displays contacts and jobs related to a company with add/delete link functionality
 */

'use client';

import React, { useState } from 'react';
import type { Company } from '../types';
import { 
  useCRMContactsByCompany, 
  useCRMJobsByCompany,
  useDeleteCRMLinkByEntities 
} from '../../hooks/useCRMApi';
import type { Contact as APIContact, Job as APIJob, CRMEntityType } from '../../lib/crm-graphql';
import { AddLinkModal } from '../modals/AddLinkModal';

// ============================================================================
// Types
// ============================================================================

interface CompanyRelatedEntitiesProps {
  company: Company;
  onContactClick?: (contact: APIContact) => void;
  onJobClick?: (job: APIJob) => void;
}

type LinkEntityType = 'CONTACT' | 'JOB';

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Contact Card Component
 */
function ContactCard({ 
  contact,
  onClick 
}: { 
  contact: APIContact;
  onClick?: () => void;
}) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();
  
  return (
    <div 
      className={`flex items-center p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
        {initials || '?'}
      </div>
      
      <div className="flex-1 min-w-0 ml-3">
        {/* Name & Role */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-[var(--foreground)] truncate">
            {fullName || 'Unknown Contact'}
          </h4>
          {contact.role && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {contact.role}
            </span>
          )}
        </div>
        
        {/* Contact Details */}
        <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
          {contact.email && <span className="truncate">{contact.email}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
        </div>
      </div>
    </div>
  );
}

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

export default function CompanyRelatedEntities({ 
  company,
  onContactClick,
  onJobClick 
}: CompanyRelatedEntitiesProps) {
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<LinkEntityType>('CONTACT');

  // Fetch contacts and jobs for this company
  const { 
    data: contacts = [], 
    isLoading: contactsLoading, 
    error: contactsError,
    refetch: refetchContacts 
  } = useCRMContactsByCompany(company.id);
  
  const { 
    data: jobs = [], 
    isLoading: jobsLoading, 
    error: jobsError,
    refetch: refetchJobs 
  } = useCRMJobsByCompany(company.id);

  // Delete link mutation
  const deleteLinkMutation = useDeleteCRMLinkByEntities();

  // Open modal with specific entity type
  const openAddLinkModal = (entityType: LinkEntityType) => {
    setAddLinkEntityType(entityType);
    setShowAddLinkModal(true);
  };

  // Handle unlinking an entity
  const handleUnlink = async (entityType: 'CONTACT' | 'JOB', entityId: string) => {
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: 'COMPANY' as CRMEntityType,
        sourceEntityId: company.id,
        targetEntityType: entityType as CRMEntityType,
        targetEntityId: entityId,
      });
      // Refetch to update the UI
      if (entityType === 'CONTACT') {
        refetchContacts();
      } else {
        refetchJobs();
      }
    } catch (error) {
      console.error('Failed to unlink entity:', error);
    }
  };

  // Handle successful link creation
  const handleLinkSuccess = () => {
    refetchContacts();
    refetchJobs();
  };

  return (
    <>
      {/* Contacts at Company */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Contacts at {company.name}
            </h2>
            {!contactsLoading && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                {contacts.length}
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          {contactsLoading ? (
            <LoadingSkeleton />
          ) : contactsError ? (
            <div className="text-center py-8 text-red-600">
              <p className="text-sm">Failed to load contacts</p>
              <button 
                onClick={() => refetchContacts()}
                className="mt-2 text-sm text-[var(--primary)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-4 text-[var(--muted-foreground)]">
              <p className="text-sm">No contacts linked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <ContactCard 
                  key={contact.id} 
                  contact={contact}
                  onClick={onContactClick ? () => onContactClick(contact) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
        companyId={company.id}
        initialEntityType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />
    </>
  );
}
