'use client';

import {
  HistoryPageHeader,
  HistoryFilters,
  ManufacturerMonthSendCard,
  EmptyHistoryState,
  NoResultsState,
} from '@/components/history';
import { fetchManufacturerSendHistory } from '@/lib/historyGqlSdk';
import { searchOrganizations } from '@/lib/organizationsGqlSdk';
import {
  historyPeriodOptions,
  getOverallStatusFromRepFirms,
  type ManufacturerMonthSend,
} from '@/lib/nemra-pos-data';
import { useHistoryData, type HistoryConfig } from '@/lib/hooks';

const manufacturerHistoryConfig: HistoryConfig<ManufacturerMonthSend> = {
  fetchHistory: fetchManufacturerSendHistory,
  getOverallStatus: (send) => getOverallStatusFromRepFirms(send.repFirms),
  fetchEntityOptions: async (token?: string) => {
    const orgs = await searchOrganizations(
      {
        searchTerm: '',
        repFirms: true, // Get rep firms for manufacturer
        connected: true,
        limit: 100,
      },
      token
    );
    return orgs.map((org) => ({ id: org.id, name: org.name }));
  },
  getEntityNames: (send) => send.repFirms.map((r) => r.name),
  filterEntitiesByName: (send, entityName) => {
    const filteredRepFirms = send.repFirms.filter(
      (r) => r.name.trim().toLowerCase() === entityName
    );
    const totalRecords = filteredRepFirms.reduce((sum, r) => sum + r.recordCount, 0);
    return {
      ...send,
      repFirms: filteredRepFirms,
      totalRecords,
    };
  },
  labels: {
    pageTitle: 'Send History',
    pageDescription: 'View past sends to rep firms and download what was delivered.',
    entityFilterLabel: 'All rep firms',
    entityFilterPlaceholder: 'All rep firms',
    sendLink: '/nemra-pos/manufacturer/send',
    emptyTitle: 'No send history yet',
    emptyDescription: 'When you send data to rep firms, you\'ll see your send history here.',
  },
};

export default function ManufacturerSendHistoryPage() {
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
  } = useHistoryData({ config: manufacturerHistoryConfig });

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
              <ManufacturerMonthSendCard
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
