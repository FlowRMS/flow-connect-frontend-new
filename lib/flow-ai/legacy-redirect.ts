'use client';

export type LegacyRedirectParams = {
  pendingId?: string;
  fileUploadProcessId?: string;
};

type LegacyParamDefinition = {
  queryKeys: string[];
  targetKey: keyof LegacyRedirectParams;
  storageKey: string;
  label: string;
};

const LEGACY_PARAM_DEFINITIONS: LegacyParamDefinition[] = [
  {
    queryKeys: ['pending_id', 'pendingId', 'pending'],
    targetKey: 'pendingId',
    storageKey: 'flowrms_pending_id',
    label: 'pending ID',
  },
  {
    queryKeys: ['fileuploadprocess_id', 'file_upload_process_id', 'fileUploadProcessId'],
    targetKey: 'fileUploadProcessId',
    storageKey: 'fileUploadProcessId',
    label: 'file upload process ID',
  },
];

function sanitizeValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function extractLegacyParams(searchParams: URLSearchParams): LegacyRedirectParams {
  const result: LegacyRedirectParams = {};

  LEGACY_PARAM_DEFINITIONS.forEach(({ queryKeys, targetKey }) => {
    for (const key of queryKeys) {
      const value = sanitizeValue(searchParams.get(key));
      if (value) {
        result[targetKey] = value;
        break;
      }
    }
  });

  return result;
}

export function persistLegacyParams(params: LegacyRedirectParams): boolean {
  if (typeof window === 'undefined') return false;

  let stored = false;

  LEGACY_PARAM_DEFINITIONS.forEach(({ targetKey, storageKey, label }) => {
    const value = params[targetKey];
    if (value) {
      localStorage.setItem(storageKey, value);
      console.debug(`[legacy-redirect] Stored ${label}:`, value);
      stored = true;
    }
  });

  return stored;
}

export function removeLegacyParams(searchParams: URLSearchParams): boolean {
  let mutated = false;

  LEGACY_PARAM_DEFINITIONS.forEach(({ queryKeys }) => {
    queryKeys.forEach((key) => {
      if (searchParams.has(key)) {
        searchParams.delete(key);
        mutated = true;
      }
    });
  });

  return mutated;
}

export function buildLegacyRedirectExample(basePath = '/apps/flowrms/templates'): string {
  const url = new URL(
    basePath,
    typeof window !== 'undefined' ? window.location.origin : 'https://flowscan.example.com'
  );
  url.searchParams.set('pending_id', 'ca72fd2b-6aba-4203-8781-fe6987906c6b');
  url.searchParams.set('fileuploadprocess_id', 'abc123-def456-ghi789');
  return url.toString();
}

export { LEGACY_PARAM_DEFINITIONS };





