/**
 * Contact Information Form Component
 * Enhanced with Jobs-style UI patterns and portaled dropdowns
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CONTACT_ROLES } from '../constants';
import type { Contact } from '../types';

// Portaled Role Select Component
interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function RoleSelect({ value, onChange, disabled }: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(CONTACT_ROLES.length * 44 + 8, 250);
      
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

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="max-h-60 overflow-y-auto py-1">
        <button
          type="button"
          onClick={() => {
            onChange('');
            setIsOpen(false);
          }}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors text-gray-500"
        >
          Select Role...
        </button>
        {CONTACT_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => {
              onChange(role);
              setIsOpen(false);
            }}
            className={`
              w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
              transition-colors hover:bg-gray-50
              ${value === role ? 'bg-blue-50' : ''}
            `}
          >
            <span className={`${value === role ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
              {role}
            </span>
            {value === role && (
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>,
    portalTarget
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-blue-300 hover:shadow-sm cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {value ? (
            <span className="text-gray-900 truncate">{value}</span>
          ) : (
            <span className="text-gray-400">Select Role...</span>
          )}
        </div>
        {!disabled && (
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {dropdownContent}
    </div>
  );
}

interface ContactInfoFormProps {
  contact: Contact;
  isEditing: boolean;
  editFormData: Partial<Contact>;
  onFieldChange: (field: string, value: string) => void;
}

export default function ContactInfoForm({
  contact,
  isEditing,
  editFormData,
  onFieldChange,
}: ContactInfoFormProps) {
  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";
  const inputClass = `
    w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
    placeholder:text-gray-400
  `;
  const readOnlyClass = `
    w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600
    cursor-not-allowed
  `;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Section Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Contact Information
        </h2>
      </div>
      
      {/* Form Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* First Name */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              First Name
            </label>
            <input
              type="text"
              value={isEditing ? editFormData.firstName || '' : contact.firstName}
              onChange={(e) => onFieldChange('firstName', e.target.value)}
              className={isEditing ? inputClass : readOnlyClass}
              readOnly={!isEditing}
              placeholder="Enter first name"
            />
          </div>
          
          {/* Last Name */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Last Name
            </label>
            <input
              type="text"
              value={isEditing ? editFormData.lastName || '' : contact.lastName}
              onChange={(e) => onFieldChange('lastName', e.target.value)}
              className={isEditing ? inputClass : readOnlyClass}
              readOnly={!isEditing}
              placeholder="Enter last name"
            />
          </div>
          
          {/* Role */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Role
            </label>
            {isEditing ? (
              <RoleSelect
                value={editFormData.role || contact.role}
                onChange={(value) => onFieldChange('role', value)}
              />
            ) : (
              <input
                type="text"
                value={contact.role || '-'}
                className={readOnlyClass}
                readOnly
              />
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </label>
            <input
              type="email"
              value={isEditing ? editFormData.email || '' : (contact.email || '-')}
              onChange={(e) => onFieldChange('email', e.target.value)}
              className={isEditing ? inputClass : readOnlyClass}
              readOnly={!isEditing}
              placeholder="Enter email"
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
              type="tel"
              value={isEditing ? editFormData.phone || '' : (contact.phone || '-')}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              className={isEditing ? inputClass : readOnlyClass}
              readOnly={!isEditing}
              placeholder="Enter phone"
            />
          </div>
          
          {/* Company */}
          <div>
            <label className={labelClass}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company
            </label>
            <input
              type="text"
              value={contact.company || '-'}
              className={readOnlyClass}
              readOnly
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <label className={labelClass}>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </label>
          <div className="flex gap-2 flex-wrap mt-2">
            {contact.tags.length > 0 ? (
              contact.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">No tags assigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
