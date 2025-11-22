'use client';

import React, { useState } from 'react';

type Company = {
  id: string;
  name: string;
  type: string[];
  website: string;
  phone: string;
  address: string;
  tags: string[];
  territory: string;
  contactCount: number;
  jobCount: number;
  lastActivity: string;
};

export default function CompaniesContent() {
  const [selectedType, setSelectedType] = useState<string>('All');

  const initialCompanies: Company[] = [
    {
      id: 'CO-001',
      name: 'Turner Construction',
      type: ['GC'],
      website: 'turnerconst.com',
      phone: '(555) 100-2000',
      address: 'San Francisco, CA',
      tags: ['Commercial', 'Healthcare'],
      territory: 'West',
      contactCount: 12,
      jobCount: 8,
      lastActivity: '2024-11-20',
    },
    {
      id: 'CO-002',
      name: 'Miller Electric',
      type: ['EC'],
      website: 'millerelectric.com',
      phone: '(555) 200-3000',
      address: 'Los Angeles, CA',
      tags: ['Commercial', 'Industrial'],
      territory: 'West',
      contactCount: 8,
      jobCount: 5,
      lastActivity: '2024-11-19',
    },
    {
      id: 'CO-003',
      name: 'Smith & Associates',
      type: ['Architect'],
      website: 'smitharch.com',
      phone: '(555) 300-4000',
      address: 'Portland, OR',
      tags: ['Design', 'High-rise'],
      territory: 'West',
      contactCount: 6,
      jobCount: 4,
      lastActivity: '2024-11-21',
    },
    {
      id: 'CO-004',
      name: 'Johnson Controls',
      type: ['EC', 'Manufacturer'],
      website: 'jci.com',
      phone: '(555) 400-5000',
      address: 'Seattle, WA',
      tags: ['HVAC', 'Controls'],
      territory: 'West',
      contactCount: 15,
      jobCount: 12,
      lastActivity: '2024-11-18',
    },
    {
      id: 'CO-005',
      name: 'Hensel Phelps',
      type: ['GC'],
      website: 'henselphelps.com',
      phone: '(555) 500-6000',
      address: 'Denver, CO',
      tags: ['Commercial', 'Education'],
      territory: 'Central',
      contactCount: 18,
      jobCount: 10,
      lastActivity: '2024-11-22',
    },
    {
      id: 'CO-006',
      name: 'Summit Electric',
      type: ['EC', 'Distributor'],
      website: 'summitelec.com',
      phone: '(555) 600-7000',
      address: 'Sacramento, CA',
      tags: ['Office', 'Retail'],
      territory: 'West',
      contactCount: 10,
      jobCount: 7,
      lastActivity: '2024-11-17',
    },
    {
      id: 'CO-007',
      name: 'McCarthy Building',
      type: ['GC'],
      website: 'mccarthybuilding.com',
      phone: '(555) 700-8000',
      address: 'Phoenix, AZ',
      tags: ['Healthcare', 'Mission Critical'],
      territory: 'Southwest',
      contactCount: 14,
      jobCount: 6,
      lastActivity: '2024-11-21',
    },
    {
      id: 'CO-008',
      name: 'Bay Area Electric',
      type: ['EC'],
      website: 'bayareaelec.com',
      phone: '(555) 800-9000',
      address: 'Oakland, CA',
      tags: ['Residential', 'Multi-family'],
      territory: 'West',
      contactCount: 5,
      jobCount: 3,
      lastActivity: '2024-11-16',
    },
    {
      id: 'CO-009',
      name: 'Skanska USA',
      type: ['GC'],
      website: 'skanska.com',
      phone: '(555) 900-1000',
      address: 'New York, NY',
      tags: ['Education', 'Infrastructure'],
      territory: 'East',
      contactCount: 20,
      jobCount: 9,
      lastActivity: '2024-11-20',
    },
    {
      id: 'CO-010',
      name: 'Prime Electric',
      type: ['EC'],
      website: 'primeelectric.com',
      phone: '(555) 101-2000',
      address: 'Boston, MA',
      tags: ['Education', 'Institutional'],
      territory: 'East',
      contactCount: 11,
      jobCount: 6,
      lastActivity: '2024-11-19',
    },
    {
      id: 'CO-011',
      name: 'Graybar Electric',
      type: ['Distributor'],
      website: 'graybar.com',
      phone: '(555) 102-3000',
      address: 'Dallas, TX',
      tags: ['National', 'Full-service'],
      territory: 'Central',
      contactCount: 25,
      jobCount: 15,
      lastActivity: '2024-11-22',
    },
    {
      id: 'CO-012',
      name: 'Legrand North America',
      type: ['Manufacturer'],
      website: 'legrand.us',
      phone: '(555) 103-4000',
      address: 'West Hartford, CT',
      tags: ['Electrical', 'Wiring Devices'],
      territory: 'National',
      contactCount: 8,
      jobCount: 0,
      lastActivity: '2024-11-15',
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

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Companies</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Company
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {companyTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedType === type
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {type}
              {type === 'All' && <span className="ml-2 text-xs opacity-75">({companies.length})</span>}
              {type !== 'All' && (
                <span className="ml-2 text-xs opacity-75">
                  ({companies.filter(c => c.type.includes(type)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pb-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
            </svg>
            Sort
          </button>
        </div>
      </div>

      {/* List View */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Company Name
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
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
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Last Activity
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
            >
              <div className="col-span-3 flex items-center gap-3">
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
              <div className="col-span-2 flex items-center gap-1 flex-wrap">
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
