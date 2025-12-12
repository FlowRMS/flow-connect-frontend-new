'use client';

import React, { useState } from 'react';
import AdvancedFilters from './AdvancedFilters';

type Company = {
  id: string;
  name: string;
  type: string[];
  website: string;
  phone: string;
  address: string;
  tags: string[];
  lists: string[];
  territory: string;
  contactCount: number;
  jobCount: number;
  lastActivity: string;
  followers: string[];
};

export default function CompaniesContent() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const companyFilterOptions = [
    { id: 'company-id', label: 'Company ID', type: 'text' as const },
    { id: 'name', label: 'Company Name', type: 'text' as const },
    { id: 'type', label: 'Company Type', type: 'dropdown' as const },
    { id: 'website', label: 'Website', type: 'text' as const },
    { id: 'phone', label: 'Phone', type: 'text' as const },
    { id: 'address', label: 'Address', type: 'text' as const },
    { id: 'territory', label: 'Territory', type: 'dropdown' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
    { id: 'lists', label: 'Lists', type: 'dropdown' as const },
    { id: 'contact-count', label: 'Contact Count', type: 'number' as const },
    { id: 'job-count', label: 'Job Count', type: 'number' as const },
    { id: 'last-activity', label: 'Last Activity', type: 'date' as const },
  ];

  const initialCompanies: Company[] = [
    {
      id: 'CO-001',
      name: 'Turner Construction',
      type: ['GC'],
      website: 'turnerconst.com',
      phone: '(555) 100-2000',
      address: 'San Francisco, CA',
      tags: ['Commercial', 'Healthcare'],
      lists: ['Strategic Accounts', 'Top Tier GCs'],
      territory: 'West',
      contactCount: 12,
      jobCount: 8,
      lastActivity: '2024-11-20',
      followers: ['Sarah Johnson', 'Marcus Chen'],
    },
    {
      id: 'CO-002',
      name: 'Miller Electric',
      type: ['EC'],
      website: 'millerelectric.com',
      phone: '(555) 200-3000',
      address: 'Los Angeles, CA',
      tags: ['Commercial', 'Industrial'],
      lists: ['Preferred Partners', 'West Coast ECs'],
      territory: 'West',
      contactCount: 8,
      jobCount: 5,
      lastActivity: '2024-11-19',
      followers: ['Marcus Chen'],
    },
    {
      id: 'CO-003',
      name: 'Smith & Associates',
      type: ['Architect'],
      website: 'smitharch.com',
      phone: '(555) 300-4000',
      address: 'Portland, OR',
      tags: ['Design', 'High-rise'],
      lists: [],
      territory: 'West',
      contactCount: 6,
      jobCount: 4,
      lastActivity: '2024-11-21',
      followers: ['Sarah Johnson', 'David Torres'],
    },
    {
      id: 'CO-004',
      name: 'Johnson Controls',
      type: ['EC', 'Manufacturer'],
      website: 'jci.com',
      phone: '(555) 400-5000',
      address: 'Seattle, WA',
      tags: ['HVAC', 'Controls'],
      lists: [],
      territory: 'West',
      contactCount: 15,
      jobCount: 12,
      lastActivity: '2024-11-18',
      followers: ['Sarah Johnson', 'Emily Roberts'],
    },
    {
      id: 'CO-005',
      name: 'Hensel Phelps',
      type: ['GC'],
      website: 'henselphelps.com',
      phone: '(555) 500-6000',
      address: 'Denver, CO',
      tags: ['Commercial', 'Education'],
      lists: [],
      territory: 'Central',
      contactCount: 18,
      jobCount: 10,
      lastActivity: '2024-11-22',
      followers: ['David Torres'],
    },
    {
      id: 'CO-006',
      name: 'Summit Electric',
      type: ['EC', 'Distributor'],
      website: 'summitelec.com',
      phone: '(555) 600-7000',
      address: 'Sacramento, CA',
      tags: ['Office', 'Retail'],
      lists: [],
      territory: 'West',
      contactCount: 10,
      jobCount: 7,
      lastActivity: '2024-11-17',
      followers: ['Marcus Chen', 'Emily Roberts'],
    },
    {
      id: 'CO-007',
      name: 'McCarthy Building',
      type: ['GC'],
      website: 'mccarthybuilding.com',
      phone: '(555) 700-8000',
      address: 'Phoenix, AZ',
      tags: ['Healthcare', 'Mission Critical'],
      lists: [],
      territory: 'Southwest',
      contactCount: 14,
      jobCount: 6,
      lastActivity: '2024-11-21',
      followers: ['David Torres', 'Sarah Johnson'],
    },
    {
      id: 'CO-008',
      name: 'Bay Area Electric',
      type: ['EC'],
      website: 'bayareaelec.com',
      phone: '(555) 800-9000',
      address: 'Oakland, CA',
      tags: ['Residential', 'Multi-family'],
      lists: [],
      territory: 'West',
      contactCount: 5,
      jobCount: 3,
      lastActivity: '2024-11-16',
      followers: ['Marcus Chen'],
    },
    {
      id: 'CO-009',
      name: 'Skanska USA',
      type: ['GC'],
      website: 'skanska.com',
      phone: '(555) 900-1000',
      address: 'New York, NY',
      tags: ['Education', 'Infrastructure'],
      lists: [],
      territory: 'East',
      contactCount: 20,
      jobCount: 9,
      lastActivity: '2024-11-20',
      followers: ['Sarah Johnson', 'Emily Roberts'],
    },
    {
      id: 'CO-010',
      name: 'Prime Electric',
      type: ['EC'],
      website: 'primeelectric.com',
      phone: '(555) 101-2000',
      address: 'Boston, MA',
      tags: ['Education', 'Institutional'],
      lists: [],
      territory: 'East',
      contactCount: 11,
      jobCount: 6,
      lastActivity: '2024-11-19',
      followers: ['David Torres'],
    },
    {
      id: 'CO-011',
      name: 'Graybar Electric',
      type: ['Distributor'],
      website: 'graybar.com',
      phone: '(555) 102-3000',
      address: 'Dallas, TX',
      tags: ['National', 'Full-service'],
      lists: [],
      territory: 'Central',
      contactCount: 25,
      jobCount: 15,
      lastActivity: '2024-11-22',
      followers: ['Marcus Chen', 'Emily Roberts', 'David Torres'],
    },
    {
      id: 'CO-012',
      name: 'Legrand North America',
      type: ['Manufacturer'],
      website: 'legrand.us',
      phone: '(555) 103-4000',
      address: 'West Hartford, CT',
      tags: ['Electrical', 'Wiring Devices'],
      lists: [],
      territory: 'National',
      contactCount: 8,
      jobCount: 0,
      lastActivity: '2024-11-15',
      followers: ['Sarah Johnson'],
    },
  ];

  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  const companyTypes = ['All', 'GC', 'EC', 'Architect', 'Engineer', 'Distributor', 'Manufacturer', 'Owner'];

  const filteredCompanies = selectedType === 'All'
    ? companies
    : companies.filter(company => company.type.includes(selectedType));

  const getCompanyInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const getLogoColor = (id: string) => {
    const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-red-600', 'bg-orange-600', 'bg-teal-600', 'bg-green-600'];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Mock detailed company data
  const getCompanyDetails = (companyId: string) => {
    const companyData: Record<string, any> = {
      'CO-001': {
        id: 'CO-001',
        name: 'Turner Construction',
        companyType: 'GC',
        address: '375 Hudson Street, New York, NY 10014',
        phone: '(212) 229-6000',
        website: 'www.turnerconstruction.com',
        linkedin: 'https://linkedin.com/company/turner-construction',
        contacts: [
          { id: 'C-001', name: 'John Smith', role: 'Project Manager', email: 'john.smith@turner.com', phone: '(555) 123-4567', department: 'Operations' },
          { id: 'C-003', name: 'Mike Johnson', role: 'Superintendent', email: 'mike.j@turner.com', phone: '(555) 345-6789', department: 'Field Operations' },
          { id: 'C-006', name: 'Lisa Anderson', role: 'Estimator', email: 'lisa.a@turner.com', phone: '(555) 678-9012', department: 'Preconstruction' },
          { id: 'C-007', name: 'Tom Bradley', role: 'Safety Director', email: 'tom.b@turner.com', phone: '(555) 789-0123', department: 'Safety' },
        ],
        activeJobs: [
          { id: 'J-001', name: 'Downtown Plaza Renovation', value: '$2.3M', status: 'Active', role: 'GC' },
          { id: 'J-003', name: 'Riverside Medical Center', value: '$4.2M', status: 'Active', role: 'GC' },
        ],
        notes: 'Preferred GC for large commercial projects. Strong safety record.',
      },
      'CO-002': {
        id: 'CO-002',
        name: 'Miller Electric',
        companyType: 'EC',
        address: '1250 Industrial Blvd, Dallas, TX 75207',
        phone: '(214) 555-3000',
        website: 'www.millerelectric.com',
        linkedin: 'https://linkedin.com/company/miller-electric',
        contacts: [
          { id: 'C-002', name: 'Sarah Williams', role: 'Estimator', email: 'sarah.w@millerelectric.com', phone: '(555) 234-5678', department: 'Estimating' },
          { id: 'C-008', name: 'David Chen', role: 'Project Manager', email: 'david.c@millerelectric.com', phone: '(555) 890-1234', department: 'Project Management' },
        ],
        activeJobs: [
          { id: 'J-001', name: 'Downtown Plaza Renovation', value: '$2.3M', status: 'Active', role: 'EC' },
        ],
        notes: 'Reliable electrical contractor. Good pricing on LED systems.',
      },
    };
    return companyData[companyId] || {
      id: companyId,
      name: selectedCompany?.name || 'Company',
      companyType: selectedCompany?.type[0] || 'N/A',
      address: selectedCompany?.address || '',
      phone: selectedCompany?.phone || '',
      website: selectedCompany?.website || '',
      employees: 0,
      founded: 0,
      contacts: [],
      activeJobs: [],
      notes: '',
    };
  };

  // Company Detail View
  if (selectedCompany) {
    const companyDetails = getCompanyDetails(selectedCompany.id);

    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{companyDetails.name}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {companyDetails.companyType}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{companyDetails.id}</p>
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
                defaultValue={companyDetails.address}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Phone</label>
              <input
                type="text"
                defaultValue={companyDetails.phone}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Website</label>
              <input
                type="text"
                defaultValue={companyDetails.website}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div className="col-span-3">
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">LinkedIn Profile</label>
              <input
                type="text"
                defaultValue={companyDetails.linkedin || ''}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Contacts at Company */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Contacts at {companyDetails.name}</h2>
            <button className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
              + Add Contact
            </button>
          </div>
          <div className="p-6">
            {companyDetails.contacts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {companyDetails.contacts.map((contact: any) => (
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
            ) : (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                No contacts found for this company
              </div>
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Jobs</h2>
          </div>
          <div className="p-6">
            {companyDetails.activeJobs.length > 0 ? (
              <div className="space-y-3">
                {companyDetails.activeJobs.map((job: any) => (
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
            ) : (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                No active jobs for this company
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Companies</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={companyFilterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Company
            </button>
          </div>
        </div>
      </div>


      {/* List View */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Company Name
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Type
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Location
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Contacts
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Jobs
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Tags
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Lists
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Last Activity
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
            >
              <div className="col-span-2 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${getLogoColor(company.id)} flex items-center justify-center text-white text-xs font-bold`}>
                  {getCompanyInitials(company.name)}
                </div>
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">{company.name}</h3>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                      {company.website}
                    </a>
                    <a href={`tel:${company.phone}`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                      {company.phone}
                    </a>
                  </div>
                </div>
              </div>
              <div className="col-span-1 flex items-center gap-1 flex-wrap">
                {company.type.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="col-span-2 flex items-center">
                <div>
                  <span className="text-sm text-[var(--foreground)]">{company.address}</span>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{company.territory}</div>
                </div>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--foreground)]">{company.contactCount}</span>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--foreground)]">{company.jobCount}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1 flex-wrap">
                {company.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="col-span-2 flex items-center gap-1 flex-wrap">
                {company.lists.map((list, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                  >
                    {list}
                  </span>
                ))}
              </div>
              <div className="col-span-1 flex items-center">
                <span className="text-xs text-[var(--muted-foreground)]">{formatDate(company.lastActivity)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
