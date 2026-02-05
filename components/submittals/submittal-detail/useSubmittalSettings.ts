'use client';

import { useState, useMemo } from 'react';
import type { Submittal } from '../../../lib/types/submittals';

interface UseSubmittalSettingsProps {
  submittal: Submittal;
  onUpdate?: (updates: Partial<Submittal>) => void;
}

export function useSubmittalSettings({ submittal, onUpdate }: UseSubmittalSettingsProps) {
  const [editingJobName, setEditingJobName] = useState(submittal.jobName);
  const [editingJobLocation, setEditingJobLocation] = useState(submittal.jobLocation || '');
  const [editingBidDate, setEditingBidDate] = useState(submittal.bidDate?.split('T')[0] || '');
  const [editingTags, setEditingTags] = useState<string[]>(submittal.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = () => {
    if (newTagInput.trim() && !editingTags.includes(newTagInput.trim())) {
      setEditingTags(prev => [...prev, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSaveSettings = () => {
    if (!onUpdate) return;
    onUpdate({
      jobName: editingJobName,
      jobLocation: editingJobLocation || undefined,
      bidDate: editingBidDate || undefined,
      tags: editingTags,
    });
  };

  const hasSettingsChanges = useMemo(() => {
    return (
      editingJobName !== submittal.jobName ||
      editingJobLocation !== (submittal.jobLocation || '') ||
      editingBidDate !== (submittal.bidDate?.split('T')[0] || '') ||
      JSON.stringify(editingTags) !== JSON.stringify(submittal.tags || [])
    );
  }, [editingJobName, editingJobLocation, editingBidDate, editingTags, submittal]);

  return {
    editingJobName,
    setEditingJobName,
    editingJobLocation,
    setEditingJobLocation,
    editingBidDate,
    setEditingBidDate,
    editingTags,
    newTagInput,
    setNewTagInput,
    handleAddTag,
    handleRemoveTag,
    handleSaveSettings,
    hasSettingsChanges,
  };
}
