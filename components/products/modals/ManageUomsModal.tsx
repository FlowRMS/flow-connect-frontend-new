'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useProductUoms,
  useCreateProductUom,
  useUpdateProductUom,
  useDeleteProductUom,
  type ProductUom,
  type CreateProductUomInput,
} from '../api/useProductsApi';

interface ManageUomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageUomsModal({ isOpen, onClose }: ManageUomsModalProps) {
  // UOM management state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUom, setEditingUom] = useState<ProductUom | null>(null);
  const [deletingUom, setDeletingUom] = useState<ProductUom | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    multiply: boolean;
    multiplyBy: number | undefined;
  }>({
    title: '',
    description: '',
    multiply: false,
    multiplyBy: undefined,
  });

  // API hooks
  const { data: uoms = [], isLoading: isLoadingUoms, refetch: refetchUoms } = useProductUoms();
  const createMutation = useCreateProductUom();
  const updateMutation = useUpdateProductUom();
  const deleteMutation = useDeleteProductUom();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setEditingUom(null);
      setDeletingUom(null);
      setFormData({ title: '', description: '', multiply: false, multiplyBy: undefined });
    }
  }, [isOpen]);

  // Handle create UOM
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const input: CreateProductUomInput = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      multiply: formData.multiply,
      multiplyBy: formData.multiply ? formData.multiplyBy : undefined,
    };

    try {
      await createMutation.mutateAsync(input);
      toast.success('UOM created successfully');
      setFormData({ title: '', description: '', multiply: false, multiplyBy: undefined });
      setShowCreateForm(false);
      refetchUoms();
    } catch (error) {
      console.error('Failed to create UOM:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create UOM');
    }
  };

  // Handle update UOM
  const handleUpdate = async () => {
    if (!editingUom || !formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingUom.id,
        input: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          multiply: formData.multiply,
          multiplyBy: formData.multiply ? formData.multiplyBy : undefined,
        },
      });
      toast.success('UOM updated successfully');
      setEditingUom(null);
      setFormData({ title: '', description: '', multiply: false, multiplyBy: undefined });
      refetchUoms();
    } catch (error) {
      console.error('Failed to update UOM:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update UOM');
    }
  };

  // Handle delete UOM
  const handleDelete = async () => {
    if (!deletingUom) return;

    try {
      await deleteMutation.mutateAsync(deletingUom.id);
      toast.success('UOM deleted successfully');
      setDeletingUom(null);
      refetchUoms();
    } catch (error) {
      console.error('Failed to delete UOM:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete UOM');
    }
  };

  // Start editing
  const startEdit = (uom: ProductUom) => {
    setEditingUom(uom);
    setFormData({
      title: uom.title,
      description: uom.description || '',
      multiply: uom.multiply,
      multiplyBy: uom.multiplyBy,
    });
    setShowCreateForm(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingUom(null);
    setFormData({ title: '', description: '', multiply: false, multiplyBy: undefined });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Manage Units of Measure</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Create and manage product UOMs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingUoms ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create New UOM Button/Form */}
              {!showCreateForm && !editingUom && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                  </svg>
                  Add New Unit of Measure
                </button>
              )}

              {/* Create/Edit Form */}
              {(showCreateForm || editingUom) && (
                <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/10 space-y-4">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">
                    {editingUom ? 'Edit UOM' : 'New Unit of Measure'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Each, Box, Case..."
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description..."
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                  </div>

                  {/* Multiply Settings */}
                  <div className="p-3 bg-[var(--muted)]/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">
                          Enable Multiplier
                        </label>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Multiply unit price by a factor
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          multiply: !prev.multiply,
                          multiplyBy: !prev.multiply ? 1 : undefined
                        }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          formData.multiply ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.multiply ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {formData.multiply && (
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                          Multiply By
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.multiplyBy ?? ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            multiplyBy: e.target.value ? parseFloat(e.target.value) : undefined
                          }))}
                          placeholder="1.0"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        if (editingUom) {
                          cancelEdit();
                        } else {
                          setShowCreateForm(false);
                          setFormData({ title: '', description: '', multiply: false, multiplyBy: undefined });
                        }
                      }}
                      className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingUom ? handleUpdate : handleCreate}
                      disabled={!formData.title.trim() || createMutation.isPending || updateMutation.isPending}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                    >
                      {(createMutation.isPending || updateMutation.isPending)
                        ? (editingUom ? 'Saving...' : 'Creating...')
                        : (editingUom ? 'Save Changes' : 'Create UOM')
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* UOMs List */}
              {uoms.length === 0 && !showCreateForm ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <p className="text-[var(--muted-foreground)]">No units of measure defined yet</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">Click the button above to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uoms.map((uom) => (
                    <div
                      key={uom.id}
                      className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors"
                    >
                      {editingUom?.id === uom.id ? null : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-green-700">
                                {uom.title.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-[var(--foreground)]">{uom.title}</h4>
                              <div className="flex items-center gap-2">
                                {uom.description && (
                                  <p className="text-xs text-[var(--muted-foreground)]">{uom.description}</p>
                                )}
                                {uom.multiply && uom.multiplyBy && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">
                                    x{uom.multiplyBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(uom)}
                              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              title="Edit UOM"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingUom(uom)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                              title="Delete UOM"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deletingUom && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete UOM</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-4">
                Are you sure you want to delete &quot;{deletingUom.title}&quot;? Products using this UOM may be affected.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingUom(null)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end bg-[var(--muted)]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
