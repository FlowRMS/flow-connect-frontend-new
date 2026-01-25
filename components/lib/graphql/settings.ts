/**
 * Settings GraphQL Module
 * Handles user and tenant settings persistence via GraphQL API
 */

import { crmGraphQLRequest } from './client';
import type { ColumnConfig } from '@/components/quotes-v2/types';

// ============================================================================
// Setting Key Types
// ============================================================================

export type SettingKey =
  | 'QUOTE_SETTINGS'
  | 'ORDER_SETTINGS'
  | 'INVOICE_SETTINGS'
  | 'CHECKS_SETTINGS'
  | 'CHAT_SETTINGS'
  | 'SIDEBAR_SETTINGS'
  | 'FLOW_AI_SETTINGS';

// ============================================================================
// Setting Value Types
// ============================================================================

export interface QuoteSettingsValue {
  columnConfig: ColumnConfig[];
  specifyEndUserPerLine: boolean;
  outsideRepAtLineLevel: boolean;
  insideRepAtLineLevel: boolean;
  factoryPerLineItem: boolean;
  customerPartNumberSource: 'sold_to' | 'end_user';
}

export interface OrderColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  pinned?: boolean;
}

export interface OrderSettingsValue {
  columnConfig: OrderColumnConfig[];
  showEndUserPerLine: boolean;
  showOutsideRepPerLine: boolean;
  showInsideRepPerLine: boolean;
}

export interface InvoiceColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  pinned?: boolean;
}

export interface InvoiceSettingsValue {
  columnConfig: InvoiceColumnConfig[];
}

export type ProcessingMode = 'automatic' | 'manual';

export interface VoicePersonalityConfig {
  id: string;
  name: string;
  voiceId: string;
}

export interface ChatSettingsValue {
  // Chat configuration
  followUpSuggestions: boolean;
  vectorSearch: boolean;
  // Text-to-Speech settings
  ttsEnabled: boolean;
  voicePersonalityId: string;
  speakingSpeed: number;
}

export interface FlowAISettingsValue {
  // Processing modes for each document type
  quotes: ProcessingMode;
  orders: ProcessingMode;
  invoices: ProcessingMode;
  checks: ProcessingMode;
  associations: ProcessingMode;
  jobs: ProcessingMode;
  preOpportunities: ProcessingMode;
  // Confidence threshold for automatic processing (0-100)
  confidenceThreshold: number;
}

export interface NavItemConfig {
  id: string;
  name: string;
  href: string;
  enabled: boolean;
}

export interface NavGroupConfig {
  id: string;
  label: string;
  collapsed: boolean;
  items: NavItemConfig[];
}

export interface SidebarSettingsValue {
  groups: NavGroupConfig[];
}

export type SettingValue =
  | QuoteSettingsValue
  | OrderSettingsValue
  | InvoiceSettingsValue
  | ChatSettingsValue
  | SidebarSettingsValue
  | FlowAISettingsValue;

// ============================================================================
// Setting Response Types
// ============================================================================

export interface Setting {
  id: string;
  key: SettingKey;
  value: unknown; // JSON value (object or string depending on API)
  userId: string;
  createdAt: string;
}

