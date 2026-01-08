/**
 * Company Information Form Component
 * Enhanced with Jobs-style styling and portaled dropdowns
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Company } from '../types';
import type { CompanySourceType } from '../../lib/crm-graphql';

interface CompanyInfoFormProps {
  company: Company;
  isEditing: boolean;
  editFormData: Partial<Company>;
  onFieldChange: (field: string, value: string | number | CompanySourceType) => void;
}

// Portaled Select Component for Company Type
function CompanyTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value: CompanySourceType;
  onChange: (value: CompanySourceType) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only Customer type available - Manufacturers are managed in /manufacturers
  const options: { value: CompanySourceType; label: string; description: string }[] = [
    { value: 'CUSTOMER', label: 'Customer', description: 'End customers and buyers' },
  ];

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 120;
      
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setPosition({
          top: rect.top + window.scrollY - dropdownHeight - 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideTrigger = triggerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isInsideTrigger && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const getTypeColor = (type: CompanySourceType) => {
    return type === 'MANUFACTURER'
      ? { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' }
      : { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
  };

  if (disabled) {
    const colors = getTypeColor(value);
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
        <span className="text-gray-900">{selectedOption?.label || (value === 'MANUFACTURER' ? 'Manufacturer' : 'Customer')}</span>
      </div>
    );
  }

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="py-1">
        {options.map((option) => {
          const colors = getTypeColor(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
                transition-colors hover:bg-gray-50
                ${value === option.value ? 'bg-blue-50' : ''}
              `}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0`} />
              <div className="flex-1">
                <span className={`${value === option.value ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                  {option.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              </div>
              {value === option.value && (
                <svg className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    portalTarget
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          hover:border-blue-300 hover:shadow-sm cursor-pointer
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full ${getTypeColor(value).dot}`} />
          <span className="text-gray-900">{selectedOption?.label || (value === 'MANUFACTURER' ? 'Manufacturer' : 'Customer')}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownContent}
    </div>
  );
}

export default function CompanyInfoForm({
  company,
  isEditing,
  editFormData,
  onFieldChange,
}: CompanyInfoFormProps) {
  const inputBaseClass = `
    w-full px-4 py-3 border rounded-lg text-sm
    transition-all duration-200
    ${isEditing 
      ? 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400' 
      : 'border-gray-200 bg-gray-50 cursor-default'
    }
  `;

  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-5">
          {/* Company Name */}
          <div className="col-span-2">
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Company Name
            </label>
            <input
              type="text"
              value={isEditing ? editFormData.name || '' : company.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className={inputBaseClass}
              readOnly={!isEditing}
              placeholder={isEditing ? "Enter company name" : ""}
            />
          </div>

          {/* Company Type */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Type
            </label>
            <CompanyTypeSelect
              value={(isEditing ? editFormData.companySourceType : company.companySourceType) || 'CUSTOMER'}
              onChange={(value) => onFieldChange('companySourceType', value)}
              disabled={!isEditing}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </label>
            <input
              type="text"
              value={isEditing ? editFormData.phone || '' : (company.phone || '-')}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              className={inputBaseClass}
              readOnly={!isEditing}
              placeholder={isEditing ? "(555) 123-4567" : ""}
            />
          </div>

          {/* Website */}
          <div className="col-span-2">
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              Website
            </label>
            <input
              type="text"
              value={isEditing ? editFormData.website || '' : (company.website || '-')}
              onChange={(e) => onFieldChange('website', e.target.value)}
              className={inputBaseClass}
              readOnly={!isEditing}
              placeholder={isEditing ? "www.example.com" : ""}
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-5">
          <label className={labelClass}>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editFormData.tags ? (Array.isArray(editFormData.tags) ? editFormData.tags.join(', ') : editFormData.tags) : company.tags.join(', ')}
              onChange={(e) => onFieldChange('tags', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="Enter comma-separated tags (e.g. GC, Healthcare, Monitor)"
            />
          ) : (
            <div className="flex gap-2 flex-wrap items-center min-h-[44px] p-3 border border-gray-200 rounded-lg bg-gray-50">
              {company.tags.length > 0 ? (
                company.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No tags added</span>
              )}
            </div>
          )}
        </div>

        {/* Commission Rates Section - Only show for Manufacturers */}
        {((isEditing ? editFormData.companySourceType : company.companySourceType) === 'MANUFACTURER') && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Commission Rates
            </h3>
            <div className="grid grid-cols-2 gap-5">
              {/* Standard Commission Rate */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Standard Commission Rate
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editFormData.standardCommissionRate != null
                        ? (editFormData.standardCommissionRate * 100).toFixed(1)
                        : (company.standardCommissionRate != null ? (company.standardCommissionRate * 100).toFixed(1) : '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          onFieldChange('standardCommissionRate', '');
                        } else {
                          onFieldChange('standardCommissionRate', (parseFloat(value) / 100).toString());
                        }
                      }}
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="e.g. 10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                ) : (
                  <div className={inputBaseClass}>
                    {company.standardCommissionRate != null
                      ? `${(company.standardCommissionRate * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Commission rate for direct/standard sales</p>
              </div>

              {/* Warehouse Commission Rate */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Warehouse Commission Rate
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editFormData.warehouseCommissionRate != null
                        ? (editFormData.warehouseCommissionRate * 100).toFixed(1)
                        : (company.warehouseCommissionRate != null ? (company.warehouseCommissionRate * 100).toFixed(1) : '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          onFieldChange('warehouseCommissionRate', '');
                        } else {
                          onFieldChange('warehouseCommissionRate', (parseFloat(value) / 100).toString());
                        }
                      }}
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="e.g. 5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                ) : (
                  <div className={inputBaseClass}>
                    {company.warehouseCommissionRate != null
                      ? `${(company.warehouseCommissionRate * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Commission rate for warehouse sales</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
