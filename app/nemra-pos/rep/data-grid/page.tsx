'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Factory,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  LayoutDashboard,
  Table2,
  TrendingUp,
  DollarSign,
  CheckCircle,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';
import { getRepDataGrid, type RepDataGridResult, type ExtendedPOSRecord } from '@/lib/gqlSdk';
import { cn } from '@/lib/utils';

type SortField = 'transactionDate' | 'manufacturer' | 'orderType' | 'sellingBranch' | 'sellingBranchZip' | 'customerZip' | 'shippingBranch' | 'billTo' | 'territory' | 'catalogNumber' | 'uom' | 'quantity' | 'extendedPrice';
type SortDirection = 'asc' | 'desc' | null;

// Column filter state
interface ColumnFilters {
  transactionDate: string;
  manufacturer: string;
  orderType: string;
  sellingBranch: string;
  sellingBranchZip: string;
  customerZip: string;
  shippingBranch: string;
  billTo: string;
  territory: string;
  catalogNumber: string;
  uom: string;
  quantity: string;
  extendedPrice: string;
}

export default function RepDataViewerPage() {
  const [data, setData] = useState<RepDataGridResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    transactionDate: '',
    manufacturer: '',
    orderType: '',
    sellingBranch: '',
    sellingBranchZip: '',
    customerZip: '',
    shippingBranch: '',
    billTo: '',
    territory: '',
    catalogNumber: '',
    uom: '',
    quantity: '',
    extendedPrice: '',
  });
  const pageSize = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getRepDataGrid({
          manufacturer: filterManufacturer !== 'all' ? filterManufacturer : undefined,
          month: filterMonth !== 'all' ? filterMonth : undefined,
          search: searchQuery || undefined,
        });
        setData(result);
      } catch (e) {
        console.error('Failed to load data grid', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filterManufacturer, filterMonth, searchQuery]);

  const manufacturers = useMemo(() => 
    data?.manufacturers.filter(m => m.status === 'reporting').map(m => m.name) || [],
    [data]
  );
  const months = ['November 2024', 'October 2024', 'September 2024'];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  const handleColumnFilterChange = (field: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearColumnFilters = () => {
    setColumnFilters({
      transactionDate: '',
      manufacturer: '',
      orderType: '',
      sellingBranch: '',
      sellingBranchZip: '',
      customerZip: '',
      shippingBranch: '',
      billTo: '',
      territory: '',
      catalogNumber: '',
      uom: '',
      quantity: '',
      extendedPrice: '',
    });
  };

  const hasActiveFilters = Object.values(columnFilters).some(v => v !== '');

  // Apply column filters to records
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];
    
    return data.records.filter(record => {
      return (
        (!columnFilters.transactionDate || record.transactionDate.toLowerCase().includes(columnFilters.transactionDate.toLowerCase())) &&
        (!columnFilters.manufacturer || record.manufacturer.toLowerCase().includes(columnFilters.manufacturer.toLowerCase())) &&
        (!columnFilters.orderType || record.orderType.toLowerCase().includes(columnFilters.orderType.toLowerCase())) &&
        (!columnFilters.sellingBranch || record.sellingBranch.toLowerCase().includes(columnFilters.sellingBranch.toLowerCase())) &&
        (!columnFilters.sellingBranchZip || record.sellingBranchZip.includes(columnFilters.sellingBranchZip)) &&
        (!columnFilters.customerZip || record.customerZip.includes(columnFilters.customerZip)) &&
        (!columnFilters.shippingBranch || record.shippingBranch.toLowerCase().includes(columnFilters.shippingBranch.toLowerCase())) &&
        (!columnFilters.billTo || record.billTo.toLowerCase().includes(columnFilters.billTo.toLowerCase())) &&
        (!columnFilters.territory || (record.territory && record.territory.toLowerCase().includes(columnFilters.territory.toLowerCase()))) &&
        (!columnFilters.catalogNumber || record.catalogNumber.toLowerCase().includes(columnFilters.catalogNumber.toLowerCase())) &&
        (!columnFilters.uom || record.uom.toLowerCase().includes(columnFilters.uom.toLowerCase())) &&
        (!columnFilters.quantity || record.quantity.toString().includes(columnFilters.quantity)) &&
        (!columnFilters.extendedPrice || record.extendedPrice.toString().includes(columnFilters.extendedPrice))
      );
    });
  }, [data?.records, columnFilters]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const records = [...filteredRecords];
    if (!sortField || !sortDirection) return records;

    return records.sort((a, b) => {
      let aVal: string | number = (a as unknown as Record<string, string | number>)[sortField] ?? '';
      let bVal: string | number = (b as unknown as Record<string, string | number>)[sortField] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortDirection]);

  const paginatedRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedRecords.length / pageSize);

  const advancedFeatures = [
    {
      icon: Table2,
      title: 'Dynamic, Savable Pivot Tables',
      description: 'Create custom pivot tables to slice and dice your data any way you need. Save and share your favorite views.',
    },
    {
      icon: LayoutDashboard,
      title: 'Interactive Dashboards',
      description: 'Build personalized dashboards with drag-and-drop widgets. Monitor KPIs at a glance.',
    },
    {
      icon: TrendingUp,
      title: 'DISC Market Data Integration',
      description: 'Combine your POS data with DISC market forecasting data - the industry\'s trusted source for over 50 years. See how your sales compare to market trends.',
    },
    {
      icon: Sparkles,
      title: 'Rep-Focused Analytics Views',
      description: 'Access all the powerful analytics views manufacturers see, tailored for rep firms: Highlights, Product Categories, Coverage Analysis, Inventory Risk, Action Boards, and Playbooks.',
    },
    {
      icon: DollarSign,
      title: 'Commission Tracking',
      description: 'Track commissions by manufacturer, territory, and product line. See projected vs. actual earnings and identify growth opportunities.',
    },
  ];

  const renderColumnHeader = (field: SortField, label: string, alignRight = false) => (
    <th
      className="text-left py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors text-xs whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className={cn("flex items-center gap-1", alignRight && "justify-end")}>
        {label}
        {getSortIcon(field)}
      </div>
    </th>
  );

  const renderFilterInput = (field: keyof ColumnFilters, placeholder: string) => (
    <th className="px-2 py-1">
      <Input
        placeholder={placeholder}
        value={columnFilters[field]}
        onChange={(e) => handleColumnFilterChange(field, e.target.value)}
        className="h-7 text-xs"
      />
    </th>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Viewer</h1>
            <p className="text-muted-foreground">View all POS data from your manufacturers</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - At Top */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{sortedRecords.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              ${sortedRecords.reduce((sum, r) => sum + r.extendedPrice, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Manufacturers</p>
            <p className="text-2xl font-bold">{manufacturers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unique Products</p>
            <p className="text-2xl font-bold">
              {new Set(sortedRecords.map(r => r.catalogNumber)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Viewer</h1>
          <p className="text-muted-foreground">View all POS data from your manufacturers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAdvancedModal(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Get Advanced Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by catalog #, branch, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Manufacturers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturers.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 border-l pl-4">
              <Button
                variant={showColumnFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Column Filters
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearColumnFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>POS Records</CardTitle>
            <CardDescription>
              Showing {paginatedRecords.length} of {sortedRecords.length} records
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {renderColumnHeader('transactionDate', 'Date')}
                  {renderColumnHeader('manufacturer', 'Manufacturer')}
                  {renderColumnHeader('orderType', 'Order Type')}
                  {renderColumnHeader('sellingBranch', 'Selling Branch')}
                  {renderColumnHeader('sellingBranchZip', 'Branch ZIP')}
                  {renderColumnHeader('customerZip', 'Customer ZIP')}
                  {renderColumnHeader('shippingBranch', 'Shipping Branch')}
                  {renderColumnHeader('billTo', 'Bill-To')}
                  {renderColumnHeader('territory', 'Territory')}
                  {renderColumnHeader('catalogNumber', 'Catalog #')}
                  {renderColumnHeader('uom', 'UOM')}
                  {renderColumnHeader('quantity', 'Qty', true)}
                  {renderColumnHeader('extendedPrice', 'Ext Price', true)}
                </tr>
                {showColumnFilters && (
                  <tr className="bg-muted/30">
                    {renderFilterInput('transactionDate', 'Filter...')}
                    {renderFilterInput('manufacturer', 'Filter...')}
                    {renderFilterInput('orderType', 'Filter...')}
                    {renderFilterInput('sellingBranch', 'Filter...')}
                    {renderFilterInput('sellingBranchZip', 'Filter...')}
                    {renderFilterInput('customerZip', 'Filter...')}
                    {renderFilterInput('shippingBranch', 'Filter...')}
                    {renderFilterInput('billTo', 'Filter...')}
                    {renderFilterInput('territory', 'Filter...')}
                    {renderFilterInput('catalogNumber', 'Filter...')}
                    {renderFilterInput('uom', 'Filter...')}
                    {renderFilterInput('quantity', 'Filter...')}
                    {renderFilterInput('extendedPrice', 'Filter...')}
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-xs">{record.transactionDate}</td>
                    <td className="py-3 px-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{record.manufacturer}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs">
                      <Badge variant="outline" className="text-xs">{record.orderType}</Badge>
                    </td>
                    <td className="py-3 px-2 text-xs">{record.sellingBranch}</td>
                    <td className="py-3 px-2 text-xs font-mono">{record.sellingBranchZip}</td>
                    <td className="py-3 px-2 text-xs font-mono">{record.customerZip}</td>
                    <td className="py-3 px-2 text-xs">{record.shippingBranch}</td>
                    <td className="py-3 px-2 text-xs font-mono">{record.billTo}</td>
                    <td className="py-3 px-2 text-xs">
                      {record.territory && (
                        <Badge variant="outline" className="text-xs">{record.territory}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">{record.catalogNumber}</td>
                    <td className="py-3 px-2 text-xs">{record.uom}</td>
                    <td className="py-3 px-2 text-right text-xs">{record.quantity}</td>
                    <td className="py-3 px-2 text-right font-medium text-xs">${record.extendedPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics Modal */}
      <Dialog open={showAdvancedModal} onOpenChange={setShowAdvancedModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              Connect to Flow RMS
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Unlock the full power of your POS data with Flow RMS - the complete rep management system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {advancedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex gap-4 p-5 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-medium flex items-center gap-2 text-base">
                      {feature.title}
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1.5">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Already have Flow RMS? <a href="#" className="text-primary hover:underline">Sign in</a>
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAdvancedModal(false)}>
                Maybe Later
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                Get Started with Flow RMS
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
