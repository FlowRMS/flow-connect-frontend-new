/**
 * List View Component for Companies
 */

import React from 'react';
import type { Company } from '../types';
import { getCompanyInitials, getLogoColor, formatDate } from '../utils';

interface ListViewProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
}

export default function ListView({ companies, onCompanyClick }: ListViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Company Name
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Phone
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Website
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Tags
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Created
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {companies.map((company) => (
              <div
                key={company.id}
                onClick={() => onCompanyClick(company)}
                className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3 flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${getLogoColor(company.id)} flex items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0`}>
                    {getCompanyInitials(company.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm md:text-base text-[var(--foreground)] truncate">{company.name}</h3>
                    <p className="text-[10px] md:text-xs text-[var(--muted-foreground)] truncate">{company.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium whitespace-nowrap ${
                    company.companySourceType === 'MANUFACTURER'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{company.phone || '-'}</span>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  {company.website ? (
                    <a
                      href={`https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs md:text-sm text-[var(--primary)] hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-xs md:text-sm text-[var(--muted-foreground)]">-</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {company.tags.slice(0, 1).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[100px]"
                    >
                      {tag}
                    </span>
                  ))}
                  {company.tags.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{company.tags.length - 1}</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">{formatDate(company.lastActivity)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
