import React, { useState, useCallback, useMemo, memo, CSSProperties, ReactElement } from 'react';
import { List, RowComponentProps } from 'react-window';
import { FlatInventoryItem, InventorySortField, SortDirection, InventoryColumnFilters } from './types';
import { Inventory, inventoryStatusColors, inventoryStatusLabels, InventoryStatus } from '@/lib/types/warehouse';
import { formatQuantity } from './utils';
import UpdateInventoryItemModal from '../modals/UpdateInventoryItemModal';

interface InventoryTableProps {
    items: FlatInventoryItem[];
    inventory: Inventory[];
    onProductClick?: (inventory: Inventory) => void;
    sortField: InventorySortField;
    sortDirection: SortDirection;
    onSort: (field: InventorySortField) => void;
    columnFilters: InventoryColumnFilters;
    setColumnFilters: (filters: InventoryColumnFilters | ((prev: InventoryColumnFilters) => InventoryColumnFilters)) => void;
    openFilter: string | null;
    setOpenFilter: (filterId: string | null) => void;
    uniqueFactories: string[];
    uniqueStatuses: InventoryStatus[];
    onAddItem: (inventory: Inventory) => void;
}

// Memoized Sort Icon Component
const SortIcon = memo(function SortIcon({ field, currentSortField, currentSortDirection }: { field: InventorySortField; currentSortField: InventorySortField; currentSortDirection: SortDirection }) {
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
});

// Memoized Text Filter Dropdown
const TextFilterDropdown = memo(function TextFilterDropdown({ value, onChange, placeholder, isOpen, onToggle }: { value: string; onChange: (value: string) => void; placeholder?: string; isOpen: boolean; onToggle: () => void }) {
    const hasValue = value !== '';
    const handleButtonClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onToggle(); }, [onToggle]);
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value), [onChange]);
    const handleClear = useCallback(() => onChange(''), [onChange]);
    return (
        <div className="relative">
            <button onClick={handleButtonClick} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onToggle} />
                    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
                        <input type="text" value={value} onChange={handleInputChange} placeholder={placeholder} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
                        {hasValue && <button onClick={handleClear} className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
                    </div>
                </>
            )}
        </div>
    );
});

// Memoized MultiSelect Filter Dropdown
const MultiSelectFilterDropdown = memo(function MultiSelectFilterDropdown({ options, value, onChange, isOpen, onToggle, renderLabel }: { options: string[]; value: string[]; onChange: (value: string[]) => void; isOpen: boolean; onToggle: () => void; renderLabel?: (opt: string) => string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const hasValue = value.length > 0;
    const filteredOptions = useMemo(() => options.filter((opt) => (renderLabel ? renderLabel(opt) : opt).toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm, renderLabel]);
    const toggleOption = useCallback((optValue: string) => { if (value.includes(optValue)) { onChange(value.filter((v) => v !== optValue)); } else { onChange([...value, optValue]); } }, [value, onChange]);
    const handleButtonClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onToggle(); }, [onToggle]);
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value), []);
    const handleClearAll = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onChange([]); }, [onChange]);
    return (
        <div className="relative">
            <button onClick={handleButtonClick} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                {hasValue && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">{value.length}</span>}
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onToggle} />
                    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
                        <div className="p-2 border-b border-[var(--border)]">
                            <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search..." className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
                        </div>
                        <div className="overflow-y-auto flex-1 py-1">
                            {filteredOptions.length === 0 ? <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div> : filteredOptions.map((opt) => (
                                <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={value.includes(opt)} onChange={() => toggleOption(opt)} className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50" />
                                    <span className={value.includes(opt) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>{renderLabel ? renderLabel(opt) : opt}</span>
                                </label>
                            ))}
                        </div>
                        {hasValue && <div className="p-2 border-t border-[var(--border)]"><button onClick={handleClearAll} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear all</button></div>}
                    </div>
                </>
            )}
        </div>
    );
});

