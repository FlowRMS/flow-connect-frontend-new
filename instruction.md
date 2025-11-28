# FlowCRM API Integration Guide

> **Complete documentation for integrating the FlowCRM UI with the external CRM GraphQL API**  
> This guide covers authentication, environment setup, API endpoints, React Query hooks, and UI component patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Project Structure](#project-structure)
4. [Authentication System](#authentication-system)
   - [Auth Library (`crm-auth.ts`)](#auth-library-crm-authts)
   - [Token Server Integration (`crm-token-server.ts`)](#token-server-integration-crm-token-serverts)
   - [Auth UI Component (`CRMAuthContent.tsx`)](#auth-ui-component-crmauthcontenttsx)
   - [Auth Page Route](#auth-page-route)
5. [GraphQL Client & API Endpoints](#graphql-client--api-endpoints)
   - [Core GraphQL Client (`crm-graphql.ts`)](#core-graphql-client-crm-graphqlts)
   - [Jobs API](#jobs-api)
   - [Companies API](#companies-api)
   - [Contacts API](#contacts-api)
   - [Landing Pages API (Efficient List Queries)](#landing-pages-api-efficient-list-queries)
6. [React Query Hooks (`useCRMApi.ts`)](#react-query-hooks-usecrmapits)
7. [UI Component Integration Patterns](#ui-component-integration-patterns)
   - [Connection Status Checks](#connection-status-checks)
   - [Loading States](#loading-states)
   - [Error Handling](#error-handling)
   - [Create Modals](#create-modals)
   - [List Components with API Data](#list-components-with-api-data)
8. [Complete File Reference](#complete-file-reference)
9. [Step-by-Step Integration Checklist](#step-by-step-integration-checklist)

---

## Overview

FlowCRM integrates with an external CRM GraphQL API to manage:
- **Jobs** - Project/job tracking with statuses
- **Companies** - Customer and manufacturer management
- **Contacts** - Contact management linked to companies

The integration supports two authentication modes:
1. **Manual Tokens** - User manually enters access/refresh tokens
2. **Token Server** - Automatic token management via a local token server (recommended)

---

## Environment Variables

### Required Environment Variable

Add to your `.env.local` (or `.env` for production):

```bash
# FlowCRM GraphQL API Endpoint
NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL=https://staging.api.crm.flowrms.com/graphql
```

### Environment Variable Usage

The environment variable is accessed in `crm-graphql.ts`:

```typescript
const getGraphQLEndpoint = (): string => {
  const endpoint = process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL;
  if (!endpoint) {
    throw new Error('NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL environment variable is not set');
  }
  return endpoint;
};
```

### Example Values

| Environment | URL |
|-------------|-----|
| Staging | `https://staging.api.crm.flowrms.com/graphql` |
| Production | `https://api.crm.flowrms.com/graphql` |
| Local Dev | `http://localhost:4000/graphql` |

---

## Project Structure

```
frontend/
├── app/
│   └── dashboard/
│       └── apps/
│           └── flow-crm/
│               ├── page.tsx              # Main dashboard entry
│               ├── auth/
│               │   └── page.tsx          # Auth configuration page ⭐ NEW
│               ├── jobs/
│               │   └── page.tsx          # Jobs list page
│               ├── companies/
│               │   └── page.tsx          # Companies list page
│               ├── contacts/
│               │   └── page.tsx          # Contacts list page
│               └── [other-routes]/
│
└── components/
    └── flow-crm/
        ├── lib/                          # ⭐ CORE API INTEGRATION
        │   ├── crm-auth.ts              # Token storage & auth mode
        │   ├── crm-graphql.ts           # GraphQL client & queries
        │   └── crm-token-server.ts      # Token server integration
        │
        ├── hooks/                        # ⭐ REACT QUERY HOOKS
        │   └── useCRMApi.ts             # All API hooks
        │
        ├── CRMAuthContent.tsx           # ⭐ AUTH UI COMPONENT
        ├── JobsContent.tsx              # Jobs with API integration
        ├── CompaniesContent.tsx         # Companies with API integration
        ├── ContactsContent.tsx          # Contacts with API integration
        ├── CreateJobModal.tsx           # Create job with API
        ├── CreateCompanyModal.tsx       # Create company with API
        ├── CreateContactModal.tsx       # Create contact with API
        └── [other-components]/
```

---

## Authentication System

### Auth Library (`crm-auth.ts`)

**Location:** `frontend/components/flow-crm/lib/crm-auth.ts`

This module handles token storage and retrieval using localStorage.

```typescript
/**
 * FlowCRM Authentication Token Storage
 * Stores access and refresh tokens in localStorage for CRM GraphQL API calls
 * Supports both manual token entry and Token Server integration
 */

import {
  isTokenServerEnabled,
  tokenServerClient,
  getTokenServerConfig,
  type TokenServerConfig,
} from './crm-token-server';

// localStorage keys
const CRM_ACCESS_TOKEN_KEY = 'flowcrm_access_token';
const CRM_REFRESH_TOKEN_KEY = 'flowcrm_refresh_token';

export interface CRMTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export type AuthMode = 'manual' | 'token-server';

/**
 * Get the current authentication mode
 */
export function getAuthMode(): AuthMode {
  return isTokenServerEnabled() ? 'token-server' : 'manual';
}

/**
 * Get Token Server configuration (re-exported for convenience)
 */
export { getTokenServerConfig, type TokenServerConfig };

/**
 * Get the stored CRM access token
 */
export function getCRMAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CRM_ACCESS_TOKEN_KEY);
}

/**
 * Get the stored CRM refresh token
 */
export function getCRMRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CRM_REFRESH_TOKEN_KEY);
}

/**
 * Get both CRM tokens
 */
export function getCRMTokens(): CRMTokens {
  return {
    accessToken: getCRMAccessToken(),
    refreshToken: getCRMRefreshToken(),
  };
}

/**
 * Set the CRM access token
 */
export function setCRMAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CRM_ACCESS_TOKEN_KEY, token);
}

/**
 * Set the CRM refresh token
 */
export function setCRMRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CRM_REFRESH_TOKEN_KEY, token);
}

/**
 * Set both CRM tokens
 */
export function setCRMTokens(accessToken: string, refreshToken: string): void {
  setCRMAccessToken(accessToken);
  setCRMRefreshToken(refreshToken);
}

/**
 * Clear all CRM tokens
 */
export function clearCRMTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CRM_ACCESS_TOKEN_KEY);
  localStorage.removeItem(CRM_REFRESH_TOKEN_KEY);
}

/**
 * Check if CRM tokens are configured
 */
export function hasCRMTokens(): boolean {
  // If Token Server is enabled, check its configuration
  if (isTokenServerEnabled()) {
    const config = getTokenServerConfig();
    return !!(config.serverUrl && config.tenant);
  }
  
  // Otherwise check manual tokens
  const tokens = getCRMTokens();
  return !!(tokens.accessToken && tokens.refreshToken);
}

/**
 * Check Token Server health
 */
export async function checkTokenServerHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const health = await tokenServerClient.checkHealth();
    return {
      healthy: true,
      message: `Token Server healthy. Cached tokens: ${health.cached_tokens}`,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}

/**
 * Get access token - handles both manual and Token Server modes
 */
export async function getAccessTokenAsync(): Promise<string> {
  if (isTokenServerEnabled()) {
    return tokenServerClient.getAccessToken();
  }
  
  const token = getCRMAccessToken();
  if (!token) {
    throw new Error('No access token configured');
  }
  return token;
}

/**
 * Get authorization header - handles both modes
 */
export async function getAuthorizationHeaderAsync(): Promise<string> {
  if (isTokenServerEnabled()) {
    return tokenServerClient.getAuthorizationHeader();
  }
  
  const token = getCRMAccessToken();
  if (!token) {
    throw new Error('No access token configured');
  }
  return `Bearer ${token}`;
}
```

### Token Server Integration (`crm-token-server.ts`)

**Location:** `frontend/components/flow-crm/lib/crm-token-server.ts`

This module integrates with a local Token Server for automatic token management.

```typescript
/**
 * FlowCRM Token Server Client
 * Integrates with the Token Server running on http://127.0.0.1:8000
 * Provides automatic token management with caching and refresh
 */

// Configuration defaults
const DEFAULT_TOKEN_SERVER_URL = 'http://127.0.0.1:8000';
const DEFAULT_TENANT = 'staging2';
const DEFAULT_ENV = 'staging';

// localStorage keys
const TOKEN_SERVER_URL_KEY = 'flowcrm_token_server_url';
const TOKEN_SERVER_TENANT_KEY = 'flowcrm_token_server_tenant';
const TOKEN_SERVER_ENV_KEY = 'flowcrm_token_server_env';
const TOKEN_SERVER_ENABLED_KEY = 'flowcrm_token_server_enabled';

export interface TokenServerResponse {
  access_token: string;
  refresh_token: string;
  authorization: string;
}

export interface TokenServerConfig {
  serverUrl: string;
  tenant: string;
  env: string;
  enabled: boolean;
}

export interface TokenServerHealthResponse {
  status: string;
  cached_tokens: number;
  timestamp?: string;
}

/**
 * Get Token Server configuration from localStorage
 */
export function getTokenServerConfig(): TokenServerConfig {
  if (typeof window === 'undefined') {
    return {
      serverUrl: DEFAULT_TOKEN_SERVER_URL,
      tenant: DEFAULT_TENANT,
      env: DEFAULT_ENV,
      enabled: false,
    };
  }

  return {
    serverUrl: localStorage.getItem(TOKEN_SERVER_URL_KEY) || DEFAULT_TOKEN_SERVER_URL,
    tenant: localStorage.getItem(TOKEN_SERVER_TENANT_KEY) || DEFAULT_TENANT,
    env: localStorage.getItem(TOKEN_SERVER_ENV_KEY) || DEFAULT_ENV,
    enabled: localStorage.getItem(TOKEN_SERVER_ENABLED_KEY) === 'true',
  };
}

/**
 * Save Token Server configuration to localStorage
 */
export function setTokenServerConfig(config: Partial<TokenServerConfig>): void {
  if (typeof window === 'undefined') return;

  if (config.serverUrl !== undefined) {
    localStorage.setItem(TOKEN_SERVER_URL_KEY, config.serverUrl);
  }
  if (config.tenant !== undefined) {
    localStorage.setItem(TOKEN_SERVER_TENANT_KEY, config.tenant);
  }
  if (config.env !== undefined) {
    localStorage.setItem(TOKEN_SERVER_ENV_KEY, config.env);
  }
  if (config.enabled !== undefined) {
    localStorage.setItem(TOKEN_SERVER_ENABLED_KEY, config.enabled.toString());
  }
}

/**
 * Clear Token Server configuration from localStorage
 */
export function clearTokenServerConfig(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_SERVER_URL_KEY);
  localStorage.removeItem(TOKEN_SERVER_TENANT_KEY);
  localStorage.removeItem(TOKEN_SERVER_ENV_KEY);
  localStorage.removeItem(TOKEN_SERVER_ENABLED_KEY);
}

/**
 * Check if Token Server is enabled
 */
export function isTokenServerEnabled(): boolean {
  return getTokenServerConfig().enabled;
}

/**
 * Token Server client class with caching and auto-refresh
 */
class TokenServerClient {
  private currentToken: TokenServerResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get token from Token Server with caching
   */
  async getToken(forceRefresh = false): Promise<TokenServerResponse> {
    const config = getTokenServerConfig();

    if (!config.enabled) {
      throw new Error('Token Server is not enabled. Enable it in FlowCRM settings.');
    }

    // Return cached token if still valid
    const now = Date.now();
    if (!forceRefresh && this.currentToken && now - this.lastFetchTime < this.TOKEN_CACHE_DURATION) {
      return this.currentToken;
    }

    const params = new URLSearchParams({
      tenant: config.tenant,
      env: config.env,
      force_refresh: forceRefresh.toString(),
    });

    try {
      const response = await fetch(`${config.serverUrl}/token?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      this.currentToken = await response.json();
      this.lastFetchTime = now;

      return this.currentToken as TokenServerResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error(`Cannot connect to Token Server at ${config.serverUrl}. Is it running?`);
        }
        throw error;
      }
      throw new Error('Failed to get token from Token Server');
    }
  }

  /**
   * Force refresh the token
   */
  async forceRefresh(): Promise<TokenServerResponse> {
    const config = getTokenServerConfig();

    if (!config.enabled) {
      throw new Error('Token Server is not enabled');
    }

    const params = new URLSearchParams({
      tenant: config.tenant,
      env: config.env,
    });

    try {
      const response = await fetch(`${config.serverUrl}/token/refresh?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      this.currentToken = await response.json();
      this.lastFetchTime = Date.now();

      return this.currentToken as TokenServerResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Get authorization header for API calls
   */
  async getAuthorizationHeader(forceRefresh = false): Promise<string> {
    const token = await this.getToken(forceRefresh);
    return token.authorization;
  }

  /**
   * Get just the access token
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const token = await this.getToken(forceRefresh);
    return token.access_token;
  }

  /**
   * Clear cached token (useful when switching tenants/envs)
   */
  clearCache(): void {
    this.currentToken = null;
    this.lastFetchTime = 0;
  }

  /**
   * Check if Token Server is healthy
   */
  async checkHealth(): Promise<TokenServerHealthResponse> {
    const config = getTokenServerConfig();

    try {
      const response = await fetch(`${config.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error(`Cannot connect to Token Server at ${config.serverUrl}`);
        }
        throw error;
      }
      throw new Error('Health check failed');
    }
  }
}

// Singleton instance
export const tokenServerClient = new TokenServerClient();
```

### Auth UI Component (`CRMAuthContent.tsx`)

**Location:** `frontend/components/flow-crm/CRMAuthContent.tsx`

This is the complete Auth configuration UI that users interact with. Key features:
- Switch between Manual Tokens and Token Server modes
- Save/clear tokens
- Test API connection
- Check Token Server health

**Key Imports:**

```typescript
import {
  getCRMTokens,
  setCRMTokens,
  clearCRMTokens,
  hasCRMTokens,
  getAuthMode,
  checkTokenServerHealth,
} from './lib/crm-auth';
import {
  getTokenServerConfig,
  setTokenServerConfig,
  clearTokenServerConfig,
  tokenServerClient,
} from './lib/crm-token-server';
import { fetchJobStatuses } from './lib/crm-graphql';
```

**Component State:**

```typescript
// Manual token state
const [accessToken, setAccessToken] = useState('');
const [refreshToken, setRefreshToken] = useState('');

// Token Server state
const [serverUrl, setServerUrl] = useState('http://127.0.0.1:8000');
const [tenant, setTenant] = useState('staging2');
const [env, setEnv] = useState('staging');
const [tokenServerEnabled, setTokenServerEnabled] = useState(false);

// General state
const [authMode, setAuthMode] = useState<AuthMode>('manual');
const [isConnected, setIsConnected] = useState(false);
const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
```

### Auth Page Route

**Location:** `frontend/app/dashboard/apps/flow-crm/auth/page.tsx`

```typescript
"use client";

import CRMAuthContent from "@/components/flow-crm/CRMAuthContent";

export default function CRMAuthPage() {
  return <CRMAuthContent />;
}
```

---

## GraphQL Client & API Endpoints

### Core GraphQL Client (`crm-graphql.ts`)

**Location:** `frontend/components/flow-crm/lib/crm-graphql.ts`

This is the main API client that handles all GraphQL requests.

#### Base Request Function

```typescript
/**
 * Execute a GraphQL query/mutation against the CRM API
 * Automatically handles token refresh when using Token Server
 */
export async function crmGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  let authHeader: string;
  
  // Get authorization header based on current mode
  if (isTokenServerEnabled()) {
    try {
      authHeader = await tokenServerClient.getAuthorizationHeader();
    } catch (error) {
      throw new Error(
        `Token Server error: ${error instanceof Error ? error.message : 'Failed to get token'}`
      );
    }
  } else {
    const accessToken = getCRMAccessToken();
    if (!accessToken) {
      throw new Error('CRM access token not configured. Please set your tokens in FlowCRM Auth settings.');
    }
    authHeader = `Bearer ${accessToken}`;
  }

  const endpoint = getGraphQLEndpoint();

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }),
  });

  // If using Token Server and we get 401, try refreshing the token
  if (response.status === 401 && isTokenServerEnabled()) {
    try {
      authHeader = await tokenServerClient.getAuthorizationHeader(true); // Force refresh
      
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          query: options.query,
          variables: options.variables,
          operationName: options.operationName,
        }),
      });
    } catch {
      throw new Error('Authentication failed. Please check your Token Server configuration.');
    }
  }

  if (!response.ok) {
    throw new Error(`CRM API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
```

### Jobs API

#### Types

```typescript
export interface JobStatus {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: JobStatus;
}

export interface JobInput {
  jobName: string;
  statusId: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  requesterId?: string;
  jobType?: string;
  jobOwnerId?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
}

export interface UpdateJobInput {
  jobName?: string;
  statusId?: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  requesterId?: string;
  jobType?: string;
  jobOwnerId?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
}
```

#### GraphQL Queries

```graphql
# Get all job statuses
query GetJobStatuses {
  jobStatuses {
    id
    name
  }
}

# Get single job by ID
query GetJob($id: UUID!) {
  job(id: $id) {
    additionalInformation
    createdAt
    createdBy
    description
    endDate
    id
    jobName
    jobType
    requesterId
    startDate
    status {
      id
      name
    }
    structuralDetails
    structuralInformation
  }
}

# Create new job
mutation CreateJob($input: JobInput!) {
  createJob(input: $input) {
    structuralInformation
    structuralDetails
    status {
      name
      id
    }
    startDate
    requesterId
    jobType
    jobName
    id
    endDate
    description
    createdBy
    createdAt
    additionalInformation
  }
}

# Update existing job
mutation UpdateJob($id: UUID!, $input: UpdateJobInput!) {
  updateJob(id: $id, input: $input) {
    id
    jobName
    jobType
    description
    additionalInformation
    structuralInformation
    structuralDetails
    startDate
    endDate
    requesterId
    createdBy
    createdAt
    status {
      id
      name
    }
  }
}
```

#### API Functions

```typescript
export async function fetchJobStatuses(): Promise<JobStatus[]>
export async function fetchJob(id: string): Promise<Job | null>
export async function createJob(input: JobInput): Promise<Job>
export async function updateJob(id: string, input: UpdateJobInput): Promise<Job>

// Local storage for tracking created jobs (API doesn't have list query)
export function getStoredJobIds(): string[]
export function addStoredJobId(id: string): void
export async function fetchJobsByIds(ids: string[]): Promise<Job[]>
```

### Companies API

#### Types

```typescript
export type CompanySourceType = 'CUSTOMER' | 'MANUFACTURER';

export interface Company {
  id: string;
  name: string;
  companySourceType: CompanySourceType;
  parentCompanyId?: string | null;
  phone?: string | null;
  website?: string | null;
  tags?: string | string[] | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface CompanyInput {
  name: string;
  companySourceType: CompanySourceType;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  companySourceType?: CompanySourceType;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
}
```

#### GraphQL Queries

```graphql
# Get all companies
query GetCompanies {
  companies {
    id
    name
    companySourceType
    parentCompanyId
    phone
    website
    tags
    createdBy
    createdAt
  }
}

# Get single company
query GetCompany($id: UUID!) {
  company(id: $id) {
    id
    name
    companySourceType
    parentCompanyId
    phone
    website
    tags
    createdBy
    createdAt
  }
}

# Get companies by job
query GetCompaniesByJobId($jobId: UUID!) {
  companiesByJobId(jobId: $jobId) {
    id
    name
    companySourceType
    parentCompanyId
    phone
    website
    tags
    createdBy
    createdAt
  }
}

# Create company
mutation CreateCompany($input: CompanyInput!) {
  createCompany(input: $input) {
    id
    name
    companySourceType
    parentCompanyId
    phone
    website
    tags
    createdBy
    createdAt
  }
}

# Update company
mutation UpdateCompany($id: UUID!, $input: UpdateCompanyInput!) {
  updateCompany(id: $id, input: $input) {
    id
    name
    companySourceType
    parentCompanyId
    phone
    website
    tags
    createdBy
    createdAt
  }
}

# Delete company
mutation DeleteCompany($id: UUID!) {
  deleteCompany(id: $id)
}
```

#### API Functions

```typescript
export async function fetchCompanies(): Promise<Company[]>
export async function fetchCompany(id: string): Promise<Company | null>
export async function fetchCompaniesByJobId(jobId: string): Promise<Company[]>
export async function createCompany(input: CompanyInput): Promise<Company>
export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company>
export async function deleteCompany(id: string): Promise<boolean>
```

### Contacts API

#### Types

```typescript
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  companyId?: string | null;
  notes?: string | null;
  tags?: string | string[] | null;
  territory?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  notes?: string;
  tags?: string;
  territory?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  notes?: string;
  tags?: string;
  territory?: string;
}
```

#### GraphQL Queries

```graphql
# Get all contacts
query GetContacts {
  contacts {
    id
    firstName
    lastName
    email
    phone
    role
    companyId
    notes
    tags
    territory
    createdBy
    createdAt
  }
}

# Get single contact
query GetContact($id: UUID!) {
  contact(id: $id) {
    id
    firstName
    lastName
    email
    phone
    role
    companyId
    notes
    tags
    territory
    createdBy
    createdAt
  }
}

# Get contacts by company
query GetContactsByCompany($companyId: UUID!) {
  contactsByCompany(companyId: $companyId) {
    id
    firstName
    lastName
    email
    phone
    role
    companyId
    notes
    tags
    territory
    createdBy
    createdAt
  }
}

# Create contact
mutation CreateContact($input: ContactInput!) {
  createContact(input: $input) {
    id
    firstName
    lastName
    email
    phone
    role
    companyId
    notes
    tags
    territory
    createdBy
    createdAt
  }
}

# Update contact
mutation UpdateContact($id: UUID!, $input: UpdateContactInput!) {
  updateContact(id: $id, input: $input) {
    id
    firstName
    lastName
    email
    phone
    role
    companyId
    notes
    tags
    territory
    createdBy
    createdAt
  }
}

# Delete contact
mutation DeleteContact($id: UUID!) {
  deleteContact(id: $id)
}
```

#### API Functions

```typescript
export async function fetchContacts(): Promise<Contact[]>
export async function fetchContact(id: string): Promise<Contact | null>
export async function fetchContactsByCompanyId(companyId: string): Promise<Contact[]>
export async function createContact(input: ContactInput): Promise<Contact>
export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact>
export async function deleteContact(id: string): Promise<boolean>
```

### Landing Pages API (Efficient List Queries)

The API provides "landing page" queries for efficient list views with filtering and sorting.

#### Types

```typescript
export type FilterOperator = 
  | 'EQ' 
  | 'NE' 
  | 'GT' 
  | 'GTE' 
  | 'LT' 
  | 'LTE' 
  | 'LIKE' 
  | 'ILIKE' 
  | 'BEGINS_WITH' 
  | 'ENDS_WITH' 
  | 'IN' 
  | 'NOT_IN' 
  | 'IS_NULL' 
  | 'IS_NOT_NULL';

export type SortDirection = 'ASC' | 'DESC';

export type SourceType = 'JOBS' | 'COMPANIES' | 'CONTACTS';

export interface LandingPageFilter {
  operator: FilterOperator;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface LandingPageOrderBy {
  columnName: string;
  direction: SortDirection;
}

// Flattened response types for list views
export interface JobLandingPage {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusName?: string;
  jobOwner?: string;
  requester?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CompanyLandingPage {
  id: string;
  name: string;
  companySourceType: CompanySourceType;
  phone?: string;
  website?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ContactLandingPage {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyName?: string;
  createdBy?: string;
  createdAt?: string;
}
```

#### GraphQL Queries

```graphql
# Find job landing pages
query FindJobLandingPages(
  $filters: [Filter!]
  $orderBy: [OrderBy!]
) {
  findLandingPages(
    sourceType: JOBS
    filters: $filters
    orderBy: $orderBy
  ) {
    records {
      ... on JobLandingPage {
        id
        createdAt
        description
        endDate
        jobName
        jobOwner
        jobType
        requester
        startDate
        statusName
        createdBy
      }
    }
  }
}

# Find company landing pages
query FindCompanyLandingPages(
  $filters: [Filter!]
  $orderBy: [OrderBy!]
) {
  findLandingPages(
    sourceType: COMPANIES
    filters: $filters
    orderBy: $orderBy
  ) {
    records {
      ... on CompanyLandingPage {
        id
        name
        companySourceType
        createdAt
        createdBy
        phone
        website
      }
    }
  }
}

# Find contact landing pages
query FindContactLandingPages(
  $filters: [Filter!]
  $orderBy: [OrderBy!]
) {
  findLandingPages(
    sourceType: CONTACTS
    filters: $filters
    orderBy: $orderBy
  ) {
    records {
      ... on ContactLandingPage {
        id
        firstName
        lastName
        email
        phone
        role
        companyName
        createdBy
        createdAt
      }
    }
    total
  }
}
```

#### API Functions

```typescript
export async function fetchJobLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
): Promise<JobLandingPage[]>

export async function fetchCompanyLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
): Promise<CompanyLandingPage[]>

export async function fetchContactLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
): Promise<ContactLandingPage[]>
```

---

## React Query Hooks (`useCRMApi.ts`)

**Location:** `frontend/components/flow-crm/hooks/useCRMApi.ts`

### Query Keys

```typescript
export const crmQueryKeys = {
  all: ['crm'] as const,
  jobStatuses: () => [...crmQueryKeys.all, 'jobStatuses'] as const,
  jobs: () => [...crmQueryKeys.all, 'jobs'] as const,
  job: (id: string) => [...crmQueryKeys.jobs(), id] as const,
  jobLandingPages: (filters?: LandingPageFilter, orderBy?: LandingPageOrderBy) => 
    [...crmQueryKeys.all, 'jobLandingPages', { filters, orderBy }] as const,
  
  companies: () => [...crmQueryKeys.all, 'companies'] as const,
  company: (id: string) => [...crmQueryKeys.companies(), id] as const,
  companiesByJob: (jobId: string) => [...crmQueryKeys.companies(), 'byJob', jobId] as const,
  companyLandingPages: (filters?: LandingPageFilter, orderBy?: LandingPageOrderBy) => 
    [...crmQueryKeys.all, 'companyLandingPages', { filters, orderBy }] as const,
  
  contacts: () => [...crmQueryKeys.all, 'contacts'] as const,
  contact: (id: string) => [...crmQueryKeys.contacts(), id] as const,
  contactsByCompany: (companyId: string) => [...crmQueryKeys.contacts(), 'byCompany', companyId] as const,
  contactLandingPages: (filters?: LandingPageFilter, orderBy?: LandingPageOrderBy) => 
    [...crmQueryKeys.all, 'contactLandingPages', { filters, orderBy }] as const,
};
```

### Available Hooks

#### Job Hooks

```typescript
// Fetch job statuses for dropdowns
export function useCRMJobStatuses()

// Fetch jobs that we've created (tracked locally)
export function useCRMJobs()

// Fetch single job by ID
export function useCRMJob(id: string)

// Create new job mutation
export function useCreateCRMJob()

// Update existing job mutation
export function useUpdateCRMJob()

// Fetch job landing pages with filtering/sorting
export function useCRMJobLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
)
```

#### Company Hooks

```typescript
// Fetch all companies
export function useCRMCompanies()

// Fetch single company
export function useCRMCompany(id: string)

// Fetch companies by job
export function useCRMCompaniesByJob(jobId: string)

// Create company mutation
export function useCreateCRMCompany()

// Update company mutation
export function useUpdateCRMCompany()

// Delete company mutation
export function useDeleteCRMCompany()

// Fetch company landing pages
export function useCRMCompanyLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
)
```

#### Contact Hooks

```typescript
// Fetch all contacts
export function useCRMContacts()

// Fetch single contact
export function useCRMContact(id: string)

// Fetch contacts by company
export function useCRMContactsByCompany(companyId: string)

// Create contact mutation
export function useCreateCRMContact()

// Update contact mutation
export function useUpdateCRMContact()

// Delete contact mutation
export function useDeleteCRMContact()

// Fetch contact landing pages
export function useCRMContactLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
)
```

#### Utility Hooks

```typescript
// Check if CRM is connected
export function useCRMConnectionStatus()
```

### Hook Implementation Pattern

```typescript
export function useCRMCompanyLandingPages(
  filters?: LandingPageFilter,
  orderBy?: LandingPageOrderBy
) {
  return useQuery<CompanyLandingPage[], Error>({
    queryKey: crmQueryKeys.companyLandingPages(filters, orderBy),
    queryFn: () => fetchCompanyLandingPages(filters, orderBy),
    enabled: hasCRMTokens(),  // Only fetch if authenticated
    staleTime: 30 * 1000,     // 30 seconds
  });
}
```

### Mutation Pattern with Cache Invalidation

```typescript
export function useCreateCRMCompany() {
  const queryClient = useQueryClient();

  return useMutation<Company, Error, CompanyInput>({
    mutationFn: createCompany,
    onSuccess: () => {
      // Invalidate companies list after creating a new company
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companies() });
    },
  });
}
```

---

## UI Component Integration Patterns

### Connection Status Checks

Every component that uses API data should check if CRM is connected:

```typescript
import { hasCRMTokens } from './lib/crm-auth';

export default function MyComponent() {
  const isConnected = hasCRMTokens();
  
  // Use in hooks
  const { data, isLoading, error } = useCRMCompanyLandingPages();
  
  // Show warning if not connected
  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800">CRM Not Connected</h3>
        <p className="text-sm text-yellow-700 mt-1">
          Please configure your CRM API tokens to view data.
        </p>
        <a
          href="/dashboard/apps/flow-crm/auth"
          className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:underline"
        >
          Go to Auth Settings →
        </a>
      </div>
    );
  }
  
  // ... rest of component
}
```

### Loading States

```typescript
const { data: companies, isLoading, error } = useCRMCompanyLandingPages();

if (isLoading) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      <span className="ml-2 text-[var(--muted-foreground)]">Loading companies...</span>
    </div>
  );
}
```

### Error Handling

```typescript
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-red-800">Failed to load data</h3>
      <p className="text-sm text-red-700 mt-1">{error.message}</p>
      <button
        onClick={() => refetch()}
        className="mt-2 text-sm font-medium text-red-800 hover:underline"
      >
        Retry
      </button>
    </div>
  );
}
```

### Create Modals

Pattern for create modals with API integration:

```typescript
import { useCreateCRMCompany } from './hooks/useCRMApi';
import { hasCRMTokens } from './lib/crm-auth';
import type { CompanyInput } from './lib/crm-graphql';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCompanyModal({ isOpen, onClose, onSuccess }: CreateCompanyModalProps) {
  const [formData, setFormData] = useState<CompanyInput>({
    name: '',
    companySourceType: 'CUSTOMER',
    // ... other fields
  });
  const [error, setError] = useState<string | null>(null);

  const isConnected = hasCRMTokens();
  const createCompanyMutation = useCreateCRMCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createCompanyMutation.mutateAsync(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  if (!isOpen) return null;

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <h3>CRM Not Connected</h3>
          <p>Please configure your CRM API tokens.</p>
          <a href="/dashboard/apps/flow-crm/auth">Go to Auth Settings</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit}>
        {error && <div className="text-red-600">{error}</div>}
        
        {/* Form fields */}
        
        <button
          type="submit"
          disabled={createCompanyMutation.isPending}
        >
          {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
        </button>
      </form>
    </div>
  );
}
```

### List Components with API Data

Pattern for list components that map API data to UI format:

```typescript
import { useCRMCompanyLandingPages } from './hooks/useCRMApi';
import { hasCRMTokens } from './lib/crm-auth';
import type { CompanyLandingPage } from './lib/crm-graphql';

// UI display type (may differ from API type)
type UICompany = {
  id: string;
  name: string;
  type: string[];
  // ... other UI-specific fields
};

// Map API response to UI format
function mapLandingPageToUICompany(landingPage: CompanyLandingPage): UICompany {
  return {
    id: landingPage.id,
    name: landingPage.name,
    type: landingPage.companySourceType === 'MANUFACTURER' 
      ? ['Manufacturer'] 
      : ['Customer'],
    // ... map other fields
  };
}

export default function CompaniesContent() {
  const isConnected = hasCRMTokens();
  const { data: landingPageCompanies, isLoading, error, refetch } = useCRMCompanyLandingPages();

  // Map and filter data
  const companies = useMemo(() => {
    if (!landingPageCompanies) return [];
    return landingPageCompanies.map(mapLandingPageToUICompany);
  }, [landingPageCompanies]);

  if (!isConnected) {
    // Show connection warning
  }

  if (isLoading) {
    // Show loading state
  }

  if (error) {
    // Show error state
  }

  return (
    <div>
      {companies.map(company => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
```

---

## Complete File Reference

### Files to Create/Copy

| File Path | Description |
|-----------|-------------|
| `frontend/components/flow-crm/lib/crm-auth.ts` | Token storage and auth mode management |
| `frontend/components/flow-crm/lib/crm-graphql.ts` | GraphQL client, queries, mutations, API functions |
| `frontend/components/flow-crm/lib/crm-token-server.ts` | Token Server integration |
| `frontend/components/flow-crm/hooks/useCRMApi.ts` | React Query hooks for all API operations |
| `frontend/components/flow-crm/CRMAuthContent.tsx` | Auth configuration UI component |
| `frontend/app/dashboard/apps/flow-crm/auth/page.tsx` | Auth page route |

### Files to Modify

Update existing content components to use API hooks instead of mock data:

| File | Changes |
|------|---------|
| `JobsContent.tsx` | Import hooks, use `useCRMJobLandingPages()`, map data |
| `CompaniesContent.tsx` | Import hooks, use `useCRMCompanyLandingPages()`, map data |
| `ContactsContent.tsx` | Import hooks, use `useCRMContactLandingPages()`, map data |
| `CreateJobModal.tsx` | Use `useCreateCRMJob()`, `useCRMJobStatuses()` |
| `CreateCompanyModal.tsx` | Use `useCreateCRMCompany()` |
| `CreateContactModal.tsx` | Use `useCreateCRMContact()` |

### Environment File

Add to `.env.local`:

```bash
NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL=https://staging.api.crm.flowrms.com/graphql
```

---

## Step-by-Step Integration Checklist

### Phase 1: Setup Environment

- [ ] Add `NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL` to `.env.local`
- [ ] Install required dependencies: `@tanstack/react-query` (if not already installed)

### Phase 2: Create Library Files

- [ ] Create `frontend/components/flow-crm/lib/` directory
- [ ] Create `crm-auth.ts` with token storage functions
- [ ] Create `crm-token-server.ts` with Token Server client
- [ ] Create `crm-graphql.ts` with GraphQL client and all API functions

### Phase 3: Create React Query Hooks

- [ ] Create `frontend/components/flow-crm/hooks/` directory
- [ ] Create `useCRMApi.ts` with all query/mutation hooks

### Phase 4: Create Auth Page

- [ ] Create `CRMAuthContent.tsx` component
- [ ] Create `frontend/app/dashboard/apps/flow-crm/auth/` directory
- [ ] Create `page.tsx` for auth route

### Phase 5: Update Content Components

- [ ] Update `JobsContent.tsx` to use API hooks
- [ ] Update `CompaniesContent.tsx` to use API hooks
- [ ] Update `ContactsContent.tsx` to use API hooks

### Phase 6: Update Create Modals

- [ ] Update `CreateJobModal.tsx` to use API
- [ ] Update `CreateCompanyModal.tsx` to use API
- [ ] Update `CreateContactModal.tsx` to use API

### Phase 7: Add Navigation Link to Auth

- [ ] Add link to `/dashboard/apps/flow-crm/auth` in sidebar or settings
- [ ] Add "Configure API" prompts in components when not connected

### Phase 8: Testing

- [ ] Test manual token mode
- [ ] Test Token Server mode (if using)
- [ ] Test CRUD operations for Jobs, Companies, Contacts
- [ ] Test error handling and loading states

---

## localStorage Keys Reference

| Key | Description |
|-----|-------------|
| `flowcrm_access_token` | Manual mode access token |
| `flowcrm_refresh_token` | Manual mode refresh token |
| `flowcrm_token_server_url` | Token Server URL |
| `flowcrm_token_server_tenant` | Token Server tenant name |
| `flowcrm_token_server_env` | Token Server environment |
| `flowcrm_token_server_enabled` | Whether Token Server mode is enabled |
| `flowcrm_created_job_ids` | Array of job IDs created (for job list) |

---

## Notes

- The CRM API uses GraphQL exclusively
- Authentication is OAuth2 Bearer token based
- The Token Server is recommended for automatic token refresh
- All API calls require authentication
- The `findLandingPages` query is optimized for list views
- React Query handles caching and refetching automatically

---

**Last Updated:** November 2024  
**Maintainer:** FlowRMS Labs
