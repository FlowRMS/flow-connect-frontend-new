'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
  useFactorySearch,
  type ProductCategory,
  type CreateProductCategoryInput,
  type FactorySearchResult,
} from '../api/useProductsApi';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Enhanced dropdown position hook
function useDropdownPosition(
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  dropdownHeight: number = 200
) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setPosition({
        top: openUpward ? rect.top + window.scrollY - dropdownHeight - 4 : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUpward,
      });
    }
  }, [isOpen, triggerRef, dropdownHeight]);

  return position;
}

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  // Category management state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);

  // Form state with factory and parent/grandparent support
  const [formData, setFormData] = useState<{
    title: string;
    commissionRate: number | undefined;
    factoryId: string | undefined;
    parentId: string | undefined;
    grandparentId: string | undefined;
  }>({
    title: '',
    commissionRate: undefined,
    factoryId: undefined,
    parentId: undefined,
    grandparentId: undefined,
  });

  // Factory dropdown state (for create/edit form only)
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);
  const factoryInputRef = useRef<HTMLInputElement>(null);
  const factoryDropdownRef = useRef<HTMLDivElement>(null);

  // Parent/Grandparent dropdown states
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [showGrandparentDropdown, setShowGrandparentDropdown] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [grandparentSearchTerm, setGrandparentSearchTerm] = useState('');
  const parentInputRef = useRef<HTMLInputElement>(null);
  const parentDropdownRef = useRef<HTMLDivElement>(null);
  const grandparentInputRef = useRef<HTMLInputElement>(null);
  const grandparentDropdownRef = useRef<HTMLDivElement>(null);

  // Portal mount state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API hooks - load all factories immediately (not just when dropdown opens)
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(
    factorySearchTerm,
    true // Always enabled - factories are needed for display and selection
  );
  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useProductCategories();
  const createMutation = useCreateProductCategory();
  const updateMutation = useUpdateProductCategory();
  const deleteMutation = useDeleteProductCategory();

  // Get selected factory for display
  const selectedFactory = factories.find(f => f.id === formData.factoryId);

  // Helper to get factory title by ID (for displaying in category list)
  const getFactoryTitle = useCallback((factoryId?: string) => {
    if (!factoryId) return null;
    return factories.find(f => f.id === factoryId)?.title || null;
  }, [factories]);

  // Filter categories for parent/grandparent dropdowns (exclude self when editing)
  const availableParentCategories = categories.filter(c =>
    c.id !== editingCategory?.id &&
    (!parentSearchTerm || c.title.toLowerCase().includes(parentSearchTerm.toLowerCase()))
  );

  const availableGrandparentCategories = categories.filter(c =>
    c.id !== editingCategory?.id &&
    c.id !== formData.parentId &&
    (!grandparentSearchTerm || c.title.toLowerCase().includes(grandparentSearchTerm.toLowerCase()))
  );

  // Get selected parent/grandparent display names
  const selectedParent = categories.find(c => c.id === formData.parentId);
  const selectedGrandparent = categories.find(c => c.id === formData.grandparentId);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Factory dropdown
      if (
        factoryInputRef.current && !factoryInputRef.current.contains(target) &&
        factoryDropdownRef.current && !factoryDropdownRef.current.contains(target)
      ) {
        setShowFactoryDropdown(false);
      }

      // Parent dropdown
      if (
        parentInputRef.current && !parentInputRef.current.contains(target) &&
        parentDropdownRef.current && !parentDropdownRef.current.contains(target)
      ) {
        setShowParentDropdown(false);
      }

      // Grandparent dropdown
      if (
        grandparentInputRef.current && !grandparentInputRef.current.contains(target) &&
        grandparentDropdownRef.current && !grandparentDropdownRef.current.contains(target)
      ) {
        setShowGrandparentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFactorySearchTerm('');
      setShowFactoryDropdown(false);
      setShowCreateForm(false);
      setEditingCategory(null);
      setDeletingCategory(null);
      resetFormData();
    }
  }, [isOpen]);

  const resetFormData = () => {
    setFormData({ title: '', commissionRate: undefined, factoryId: undefined, parentId: undefined, grandparentId: undefined });
    setFactorySearchTerm('');
    setParentSearchTerm('');
    setGrandparentSearchTerm('');
  };

  // Handle factory selection (for form)
  const handleFactorySelect = (factory: FactorySearchResult) => {
    setFormData(prev => ({ ...prev, factoryId: factory.id }));
    setFactorySearchTerm(factory.title);
    setShowFactoryDropdown(false);
  };

  // Clear factory selection
  const clearFactory = () => {
    setFormData(prev => ({ ...prev, factoryId: undefined }));
    setFactorySearchTerm('');
  };

  // Handle parent selection
  const handleParentSelect = (category: ProductCategory) => {
    setFormData(prev => ({ ...prev, parentId: category.id }));
    setParentSearchTerm(category.title);
    setShowParentDropdown(false);
  };

  // Handle grandparent selection
  const handleGrandparentSelect = (category: ProductCategory) => {
    setFormData(prev => ({ ...prev, grandparentId: category.id }));
    setGrandparentSearchTerm(category.title);
    setShowGrandparentDropdown(false);
  };

  // Clear parent selection (also clears grandparent)
  const clearParent = () => {
    setFormData(prev => ({ ...prev, parentId: undefined, grandparentId: undefined }));
    setParentSearchTerm('');
    setGrandparentSearchTerm('');
  };

  // Clear grandparent selection
  const clearGrandparent = () => {
    setFormData(prev => ({ ...prev, grandparentId: undefined }));
    setGrandparentSearchTerm('');
  };

  // Handle create category
  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    const input: CreateProductCategoryInput = {
      title: formData.title.trim(),
      factoryId: formData.factoryId, // Optional
      commissionRate: formData.commissionRate,
      parentId: formData.parentId,
      grandparentId: formData.grandparentId,
    };

    try {
      await createMutation.mutateAsync(input);
      resetFormData();
      setShowCreateForm(false);
      refetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Handle update category
  const handleUpdate = async () => {
    if (!editingCategory || !formData.title.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        input: {
          title: formData.title.trim(),
          factoryId: formData.factoryId,
          commissionRate: formData.commissionRate,
          parentId: formData.parentId,
          grandparentId: formData.grandparentId,
        },
      });
      setEditingCategory(null);
      resetFormData();
      refetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Handle delete category
  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
      refetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Start editing
  const startEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      title: category.title,
      commissionRate: category.commissionRate,
      factoryId: category.factoryId,
      parentId: undefined, // TODO: Load from category if API returns it
      grandparentId: undefined,
    });
    // Set factory search term if category has a factory
    if (category.factoryId) {
      const factory = factories.find(f => f.id === category.factoryId);
      if (factory) {
        setFactorySearchTerm(factory.title);
      }
    } else {
      setFactorySearchTerm('');
    }
    setShowCreateForm(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingCategory(null);
    resetFormData();
  };

  // Dropdown position for factory
  const factoryDropdownPosition = useDropdownPosition(showFactoryDropdown, factoryInputRef);

  if (!isOpen) return null;

  // Category dropdown item renderer
  const renderCategoryDropdownItem = (category: ProductCategory, onClick: () => void, isSelected: boolean) => (
    <button
      key={category.id}
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
        isSelected ? 'bg-purple-50 text-purple-700' : 'hover:bg-[var(--muted)]'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--foreground)] truncate">{category.title}</div>
        {category.commissionRate !== undefined && (
          <div className="text-xs text-[var(--muted-foreground)]">
            Commission: {(category.commissionRate * 100).toFixed(1)}%
          </div>
        )}
      </div>
      {isSelected && (
        <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );

  // Render parent/grandparent form fields
  const renderParentFields = () => (
    <div className="grid grid-cols-2 gap-4">
      {/* Parent Category */}
      <div className="relative">
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          Parent Category
        </label>
        <div className="relative">
          <input
            ref={parentInputRef}
            type="text"
            value={showParentDropdown ? parentSearchTerm : (selectedParent?.title || '')}
            onChange={(e) => {
              setParentSearchTerm(e.target.value);
              if (!e.target.value && !showParentDropdown) {
                clearParent();
              }
            }}
            onFocus={() => {
              setShowParentDropdown(true);
              setParentSearchTerm('');
            }}
            placeholder="Select parent category..."
            className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              showParentDropdown ? 'ring-2 ring-purple-500 border-transparent' : 'border-[var(--border)]'
            }`}
          />
          {formData.parentId ? (
            <button
              type="button"
              onClick={clearParent}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--muted)] rounded"
            >
              <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${showParentDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        {showParentDropdown && isMounted && createPortal(
          <div
            ref={parentDropdownRef}
            style={{
              position: 'fixed',
              top: (parentInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
              left: parentInputRef.current?.getBoundingClientRect().left ?? 0,
              width: parentInputRef.current?.getBoundingClientRect().width ?? 200,
              zIndex: 9999,
            }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {availableParentCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                No categories available
              </div>
            ) : (
              availableParentCategories.map((cat) =>
                renderCategoryDropdownItem(cat, () => handleParentSelect(cat), cat.id === formData.parentId)
              )
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Grandparent Category */}
      <div className="relative">
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          Grandparent Category
        </label>
        <div className="relative">
          <input
            ref={grandparentInputRef}
            type="text"
            value={showGrandparentDropdown ? grandparentSearchTerm : (selectedGrandparent?.title || '')}
            onChange={(e) => {
              setGrandparentSearchTerm(e.target.value);
              if (!e.target.value && !showGrandparentDropdown) {
                clearGrandparent();
              }
            }}
            onFocus={() => {
              setShowGrandparentDropdown(true);
              setGrandparentSearchTerm('');
            }}
            placeholder={formData.parentId ? "Select grandparent..." : "Select parent first"}
            disabled={!formData.parentId}
            className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
              showGrandparentDropdown ? 'ring-2 ring-purple-500 border-transparent' : 'border-[var(--border)]'
            }`}
          />
          {formData.grandparentId ? (
            <button
              type="button"
              onClick={clearGrandparent}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--muted)] rounded"
            >
              <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${showGrandparentDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        {showGrandparentDropdown && formData.parentId && isMounted && createPortal(
          <div
            ref={grandparentDropdownRef}
            style={{
              position: 'fixed',
              top: (grandparentInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
              left: grandparentInputRef.current?.getBoundingClientRect().left ?? 0,
              width: grandparentInputRef.current?.getBoundingClientRect().width ?? 200,
              zIndex: 9999,
            }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {availableGrandparentCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                No categories available
              </div>
            ) : (
              availableGrandparentCategories.map((cat) =>
                renderCategoryDropdownItem(cat, () => handleGrandparentSelect(cat), cat.id === formData.grandparentId)
              )
            )}
          </div>,
          document.body
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Manage Categories</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Create and manage product categories</p>
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
          {isLoadingCategories ? (
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
                  className="w-full p-4 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                  </svg>
                  Add New Category
                </button>
              )}

              {/* Create Form */}
              {showCreateForm && (
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/30 space-y-4">
                  <h3 className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    New Category
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Category name..."
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.commissionRate !== undefined ? formData.commissionRate * 100 : ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          commissionRate: e.target.value ? parseFloat(e.target.value) / 100 : undefined
                        }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>
                  {/* Factory Field (Optional) */}
                  <div className="relative">
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                      Factory <span className="text-[var(--muted-foreground)]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={factoryInputRef}
                        type="text"
                        value={showFactoryDropdown ? factorySearchTerm : (selectedFactory?.title || '')}
                        onChange={(e) => {
                          setFactorySearchTerm(e.target.value);
                          if (!e.target.value) {
                            clearFactory();
                          }
                        }}
                        onFocus={() => {
                          setShowFactoryDropdown(true);
                          setFactorySearchTerm('');
                        }}
                        placeholder="Search factories..."
                        className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          showFactoryDropdown ? 'ring-2 ring-purple-500 border-transparent' : 'border-[var(--border)]'
                        }`}
                      />
                      {formData.factoryId ? (
                        <button
                          type="button"
                          onClick={clearFactory}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--muted)] rounded"
                        >
                          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : (
                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${showFactoryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                    {showFactoryDropdown && isMounted && createPortal(
                      <div
                        ref={factoryDropdownRef}
                        style={{
                          position: 'fixed',
                          top: (factoryInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                          left: factoryInputRef.current?.getBoundingClientRect().left ?? 0,
                          width: factoryInputRef.current?.getBoundingClientRect().width ?? 300,
                          zIndex: 9999,
                        }}
                        className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {isLoadingFactories ? (
                          <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Loading factories...
                          </div>
                        ) : factories.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                            {factorySearchTerm ? 'No factories found' : 'No factories available'}
                          </div>
                        ) : (
                          factories.map((factory) => (
                            <button
                              key={factory.id}
                              type="button"
                              onClick={() => handleFactorySelect(factory)}
                              className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                                formData.factoryId === factory.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-[var(--muted)]'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--foreground)] truncate">{factory.title}</div>
                                {factory.accountNumber && (
                                  <div className="text-xs text-[var(--muted-foreground)]">Account: {factory.accountNumber}</div>
                                )}
                              </div>
                              {formData.factoryId === factory.id && (
                                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                  {/* Parent/Grandparent Fields */}
                  {renderParentFields()}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        resetFormData();
                      }}
                      className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!formData.title.trim() || createMutation.isPending}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {createMutation.isPending ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Creating...
                        </>
                      ) : 'Create'}
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              {categories.length === 0 && !showCreateForm ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No categories found. Click &quot;Add New Category&quot; to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        editingCategory?.id === category.id
                          ? 'border-purple-300 bg-purple-50/30'
                          : 'border-[var(--border)] hover:border-purple-300'
                      }`}
                    >
                      {editingCategory?.id === category.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Title *</label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Commission Rate (%)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.commissionRate !== undefined ? formData.commissionRate * 100 : ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  commissionRate: e.target.value ? parseFloat(e.target.value) / 100 : undefined
                                }))}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              />
                            </div>
                          </div>
                          {/* Factory Field (Optional) - Edit Mode */}
                          <div className="relative">
                            <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                              Factory <span className="text-[var(--muted-foreground)]">(Optional)</span>
                            </label>
                            <div className="relative">
                              <input
                                ref={factoryInputRef}
                                type="text"
                                value={showFactoryDropdown ? factorySearchTerm : (selectedFactory?.title || '')}
                                onChange={(e) => {
                                  setFactorySearchTerm(e.target.value);
                                  if (!e.target.value) {
                                    clearFactory();
                                  }
                                }}
                                onFocus={() => {
                                  setShowFactoryDropdown(true);
                                  setFactorySearchTerm('');
                                }}
                                placeholder="Search factories..."
                                className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                  showFactoryDropdown ? 'ring-2 ring-purple-500 border-transparent' : 'border-[var(--border)]'
                                }`}
                              />
                              {formData.factoryId ? (
                                <button
                                  type="button"
                                  onClick={clearFactory}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--muted)] rounded"
                                >
                                  <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              ) : (
                                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] transition-transform ${showFactoryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </div>
                            {showFactoryDropdown && isMounted && createPortal(
                              <div
                                ref={factoryDropdownRef}
                                style={{
                                  position: 'fixed',
                                  top: (factoryInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                                  left: factoryInputRef.current?.getBoundingClientRect().left ?? 0,
                                  width: factoryInputRef.current?.getBoundingClientRect().width ?? 300,
                                  zIndex: 9999,
                                }}
                                className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
                              >
                                {isLoadingFactories ? (
                                  <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    Loading factories...
                                  </div>
                                ) : factories.length === 0 ? (
                                  <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                                    {factorySearchTerm ? 'No factories found' : 'No factories available'}
                                  </div>
                                ) : (
                                  factories.map((factory) => (
                                    <button
                                      key={factory.id}
                                      type="button"
                                      onClick={() => handleFactorySelect(factory)}
                                      className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                                        formData.factoryId === factory.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-[var(--muted)]'
                                      }`}
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-[var(--foreground)] truncate">{factory.title}</div>
                                        {factory.accountNumber && (
                                          <div className="text-xs text-[var(--muted-foreground)]">Account: {factory.accountNumber}</div>
                                        )}
                                      </div>
                                      {formData.factoryId === factory.id && (
                                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>,
                              document.body
                            )}
                          </div>
                          {/* Parent/Grandparent Fields */}
                          {renderParentFields()}
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdate}
                              disabled={!formData.title.trim() || updateMutation.isPending}
                              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {updateMutation.isPending ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  Saving...
                                </>
                              ) : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-[var(--foreground)]">{category.title}</h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                {category.commissionRate !== undefined && (
                                  <p className="text-xs text-[var(--muted-foreground)]">
                                    Commission: {(category.commissionRate * 100).toFixed(1)}%
                                  </p>
                                )}
                                {category.factoryId && getFactoryTitle(category.factoryId) && (
                                  <p className="text-xs text-blue-600 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {getFactoryTitle(category.factoryId)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(category)}
                              className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-purple-600"
                              title="Edit category"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingCategory(category)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                              title="Delete category"
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
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Category</h3>
                </div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Are you sure you want to delete <strong>&quot;{deletingCategory.title}&quot;</strong>? This action cannot be undone.
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
                  ) : 'Delete'}
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