export interface ParsedSetting<T extends SettingValue = SettingValue> {
  id: string;
  key: SettingKey;
  value: T;
  userId: string;
  createdAt: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_MY_SETTING = `
  query GetMySetting($key: SettingKey!) {
    mySetting(key: $key) {
      id
      key
      value
      userId
      createdAt
    }
  }
`;

const GET_MY_SETTINGS = `
  query GetMySettings {
    mySettings {
      id
      key
      value
      userId
      createdAt
    }
  }
`;

const GET_TENANT_SETTING = `
  query GetTenantSetting($key: SettingKey!) {
    tenantSetting(key: $key) {
      id
      key
      value
      userId
      createdAt
    }
  }
`;

const GET_TENANT_SETTINGS = `
  query GetTenantSettings {
    tenantSettings {
      id
      key
      value
      userId
      createdAt
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_MY_SETTING = `
  mutation CreateMySetting($key: SettingKey!, $value: JSON!) {
    createMySetting(key: $key, value: $value) {
      id
      key
      value
      userId
      createdAt
    }
  }
`;

const CREATE_TENANT_SETTING = `
  mutation CreateTenantSetting($key: SettingKey!, $value: JSON!) {
    createTenantSetting(key: $key, value: $value) {
      id
      key
      value
      userId
      createdAt
    }
  }
`;

const DELETE_MY_SETTING = `
  mutation DeleteMySetting($key: SettingKey!) {
    deleteMySetting(key: $key)
  }
`;

const DELETE_TENANT_SETTING = `
  mutation DeleteTenantSetting($key: SettingKey!) {
    deleteTenantSetting(key: $key)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get a single personal setting by key
 */
export async function getMySetting(key: SettingKey): Promise<Setting | null> {
  const response = await crmGraphQLRequest<{ mySetting: Setting | null }>({
    query: GET_MY_SETTING,
    variables: { key },
  });

  if (response.errors?.length) {
    console.error('Failed to get my setting:', response.errors);
    return null;
  }

  return response.data?.mySetting || null;
}

/**
 * Get all personal settings
 */
export async function getMySettings(): Promise<Setting[]> {
  const response = await crmGraphQLRequest<{ mySettings: Setting[] }>({
    query: GET_MY_SETTINGS,
  });

  if (response.errors?.length) {
    console.error('Failed to get my settings:', response.errors);
    return [];
  }

  return response.data?.mySettings || [];
}

/**
 * Get a single tenant setting by key
 */
export async function getTenantSetting(key: SettingKey): Promise<Setting | null> {
  const response = await crmGraphQLRequest<{ tenantSetting: Setting | null }>({
    query: GET_TENANT_SETTING,
    variables: { key },
  });

  if (response.errors?.length) {
    console.error('Failed to get tenant setting:', response.errors);
    return null;
  }

  return response.data?.tenantSetting || null;
}

/**
 * Get all tenant settings
 */
export async function getTenantSettings(): Promise<Setting[]> {
  const response = await crmGraphQLRequest<{ tenantSettings: Setting[] }>({
    query: GET_TENANT_SETTINGS,
  });

  if (response.errors?.length) {
    console.error('Failed to get tenant settings:', response.errors);
    return [];
  }

  return response.data?.tenantSettings || [];
}

/**
 * Create or update a personal setting
 * Note: API doesn't have update, so we delete first then create
 */
export async function saveMySetting(key: SettingKey, value: SettingValue): Promise<Setting | null> {
  // First try to delete existing (ignore errors if doesn't exist)
  await crmGraphQLRequest({
    query: DELETE_MY_SETTING,
    variables: { key },
  });

  // Then create new - value is passed directly as JSON type
  const response = await crmGraphQLRequest<{ createMySetting: Setting }>({
    query: CREATE_MY_SETTING,
    variables: { key, value },
  });

  if (response.errors?.length) {
    console.error('Failed to save my setting:', response.errors);
    return null;
  }

  return response.data?.createMySetting || null;
}

/**
 * Create or update a tenant setting
 * Note: API doesn't have update, so we delete first then create
 */
export async function saveTenantSetting(key: SettingKey, value: SettingValue): Promise<Setting | null> {
  // First try to delete existing (ignore errors if doesn't exist)
  await crmGraphQLRequest({
    query: DELETE_TENANT_SETTING,
    variables: { key },
  });

  // Then create new - value is passed directly as JSON type
  const response = await crmGraphQLRequest<{ createTenantSetting: Setting }>({
    query: CREATE_TENANT_SETTING,
    variables: { key, value },
  });

  if (response.errors?.length) {
    console.error('Failed to save tenant setting:', response.errors);
    return null;
  }

  return response.data?.createTenantSetting || null;
}

/**
 * Delete a personal setting
 */
export async function deleteMySetting(key: SettingKey): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteMySetting: boolean }>({
    query: DELETE_MY_SETTING,
    variables: { key },
  });

  if (response.errors?.length) {
    console.error('Failed to delete my setting:', response.errors);
    return false;
  }

  return response.data?.deleteMySetting ?? false;
}

/**
 * Delete a tenant setting
 */
export async function deleteTenantSetting(key: SettingKey): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTenantSetting: boolean }>({
    query: DELETE_TENANT_SETTING,
    variables: { key },
  });

  if (response.errors?.length) {
    console.error('Failed to delete tenant setting:', response.errors);
    return false;
  }

  return response.data?.deleteTenantSetting ?? false;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a setting's value into the correct type
 * Handles both JSON object (from API) and string (legacy) formats
 */
export function parseSettingValue<T extends SettingValue>(setting: Setting | null): T | null {
  if (!setting?.value) return null;

  // If value is already an object, return it directly
  if (typeof setting.value === 'object') {
    return setting.value as T;
  }

  // If value is a string, try to parse it as JSON
  if (typeof setting.value === 'string') {
    try {
      return JSON.parse(setting.value) as T;
    } catch (e) {
      console.error('Failed to parse setting value:', e);
      return null;
    }
  }

  return null;
}

/**
 * Get effective setting (personal overrides tenant)
 */
export function getEffectiveSetting<T extends SettingValue>(
  mySetting: Setting | null,
  tenantSetting: Setting | null
): T | null {
  // Personal setting takes priority
  if (mySetting?.value) {
    return parseSettingValue<T>(mySetting);
  }

  // Fall back to tenant setting
  if (tenantSetting?.value) {
    return parseSettingValue<T>(tenantSetting);
  }

  return null;
}

/**
 * Parse all settings into a map
 */
export function parseSettingsMap(settings: Setting[]): Map<SettingKey, SettingValue> {
  const map = new Map<SettingKey, SettingValue>();

  for (const setting of settings) {
    const value = parseSettingValue(setting);
    if (value) {
      map.set(setting.key, value);
    }
  }

  return map;
}
