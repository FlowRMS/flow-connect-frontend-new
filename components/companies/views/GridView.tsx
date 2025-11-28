/**
 * Grid View Component for Companies
 */

import React from 'react';
import type { Company } from '../types';
import { getCompanyInitials, getLogoColor } from '../utils';

interface GridViewProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
}

export default function GridView({ companies, onCompanyClick }: GridViewProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {companies.map((company) => (
        <div
          key={company.id}
          onClick={() => onCompanyClick(company)}
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg ${getLogoColor(company.id)} flex items-center justify-center text-white font-bold`}>
                {getCompanyInitials(company.name)}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">{company.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  company.companySourceType === 'MANUFACTURER'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
            {company.website && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="8"/>
                  <path d="M2 10h16M10 2a14 14 0 010 16M10 2a14 14 0 000 16"/>
                </svg>
                <span>{company.website}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C7.82 21 2 15.18 2 8V7a2 2 0 012-2z"/>
                </svg>
                <span>{company.phone}</span>
              </div>
            )}
          </div>
          
          {company.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-4">
              {company.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {company.tags.length > 3 && (
                <span className="px-2 py-0.5 text-[var(--muted-foreground)] text-xs">
                  +{company.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
