/**
 * Condition Builder Component
 * Reusable component for building rule conditions with real API data
 * Enhanced UI matching project patterns
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { RuleConditionGroup } from '../types';
import {
  ENTITY_TYPE_OPTIONS,
  getFieldsForEntity,
  getOperatorsForFieldType,
} from '../types';
import {
  useContactSearch,
  useCompanySearch,
  useJobSearch,
  useTaskSearch,
  getContactRoles,
  getContactTerritories,
  getCompanyTypes,
  getJobTypes,
  getJobStatuses,
  getTaskStatuses,
  getTaskPriorities,
  extractAllTags,
} from '../api';

interface ConditionBuilderProps {
  conditionGroups: RuleConditionGroup[];
  onAddCondition: (groupId: string) => void;
  onRemoveCondition: (groupId: string, conditionId: string) => void;
  onUpdateCondition: (groupId: string, conditionId: string, field: string, value: string) => void;
  onAddConditionGroup: () => void;
  onRemoveConditionGroup: (groupId: string) => void;
  onUpdateGroupLogic: (groupId: string, logic: 'AND' | 'OR') => void;
}

// Entity color coding with unique SVG icons (matching LinkSelector patterns)
const ENTITY_COLORS: Record<string, { bg: string; text: string; borderColor: string }> = {
  CONTACT: { bg: 'bg-green-100', text: 'text-green-700', borderColor: 'border-green-300' },
  JOB: { bg: 'bg-blue-100', text: 'text-blue-700', borderColor: 'border-blue-300' },
  COMPANY: { bg: 'bg-purple-100', text: 'text-purple-700', borderColor: 'border-purple-300' },
};

// Entity Icons as SVG components
function EntityIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  switch (type) {
    case 'CONTACT':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'JOB':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'COMPANY':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// Hook to get ALL field values for a given entity and field (loads once, no search term dependency)
function useFieldValues(entityType: string, fieldName: string, fieldType: string) {
  const isSelectField = fieldType === 'select';

  // Load ALL entities with empty search term - this fetches up to 10,000 records
  const { data: contacts, isLoading: contactsLoading } = useContactSearch('', isSelectField && entityType === 'CONTACT');
  const { data: companies, isLoading: companiesLoading } = useCompanySearch('', isSelectField && entityType === 'COMPANY');
  const { data: jobs, isLoading: jobsLoading } = useJobSearch('', isSelectField && entityType === 'JOB');
  const { data: tasks, isLoading: tasksLoading } = useTaskSearch('', isSelectField && entityType === 'TASK');

  const isLoading = contactsLoading || companiesLoading || jobsLoading || tasksLoading;

  // Extract unique values from the loaded entities
  const allValues = useMemo(() => {
    if (!entityType || !fieldName || !isSelectField) return [];

    switch (entityType) {
      case 'CONTACT':
        if (!contacts) return [];
        switch (fieldName) {
          case 'role': return getContactRoles(contacts);
          case 'territory': return getContactTerritories(contacts);
          case 'tags': return extractAllTags(contacts);
          default: return [];
        }
      case 'COMPANY':
        if (!companies) return [];
        switch (fieldName) {
          case 'company_source_type': return getCompanyTypes(companies);
          case 'tags': return extractAllTags(companies);
          default: return [];
        }
      case 'JOB':
        if (!jobs) return [];
        switch (fieldName) {
          case 'job_type': return getJobTypes(jobs);
          case 'status_id': return getJobStatuses(jobs);
          case 'tags': return extractAllTags(jobs);
          default: return [];
        }
      case 'TASK':
        if (!tasks) return [];
        switch (fieldName) {
          case 'status': return getTaskStatuses(tasks);
          case 'priority': return getTaskPriorities(tasks);
          case 'tags': return extractAllTags(tasks);
          default: return [];
        }
      default:
        return [];
    }
  }, [entityType, fieldName, isSelectField, contacts, companies, jobs, tasks]);

  return { allValues, isLoading };
}

// Enhanced searchable dropdown component
function SearchableDropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  isLoading,
  entityType,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  isLoading?: boolean;
  entityType?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const colors = entityType ? ENTITY_COLORS[entityType] : null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg text-left transition-all flex items-center justify-between gap-2 ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
              : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <span className={`flex items-center gap-2 truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {colors && value && entityType && (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${colors.bg} ${colors.text}`}>
              <EntityIcon type={entityType} className="w-3.5 h-3.5" />
            </span>
          )}
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
              Loading...
            </span>
          ) : (
            value || placeholder
          )}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
                Loading options...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {options.length === 0 ? 'No options available' : 'No matches found'}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-2 ${
                    value === opt
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {colors && entityType && (
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${colors.bg} ${colors.text}`}>
                      <EntityIcon type={entityType} className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {opt}
                  {value === opt && (
                    <svg className="ml-auto w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Search-based value selector component for select fields
function SearchableValueDropdown({
  entityType,
  fieldName,
  fieldType,
  value,
  onChange,
  disabled,
}: {
  entityType: string;
  fieldName: string;
  fieldType: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load ALL values once (no search term dependency - fetches up to 10,000 records)
  const { allValues, isLoading } = useFieldValues(entityType, fieldName, fieldType);

  // Filter values locally based on search term
  const filteredValues = useMemo(() => {
    if (!searchTerm) return allValues;
    return allValues.filter((val: string) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allValues, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg text-left transition-all flex items-center justify-between gap-2 ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
              : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {isLoading ? 'Loading values...' : (value || 'Select or type value...')}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  onChange(searchTerm.trim());
                  setIsOpen(false);
                  setSearchTerm('');
                }
              }}
              placeholder="Type to filter or enter custom value..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1 px-1">Press Enter to use custom value</p>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
                Loading values...
              </div>
            ) : filteredValues.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {searchTerm ? (
                  <span>No matches found. Press Enter to use &quot;{searchTerm}&quot;</span>
                ) : (
                  allValues.length === 0 ? 'No values available' : 'Start typing to filter...'
                )}
              </div>
            ) : (
              filteredValues.map((opt: string) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    value === opt
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                  {value === opt && (
                    <svg className="inline ml-2 w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Value selector component
function ValueSelector({
  entityType,
  fieldName,
  fieldType,
  value,
  onChange,
  disabled,
}: {
  entityType: string;
  fieldName: string;
  fieldType: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  // For non-select fields, show text input
  if (fieldType !== 'select') {
    return (
      <input
        type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value..."
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-all ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white'
        }`}
      />
    );
  }

  // For select fields, show search-based dropdown
  return (
    <SearchableValueDropdown
      entityType={entityType}
      fieldName={fieldName}
      fieldType={fieldType}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default function ConditionBuilder({
  conditionGroups,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onAddConditionGroup,
  onRemoveConditionGroup,
  onUpdateGroupLogic,
}: ConditionBuilderProps) {
  return (
    <div className="space-y-4">
      {conditionGroups.map((group, groupIndex) => (
        <div
          key={group.id}
          className={`border rounded-xl p-5 transition-all ${
            groupIndex > 0
              ? 'border-blue-200 bg-blue-50/30'
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* OR Group Header */}
          {groupIndex > 0 && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  OR
                </span>
                <span className="text-sm text-gray-600">Alternative condition group</span>
              </div>
              <button
                onClick={() => onRemoveConditionGroup(group.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove group"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Conditions */}
          <div className="space-y-3">
            {group.conditions.map((condition, conditionIndex) => {
              const selectedEntityFields = getFieldsForEntity(condition.entity);
              const selectedField = selectedEntityFields.find(f => f.value === condition.field);
              const availableOperators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];
              const entityColor = condition.entity ? ENTITY_COLORS[condition.entity] : null;

              return (
                <div key={condition.id}>
                  {/* AND separator between conditions */}
                  {conditionIndex > 0 && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {group.logic}
                      </span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                  )}

                  {/* Condition row */}
                  <div className="flex items-start gap-2">
                    {/* Entity badge indicator */}
                    {entityColor && condition.entity && (
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 ${entityColor.bg} ${entityColor.text}`}>
                        <EntityIcon type={condition.entity} className="w-4 h-4" />
                      </div>
                    )}
                    {!entityColor && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 bg-gray-100">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}

                    {/* Condition fields */}
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      {/* Entity Type */}
                      <div className="col-span-3">
                        <SearchableDropdown
                          value={condition.entity ? ENTITY_TYPE_OPTIONS.find(e => e.value === condition.entity)?.label || '' : ''}
                          options={ENTITY_TYPE_OPTIONS.map(e => e.label)}
                          onChange={(label) => {
                            const entity = ENTITY_TYPE_OPTIONS.find(e => e.label === label)?.value || '';
                            onUpdateCondition(group.id, condition.id, 'entity', entity);
                            onUpdateCondition(group.id, condition.id, 'field', '');
                            onUpdateCondition(group.id, condition.id, 'operator', '');
                            onUpdateCondition(group.id, condition.id, 'value', '');
                          }}
                          placeholder="Select entity..."
                          disabled={false}
                          entityType={condition.entity}
                        />
                      </div>

                      {/* Field */}
                      <div className="col-span-3">
                        <SearchableDropdown
                          value={selectedField?.label || ''}
                          options={selectedEntityFields.map(f => f.label)}
                          onChange={(label) => {
                            const field = selectedEntityFields.find(f => f.label === label)?.value || '';
                            onUpdateCondition(group.id, condition.id, 'field', field);
                            onUpdateCondition(group.id, condition.id, 'operator', '');
                            onUpdateCondition(group.id, condition.id, 'value', '');
                          }}
                          placeholder="Select field..."
                          disabled={!condition.entity}
                        />
                      </div>

                      {/* Operator */}
                      <div className="col-span-2">
                        <SearchableDropdown
                          value={availableOperators.find(o => o.value === condition.operator)?.label || ''}
                          options={availableOperators.map(o => o.label)}
                          onChange={(label) => {
                            const operator = availableOperators.find(o => o.label === label)?.value || '';
                            onUpdateCondition(group.id, condition.id, 'operator', operator);
                          }}
                          placeholder="Operator..."
                          disabled={!condition.field}
                        />
                      </div>

                      {/* Value */}
                      <div className="col-span-4">
                        <ValueSelector
                          entityType={condition.entity}
                          fieldName={condition.field}
                          fieldType={selectedField?.type || 'text'}
                          value={condition.value}
                          onChange={(val) => onUpdateCondition(group.id, condition.id, 'value', val)}
                          disabled={!condition.operator || condition.operator === 'IS_NULL' || condition.operator === 'IS_NOT_NULL'}
                        />
                      </div>
                    </div>

                    {/* Remove condition button */}
                    <div className="flex-shrink-0">
                      {group.conditions.length > 1 && (
                        <button
                          onClick={() => onRemoveCondition(group.id, condition.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove condition"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add condition button */}
          <button
            onClick={() => onAddCondition(group.id)}
            className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add {group.logic} condition
          </button>
        </div>
      ))}

      {/* Add OR group button */}
      <button
        onClick={onAddConditionGroup}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
        </svg>
        Add OR condition group
      </button>
    </div>
  );
}
