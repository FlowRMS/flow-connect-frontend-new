import {
  ManufacturerMonthSend,
  DistributorMonthSend,
  ManufacturerDelivery,
  RepFirmDelivery,
  SendHistoryDataType,
  SendStatus,
} from './nemra-pos-data';
import {
  fetchSentExchangeFiles,
  SentExchangeFilesByPeriodResponse,
  SentExchangeFilesByOrgResponse,
  ExchangeFileStatus,
} from './exchangeFilesGql';

/**
 * Format a reporting period string (e.g., "2024-12") to display format (e.g., "December 2024")
 */
function formatReportingPeriod(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Determine the data type from files' isPos and isPot flags
 */
function determineDataType(orgs: SentExchangeFilesByOrgResponse[]): SendHistoryDataType {
  let hasPos = false;
  let hasPot = false;

  for (const org of orgs) {
    for (const file of org.files) {
      if (file.isPos) hasPos = true;
      if (file.isPot) hasPot = true;
    }
  }

  if (hasPos && hasPot) return 'POS + POT';
  if (hasPot) return 'POT';
  return 'POS';
}

/**
 * Map backend file status to frontend SendStatus
 */
function mapFileStatus(status: ExchangeFileStatus): SendStatus {
  switch (status) {
    case ExchangeFileStatus.SENT:
      return 'sent';
    case ExchangeFileStatus.PENDING:
      // PENDING files in history view are treated as sent (awaiting confirmation)
      return 'sent';
    default:
      return 'sent';
  }
}

/**
 * Base entity type for transformations
 */
interface BaseEntity {
  id: string;
  name: string;
  status: SendStatus;
  recordCount: number;
  issues: { blocking: number; warnings: number; fyi: number };
  sentAt: string;
  fileName?: string;
}

/**
 * Transform organization data to base entity format
 */
function transformOrganizationToEntity(org: SentExchangeFilesByOrgResponse): BaseEntity {
  const totalRecords = org.files.reduce((sum, file) => sum + file.rowCount, 0);
  const latestFile = org.files.reduce((latest, file) =>
    new Date(file.createdAt) > new Date(latest.createdAt) ? file : latest
  );
  const overallStatus = mapFileStatus(latestFile.status);

  return {
    id: org.connectedOrgId,
    name: org.connectedOrgName,
    status: overallStatus,
    recordCount: totalRecords,
    issues: { blocking: 0, warnings: 0, fyi: 0 },
    sentAt: latestFile.createdAt,
    fileName: latestFile.fileName,
  };
}

/**
 * Calculate totals from entities
 */
function calculateTotals(entities: BaseEntity[]): { totalRecords: number; latestSentAt: string } {
  const totalRecords = entities.reduce((sum, e) => sum + e.recordCount, 0);
  const latestSentAt = entities.reduce(
    (latest, e) => (new Date(e.sentAt) > new Date(latest) ? e.sentAt : latest),
    entities[0]?.sentAt || new Date().toISOString()
  );
  return { totalRecords, latestSentAt };
}

/**
 * Transform backend response to DistributorMonthSend format
 */
function transformToDistributorMonthSend(
  periodData: SentExchangeFilesByPeriodResponse
): DistributorMonthSend {
  const manufacturers: ManufacturerDelivery[] = periodData.organizations.map(transformOrganizationToEntity);
  const { totalRecords, latestSentAt } = calculateTotals(manufacturers);

  return {
    id: `hist-${periodData.reportingPeriod}`,
    period: formatReportingPeriod(periodData.reportingPeriod),
    dataType: determineDataType(periodData.organizations),
    sendMethod: 'file',
    fileName: manufacturers[0]?.fileName,
    manufacturers,
    totalRecords,
    sentAt: latestSentAt,
  };
}

export interface DistributorSendHistoryParams {
  period?: string;
  organizations?: string[];
  isPos?: boolean;
  isPot?: boolean;
}

/**
 * Fetch distributor send history from GraphQL.
 */
export async function fetchDistributorSendHistory(
  params?: DistributorSendHistoryParams,
  token?: string
): Promise<DistributorMonthSend[]> {
  const sentFiles = await fetchSentExchangeFiles(params, token);
  return sentFiles.map(transformToDistributorMonthSend);
}

/**
 * Transform backend response to ManufacturerMonthSend format
 */
function transformToManufacturerMonthSend(
  periodData: SentExchangeFilesByPeriodResponse
): ManufacturerMonthSend {
  const repFirms: RepFirmDelivery[] = periodData.organizations.map((org) => ({
    ...transformOrganizationToEntity(org),
    territories: [], // Not provided by API
  }));
  const { totalRecords, latestSentAt } = calculateTotals(repFirms);

  return {
    id: `hist-${periodData.reportingPeriod}`,
    period: formatReportingPeriod(periodData.reportingPeriod),
    dataType: determineDataType(periodData.organizations),
    sendMethod: 'file',
    fileName: repFirms[0]?.fileName,
    repFirms,
    totalRecords,
    sentAt: latestSentAt,
  };
}

export interface ManufacturerSendHistoryParams {
  period?: string;
  organizations?: string[];
  isPos?: boolean;
  isPot?: boolean;
}

/**
 * Fetch manufacturer send history from GraphQL.
 */
export async function fetchManufacturerSendHistory(
  params?: ManufacturerSendHistoryParams,
  token?: string
): Promise<ManufacturerMonthSend[]> {
  const sentFiles = await fetchSentExchangeFiles(params, token);
  return sentFiles.map(transformToManufacturerMonthSend);
}
