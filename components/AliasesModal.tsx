'use client';

import React, { useState } from 'react';

// Types for different alias configurations
export type AliasType = 'product' | 'company';

export interface ProductAlias {
  id: string;
  type: 'part_number' | 'description';
  value: string;
  createdAt: string;
  createdBy?: string;
}

export interface CompanyAlias {
  id: string;
  type: 'name' | 'name_address';
  name: string;
  // Address fields for name_address type
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  // Legacy field for compatibility
  address?: string;
  value?: string;
  createdAt: string;
  createdBy?: string;
}

interface AliasesModalProps {
  type: AliasType;
  entityName: string;
  aliases: ProductAlias[] | CompanyAlias[];
  onAdd: (alias: Omit<ProductAlias, 'id' | 'createdAt'> | Omit<CompanyAlias, 'id' | 'createdAt'>) => void;
  onDelete: (aliasId: string) => void;
  onClose: () => void;
}

export default function AliasesModal({
  type,
  entityName,
  aliases,
  onAdd,
  onDelete,
  onClose,
}: AliasesModalProps) {
  // Product alias form state
  const [productAliasType, setProductAliasType] = useState<'part_number' | 'description'>('part_number');
  const [productAliasValue, setProductAliasValue] = useState('');

  // Company alias form state
  const [companyAliasType, setCompanyAliasType] = useState<'name' | 'name_address'>('name');
  const [companyAliasName, setCompanyAliasName] = useState('');
  const [companyAliasStreet, setCompanyAliasStreet] = useState('');
  const [companyAliasCity, setCompanyAliasCity] = useState('');
  const [companyAliasState, setCompanyAliasState] = useState('');
  const [companyAliasZip, setCompanyAliasZip] = useState('');

  const handleAddProductAlias = () => {
    if (productAliasValue.trim()) {
      onAdd({
        type: productAliasType,
        value: productAliasValue.trim(),
      } as Omit<ProductAlias, 'id' | 'createdAt'>);
      setProductAliasValue('');
    }
  };

  const handleAddCompanyAlias = () => {
    if (companyAliasName.trim()) {
      const aliasData: Omit<CompanyAlias, 'id' | 'createdAt'> = {
        type: companyAliasType,
        name: companyAliasName.trim(),
      };

      if (companyAliasType === 'name_address') {
        aliasData.street = companyAliasStreet.trim() || undefined;
        aliasData.city = companyAliasCity.trim() || undefined;
        aliasData.state = companyAliasState.trim() || undefined;
        aliasData.zip = companyAliasZip.trim() || undefined;
      }

      onAdd(aliasData);
      setCompanyAliasName('');
      setCompanyAliasStreet('');
      setCompanyAliasCity('');
      setCompanyAliasState('');
      setCompanyAliasZip('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const productAliases = type === 'product' ? (aliases as ProductAlias[]) : [];
  const companyAliases = type === 'company' ? (aliases as CompanyAlias[]) : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {type === 'product' ? 'Product Aliases' : 'Company Aliases'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage aliases for "{entityName}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800">
                    {type === 'product'
                      ? 'Aliases help match products when importing data or searching. Add alternative part numbers or descriptions that should resolve to this product.'
                      : 'Aliases help match companies when importing data. Add alternative names or name/address combinations that should resolve to this company.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Add New Alias Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Alias</h3>

              {type === 'product' ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Alias Type</label>
                      <select
                        value={productAliasType}
                        onChange={(e) => setProductAliasType(e.target.value as 'part_number' | 'description')}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="part_number">Part Number</option>
                        <option value="description">Description</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {productAliasType === 'part_number' ? 'Alternative Part Number' : 'Alternative Description'}
                      </label>
                      <input
                        type="text"
                        value={productAliasValue}
                        onChange={(e) => setProductAliasValue(e.target.value)}
                        placeholder={productAliasType === 'part_number' ? 'Enter part number alias' : 'Enter description alias'}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddProductAlias}
                      disabled={!productAliasValue.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Alias
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Alias Type</label>
                      <select
                        value={companyAliasType}
                        onChange={(e) => setCompanyAliasType(e.target.value as 'name' | 'name_address')}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name">Name Only</option>
                        <option value="name_address">Name + Address</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Alternative Name</label>
                      <input
                        type="text"
                        value={companyAliasName}
                        onChange={(e) => setCompanyAliasName(e.target.value)}
                        placeholder="Enter company name alias"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {companyAliasType === 'name_address' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                        <input
                          type="text"
                          value={companyAliasStreet}
                          onChange={(e) => setCompanyAliasStreet(e.target.value)}
                          placeholder="Enter street address"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                          <input
                            type="text"
                            value={companyAliasCity}
                            onChange={(e) => setCompanyAliasCity(e.target.value)}
                            placeholder="City"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                          <input
                            type="text"
                            value={companyAliasState}
                            onChange={(e) => setCompanyAliasState(e.target.value)}
                            placeholder="State"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code</label>
                          <input
                            type="text"
                            value={companyAliasZip}
                            onChange={(e) => setCompanyAliasZip(e.target.value)}
                            placeholder="ZIP"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddCompanyAlias}
                      disabled={!companyAliasName.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Alias
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Aliases List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Existing Aliases ({aliases.length})
              </h3>

              {type === 'product' ? (
                productAliases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p>No aliases defined yet</p>
                    <p className="text-sm mt-1">Add aliases above to help with product matching</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productAliases.map((alias) => (
                      <div
                        key={alias.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            alias.type === 'part_number'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {alias.type === 'part_number' ? 'Part Number' : 'Description'}
                          </span>
                          <span className="text-sm text-gray-900 font-medium">{alias.value}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            Added {formatDate(alias.createdAt)}
                            {alias.createdBy && ` by ${alias.createdBy}`}
                          </span>
                          <button
                            onClick={() => onDelete(alias.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete alias"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                companyAliases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                    <p>No aliases defined yet</p>
                    <p className="text-sm mt-1">Add aliases above to help with company matching</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {companyAliases.map((alias) => (
                      <div
                        key={alias.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            alias.type === 'name'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {alias.type === 'name' ? 'Name' : 'Name + Address'}
                          </span>
                          <div>
                            <span className="text-sm text-gray-900 font-medium">{alias.name || alias.value}</span>
                            {alias.type === 'name_address' && (alias.street || alias.city || alias.state || alias.zip) && (
                              <div className="text-sm text-gray-500 mt-0.5">
                                {alias.street && <span>{alias.street}</span>}
                                {(alias.city || alias.state || alias.zip) && (
                                  <span>
                                    {alias.street && ', '}
                                    {alias.city}{alias.city && alias.state && ', '}{alias.state} {alias.zip}
                                  </span>
                                )}
                              </div>
                            )}
                            {alias.address && !alias.street && (
                              <span className="text-sm text-gray-500 ml-2">({alias.address})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            Added {formatDate(alias.createdAt)}
                            {alias.createdBy && ` by ${alias.createdBy}`}
                          </span>
                          <button
                            onClick={() => onDelete(alias.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete alias"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
