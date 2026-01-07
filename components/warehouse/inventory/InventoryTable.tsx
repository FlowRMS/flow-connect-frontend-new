import React, { useState } from 'react';
import Link from 'next/link';
import { FlatInventoryItem, InventorySortField, SortDirection, InventoryColumnFilters } from './types';
import { Inventory, inventoryStatusColors, inventoryStatusLabels, InventoryStatus } from '@/lib/types/warehouse';

interface InventoryTableProps {
    items: FlatInventoryItem[];
    inventory: Inventory[];
    // Product profile action
    onProductClick?: (inventory: Inventory) => void;
    // Sorting
    sortField: InventorySortField;
    sortDirection: SortDirection;
    onSort: (field: InventorySortField) => void;
    // Filtering
    columnFilters: InventoryColumnFilters;
    setColumnFilters: (filters: InventoryColumnFilters | ((prev: InventoryColumnFilters) => InventoryColumnFilters)) => void;
    openFilter: string | null;
    setOpenFilter: (filterId: string | null) => void;
    uniqueFactories: string[];
    uniqueStatuses: InventoryStatus[];
}

// Sort Icon Component
function SortIcon({ field, currentSortField, currentSortDirection }: { field: InventorySortField; currentSortField: InventorySortField; currentSortDirection: SortDirection }) {
    const isActive = currentSortField === field;
    return (
        <span className="ml-1 inline-flex flex-col">
            <svg className={`w-2 h-2 ${isActive && currentSortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} viewBox="0 0 8 4" fill="currentColor">
                <path d="M4 0L8 4H0L4 0Z" />
            </svg>
            <svg className={`w-2 h-2 -mt-0.5 ${isActive && currentSortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} viewBox="0 0 8 4" fill="currentColor">
                <path d="M4 4L0 0H8L4 4Z" />
            </svg>
        </span>
    );
}

// Text Filter Dropdown
function TextFilterDropdown({ value, onChange, placeholder, isOpen, onToggle }: { value: string; onChange: (value: string) => void; placeholder?: string; isOpen: boolean; onToggle: () => void }) {
    const hasValue = value !== '';
    return (
        <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onToggle} />
                    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
                        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
                        {hasValue && <button onClick={() => onChange('')} className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
                    </div>
                </>
            )}
        </div>
    );
}

// MultiSelect Filter Dropdown
function MultiSelectFilterDropdown({ options, value, onChange, isOpen, onToggle, renderLabel }: { options: string[]; value: string[]; onChange: (value: string[]) => void; isOpen: boolean; onToggle: () => void; renderLabel?: (opt: string) => string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const hasValue = value.length > 0;
    const filteredOptions = options.filter((opt) => (renderLabel ? renderLabel(opt) : opt).toLowerCase().includes(searchTerm.toLowerCase()));
    const toggleOption = (optValue: string) => { if (value.includes(optValue)) { onChange(value.filter((v) => v !== optValue)); } else { onChange([...value, optValue]); } };
    return (
        <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                {hasValue && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">{value.length}</span>}
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onToggle} />
                    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
                        <div className="p-2 border-b border-[var(--border)]">
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
                        </div>
                        <div className="overflow-y-auto flex-1 py-1">
                            {filteredOptions.length === 0 ? <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div> : filteredOptions.map((opt) => (
                                <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={value.includes(opt)} onChange={() => toggleOption(opt)} className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50" />
                                    <span className={value.includes(opt) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>{renderLabel ? renderLabel(opt) : opt}</span>
                                </label>
                            ))}
                        </div>
                        {hasValue && <div className="p-2 border-t border-[var(--border)]"><button onClick={(e) => { e.stopPropagation(); onChange([]); }} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear all</button></div>}
                    </div>
                </>
            )}
        </div>
    );
}

