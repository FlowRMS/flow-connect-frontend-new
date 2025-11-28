/**
 * Company Detail View Component
 */

import React from 'react';
import type { CompanyDetails } from '../types';

interface CompanyDetailViewProps {
  company: CompanyDetails;
  onBack: () => void;
}

export function CompanyDetailView({ company, onBack }: CompanyDetailViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Back Button and Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Job
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{company.name}</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {company.companyType}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{company.id}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5l5 5-5 5M7 5L2 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit Company
          </button>
        </div>
      </div>

      {/* Company Information Card */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Information</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Address</label>
            <input
              type="text"
              defaultValue={company.address}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Phone</label>
            <input
              type="text"
              defaultValue={company.phone}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Website</label>
            <input
              type="text"
              defaultValue={company.website}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <div className="col-span-3">
            <label className="text-sm text-[var(--muted-foreground)] mb-1 block">LinkedIn Profile</label>
            <input
              type="text"
              defaultValue={company.linkedin || ''}
              placeholder="https://linkedin.com/company/..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contacts at Company */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Contacts at {company.name}</h2>
          <button className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            + Add Contact
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {company.contacts.map((contact) => (
              <div
                key={contact.id}
                className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">{contact.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{contact.role}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {contact.department}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C7.82 21 2 15.18 2 8V7a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{contact.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Jobs</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {company.activeJobs.map((job) => (
              <div
                key={job.id}
                className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--foreground)]">{job.name}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                        {job.status}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {job.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                      <span>{job.id}</span>
                      <span>• {job.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
