/**
 * InsideRepSplitsModal Component
 * Modal for managing inside rep commission splits at the order header level
 * Uses API-based user search like quotes-v2
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RepSplit } from '../../../types';
import { useUserSearch } from '../../../../api';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';

// Commission split rep interface matching quotes-v2
interface CommissionSplitRep {
  id: string;
  repId: string;
  repName: string;
  percentage: number;
}

interface InsideRepSplitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  splits: RepSplit[];
  onSave: (splits: RepSplit[]) => void;
}

export function InsideRepSplitsModal({
  isOpen,
  onClose,
  splits,
  onSave,
}: InsideRepSplitsModalProps) {
  const [localSplits, setLocalSplits] = useState<CommissionSplitRep[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);

  // Search for inside reps using API
  const { data: repResults, isLoading: isRepLoading } = useUserSearch(
    searchTerm,
    { isInside: true, isOutside: false },
    searchEnabled
  );

  // Transform search results to dropdown options
  const repOptions = useMemo(() => {
    return (repResults || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
      fullName: u.fullName,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }, [repResults]);

  // Initialize local state from props
  useEffect(() => {
    if (isOpen) {
      const initialSplits: CommissionSplitRep[] = splits.map((s, idx) => ({
        id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
        repId: s.repId,
        repName: s.repName,
        percentage: s.percentage,
      }));
      setLocalSplits(initialSplits);
    }
  }, [isOpen, splits]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setSearchEnabled(true);
  }, []);

  // Add rep to split
  const addRepToSplit = useCallback((rep: { id: string; label: string }) => {
    const newRep: CommissionSplitRep = {
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
      repId: rep.id,
      repName: rep.label,
      percentage: 0,
    };

    const newSplits = [...localSplits, newRep];
    // Auto-distribute percentages
    const perRep = Math.floor(100 / newSplits.length);
    const remainder = 100 - (perRep * newSplits.length);
    const updatedSplits = newSplits.map((r, idx) => ({
      ...r,
      percentage: idx === newSplits.length - 1 ? perRep + remainder : perRep,
    }));
    setLocalSplits(updatedSplits);
  }, [localSplits]);

  // Remove rep from split
  const removeRepFromSplit = useCallback((repId: string) => {
    const newSplits = localSplits.filter(r => r.id !== repId);
    if (newSplits.length > 0) {
      // Re-distribute percentages
      const perRep = Math.floor(100 / newSplits.length);
      const remainder = 100 - (perRep * newSplits.length);
      const updatedSplits = newSplits.map((r, idx) => ({
        ...r,
        percentage: idx === newSplits.length - 1 ? perRep + remainder : perRep,
      }));
      setLocalSplits(updatedSplits);
    } else {
      setLocalSplits([]);
    }
  }, [localSplits]);

  // Update split percentage
  const updateSplitPercentage = useCallback((repId: string, percentage: string) => {
    setLocalSplits(reps => reps.map(r =>
      r.id === repId ? { ...r, percentage: parseInt(percentage) || 0 } : r
    ));
  }, []);

  if (!isOpen) return null;

  const handleCancel = () => {
    setLocalSplits([]);
    onSave([]);
    onClose();
  };

  const handleSave = () => {
    const totalPercentage = localSplits.reduce((sum, r) => sum + r.percentage, 0);
    if (totalPercentage !== 100) {
      return; // Button should be disabled anyway
    }
    // Convert back to RepSplit format
    const savedSplits: RepSplit[] = localSplits.map(r => ({
      repId: r.repId,
      repName: r.repName,
      percentage: r.percentage,
    }));
    onSave(savedSplits);
    onClose();
  };

  const totalPercentage = localSplits.reduce((sum, r) => sum + r.percentage, 0);
  const isValid = totalPercentage === 100;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Split Inside Rep Commission</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {/* Rep list */}
            <div className="space-y-3 mb-4">
              {localSplits.map((rep) => (
                <div key={rep.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{rep.repName}</span>
                  </div>
                  {/* Percentage is auto-calculated, hidden from UI */}
                  {localSplits.length > 1 && (
                    <button
                      onClick={() => removeRepFromSplit(rep.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add rep search */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Add Rep</label>
              <SearchableDropdownV2
                value=""
                displayValue=""
                onChange={(id, label) => {
                  if (id && !localSplits.some(r => r.repId === id)) {
                    addRepToSplit({ id, label });
                  }
                }}
                options={repOptions.filter(opt => !localSplits.some(r => r.repId === opt.id))}
                onSearch={handleSearch}
                isLoading={isRepLoading}
                placeholder="Search reps to add..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={localSplits.length === 0}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
