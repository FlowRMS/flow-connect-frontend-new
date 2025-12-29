import { GET_REPORT_TEMPLATES_BY_USER } from '@/lib/analytics/graphql/queries/reportTemplates';
import {
  CREATE_REPORT_TEMPLATE,
  UPDATE_REPORT_TEMPLATE,
  DELETE_REPORT_TEMPLATE,
} from '@/lib/analytics/graphql/mutations/reportTemplates';
import { ReportTemplate, ReportType } from '@/lib/analytics/graphql/types';
type ApolloClientInstance = ReturnType<typeof import('@apollo/client/react').useApolloClient>;

interface RawTemplateResponse {
  id: string;
  reportTemplateName: string;
  reportConfig: unknown;
  reportType: ReportType;
  createdAt?: string;
  userId?: string;
}

export interface ParsedTemplate<TConfig = unknown> extends ReportTemplate {
  parsedConfig: TConfig | null;
}

export interface UpsertTemplateParams<TConfig> {
  id?: string;
  name: string;
  config: TConfig;
  reportType: ReportType;
}

const safeParseConfig = <T>(config: unknown): T | null => {
  if (config == null) return null;

  if (typeof config === 'object') {
    return config as T;
  }

  if (typeof config !== 'string') {
    console.warn(
      '[reportTemplateManager] Unsupported report config type:',
      typeof config
    );
    return null;
  }

  let current = config.trim();
  if (!current) return null;

  const maxDepth = 5;
  for (let depth = 0; depth < maxDepth; depth += 1) {
    try {
      const parsed = JSON.parse(current) as unknown;
      if (parsed == null) return null;

      if (typeof parsed === 'object') {
        return parsed as T;
      }

      if (typeof parsed === 'string') {
        const next = parsed.trim();
        if (!next || next === current) {
          return null;
        }
        current = next;
        continue;
      }

      // Numbers/booleans are not valid configs
      console.warn(
        '[reportTemplateManager] Parsed config is not an object',
        typeof parsed
      );
      return null;
    } catch (error) {
      // Try unwrapping single-quoted payloads
      if (current.startsWith("'") && current.endsWith("'")) {
        current = current.slice(1, -1);
        continue;
      }

      console.warn('[reportTemplateManager] Failed to parse report config', {
        error,
        depth,
        sample: current.slice(0, 200),
      });
      return null;
    }
  }

  console.warn(
    '[reportTemplateManager] Reached max decode depth for report config'
  );
  return null;
};

const normalizeTemplate = <TConfig = unknown>(
  template: RawTemplateResponse
): ParsedTemplate<TConfig> => ({
  ...template,
  parsedConfig: safeParseConfig<TConfig>(template.reportConfig),
});

export async function fetchReportTemplates<TConfig = unknown>(
  client: ApolloClientInstance,
  reportType: ReportType
): Promise<ParsedTemplate<TConfig>[]> {
  const response = await client.query<{
    reportTemplatesByUser: RawTemplateResponse[];
  }>({
    query: GET_REPORT_TEMPLATES_BY_USER,
    fetchPolicy: 'network-only',
  });

  const templates = (response.data?.reportTemplatesByUser ?? []).filter(
    (template) => template.reportType === reportType
  );
  return templates.map((template) => normalizeTemplate<TConfig>(template));
}

export async function upsertReportTemplate<TConfig>(
  client: ApolloClientInstance,
  params: UpsertTemplateParams<TConfig>
): Promise<ParsedTemplate<TConfig>> {
  const { id, name, config, reportType } = params;
  const normalizedConfig =
    config == null
      ? null
      : typeof config === 'string'
      ? (() => {
          try {
            return JSON.parse(config);
          } catch {
            return config;
          }
        })()
      : JSON.parse(JSON.stringify(config));

  if (id) {
    const response = await client.mutate<{
      updateReportTemplate: RawTemplateResponse;
    }>({
      mutation: UPDATE_REPORT_TEMPLATE,
      variables: {
        reportTemplateId: id,
        reportConfig: normalizedConfig,
        reportTemplateName: name,
      },
    });

    if (!response.data?.updateReportTemplate) {
      throw new Error('Failed to update report template');
    }

    return normalizeTemplate<TConfig>(response.data.updateReportTemplate);
  }

  const response = await client.mutate<{
    createReportTemplate: RawTemplateResponse;
  }>({
    mutation: CREATE_REPORT_TEMPLATE,
    variables: {
      input: {
        reportConfig: normalizedConfig,
        reportTemplateName: name,
        reportType,
      },
    },
  });

  if (!response.data?.createReportTemplate) {
    throw new Error('Failed to create report template');
  }

  return normalizeTemplate<TConfig>(response.data.createReportTemplate);
}

export async function deleteReportTemplate(
  client: ApolloClientInstance,
  templateId: string
): Promise<void> {
  await client.mutate({
    mutation: DELETE_REPORT_TEMPLATE,
    variables: { templateId },
  });
}