// Memoized Date Range Filter Dropdown
const DateRangeFilterDropdown = memo(function DateRangeFilterDropdown({ value, onChange, isOpen, onToggle }: { value: { start: string; end: string }; onChange: (value: { start: string; end: string }) => void; isOpen: boolean; onToggle: () => void }) {
    const hasValue = value.start !== '' || value.end !== '';
    const handleButtonClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onToggle(); }, [onToggle]);
    const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, start: e.target.value }), [onChange, value]);
    const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, end: e.target.value }), [onChange, value]);
    const handleClear = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onChange({ start: '', end: '' }); }, [onChange]);
    return (
        <div className="relative">
            <button onClick={handleButtonClick} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onToggle} />
                    <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
                        <div className="space-y-3">
                            <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label><input type="date" value={value.start} onChange={handleStartChange} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
                            <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label><input type="date" value={value.end} onChange={handleEndChange} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
                            {hasValue && <button onClick={handleClear} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

// Column widths for consistent layout
const COLUMN_WIDTHS = ['8%', '18%', '10%', '10%', '9%', '7%', '8%', '8%', '8%', '14%'];
const ROW_HEIGHT = 52;
const VIRTUALIZATION_THRESHOLD = 50;

// Props passed to virtualized rows via rowProps
interface VirtualRowProps {
    items: FlatInventoryItem[];
    inventoryMap: Map<string, Inventory>;
    onProductClick?: (inventory: Inventory) => void;
    onAddItem: (inventory: Inventory) => void;
    onEditItem: (item: FlatInventoryItem) => void;
}

// Memoized Row Component
interface RowProps {
    item: FlatInventoryItem;
    inv: Inventory | undefined;
    onProductClick?: (inventory: Inventory) => void;
    onAddItem: (inventory: Inventory) => void;
    onEditItem: (item: FlatInventoryItem) => void;
    style?: CSSProperties;
}

const InventoryTableRow = memo(function InventoryTableRow({ item, inv, onProductClick, onAddItem, onEditItem, style }: RowProps) {
    const isLowStock = item.availableQuantity <= (item.reorderPoint || 0);
    const factoryShort = useMemo(() => item.factoryName.split(' ')[0], [item.factoryName]);
    const formattedDate = useMemo(() => {
        if (!item.receivedDate) return '-';
        return new Date(item.receivedDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    }, [item.receivedDate]);
    const handleProductClick = useCallback(() => { if (inv && onProductClick) onProductClick(inv); }, [inv, onProductClick]);
    const handleAddClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); if (inv) onAddItem(inv); }, [inv, onAddItem]);
    const handleEditClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onEditItem(item); }, [item, onEditItem]);

    return (
        <div style={style} className="flex items-center hover:bg-[var(--muted)]/20 transition-colors border-b border-[var(--border)]">
            <div style={{ width: COLUMN_WIDTHS[0] }} className="px-4 py-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">{factoryShort}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[1] }} className="px-4 py-3">
                {inv && onProductClick ? (
                    <button onClick={handleProductClick} className="text-sm text-[var(--primary)] hover:underline line-clamp-1 text-left">{item.productName}</button>
                ) : (
                    <span className="text-sm text-[var(--foreground)] line-clamp-1">{item.productName}</span>
                )}
            </div>
            <div style={{ width: COLUMN_WIDTHS[2] }} className="px-4 py-3">
                <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-[var(--foreground)]'}`}>{item.partNumber}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[3] }} className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-[var(--foreground)]">{item.locationName || 'Unassigned'}</span>
                </div>
            </div>
            <div style={{ width: COLUMN_WIDTHS[4] }} className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${inventoryStatusColors[item.status]}`}>{inventoryStatusLabels[item.status]}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[5] }} className="px-4 py-3 text-right">
                <span className="text-sm font-semibold text-[var(--foreground)]">{formatQuantity(item.quantity)}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[6] }} className="px-4 py-3 text-right">
                <span className={`text-sm font-semibold ${item.status === 'AVAILABLE' ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>{item.status === 'AVAILABLE' ? formatQuantity(item.quantity) : '-'}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[7] }} className="px-4 py-3 text-right">
                <span className={`text-sm font-semibold ${item.status === 'RESERVED' ? 'text-blue-600' : 'text-[var(--muted-foreground)]'}`}>{item.status === 'RESERVED' ? formatQuantity(item.quantity) : '-'}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[8] }} className="px-4 py-3">
                <span className="text-sm text-[var(--foreground)]">{item.lotNumber || '-'}</span>
            </div>
            <div style={{ width: COLUMN_WIDTHS[9] }} className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                    <span className="text-sm text-[var(--muted-foreground)] mr-2">{formattedDate}</span>
                    {(item.id === item.inventoryId) && inv && (
                        <button onClick={handleAddClick} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-all" title="Add Item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                    )}
                    {(item.id !== item.inventoryId) && (
                        <button onClick={handleEditClick} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-all" title="Edit Item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

// Virtualized row component for react-window v2
function VirtualizedRowComponent({ index, style, items, inventoryMap, onProductClick, onAddItem, onEditItem }: RowComponentProps<VirtualRowProps>): ReactElement {
    const item = items[index];
    return <InventoryTableRow item={item} inv={inventoryMap.get(item.inventoryId)} onProductClick={onProductClick} onAddItem={onAddItem} onEditItem={onEditItem} style={style} />;
}

export default function InventoryTable({
    items, inventory, onProductClick, sortField, sortDirection, onSort, columnFilters, setColumnFilters, openFilter, setOpenFilter, uniqueFactories, uniqueStatuses, onAddItem,
}: InventoryTableProps) {
    const [editingItem, setEditingItem] = useState<FlatInventoryItem | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(400);

    // O(1) inventory lookup map
    const inventoryMap = useMemo(() => new Map(inventory.map(inv => [inv.id, inv])), [inventory]);

    // Memoized callbacks for filter changes
    const handleFactoryFilterChange = useCallback((value: string[]) => setColumnFilters(prev => ({ ...prev, factoryName: value })), [setColumnFilters]);
    const handleProductNameFilterChange = useCallback((value: string) => setColumnFilters(prev => ({ ...prev, productName: value })), [setColumnFilters]);
    const handlePartNumberFilterChange = useCallback((value: string) => setColumnFilters(prev => ({ ...prev, partNumber: value })), [setColumnFilters]);
    const handleLocationFilterChange = useCallback((value: string) => setColumnFilters(prev => ({ ...prev, location: value })), [setColumnFilters]);
    const handleStatusFilterChange = useCallback((value: string[]) => setColumnFilters(prev => ({ ...prev, status: value })), [setColumnFilters]);
    const handleDateRangeFilterChange = useCallback((value: { start: string; end: string }) => setColumnFilters(prev => ({ ...prev, dateRange: value })), [setColumnFilters]);

    // Memoized callbacks for sort
    const handleSortFactory = useCallback(() => onSort('factoryName'), [onSort]);
    const handleSortProduct = useCallback(() => onSort('productName'), [onSort]);
    const handleSortPartNumber = useCallback(() => onSort('partNumber'), [onSort]);
    const handleSortLocation = useCallback(() => onSort('locationName'), [onSort]);
    const handleSortStatus = useCallback(() => onSort('status'), [onSort]);
    const handleSortQuantity = useCallback(() => onSort('quantity'), [onSort]);
    const handleSortReceived = useCallback(() => onSort('receivedDate'), [onSort]);

    // Memoized callbacks for filter toggles
    const handleToggleFactoryFilter = useCallback(() => setOpenFilter(openFilter === 'factoryName' ? null : 'factoryName'), [openFilter, setOpenFilter]);
    const handleToggleProductFilter = useCallback(() => setOpenFilter(openFilter === 'productName' ? null : 'productName'), [openFilter, setOpenFilter]);
    const handleTogglePartNumberFilter = useCallback(() => setOpenFilter(openFilter === 'partNumber' ? null : 'partNumber'), [openFilter, setOpenFilter]);
    const handleToggleLocationFilter = useCallback(() => setOpenFilter(openFilter === 'location' ? null : 'location'), [openFilter, setOpenFilter]);
    const handleToggleStatusFilter = useCallback(() => setOpenFilter(openFilter === 'status' ? null : 'status'), [openFilter, setOpenFilter]);
    const handleToggleDateRangeFilter = useCallback(() => setOpenFilter(openFilter === 'dateRange' ? null : 'dateRange'), [openFilter, setOpenFilter]);

    const handleEditItem = useCallback((item: FlatInventoryItem) => setEditingItem(item), []);
    const handleCloseModal = useCallback(() => setEditingItem(null), []);

    // Observe container size for virtualization
    React.useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            const height = entries[0]?.contentRect.height ?? 400;
            setContainerHeight(Math.max(200, height - 48)); // subtract header height
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const useVirtualization = items.length > VIRTUALIZATION_THRESHOLD;

    return (
        <div ref={containerRef} className="flex-1 overflow-hidden p-6 pt-0 flex flex-col">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col flex-1">
                {/* Header */}
                <div className="flex border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <div style={{ width: COLUMN_WIDTHS[0] }} className="px-4 py-3">
                        <div className="flex items-center">
                            <button onClick={handleSortFactory} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                Factory<SortIcon field="factoryName" currentSortField={sortField} currentSortDirection={sortDirection} />
                            </button>
                            <MultiSelectFilterDropdown options={uniqueFactories} value={columnFilters.factoryName} onChange={handleFactoryFilterChange} isOpen={openFilter === 'factoryName'} onToggle={handleToggleFactoryFilter} />
                        </div>
                    </div>
                    <div style={{ width: COLUMN_WIDTHS[1] }} className="px-4 py-3">
                        <div className="flex items-center">
                            <button onClick={handleSortProduct} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                Description<SortIcon field="productName" currentSortField={sortField} currentSortDirection={sortDirection} />
                            </button>
                            <TextFilterDropdown value={columnFilters.productName} onChange={handleProductNameFilterChange} placeholder="Search..." isOpen={openFilter === 'productName'} onToggle={handleToggleProductFilter} />
                        </div>
                    </div>
                    <div style={{ width: COLUMN_WIDTHS[2] }} className="px-4 py-3">
                        <div className="flex items-center">
                            <button onClick={handleSortPartNumber} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                Part #<SortIcon field="partNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                            </button>
                            <TextFilterDropdown value={columnFilters.partNumber} onChange={handlePartNumberFilterChange} placeholder="Search..." isOpen={openFilter === 'partNumber'} onToggle={handleTogglePartNumberFilter} />
                        </div>
                    </div>
                    <div style={{ width: COLUMN_WIDTHS[3] }} className="px-4 py-3">
                        <div className="flex items-center">
                            <button onClick={handleSortLocation} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                Location<SortIcon field="locationName" currentSortField={sortField} currentSortDirection={sortDirection} />
                            </button>
                            <TextFilterDropdown value={columnFilters.location} onChange={handleLocationFilterChange} placeholder="Search..." isOpen={openFilter === 'location'} onToggle={handleToggleLocationFilter} />
                        </div>
                    </div>
                    <div style={{ width: COLUMN_WIDTHS[4] }} className="px-4 py-3">
                        <div className="flex items-center">
                            <button onClick={handleSortStatus} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                Status<SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                            </button>
                            <MultiSelectFilterDropdown options={uniqueStatuses} value={columnFilters.status} onChange={handleStatusFilterChange} isOpen={openFilter === 'status'} onToggle={handleToggleStatusFilter} renderLabel={(opt) => inventoryStatusLabels[opt as InventoryStatus]} />
                        </div>
                    </div>
                    <div style={{ width: COLUMN_WIDTHS[5] }} className="px-4 py-3 text-right">
                        <button onClick={handleSortQuantity} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center justify-end hover:text-[var(--foreground)] transition-colors">
                            Qty<SortIcon field="quantity" currentSortField={sortField} currentSortDirection={sortDirection} />
                        </button>
                    </div>
                    <div style={{ width: COLUMN_WIDTHS[6] }} className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Available</div>
                    <div style={{ width: COLUMN_WIDTHS[7] }} className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Reserved</div>
                    <div style={{ width: COLUMN_WIDTHS[8] }} className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Lot #</div>
                    <div style={{ width: COLUMN_WIDTHS[9] }} className="px-4 py-3">
                        <div className="flex items-center">
                            <button onClick={handleSortReceived} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                                Received<SortIcon field="receivedDate" currentSortField={sortField} currentSortDirection={sortDirection} />
                            </button>
                            <DateRangeFilterDropdown value={columnFilters.dateRange} onChange={handleDateRangeFilterChange} isOpen={openFilter === 'dateRange'} onToggle={handleToggleDateRangeFilter} />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto">
                    {items.length === 0 ? (
                        <div className="px-4 py-12 text-center text-[var(--muted-foreground)]">No inventory items found</div>
                    ) : useVirtualization ? (
                        <List<VirtualRowProps>
                            style={{ height: containerHeight }}
                            rowCount={items.length}
                            rowHeight={ROW_HEIGHT}
                            rowComponent={VirtualizedRowComponent}
                            rowProps={{ items, inventoryMap, onProductClick, onAddItem, onEditItem: handleEditItem }}
                        />
                    ) : (
                        items.map((item) => (
                            <InventoryTableRow key={item.id} item={item} inv={inventoryMap.get(item.inventoryId)} onProductClick={onProductClick} onAddItem={onAddItem} onEditItem={handleEditItem} />
                        ))
                    )}
                </div>
            </div>
            {editingItem && <UpdateInventoryItemModal item={editingItem} onClose={handleCloseModal} onSuccess={handleCloseModal} />}
        </div>
    );
}
