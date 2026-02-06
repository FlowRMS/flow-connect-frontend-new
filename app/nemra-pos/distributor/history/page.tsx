'use client';

import {
  HistoryPageHeader,
  HistoryFilters,
  DistributorMonthSendCard,
  EmptyHistoryState,
  NoResultsState,
} from '@/components/history';
import { fetchDistributorSendHistory } from '@/lib/historyGqlSdk';
import { searchOrganizations } from '@/lib/organizationsGqlSdk';
import {
  historyPeriodOptions,
  getOverallStatusFromManufacturers,
  type DistributorMonthSend,
} from '@/lib/nemra-pos-data';
import { useHistoryData, type HistoryConfig } from '@/lib/hooks';

const distributorHistoryConfig: HistoryConfig<DistributorMonthSend> = {
  fetchHistory: fetchDistributorSendHistory,
  getOverallStatus: (send) => getOverallStatusFromManufacturers(send.manufacturers),
  fetchEntityOptions: async (token?: string) => {
    const orgs = await searchOrganizations(
      {
        searchTerm: '',
        repFirms: false, // Get manufacturers for distributor
        connected: true,
        limit: 100,
      },
      token
    );
    return orgs.map((org) => ({ id: org.id, name: org.name }));
  },
  getEntityNames: (send) => send.manufacturers.map((m) => m.name),
  filterEntitiesByName: (send, entityName) => {
    const filteredManufacturers = send.manufacturers.filter(
      (m) => m.name.trim().toLowerCase() === entityName
    );
    const totalRecords = filteredManufacturers.reduce((sum, m) => sum + m.recordCount, 0);
    return {
      ...send,
      manufacturers: filteredManufacturers,
      totalRecords,
    };
  },
  labels: {
    pageTitle: 'History',
    pageDescription: 'View past sends and download what was delivered.',
    entityFilterLabel: 'All manufacturers',
    entityFilterPlaceholder: 'All manufacturers',
    sendLink: '/nemra-pos/distributor/send',
    emptyTitle: 'No send history yet',
    emptyDescription: 'When you send data, you\'ll see your send history here.',
  },
};

export default function DistributorHistoryPage() {
  const {
    filterPeriod,
    setFilterPeriod,
    filterStatus,
    setFilterStatus,
    filterEntity,
    setFilterEntity,
    filterDataType,
    setFilterDataType,
    expandedMonths,
    toggleMonth,
    filteredSends,
    entityOptions,
    isLoading,
    error,
    hasNoHistory,
    config,
  } = useHistoryData({ config: distributorHistoryConfig });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <HistoryPageHeader
          title={config.labels.pageTitle}
          description={config.labels.pageDescription}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-5xl">
        <HistoryPageHeader
          title={config.labels.pageTitle}
          description={config.labels.pageDescription}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <HistoryPageHeader
        title={config.labels.pageTitle}
        description={config.labels.pageDescription}
      />

      {/* Empty State */}
      {hasNoHistory && (
        <EmptyHistoryState
          sendLink={config.labels.sendLink}
          title={config.labels.emptyTitle}
          description={config.labels.emptyDescription}
        />
      )}

      {!hasNoHistory && (
        <>
          {/* Filters */}
          <HistoryFilters
            filterPeriod={filterPeriod}
            setFilterPeriod={setFilterPeriod}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterDataType={filterDataType}
            setFilterDataType={setFilterDataType}
            periodOptions={historyPeriodOptions}
            entityFilterValue={filterEntity}
            setEntityFilterValue={setFilterEntity}
            entityOptions={entityOptions}
            entityLabel={config.labels.entityFilterLabel}
            entityPlaceholder={config.labels.entityFilterPlaceholder}
          />

          {/* History List - Expandable by Month */}
          <div className="space-y-3">
            {filteredSends.map((send) => (
              <DistributorMonthSendCard
                key={send.id}
                send={send}
                isExpanded={expandedMonths.has(send.id)}
                onToggle={() => toggleMonth(send.id)}
              />
            ))}
          </div>

          {filteredSends.length === 0 && <NoResultsState />}
        </>
      )}
    </div>
  );
}
