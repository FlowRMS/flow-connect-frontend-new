/**
 * Grid View Component for Companies
 */

import React from 'react';
import type { Company } from '../../types';
import { getCompanyInitials, getLogoColor } from '../../utils';
import { CompaniesGridSkeleton } from './components/CompaniesGridSkeleton';

interface GridViewProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
  isLoading?: boolean;
}

export default function GridView({ companies, onCompanyClick, isLoading = false }: GridViewProps) {
  if (isLoading) {
    return <CompaniesGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {companies.map((company) => (
        <div
          key={company.id}
          onClick={() => onCompanyClick(company)}
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3 md:p-5 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${getLogoColor(company.id)} flex items-center justify-center text-white text-sm md:text-base font-bold flex-shrink-0`}>
                {getCompanyInitials(company.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm md:text-base text-[var(--foreground)] truncate">{company.name}</h3>
                <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded inline-block mt-0.5 ${
                  company.companyTypeName?.toLowerCase() === 'manufacturer'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {company.companyTypeName || company.type?.[0] || 'Customer'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-[var(--muted-foreground)]">
            {company.website && (
              <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 md:w-[14px] md:h-[14px]">
                  <circle cx="10" cy="10" r="8"/>
                  <path d="M2 10h16M10 2a14 14 0 010 16M10 2a14 14 0 000 16"/>
                </svg>
                <span className="truncate">{company.website}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 md:w-[14px] md:h-[14px]">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C7.82 21 2 15.18 2 8V7a2 2 0 012-2z"/>
                </svg>
                <span className="truncate">{company.phone}</span>
              </div>
            )}
          </div>

          {company.tags.length > 0 && (
            <div className="flex gap-1 md:gap-1.5 flex-wrap mt-3 md:mt-4">
              {company.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[100px]"
                >
                  {tag}
                </span>
              ))}
              {company.tags.length > 2 && (
                <span className="px-1.5 md:px-2 py-0.5 text-[var(--muted-foreground)] text-[10px] md:text-xs">
                  +{company.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
