'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useTaskCategories,
  useCreateTaskCategory,
  useUpdateTaskCategory,
  useDeleteTaskCategory,
  type TaskCategory,
  type CreateTaskCategoryInput,
} from '../../hooks/useCRMApi';

interface ManageTaskCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageTaskCategoriesModal({ isOpen, onClose }: ManageTaskCategoriesModalProps) {
  // Category management state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<TaskCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    displayOrder: number;
  }>({
    name: '',
    displayOrder: 0,
  });

  // API hooks
  const { data: categoriesData, isLoading, refetch } = useTaskCategories();
  const categories: TaskCategory[] = categoriesData ?? [];
  const createMutation = useCreateTaskCategory();
  const updateMutation = useUpdateTaskCategory();
  const deleteMutation = useDeleteTaskCategory();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setEditingCategory(null);
      setDeletingCategory(null);
      setFormData({ name: '', displayOrder: 0 });
    }
  }, [isOpen]);

  // Handle create category
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const input: CreateTaskCategoryInput = {
      name: formData.name.trim(),
      displayOrder: formData.displayOrder,
    };

    try {
      await createMutation.mutateAsync(input);
      toast.success('Category created successfully');
      setFormData({ name: '', displayOrder: 0 });
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  // Handle update category
  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        input: {
          name: formData.name.trim(),
          displayOrder: formData.displayOrder,
        },
      });
      toast.success('Category updated successfully');
      setEditingCategory(null);
      setFormData({ name: '', displayOrder: 0 });
      refetch();
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update category');
    }
  };

  // Handle delete category
  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  // Start editing
  const startEdit = (category: TaskCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayOrder: category.displayOrder,
    });
    setShowCreateForm(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', displayOrder: 0 });
  };

  if (!isOpen) return null;

  // Sort categories by displayOrder
  const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Manage Task Categories</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Create and manage task categories</p>
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
              {/* Create New Category Button/Form */}
              {!showCreateForm && !editingCategory && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                  </svg>
                  Add New Category
                </button>
              )}

              {/* Create/Edit Form */}
              {(showCreateForm || editingCategory) && (
                <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/10 space-y-4">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">
                    {editingCategory ? 'Edit Category' : 'New Category'}
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
                        placeholder="e.g., Follow-up, Meeting..."
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
                        if (editingCategory) {
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
                      onClick={editingCategory ? handleUpdate : handleCreate}
                      disabled={!formData.name.trim() || createMutation.isPending || updateMutation.isPending}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                    >
                      {(createMutation.isPending || updateMutation.isPending)
                        ? (editingCategory ? 'Saving...' : 'Creating...')
                        : (editingCategory ? 'Save Changes' : 'Create Category')
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              {sortedCategories.length === 0 && !showCreateForm ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[var(--muted-foreground)]">No categories defined yet</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">Click the button above to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedCategories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors"
                    >
                      {editingCategory?.id === category.id ? null : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-purple-700">
                                {category.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-[var(--foreground)]">{category.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  Order: {category.displayOrder}
                                </span>
                                {!category.isActive && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(category)}
                              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              title="Edit Category"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingCategory(category)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                              title="Delete Category"
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
        {deletingCategory && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Category</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-4">
                Are you sure you want to delete &quot;{deletingCategory.name}&quot;? Tasks using this category may be affected.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingCategory(null)}
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
