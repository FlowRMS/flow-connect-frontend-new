/**
 * Pre-Opportunity Detail Header Component
 * Enhanced with Jobs-style styling and visual hierarchy
 */

import React, { useState } from 'react';
import type { PreOpportunity, PreOpportunityStatus } from '../types';
import { formatDate, formatCurrency, getOwnerInitials, getOwnerColor } from '../utils';
import { PDFBuilder } from '@/components/shared/pdf-builder';
import { ExcelBuilder } from '@/components/shared/excel-builder';
import { ManufacturerExcelModal } from '@/components/shared/manufacturer-excel';

// Status color mapping
const STATUS_COLORS: Record<PreOpportunityStatus, { bg: string; text: string; dot: string }> = {
  'QUALIFIED': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'NEGOTIATION': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'FOLLOW_UP': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'WAITING_ON_FACTORY': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'LOST': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'WON': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

const STATUS_LABELS: Record<PreOpportunityStatus, string> = {
  'QUALIFIED': 'Qualified',
  'NEGOTIATION': 'Negotiation',
  'FOLLOW_UP': 'Follow Up',
  'WAITING_ON_FACTORY': 'Waiting on Factory',
  'LOST': 'Lost',
  'WON': 'Won',
};

interface PreOpportunityDetailHeaderProps {
  preOpp: PreOpportunity;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onBack: () => void;
  onEditClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onCreateQuote?: () => void;
}

export function PreOpportunityDetailHeader({
  preOpp,
  isEditing,
  isSaving,
  isDeleting,
  onBack,
  onEditClick,
  onSave,
  onCancel,
  onDelete,
  onCreateQuote,
}: PreOpportunityDetailHeaderProps) {
  const statusColors = STATUS_COLORS[preOpp.status] || STATUS_COLORS.QUALIFIED;
  const [showPDFBuilder, setShowPDFBuilder] = useState(false);
  const [showExcelBuilder, setShowExcelBuilder] = useState(false);
  const [showManufacturerExcel, setShowManufacturerExcel] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const ownerInitials = getOwnerInitials(preOpp.createdBy);
  const ownerColor = getOwnerColor(preOpp.id);

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
        <span className="text-xs md:text-sm font-medium">Back to Pre-Opportunities</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left Side - Pre-Opp Info */}
          <div className="flex items-start gap-3 md:gap-4">
            {/* Pre-Opp Icon */}
            <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Pre-Opp Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)] truncate">{preOpp.entityNumber}</h1>
                <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                  <span className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${statusColors.dot}`}></span>
                  {STATUS_LABELS[preOpp.status]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-blue-600 text-base md:text-lg">
                  {formatCurrency(preOpp.balance?.total || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(preOpp.entityDate)}
                </span>
                <span className="flex items-center gap-1.5 md:gap-2">
                  <div
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${ownerColor} flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}
                  >
                    {ownerInitials}
                  </div>
                  <span className="truncate max-w-[100px] md:max-w-none">{preOpp.createdBy}</span>
                </span>
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
                  disabled={isSaving}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? (
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
                {/* PDF Button with Excel Dropdown */}
                <div className="relative">
                  <div className="flex">
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        setShowPDFBuilder(true);
                      }}
                      disabled={!preOpp.id}
                      className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-2.5 rounded-l-lg text-xs md:text-sm font-medium transition-all ${
                        !preOpp.id
                          ? 'bg-red-600 text-white opacity-50 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
                      </svg>
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                      onClick={() => setShowDownloadMenu((prev) => !prev)}
                      disabled={!preOpp.id}
                      className={`px-2 md:px-2.5 py-2 md:py-2.5 rounded-r-lg text-white transition-all border-l border-red-500 ${
                        !preOpp.id
                          ? 'bg-red-600 opacity-50 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      aria-label="Download options"
                    >
                      <svg className="w-3 h-3 md:w-3.5 md:h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  {showDownloadMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                          onClick={() => {
                            setShowExcelBuilder(true);
                            setShowDownloadMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors rounded-t-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Excel
                        </button>
                        <button
                          onClick={() => {
                            setShowManufacturerExcel(true);
                            setShowDownloadMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors rounded-b-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                          </svg>
                          Manufacturer Excel
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-xs md:text-sm font-medium"
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h12M6 6v10a2 2 0 002 2h4a2 2 0 002-2V6M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                </button>
                {onCreateQuote && (
                  <button
                    onClick={onCreateQuote}
                    title="Create a new quote from this pre-opportunity"
                    className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-xs md:text-sm font-medium shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="hidden md:inline">Convert to Quote</span>
                    <span className="hidden sm:inline md:hidden">To Quote</span>
                    <span className="sm:hidden">Quote</span>
                  </button>
                )}
                <button
                  onClick={onEditClick}
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs md:text-sm font-medium"
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Edit Pre-Opp</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Builder */}
      <PDFBuilder
        entityId={preOpp.id}
        entityType="PRE_OPPORTUNITIES"
        isOpen={showPDFBuilder}
        onClose={() => setShowPDFBuilder(false)}
      />

      {/* Excel Builder */}
      <ExcelBuilder
        entityId={preOpp.id}
        entityType="PRE_OPPORTUNITIES"
        isOpen={showExcelBuilder}
        onClose={() => setShowExcelBuilder(false)}
      />

      <ManufacturerExcelModal
        entityId={preOpp.id}
        entityType="PRE_OPPORTUNITIES"
        isOpen={showManufacturerExcel}
        onClose={() => setShowManufacturerExcel(false)}
      />
    </div>
  );
}
