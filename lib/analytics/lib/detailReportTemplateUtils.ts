import type { ParsedTemplate } from './reportTemplateManager';
import type {
  ColumnConfig,
  SavedColumnConfigEntry,
} from '@/lib/analytics/hooks/useColumnConfig';

export interface DetailTemplateEntry extends SavedColumnConfigEntry {
  isDefault: boolean;
}

export interface BuildDetailConfigParams {
  name: string;
  config: ColumnConfig;
  advancedFilters?: Record<string, unknown>;
  dateRange?: { startDate?: string; endDate?: string };
  sorting?: Array<{ prop: string; order: string }>;
  isDefault?: boolean;
  timestamp?: number;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null && !Array.isArray(value);

const cloneValue = <T>(value: T): T => {
  if (value == null) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

const isValidColumnConfig = (value: unknown): value is ColumnConfig => {
  if (!isPlainObject(value)) return false;

  const order = (value as Record<string, unknown>).order;
  const hidden = (value as Record<string, unknown>).hidden;
  const pin = (value as Record<string, unknown>).pin;

  if (!Array.isArray(order) || !order.every((item) => typeof item === 'string')) {
    return false;
  }

  if (!isPlainObject(hidden)) return false;
  if (!isPlainObject(pin)) return false;

  return true;
};

const normalizeSorting = (
  sorting: unknown
): Array<{ prop: string; order: string }> | undefined => {
  if (!Array.isArray(sorting)) return undefined;

  const normalized = sorting
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as { prop?: unknown }).prop === 'string' &&
        typeof (item as { order?: unknown }).order === 'string'
    )
    .map((item) => ({
      prop: (item as { prop: string }).prop,
      order: (item as { order: string }).order,
    }));

  return normalized.length > 0 ? normalized : undefined;
};

export const normalizeDetailTemplate = (
  template: ParsedTemplate<Record<string, unknown>>
): DetailTemplateEntry | null => {
  if (!template) return null;

  const parsed =
    template.parsedConfig && isPlainObject(template.parsedConfig)
      ? template.parsedConfig
      : {};

  const config = parsed.config;
  if (!isValidColumnConfig(config)) {
    console.warn('[detailReportTemplateUtils] Skipping template with invalid column config', template.id);
    return null;
  }

  const timestamp =
    typeof parsed.timestamp === 'number'
      ? parsed.timestamp
      : template.createdAt
      ? new Date(template.createdAt).getTime()
      : Date.now();

  const advancedFilters = isPlainObject(parsed.advancedFilters)
    ? (parsed.advancedFilters as Record<string, unknown>)
    : undefined;

  const parsedDateRange = parsed.dateRange;
  const dateRange =
    isPlainObject(parsedDateRange) &&
    (typeof parsedDateRange.startDate === 'string' ||
      typeof parsedDateRange.endDate === 'string')
      ? {
          startDate:
            typeof parsedDateRange.startDate === 'string'
              ? parsedDateRange.startDate
              : undefined,
          endDate:
            typeof parsedDateRange.endDate === 'string'
              ? parsedDateRange.endDate
              : undefined,
        }
      : undefined;

  const sorting = normalizeSorting(parsed.sorting);

  const entry: DetailTemplateEntry = {
    id: template.id,
    name:
      typeof template.reportTemplateName === 'string'
        ? template.reportTemplateName
        : typeof parsed.name === 'string'
        ? parsed.name
        : '',
    timestamp,
    config: cloneValue(config),
    advancedFilters: advancedFilters ? cloneValue(advancedFilters) : undefined,
    dateRange: dateRange ? cloneValue(dateRange) : undefined,
    sorting: sorting ? cloneValue(sorting) : undefined,
    isDefault: Boolean(parsed.isDefault),
  };

  return entry;
};

export const buildDetailConfigPayload = (
  params: BuildDetailConfigParams
): Record<string, unknown> => {
  const {
    name,
    config,
    advancedFilters,
    dateRange,
    sorting,
    isDefault = false,
    timestamp,
  } = params;

  const payload: Record<string, unknown> = {
    name,
    timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
    config: cloneValue(config),
    isDefault: Boolean(isDefault),
  };

  if (advancedFilters && Object.keys(advancedFilters).length > 0) {
    payload.advancedFilters = cloneValue(advancedFilters);
  }

  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    payload.dateRange = {
      startDate: dateRange.startDate || '',
      endDate: dateRange.endDate || '',
    };
  }

  const normalizedSorting = normalizeSorting(sorting);
  if (normalizedSorting) {
    payload.sorting = cloneValue(normalizedSorting);
  }

  return payload;
};

