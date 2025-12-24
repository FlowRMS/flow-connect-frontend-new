'use client';

import React, { useState } from 'react';
import {
  mockProducts,
  mockManufacturers,
  mockCreditReasons,
  mockExpenseCategories,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type {
  Product,
  Manufacturer,
  CreditReason,
  ExpenseCategory,
  SalesRep,
} from '../../lib/types/rms';

type SettingsTab = 'products' | 'manufacturers' | 'credit-reasons' | 'expense-categories' | 'sales-reps';

export default function RMSSettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('products');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(mockManufacturers);
  const [creditReasons, setCreditReasons] = useState<CreditReason[]>(mockCreditReasons);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(mockExpenseCategories);
  const [salesReps, setSalesReps] = useState<SalesRep[]>(mockSalesReps);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddManufacturer, setShowAddManufacturer] = useState(false);

  const tabs: { id: SettingsTab; label: string; count: number }[] = [
    { id: 'products', label: 'Products', count: products.length },
    { id: 'manufacturers', label: 'Manufacturers', count: manufacturers.length },
    { id: 'credit-reasons', label: 'Credit Reasons', count: creditReasons.length },
    { id: 'expense-categories', label: 'Expense Categories', count: expenseCategories.length },
    { id: 'sales-reps', label: 'Sales Reps', count: salesReps.length },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const filteredProducts = products.filter(p =>
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredManufacturers = manufacturers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">RMS Settings</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Configure products, manufacturers, and system settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)] mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">({tab.count})</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Product
              </button>
            </div>

            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</div>
                <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Description</div>
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Manufacturer</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Price</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Cost</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Comm %</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20">
                    <div className="col-span-2 text-sm font-medium text-[var(--foreground)]">{product.partNumber}</div>
                    <div className="col-span-3 text-sm text-[var(--muted-foreground)] truncate">{product.description}</div>
                    <div className="col-span-2 text-sm text-[var(--foreground)]">{product.manufacturerName}</div>
                    <div className="col-span-1 text-sm text-[var(--foreground)] text-right">{formatCurrency(product.unitPrice)}</div>
                    <div className="col-span-1 text-sm text-[var(--muted-foreground)] text-right">{product.cost ? formatCurrency(product.cost) : '-'}</div>
                    <div className="col-span-1 text-sm text-[var(--foreground)] text-right">{product.commissionRate ? formatPercent(product.commissionRate) : '-'}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manufacturers Tab */}
        {activeTab === 'manufacturers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search manufacturers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              <button
                onClick={() => setShowAddManufacturer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Manufacturer
              </button>
            </div>

            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-8 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Name</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Base Comm %</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Payment Terms</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Sales Model</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Products</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {filteredManufacturers.map((mfg) => {
                  const productCount = products.filter(p => p.manufacturerId === mfg.id).length;
                  return (
                    <div key={mfg.id} className="grid grid-cols-8 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20">
                      <div className="col-span-2 text-sm font-medium text-[var(--foreground)]">{mfg.name}</div>
                      <div className="col-span-1 text-sm text-[var(--foreground)] text-right">{formatPercent(mfg.baseCommissionRate)}</div>
                      <div className="col-span-1 text-sm text-[var(--muted-foreground)]">{mfg.paymentTerms || '-'}</div>
                      <div className="col-span-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          mfg.salesModel === 'direct' ? 'bg-blue-100 text-blue-700' :
                          mfg.salesModel === 'warehouse' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {mfg.salesModel.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="col-span-1 text-sm text-[var(--foreground)] text-right">{productCount}</div>
                      <div className="col-span-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${mfg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {mfg.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => setEditingManufacturer(mfg)}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Credit Reasons Tab */}
        {activeTab === 'credit-reasons' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Configure available credit reason codes
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Reason
              </button>
            </div>

            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Code</div>
                <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Description</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {creditReasons.map((reason) => (
                  <div key={reason.id} className="grid grid-cols-6 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20">
                    <div className="col-span-1 text-sm font-mono font-medium text-[var(--foreground)]">{reason.code}</div>
                    <div className="col-span-3 text-sm text-[var(--foreground)]">{reason.description}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${reason.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {reason.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-1 flex gap-2">
                      <button className="text-xs text-[var(--primary)] hover:underline">Edit</button>
                      <button className="text-xs text-red-500 hover:underline">
                        {reason.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expense Categories Tab */}
        {activeTab === 'expense-categories' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Configure expense categories for commission adjustments
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Category
              </button>
            </div>

            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Name</div>
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Description</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="grid grid-cols-6 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20">
                    <div className="col-span-2 text-sm font-medium text-[var(--foreground)]">{category.name}</div>
                    <div className="col-span-2 text-sm text-[var(--muted-foreground)]">{category.description || '-'}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-1 flex gap-2">
                      <button className="text-xs text-[var(--primary)] hover:underline">Edit</button>
                      <button className="text-xs text-red-500 hover:underline">
                        {category.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sales Reps Tab */}
        {activeTab === 'sales-reps' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Manage sales representatives and their default split rates
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Sales Rep
              </button>
            </div>

            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-8 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Name</div>
                <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Email</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Type</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Default Split</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</div>
                <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {salesReps.map((rep) => (
                  <div key={rep.id} className="grid grid-cols-8 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20">
                    <div className="col-span-2 text-sm font-medium text-[var(--foreground)]">{rep.name}</div>
                    <div className="col-span-2 text-sm text-[var(--muted-foreground)]">{rep.email || '-'}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        rep.repType === 'outside' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {rep.repType}
                      </span>
                    </div>
                    <div className="col-span-1 text-sm text-[var(--foreground)] text-right">{rep.defaultSplitRate}%</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${rep.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {rep.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <button className="text-xs text-[var(--primary)] hover:underline">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <EditProductModal
            product={editingProduct}
            manufacturers={manufacturers}
            onClose={() => setEditingProduct(null)}
            onSave={(updated) => {
              setProducts(products.map(p => p.id === updated.id ? updated : p));
              setEditingProduct(null);
            }}
          />
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <AddProductModal
            manufacturers={manufacturers}
            onClose={() => setShowAddProduct(false)}
            onSave={(newProduct) => {
              setProducts([...products, newProduct]);
              setShowAddProduct(false);
            }}
          />
        )}
      </div>
    </main>
  );
}

// Edit Product Modal Component
function EditProductModal({
  product,
  manufacturers,
  onClose,
  onSave
}: {
  product: Product;
  manufacturers: Manufacturer[];
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [formData, setFormData] = useState({
    partNumber: product.partNumber,
    description: product.description,
    manufacturerId: product.manufacturerId,
    unitPrice: product.unitPrice,
    cost: product.cost || 0,
    commissionRate: product.commissionRate || 0,
    category: product.category || '',
    leadTimeDays: product.leadTimeDays || 0,
    isActive: product.isActive,
  });

  const handleSave = () => {
    const mfg = manufacturers.find(m => m.id === formData.manufacturerId);
    onSave({
      ...product,
      ...formData,
      manufacturerName: mfg?.name || product.manufacturerName,
      updatedAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Part Number</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Manufacturer</label>
            <select
              value={formData.manufacturerId}
              onChange={(e) => setFormData({ ...formData, manufacturerId: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Cost</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={(formData.commissionRate * 100).toFixed(1)}
                onChange={(e) => setFormData({ ...formData, commissionRate: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm text-[var(--foreground)]">Active</label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Product Modal Component
function AddProductModal({
  manufacturers,
  onClose,
  onSave
}: {
  manufacturers: Manufacturer[];
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    manufacturerId: manufacturers[0]?.id || '',
    unitPrice: 0,
    cost: 0,
    commissionRate: 0.08,
    category: '',
    leadTimeDays: 5,
  });

  const handleSave = () => {
    const mfg = manufacturers.find(m => m.id === formData.manufacturerId);
    const newProduct: Product = {
      id: `PROD-NEW-${Date.now()}`,
      manufacturerId: formData.manufacturerId,
      manufacturerName: mfg?.name || '',
      partNumber: formData.partNumber,
      description: formData.description,
      unitPrice: formData.unitPrice,
      cost: formData.cost || undefined,
      commissionRate: formData.commissionRate,
      category: formData.category || undefined,
      leadTimeDays: formData.leadTimeDays || undefined,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSave(newProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Part Number *</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              placeholder="e.g., LED-4FT-40W"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              placeholder="Product description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Manufacturer *</label>
            <select
              value={formData.manufacturerId}
              onChange={(e) => setFormData({ ...formData, manufacturerId: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Unit Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Cost</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={(formData.commissionRate * 100).toFixed(1)}
                onChange={(e) => setFormData({ ...formData, commissionRate: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.partNumber || !formData.description || !formData.unitPrice}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}
