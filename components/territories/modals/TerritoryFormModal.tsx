'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TerritoryBadge } from '../components/TerritoryBadge';
import {
  type Territory,
  type TerritoryType,
  type TerritoryInput,
  type SplitRateInput,
  type TerritoryManager,
  getTerritoryTypeLabel,
  getChildTerritoryType,
  generateTerritoryCode,
  validateSplitRates,
} from '../../lib/graphql/territories';
import { searchUsers, type UserSearchResult } from '../../lib/api/search';
import { useAssignTerritoryManager, useRemoveTerritoryManager } from '../api/useTerritories';

interface TerritoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: TerritoryInput) => Promise<{ id: string } | void>;
  territory?: Territory | null;
  parentId?: string | null;
  parentType?: TerritoryType | null;
  parentName?: string;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

export function TerritoryFormModal({
  isOpen,
  onClose,
  onSave,
  territory,
  parentId,
  parentType,
  parentName,
}: TerritoryFormModalProps) {
  const isEditing = !!territory;
  const territoryType: TerritoryType = territory
    ? territory.territoryType
    : parentType
    ? (getChildTerritoryType(parentType) as TerritoryType)
    : 'REGION';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [active, setActive] = useState(true);
  const [stateCodes, setStateCodes] = useState<string[]>([]);
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [splitRates, setSplitRates] = useState<(SplitRateInput & { userName?: string })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rep search state
  const [repSearchTerm, setRepSearchTerm] = useState('');
  const [repSearchResults, setRepSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingReps, setIsSearchingReps] = useState(false);
  const [showRepDropdown, setShowRepDropdown] = useState(false);

  // Manager state
  const [managers, setManagers] = useState<TerritoryManager[]>([]);
  const [originalManagerIds, setOriginalManagerIds] = useState<Set<string>>(new Set());
  const [managerSearchTerm, setManagerSearchTerm] = useState('');
  const [managerSearchResults, setManagerSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingManagers, setIsSearchingManagers] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  // Manager mutations
  const assignManager = useAssignTerritoryManager();
  const removeManager = useRemoveTerritoryManager();

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (territory) {
        setName(territory.name);
        setCode(territory.code);
        setCodeManuallyEdited(true);
        setActive(territory.active);
        setStateCodes(territory.stateCodes || []);
        setZipCodes(territory.zipCodes || []);
        setSplitRates(
          territory.splitRates?.map((sr) => ({
            userId: sr.userId,
            splitRate: sr.splitRate,
            position: sr.position,
            userName: sr.user.fullName,
          })) || []
        );
        setManagers(territory.managers || []);
        setOriginalManagerIds(new Set((territory.managers || []).map((m) => m.id)));
      } else {
        setName('');
        setCode('');
        setCodeManuallyEdited(false);
        setActive(true);
        setStateCodes([]);
        setZipCodes([]);
        setSplitRates([]);
        setManagers([]);
        setOriginalManagerIds(new Set());
      }
      setZipCodeInput('');
      setStateSearchTerm('');
      setManagerSearchTerm('');
      setErrors({});
    }
  }, [isOpen, territory]);

  // Auto-generate code from name
  useEffect(() => {
    if (!codeManuallyEdited && name) {
      setCode(generateTerritoryCode(name));
    }
  }, [name, codeManuallyEdited]);

  // Search for outside reps
  const handleRepSearch = useCallback(async (term: string) => {
    setRepSearchTerm(term);
    if (term.length < 2) {
      setRepSearchResults([]);
      return;
    }

    setIsSearchingReps(true);
    try {
      const results = await searchUsers({
        searchTerm: term,
        isOutside: true,
        enabled: true,
        limit: 10,
      });
      // Filter out already added reps
      const existingIds = new Set(splitRates.map((sr) => sr.userId));
      setRepSearchResults(results.filter((r) => !existingIds.has(r.id)));
    } catch (error) {
      console.error('Error searching reps:', error);
    } finally {
      setIsSearchingReps(false);
    }
  }, [splitRates]);

  const handleAddRep = (rep: UserSearchResult) => {
    const totalReps = splitRates.length + 1;
    // Calculate even share, giving remainder to last rep to total exactly 100
    const baseShare = Math.floor((100 / totalReps) * 100) / 100; // 2 decimal places, rounded down
    const lastShare = (100 - baseShare * (totalReps - 1)).toFixed(2);

    const allReps = [
      ...splitRates.map((sr) => ({
        ...sr,
        userName: sr.userName,
      })),
      {
        userId: rep.id,
        splitRate: '0',
        position: splitRates.length,
        userName: rep.fullName || `${rep.firstName} ${rep.lastName}`,
      },
    ];

    const updatedSplits = allReps.map((sr, idx) => ({
      ...sr,
      splitRate: idx === totalReps - 1 ? lastShare : baseShare.toFixed(2),
      position: idx,
    }));

    setSplitRates(updatedSplits);
    setRepSearchTerm('');
    setRepSearchResults([]);
    setShowRepDropdown(false);
  };

  const handleRemoveRep = (userId: string) => {
    const remaining = splitRates.filter((sr) => sr.userId !== userId);
    if (remaining.length > 0) {
      const totalReps = remaining.length;
      const baseShare = Math.floor((100 / totalReps) * 100) / 100;
      const lastShare = (100 - baseShare * (totalReps - 1)).toFixed(2);
      setSplitRates(
        remaining.map((sr, idx) => ({
          ...sr,
          splitRate: idx === totalReps - 1 ? lastShare : baseShare.toFixed(2),
          position: idx,
        }))
      );
    } else {
      setSplitRates([]);
    }
  };

  const handleSplitRateChange = (userId: string, value: string) => {
    setSplitRates((prev) =>
      prev.map((sr) => (sr.userId === userId ? { ...sr, splitRate: value } : sr))
    );
  };

  const handleAddZipCodes = () => {
    const codes = zipCodeInput
      .split(/[,\s]+/)
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z));
    if (codes.length > 0) {
      setZipCodes((prev) => [...new Set([...prev, ...codes])]);
      setZipCodeInput('');
    }
  };

  const handleRemoveZipCode = (zip: string) => {
    setZipCodes((prev) => prev.filter((z) => z !== zip));
  };

  const handleAddState = (stateCode: string) => {
    if (!stateCodes.includes(stateCode)) {
      setStateCodes((prev) => [...prev, stateCode]);
    }
    setStateSearchTerm('');
    setShowStateDropdown(false);
  };

  const handleRemoveState = (stateCode: string) => {
    setStateCodes((prev) => prev.filter((s) => s !== stateCode));
  };

  // Filter states based on search term
  const filteredStates = stateSearchTerm
    ? US_STATES.filter(
        (state) =>
          !stateCodes.includes(state.code) &&
          (state.code.toLowerCase().includes(stateSearchTerm.toLowerCase()) ||
            state.name.toLowerCase().includes(stateSearchTerm.toLowerCase()))
      )
    : US_STATES.filter((state) => !stateCodes.includes(state.code));

  // Manager search handler
  const handleManagerSearch = useCallback(async (term: string) => {
    setManagerSearchTerm(term);
    if (term.length < 2) {
      setManagerSearchResults([]);
      return;
    }

    setIsSearchingManagers(true);
    try {
      const results = await searchUsers({
        searchTerm: term,
        enabled: true,
        limit: 10,
      });
      // Filter out already added managers
      const existingIds = new Set(managers.map((m) => m.id));
      setManagerSearchResults(results.filter((r) => !existingIds.has(r.id)));
    } catch (error) {
      console.error('Error searching managers:', error);
    } finally {
      setIsSearchingManagers(false);
    }
  }, [managers]);

  const handleAddManager = (user: UserSearchResult) => {
    // Add to local state only - will be saved when "Save Changes" is clicked
    setManagers((prev) => [
      ...prev,
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName || `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    ]);
    setManagerSearchTerm('');
    setManagerSearchResults([]);
    setShowManagerDropdown(false);
  };

  const handleRemoveManager = (userId: string) => {
    // Remove from local state only - will be saved when "Save Changes" is clicked
    setManagers((prev) => prev.filter((m) => m.id !== userId));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!code.trim()) {
      newErrors.code = 'Code is required';
    }

    // Validate split rates
    if (splitRates.length > 0) {
      const validation = validateSplitRates(splitRates);
      if (!validation.valid) {
        newErrors.splitRates = validation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);
    try {
      const input: TerritoryInput = {
        name: name.trim(),
        code: code.trim(),
        territoryType,
        parentId: parentId || territory?.parentId || undefined,
        active,
        stateCodes: stateCodes.length > 0 ? stateCodes : undefined,
        zipCodes: zipCodes.length > 0 ? zipCodes : undefined,
        splitRates:
          splitRates.length > 0
            ? splitRates.map(({ userId, splitRate, position }) => ({
                userId,
                splitRate,
                position,
              }))
            : undefined,
      };

      // Save the territory first
      const result = await onSave(input);
      const territoryId = result?.id || territory?.id;

      // Apply manager changes if we have a territory ID
      if (territoryId) {
        const currentManagerIds = new Set(managers.map((m) => m.id));

        // Find managers to add (in current but not in original)
        const managersToAdd = managers.filter((m) => !originalManagerIds.has(m.id));

        // Find managers to remove (in original but not in current)
        const managerIdsToRemove = [...originalManagerIds].filter((id) => !currentManagerIds.has(id));

        // Apply additions
        for (const manager of managersToAdd) {
          try {
            await assignManager.mutateAsync({
              territoryId,
              userId: manager.id,
            });
          } catch (error) {
            console.error('Error assigning manager:', manager.fullName, error);
          }
        }

        // Apply removals
        for (const userId of managerIdsToRemove) {
          try {
            await removeManager.mutateAsync({
              territoryId,
              userId,
            });
          } catch (error) {
            console.error('Error removing manager:', userId, error);
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving territory:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalSplitRate = splitRates.reduce(
    (sum, sr) => sum + (parseFloat(sr.splitRate) || 0),
    0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit' : 'Create'} {getTerritoryTypeLabel(territoryType)}
            </h2>
            <TerritoryBadge type={territoryType} size="md" />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Parent Info */}
            {(parentName || territory?.parent) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Parent: </span>
                <span className="text-sm font-medium text-gray-900">
                  {parentName || territory?.parent?.name}
                </span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., West Coast"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setCodeManuallyEdited(true);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., WEST-COAST"
                />
                {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  active ? 'bg-[var(--primary)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    active ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">Active</span>
            </div>

            {/* States Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                States
              </label>

              {/* Selected States */}
              {stateCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {stateCodes.map((code) => {
                    const state = US_STATES.find((s) => s.code === code);
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => handleRemoveState(code)}
                          className="hover:text-blue-900"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* State Search Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  value={stateSearchTerm}
                  onChange={(e) => {
                    setStateSearchTerm(e.target.value);
                    setShowStateDropdown(true);
                  }}
                  onFocus={() => setShowStateDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="Search and add states..."
                />
                {showStateDropdown && filteredStates.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                    {filteredStates.map((state) => (
                      <button
                        key={state.code}
                        type="button"
                        onClick={() => handleAddState(state.code)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-900">{state.name}</span>
                        <span className="text-xs text-gray-500">{state.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Zip Codes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Codes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={zipCodeInput}
                  onChange={(e) => setZipCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddZipCodes();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="Enter zip codes (comma or space separated)"
                />
                <button
                  type="button"
                  onClick={handleAddZipCodes}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {zipCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {zipCodes.map((zip) => (
                    <span
                      key={zip}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      {zip}
                      <button
                        type="button"
                        onClick={() => handleRemoveZipCode(zip)}
                        className="hover:text-red-500"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Outside Rep Splits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outside Rep Splits
              </label>

              {/* Total Progress */}
              {splitRates.length > 0 && (
                <div className="mb-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span
                      className={`text-sm font-bold ${
                        Math.abs(totalSplitRate - 100) < 0.01
                          ? 'text-green-600'
                          : totalSplitRate > 100
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {totalSplitRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        Math.abs(totalSplitRate - 100) < 0.01
                          ? 'bg-green-500'
                          : totalSplitRate > 100
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(totalSplitRate, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Rep List */}
              {splitRates.length > 0 && (
                <div className="space-y-2 mb-3">
                  {splitRates.map((sr) => (
                    <div
                      key={sr.userId}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-green-700">
                          {sr.userName
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {sr.userName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={sr.splitRate}
                          onChange={(e) => handleSplitRateChange(sr.userId, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRep(sr.userId)}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Rep Search */}
              <div className="relative">
                <input
                  type="text"
                  value={repSearchTerm}
                  onChange={(e) => handleRepSearch(e.target.value)}
                  onFocus={() => setShowRepDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="Search outside reps to add..."
                />
                {showRepDropdown && repSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {repSearchResults.map((rep) => (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => handleAddRep(rep)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-green-700">
                            {(rep.fullName || `${rep.firstName} ${rep.lastName}`)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rep.fullName || `${rep.firstName} ${rep.lastName}`}
                          </div>
                          {rep.email && (
                            <div className="text-xs text-gray-500">{rep.email}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {isSearchingReps && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {errors.splitRates && (
                <p className="mt-2 text-xs text-red-500">{errors.splitRates}</p>
              )}
            </div>

            {/* Territory Managers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Territory Managers
              </label>

              {/* Manager List */}
                  {managers.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {managers.map((manager) => (
                        <div
                          key={manager.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-700">
                              {manager.fullName
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {manager.fullName}
                            </div>
                            {manager.email && (
                              <div className="text-xs text-gray-500 truncate">
                                {manager.email}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveManager(manager.id)}
                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Manager Search */}
                  <div className="relative">
                    <input
                      type="text"
                      value={managerSearchTerm}
                      onChange={(e) => handleManagerSearch(e.target.value)}
                      onFocus={() => setShowManagerDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      placeholder="Search users to add as manager..."
                    />
                    {showManagerDropdown && managerSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {managerSearchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleAddManager(user)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-blue-700">
                                {(user.fullName || `${user.firstName} ${user.lastName}`)
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName || `${user.firstName} ${user.lastName}`}
                              </div>
                              {user.email && (
                                <div className="text-xs text-gray-500">{user.email}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {isSearchingManagers && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Territory'}
          </button>
        </div>
      </div>
    </div>
  );
}
