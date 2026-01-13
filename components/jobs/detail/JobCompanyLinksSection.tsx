/**
 * Job Company Links Section Component
 * Displays specifiers and awardees side by side with ability to add/remove companies
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchJobSpecifiers,
  fetchJobAwardees,
  addCompanyToJob,
  removeCompanyFromJob,
  type JobCompanyLink,
  type JobCompanyRole,
} from '../../lib/graphql';
import { searchCompanies, type CompanySearchResult } from '../../lib/api/search';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

// ============================================================================
// Types
// ============================================================================

interface JobCompanyLinksSectionProps {
  jobId: string;
  onCompanyClick?: (companyId: string) => void;
}

// ============================================================================
// Query Keys
// ============================================================================

const jobCompanyLinksKeys = {
  specifiers: (jobId: string) => ['jobs', jobId, 'specifiers'] as const,
  awardees: (jobId: string) => ['jobs', jobId, 'awardees'] as const,
  companySearch: (term: string) => ['companySearch', term] as const,
};

// ============================================================================
// Add Company Modal
// ============================================================================

interface AddCompanyModalProps {
  isOpen: boolean;
  role: JobCompanyRole;
  jobId: string;
  existingCompanyIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddCompanyModal({
  isOpen,
  role,
  jobId,
  existingCompanyIds,
  onClose,
  onSuccess,
}: AddCompanyModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: jobCompanyLinksKeys.companySearch(debouncedSearch),
    queryFn: () => searchCompanies(debouncedSearch || '', 50),
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  // Filter out already linked companies
  const availableCompanies = companies.filter(
    (company) => !existingCompanyIds.includes(company.id)
  );

  const handleAddCompany = async (company: CompanySearchResult) => {
    setIsAdding(true);
    try {
      await addCompanyToJob({
        jobId,
        companyId: company.id,
        role,
      });
      showSuccessToast(`Added ${company.name} as ${role.toLowerCase()}`);
      onSuccess();
      onClose();
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : 'Failed to add company'
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Reset search on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setDebouncedSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const roleLabel = role === 'SPECIFIER' ? 'Specifier' : 'Awardee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Add {roleLabel}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Search and select a company to add as a {roleLabel.toLowerCase()}
          </p>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-6 w-6 text-[var(--primary)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : availableCompanies.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-sm">
                {searchTerm
                  ? 'No companies found matching your search'
                  : 'No companies available to add'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleAddCompany(company)}
                  disabled={isAdding}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--muted)]/30 hover:bg-[var(--muted)] rounded-lg transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Company Icon */}
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)] truncate">
                        {company.name}
                      </span>
                      {company.companySourceType && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                            company.companySourceType === 'MANUFACTURER'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {company.companySourceType === 'MANUFACTURER'
                            ? 'Manufacturer'
                            : 'Customer'}
                        </span>
                      )}
                    </div>
                    {(company.phone || company.website) && (
                      <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)] mt-0.5">
                        {company.phone && <span>{company.phone}</span>}
                        {company.website && (
                          <span className="truncate">{company.website}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Icon */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[var(--primary)]"
                    >
                      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Company Card Component
// ============================================================================

interface CompanyCardProps {
  link: JobCompanyLink;
  role: JobCompanyRole;
  jobId: string;
  onRemove: () => void;
  onCompanyClick?: (companyId: string) => void;
  isRemoving: boolean;
}

function CompanyCard({
  link,
  role,
  jobId,
  onRemove,
  onCompanyClick,
  isRemoving,
}: CompanyCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onCompanyClick) {
      onCompanyClick(link.company.id);
    } else {
      router.push(`/companies?id=${link.company.id}`);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--muted)]/20 hover:bg-[var(--muted)]/40 rounded-lg transition-colors group">
      <div
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={handleClick}
      >
        {/* Company Icon */}
        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-medium text-[var(--foreground)] truncate">
              {link.company.name}
            </h4>
            {link.company.companySourceType && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                  link.company.companySourceType === 'MANUFACTURER'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {link.company.companySourceType === 'MANUFACTURER'
                  ? 'Manufacturer'
                  : 'Customer'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            {link.company.phone && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {link.company.phone}
              </span>
            )}
            {link.company.website && (
              <span className="flex items-center gap-1.5 truncate">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                {link.company.website}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={isRemoving}
        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2 disabled:opacity-50"
        title={`Remove ${role.toLowerCase()}`}
      >
        {isRemoving ? (
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Company Links Pane Component
// ============================================================================

interface CompanyLinksPaneProps {
  title: string;
  role: JobCompanyRole;
  jobId: string;
  links: JobCompanyLink[];
  isLoading: boolean;
  onAddClick: () => void;
  onRemove: (companyId: string) => void;
  removingCompanyId: string | null;
  onCompanyClick?: (companyId: string) => void;
  accentColor: string;
  icon: React.ReactNode;
}

function CompanyLinksPane({
  title,
  role,
  jobId,
  links,
  isLoading,
  onAddClick,
  onRemove,
  removingCompanyId,
  onCompanyClick,
  accentColor,
  icon,
}: CompanyLinksPaneProps) {
  return (
    <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div
        className={`px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r ${accentColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-xs text-white/70">
                {links.length} {links.length === 1 ? 'company' : 'companies'}
              </p>
            </div>
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M10 5v10M5 10h10" strokeLinecap="round" />
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-6 w-6 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center text-white/80`}
            >
              {icon}
            </div>
            <p className="text-sm font-medium mb-1">No {title.toLowerCase()}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Click Add to link companies as {title.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <CompanyCard
                key={link.id}
                link={link}
                role={role}
                jobId={jobId}
                onRemove={() => onRemove(link.company.id)}
                onCompanyClick={onCompanyClick}
                isRemoving={removingCompanyId === link.company.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function JobCompanyLinksSection({
  jobId,
  onCompanyClick,
}: JobCompanyLinksSectionProps) {
  const queryClient = useQueryClient();

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalRole, setAddModalRole] = useState<JobCompanyRole>('SPECIFIER');
  const [removingCompanyId, setRemovingCompanyId] = useState<string | null>(null);

  // Fetch specifiers
  const {
    data: specifiers = [],
    isLoading: specifiersLoading,
    refetch: refetchSpecifiers,
  } = useQuery({
    queryKey: jobCompanyLinksKeys.specifiers(jobId),
    queryFn: () => fetchJobSpecifiers(jobId),
    enabled: !!jobId,
  });

  // Fetch awardees
  const {
    data: awardees = [],
    isLoading: awardeesLoading,
    refetch: refetchAwardees,
  } = useQuery({
    queryKey: jobCompanyLinksKeys.awardees(jobId),
    queryFn: () => fetchJobAwardees(jobId),
    enabled: !!jobId,
  });

  // Remove company mutation
  const removeMutation = useMutation({
    mutationFn: removeCompanyFromJob,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: jobCompanyLinksKeys.specifiers(jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobCompanyLinksKeys.awardees(jobId),
      });
    },
  });

  const handleOpenAddModal = (role: JobCompanyRole) => {
    setAddModalRole(role);
    setAddModalOpen(true);
  };

  const handleRemoveCompany = async (companyId: string, role: JobCompanyRole) => {
    setRemovingCompanyId(companyId);
    try {
      await removeMutation.mutateAsync({
        jobId,
        companyId,
        role,
      });
      showSuccessToast(`Removed company from ${role.toLowerCase()}s`);
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : 'Failed to remove company'
      );
    } finally {
      setRemovingCompanyId(null);
    }
  };

  const handleModalSuccess = useCallback(() => {
    refetchSpecifiers();
    refetchAwardees();
  }, [refetchSpecifiers, refetchAwardees]);

  // Get existing company IDs for filtering in add modal
  const existingCompanyIds =
    addModalRole === 'SPECIFIER'
      ? specifiers.map((s) => s.company.id)
      : awardees.map((a) => a.company.id);

  return (
    <>
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] mb-6">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Company Roles
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Manage specifiers and awardees for this job
          </p>
        </div>

        {/* Side by Side Panes */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Specifiers Pane */}
            <CompanyLinksPane
              title="Specifiers"
              role="SPECIFIER"
              jobId={jobId}
              links={specifiers}
              isLoading={specifiersLoading}
              onAddClick={() => handleOpenAddModal('SPECIFIER')}
              onRemove={(companyId) =>
                handleRemoveCompany(companyId, 'SPECIFIER')
              }
              removingCompanyId={removingCompanyId}
              onCompanyClick={onCompanyClick}
              accentColor="from-blue-500 to-blue-600"
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />

            {/* Awardees Pane */}
            <CompanyLinksPane
              title="Awardees"
              role="AWARDEE"
              jobId={jobId}
              links={awardees}
              isLoading={awardeesLoading}
              onAddClick={() => handleOpenAddModal('AWARDEE')}
              onRemove={(companyId) =>
                handleRemoveCompany(companyId, 'AWARDEE')
              }
              removingCompanyId={removingCompanyId}
              onCompanyClick={onCompanyClick}
              accentColor="from-amber-500 to-orange-500"
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={addModalOpen}
        role={addModalRole}
        jobId={jobId}
        existingCompanyIds={existingCompanyIds}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}

export default JobCompanyLinksSection;
