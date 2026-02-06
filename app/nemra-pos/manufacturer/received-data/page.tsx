'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Building2,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
} from 'lucide-react';
import { getManufacturerReceivedData, type ManufacturerReceivedDataResult, type ReceivedDataFile } from '@/lib/gqlSdk';

export default function ReceivedDataPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>('December 2024');
  const [data, setData] = useState<ManufacturerReceivedDataResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getManufacturerReceivedData(selectedPeriod !== 'all' ? selectedPeriod : undefined);
        setData(result);
      } catch (e) {
        console.error('Failed to load received data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedPeriod]);

  // Get unique periods from data
  const periods = data ? [...new Set(data.receivedData.map(d => d.period))] : [];

  // Group by period for display
  const groupedByPeriod = data?.receivedData.reduce((acc, file) => {
    if (!acc[file.period]) {
      acc[file.period] = [];
    }
    acc[file.period].push(file);
    return acc;
  }, {} as Record<string, ReceivedDataFile[]>) || {};

  const statusConfig = {
    complete: { label: 'Complete', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
    partial: { label: 'Partial', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
    pending: { label: 'Pending', icon: Clock, className: 'bg-gray-100 text-gray-700' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Received Data</h1>
            <p className="text-muted-foreground">View and download POS data received from distributors</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Received Data</h1>
          <p className="text-muted-foreground">View and download POS data received from distributors</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.map(period => (
                <SelectItem key={period} value={period}>{period}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{data?.summary.activeDistributors || 0}</p>
                <p className="text-sm text-muted-foreground">Active Distributors</p>
              </div>
              <Building2 className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {(data?.summary.totalRecords || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{data?.summary.reportingPeriods || 0}</p>
                <p className="text-sm text-muted-foreground">Reporting Periods</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data by Period */}
      <div className="space-y-4">
        {Object.entries(groupedByPeriod).map(([period, files]) => {
          const isExpanded = expandedPeriod === period;
          const totalRecords = files.reduce((sum, f) => sum + f.recordCount, 0);

          return (
            <Card key={period}>
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedPeriod(isExpanded ? null : period)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{period}</p>
                    <p className="text-sm text-muted-foreground">
                      {files.length} {files.length === 1 ? 'distributor' : 'distributors'} &middot; {totalRecords.toLocaleString()} records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Download aggregated file
                    }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Download Aggregated
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded: Individual Distributor Files */}
              {isExpanded && (
                <div className="border-t">
                  <div className="p-4 bg-muted/20">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Individual Distributor Files</p>
                    <div className="space-y-2">
                      {files.map((file) => {
                        const status = statusConfig[file.status];
                        const StatusIcon = status.icon;

                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{file.distributorName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Received {new Date(file.receivedAt).toLocaleDateString()} at {new Date(file.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium">{file.recordCount.toLocaleString()} records</p>
                                <p className="text-xs text-muted-foreground">{file.fileSize}</p>
                              </div>
                              <Badge className={status.className}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {(!data || data.receivedData.length === 0) && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No data received yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Data will appear here once your distributors start sending POS reports.
            </p>
            <Button variant="outline" asChild>
              <a href="/nemra-pos/manufacturer/distributors">Manage Distributors</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