// Date Range Filter Dropdown
function DateRangeFilterDropdown({ value, onChange, isOpen, onToggle }: { value: { start: string; end: string }; onChange: (value: { start: string; end: string }) => void; isOpen: boolean; onToggle: () => void }) {
    const hasValue = value.start !== '' || value.end !== '';
    return (
        <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onToggle} />
                    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
                        <div className="space-y-3">
                            <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label><input type="date" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
                            <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label><input type="date" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
                            {hasValue && <button onClick={(e) => { e.stopPropagation(); onChange({ start: '', end: '' }); }} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function InventoryTable({
    items,
    inventory,
    onProductClick,
    sortField,
    sortDirection,
    onSort,
    columnFilters,
    setColumnFilters,
    openFilter,
    setOpenFilter,
    uniqueFactories,
    uniqueStatuses,
}: InventoryTableProps) {
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatLocation = (item: FlatInventoryItem) => {
        if (item.fullLocationPath) {
            return item.fullLocationPath;
        }
        return item.binLocation;
    };

    return (
        <div className="flex-1 overflow-auto p-6 pt-0">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center">
                                    <button onClick={() => onSort('factoryName')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Factory<SortIcon field="factoryName" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                    <MultiSelectFilterDropdown options={uniqueFactories} value={columnFilters.factoryName} onChange={(value) => setColumnFilters(prev => ({ ...prev, factoryName: value }))} isOpen={openFilter === 'factoryName'} onToggle={() => setOpenFilter(openFilter === 'factoryName' ? null : 'factoryName')} />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center">
                                    <button onClick={() => onSort('productName')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Description<SortIcon field="productName" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                    <TextFilterDropdown value={columnFilters.productName} onChange={(value) => setColumnFilters(prev => ({ ...prev, productName: value }))} placeholder="Search..." isOpen={openFilter === 'productName'} onToggle={() => setOpenFilter(openFilter === 'productName' ? null : 'productName')} />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center">
                                    <button onClick={() => onSort('partNumber')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Part Number<SortIcon field="partNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                    <TextFilterDropdown value={columnFilters.partNumber} onChange={(value) => setColumnFilters(prev => ({ ...prev, partNumber: value }))} placeholder="Search..." isOpen={openFilter === 'partNumber'} onToggle={() => setOpenFilter(openFilter === 'partNumber' ? null : 'partNumber')} />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center">
                                    <button onClick={() => onSort('binLocation')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Location<SortIcon field="binLocation" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                    <TextFilterDropdown value={columnFilters.location} onChange={(value) => setColumnFilters(prev => ({ ...prev, location: value }))} placeholder="Search..." isOpen={openFilter === 'location'} onToggle={() => setOpenFilter(openFilter === 'location' ? null : 'location')} />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center">
                                    <button onClick={() => onSort('status')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Status<SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                    <MultiSelectFilterDropdown options={uniqueStatuses} value={columnFilters.status} onChange={(value) => setColumnFilters(prev => ({ ...prev, status: value }))} isOpen={openFilter === 'status'} onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')} renderLabel={(opt) => inventoryStatusLabels[opt as InventoryStatus]} />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end">
                                    <button onClick={() => onSort('quantity')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Qty<SortIcon field="quantity" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Available</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Reserved</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Lot #</th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center">
                                    <button onClick={() => onSort('receivedDate')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                        Received<SortIcon field="receivedDate" currentSortField={sortField} currentSortDirection={sortDirection} />
                                    </button>
                                    <DateRangeFilterDropdown value={columnFilters.dateRange} onChange={(value) => setColumnFilters(prev => ({ ...prev, dateRange: value }))} isOpen={openFilter === 'dateRange'} onToggle={() => setOpenFilter(openFilter === 'dateRange' ? null : 'dateRange')} />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                                    No inventory items found
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const isLowStock = item.availableQuantity <= (item.reorderPoint || 0);
                                const inv = inventory.find(i => i.id === item.inventoryId);

                                return (
                                    <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                                                {item.factoryName.split(' ')[0]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {inv && onProductClick ? (
                                                <button
                                                    onClick={() => onProductClick(inv)}
                                                    className="text-sm text-[var(--primary)] hover:underline line-clamp-1 text-left"
                                                >
                                                    {item.productName}
                                                </button>
                                            ) : (
                                                <span className="text-sm text-[var(--foreground)] line-clamp-1">{item.productName}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                                                {item.partNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="font-medium text-[var(--foreground)]">{formatLocation(item)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${inventoryStatusColors[item.status]}`}>
                                                {inventoryStatusLabels[item.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-[var(--foreground)]">{Math.round(Number(item.quantity))}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-sm font-semibold ${item.status === 'AVAILABLE' ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                                                {item.status === 'AVAILABLE' ? Math.round(Number(item.quantity)) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-sm font-semibold ${item.status === 'RESERVED' ? 'text-blue-600' : 'text-[var(--muted-foreground)]'}`}>
                                                {item.status === 'RESERVED' ? Math.round(Number(item.quantity)) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-[var(--foreground)]">{item.lotNumber || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-[var(--muted-foreground)]">{formatDate(item.receivedDate)}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
