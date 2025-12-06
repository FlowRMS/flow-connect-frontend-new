/**
 * Company Detail Header Component
 * Enhanced with Jobs-style visual hierarchy and avatar
 */

import React from 'react';
import type { Company } from '../types';
import { getCompanyInitials, getLogoColor } from '../utils';

interface CompanyDetailHeaderProps {
  company: Company;
  isEditing: boolean;
  isPending: boolean;
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function CompanyDetailHeader({
  company,
  isEditing,
  isPending,
  onBack,
  onDelete,
  onEdit,
  onSave,
  onCancel,
}: CompanyDetailHeaderProps) {
  const logoColor = getLogoColor(company.id);
  const initials = getCompanyInitials(company.name);

  return (
    <div className="mb-4 md:mb-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 md:gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 md:mb-6 transition-colors group"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="group-hover:-translate-x-1 transition-transform md:w-[18px] md:h-[18px]"
        >
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs md:text-sm font-medium">Back to Companies</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left Side - Company Info */}
          <div className="flex items-start gap-3 md:gap-4">
            {/* Company Avatar */}
            <div className={`w-10 h-10 md:w-14 md:h-14 ${logoColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-sm md:text-lg font-bold">{initials}</span>
            </div>

            {/* Company Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)] truncate">{company.name}</h1>
                <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium ${
                  company.companySourceType === 'MANUFACTURER'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-green-50 text-green-700'
                }`}>
                  <span className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${
                    company.companySourceType === 'MANUFACTURER' ? 'bg-purple-500' : 'bg-green-500'
                  }`}></span>
                  {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-[var(--muted-foreground)]">
                <span className="font-mono bg-gray-100 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-sm truncate max-w-[120px] md:max-w-none">{company.id}</span>
                {company.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="truncate">{company.phone}</span>
                  </span>
                )}
                {company.website && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                    </svg>
                    <span className="truncate max-w-[100px] md:max-w-none">{company.website}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium text-gray-700"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  onClick={onSave}
                  disabled={isPending}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs md:text-sm font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
