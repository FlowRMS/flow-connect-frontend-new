'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useCompanyTypes,
  useCreateCompanyType,
  useUpdateCompanyType,
  useDeleteCompanyType,
  type CompanyType,
  type CreateCompanyTypeInput,
} from '../../hooks/useCRMApi';

interface ManageCompanyTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageCompanyTypesModal({ isOpen, onClose }: ManageCompanyTypesModalProps) {
  // Company type management state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingType, setEditingType] = useState<CompanyType | null>(null);
  const [deletingType, setDeletingType] = useState<CompanyType | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    displayOrder: number;
  }>({
    name: '',
    displayOrder: 0,
  });

  // API hooks
  const { data: companyTypesData, isLoading, refetch } = useCompanyTypes();
  const companyTypes: CompanyType[] = companyTypesData ?? [];
  const createMutation = useCreateCompanyType();
  const updateMutation = useUpdateCompanyType();
  const deleteMutation = useDeleteCompanyType();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setEditingType(null);
      setDeletingType(null);
      setFormData({ name: '', displayOrder: 0 });
    }
  }, [isOpen]);

  // Handle create company type
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const input: CreateCompanyTypeInput = {
      name: formData.name.trim(),
      displayOrder: formData.displayOrder,
    };

    try {
      await createMutation.mutateAsync(input);
      toast.success('Company type created successfully');
      setFormData({ name: '', displayOrder: 0 });
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error('Failed to create company type:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create company type');
    }
  };

  // Handle update company type
  const handleUpdate = async () => {
    if (!editingType || !formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingType.id,
        input: {
          name: formData.name.trim(),
          displayOrder: formData.displayOrder,
        },
      });
      toast.success('Company type updated successfully');
      setEditingType(null);
      setFormData({ name: '', displayOrder: 0 });
      refetch();
    } catch (error) {
      console.error('Failed to update company type:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update company type');
    }
  };

  // Handle delete company type
  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      await deleteMutation.mutateAsync(deletingType.id);
      toast.success('Company type deleted successfully');
      setDeletingType(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete company type:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete company type');
    }
  };

  // Start editing
  const startEdit = (type: CompanyType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      displayOrder: type.displayOrder,
    });
    setShowCreateForm(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingType(null);
    setFormData({ name: '', displayOrder: 0 });
  };

  if (!isOpen) return null;

  // Sort company types by displayOrder
  const sortedTypes = [...companyTypes].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Manage Company Types</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Create and manage company types</p>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create New Company Type Button/Form */}
              {!showCreateForm && !editingType && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                  </svg>
                  Add New Company Type
                </button>
              )}

              {/* Create/Edit Form */}
              {(showCreateForm || editingType) && (
                <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/10 space-y-4">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">
                    {editingType ? 'Edit Company Type' : 'New Company Type'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., General Contractor..."
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        if (editingType) {
                          cancelEdit();
                        } else {
                          setShowCreateForm(false);
                          setFormData({ name: '', displayOrder: 0 });
                        }
                      }}
                      className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingType ? handleUpdate : handleCreate}
                      disabled={!formData.name.trim() || createMutation.isPending || updateMutation.isPending}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                    >
                      {(createMutation.isPending || updateMutation.isPending)
                        ? (editingType ? 'Saving...' : 'Creating...')
                        : (editingType ? 'Save Changes' : 'Create Type')
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Company Types List */}
              {sortedTypes.length === 0 && !showCreateForm ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <p className="text-[var(--muted-foreground)]">No company types defined yet</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">Click the button above to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedTypes.map((type) => (
                    <div
                      key={type.id}
                      className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors"
                    >
                      {editingType?.id === type.id ? null : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">
                                {type.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-[var(--foreground)]">{type.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  Order: {type.displayOrder}
                                </span>
                                {!type.isActive && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(type)}
                              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              title="Edit Company Type"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingType(type)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                              title="Delete Company Type"
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
        {deletingType && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Company Type</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-4">
                Are you sure you want to delete &quot;{deletingType.name}&quot;? Companies using this type may be affected.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingType(null)}
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
