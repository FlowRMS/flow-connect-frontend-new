# REVERT INSTRUCTIONS: Temporary API Endpoint Separation

This document describes how to **exactly revert** the temporary changes that separate the 3 modules to use different API endpoints.

## What Was Changed

| Module | Current Endpoint | Original Endpoint |
|--------|------------------|-------------------|
| CRM | `https://flow-py-backend-staging-2.onrender.com/graphql` | *(unchanged)* |
| Flow AI | `https://flow-ai-staging-2.onrender.com/graphql` | `https://flow-py-backend-staging-2.onrender.com/graphql` |
| Analytics | `https://staging.v6.report.flowrms.com/graphql` | `https://flow-py-backend-staging-2.onrender.com/graphql` |

---

## Step 1: Remove Environment Variable

**File:** `.env.local`

**Delete this entire line:**
```
NEXT_PUBLIC_REPORT_GRAPHQL_URL_TEMP=https://staging.v6.report.flowrms.com/graphql
```

**Also delete the comment block above it (around lines 73-95 in .env.local):**
```
# ============================================================================
# TEMPORARY ENV VARIABLES - REVERT INSTRUCTIONS
# ============================================================================
# These changes separate the 3 modules to use their own API endpoints:
# ... (entire block)
# ============================================================================

# TEMPORARY: Report/Analytics API endpoint (separate from main CRM)
NEXT_PUBLIC_REPORT_GRAPHQL_URL_TEMP=https://staging.v6.report.flowrms.com/graphql
```

---

## Step 2: Revert Analytics Apollo Client

**File:** `lib/analytics/apolloClient.ts`

### 2a. Remove the CRM HTTP Link

**Find and DELETE this entire block (around line 57-65):**
```typescript
// ============================================================================
// TEMPORARY: CRM Apollo Client for Analytics module
// Used for CRM-specific queries (userSearch, findCustomerByCompanyName, etc.)
// that need to go to the CRM backend, not the Report API
// TO REVERT: Delete this entire crmHttpLink and crmClient section
// ============================================================================
const crmHttpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL || "https://staging.v6.api.flowrms.com/graphql",
  fetchOptions: {
    mode: 'cors',
  },
});
```

### 2b. Remove the CRM Client and Export

**Find and DELETE this entire block (at the end of the file):**
```typescript
// ============================================================================
// TEMPORARY: CRM Client for Analytics (for user/entity lookups)
// TO REVERT: Delete this crmClient and its export
// ============================================================================
const crmLink = ApolloLink.from([errorLink, authLink, crmHttpLink]);

const crmClient = new ApolloClient({
  link: crmLink,
  cache: new InMemoryCache(),
});
```

**Also DELETE this export line:**
```typescript
// TEMPORARY: Export CRM client for user/entity searches in Analytics
// TO REVERT: Delete this export
export { crmClient };
```

### 2c. Revert the Report API httpLink

**Find (around line 48-56):**
```typescript
// Primary GraphQL endpoint for analytics/reports
// TEMPORARY: Using separate report API endpoint
// TO REVERT: Change back to process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_REPORT_GRAPHQL_URL_TEMP || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL || "https://staging.v6.api.flowrms.com/graphql",
  fetchOptions: {
    mode: 'cors',
  },
});
```

**Replace with:**
```typescript
// Primary GraphQL endpoint - uses the same endpoint as the CRM
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL || "https://staging.v6.api.flowrms.com/graphql",
  fetchOptions: {
    mode: 'cors',
  },
});
```

---

## Step 3: Revert Flow AI GraphQL Proxy

**File:** `app/api/flow-ai/graphql/route.ts`

**Find (around line 4-8):**
```typescript
// FlowAI GraphQL endpoint - use the dedicated Flow AI endpoint
// TEMPORARY: Changed to use NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL for Flow AI module
// TO REVERT: Change back to NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL || NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL
const FLOWAI_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL
  || 'https://staging.v6.ai.flowrms.com/graphql';
```

**Replace with:**
```typescript
// FlowAI GraphQL endpoint - use the dedicated FlowAI/FlowRMS endpoint
// Falls back to the main CRM endpoint if not set
const FLOWAI_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL
  || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL
  || 'https://staging.v6.api.flowrms.com/graphql';
```

---

## Step 4: Revert GlobalFilterPane

**File:** `components/analytics/filters/GlobalFilterPane.tsx`

### 4a. Remove CRM client import

**Find and DELETE these lines (around line 11-13):**
```typescript
// TEMPORARY: Import CRM client for user searches (CRM queries need CRM backend, not Report API)
// TO REVERT: Remove this import and change crmClient.query back to client.query for USER_SEARCH
import { crmClient } from "@/lib/analytics/apolloClient";
```

### 4b. Revert loadOutsideReps function

**Find (around line 95-107):**
```typescript
  // Load reps based on search term
  // TEMPORARY: Using crmClient for user search (CRM query needs CRM backend)
  // TO REVERT: Change crmClient.query back to client.query
  const loadOutsideReps = React.useCallback(async (searchTerm: string) => {
    setRepsLoading(true);
    try {
      const { data } = await crmClient.query<UserSearchData>({
```

**Replace with:**
```typescript
  // Load reps based on search term
  const loadOutsideReps = React.useCallback(async (searchTerm: string) => {
    setRepsLoading(true);
    try {
      const { data } = await client.query<UserSearchData>({
```

---

## Step 5: Revert GlobalFilterBar

**File:** `components/analytics/filters/GlobalFilterBar.tsx`

### 5a. Remove CRM client import

**Find and DELETE these lines (around line 11-13):**
```typescript
// TEMPORARY: Import CRM client for user searches (CRM queries need CRM backend, not Report API)
// TO REVERT: Remove this import and change crmClient.query back to client.query for USER_SEARCH
import { crmClient } from "@/lib/analytics/apolloClient";
```

### 5b. Revert loadOutsideReps function

**Find (around line 335-347):**
```typescript
  // TEMPORARY: Using crmClient for user search (CRM query needs CRM backend)
  // TO REVERT: Change crmClient.query back to client.query
  const loadOutsideReps = React.useCallback(async (searchTerm: string = "") => {
    setOutsideRepLoading(true);
    try {
      const { data } = await crmClient.query<UserSearchData>({
```

**Replace with:**
```typescript
  const loadOutsideReps = React.useCallback(async (searchTerm: string = "") => {
    setOutsideRepLoading(true);
    try {
      const { data } = await client.query<UserSearchData>({
```

---

## Step 6: Revert Flow AI Apollo Client

**File:** `lib/flow-ai/flowrms-apollo.ts`

### 6a. Remove CRM Apollo Client

**Find and DELETE this entire block (at the end of the file, around line 457-487):**
```typescript
// ============================================================================
// TEMPORARY: CRM Apollo Client for Flow AI module
// Used for CRM-specific queries (findLandingPages, etc.) that need to go to
// the CRM backend, not the Flow AI backend
// TO REVERT: Delete this entire crmHttpLink and crmApolloClient section
// ============================================================================
// Use the CRM proxy route which handles WorkOS authentication
const CRM_PROXY_URL = '/api/flowrms-api';

const crmHttpLink = createHttpLink({
  uri: CRM_PROXY_URL,
  credentials: "include",
});

// CRM client for queries that need CRM backend (like findLandingPages)
export const crmApolloClient = new ApolloClient({
  link: from([errorLink, authLink, crmHttpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});
```

---

## Step 7: Revert Queue Page

**File:** `app/(dashboard)/flow-ai/queue/page.tsx`

### 7a. Remove CRM client import

**Find and DELETE these lines (around line 102-104):**
```typescript
// TEMPORARY: Import CRM client for findLandingPages query (CRM query needs CRM backend)
// TO REVERT: Remove this import and change crmApolloClient back to apolloClient for Q_PENDING_DOCUMENTS_LANDING
import { crmApolloClient } from "@/lib/flow-ai/flowrms-apollo";
```

### 7b. Revert fetchDocuments function

**Find (around line 806-821):**
```typescript
  // Fetch documents
  // TEMPORARY: Using crmApolloClient for findLandingPages (CRM query needs CRM backend)
  // TO REVERT: Change crmApolloClient back to apolloClient
  const fetchDocuments = useCallback(
    async (showRefreshToast = false) => {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const offset = (currentPage - 1) * pageSize;
        const filters = buildFilters();
        const orderByInput = buildOrderBy();

        const { data } = await crmApolloClient.query<PaginatedResponse>({
```

**Replace with:**
```typescript
  // Fetch documents
  const fetchDocuments = useCallback(
    async (showRefreshToast = false) => {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const offset = (currentPage - 1) * pageSize;
        const filters = buildFilters();
        const orderByInput = buildOrderBy();

        const { data } = await apolloClient.query<PaginatedResponse>({
```

### 7c. Revert silent auto-refresh

**Find (around line 876-888):**
```typescript
  // Silent auto-refresh every 10 seconds
  // TEMPORARY: Using crmApolloClient for findLandingPages (CRM query needs CRM backend)
  // TO REVERT: Change crmApolloClient back to apolloClient
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Silent refresh - don't show loading state or toast
      const silentRefresh = async () => {
        try {
          const offset = (currentPage - 1) * pageSize;
          const filters = buildFilters();
          const orderByInput = buildOrderBy();

          const { data } = await crmApolloClient.query<PaginatedResponse>({
```

**Replace with:**
```typescript
  // Silent auto-refresh every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Silent refresh - don't show loading state or toast
      const silentRefresh = async () => {
        try {
          const offset = (currentPage - 1) * pageSize;
          const filters = buildFilters();
          const orderByInput = buildOrderBy();

          const { data } = await apolloClient.query<PaginatedResponse>({
```

---

## Step 8: Revert Queue Page Email Mutation

**File:** `app/(dashboard)/flow-ai/queue/page.tsx`

### 8a. Revert sendingEmail state back to useMutation hook

**Find (around line 634-637):**
```typescript
  // Email notification mutation - using state for loading since we call crmApolloClient directly
  // TEMPORARY: Using crmApolloClient for sendPendingDocumentStatusEmail (CRM mutation needs CRM backend)
  // TO REVERT: Change back to useMutation hook with default client
  const [sendingEmail, setSendingEmail] = useState(false);
```

**Replace with:**
```typescript
  // Email notification mutation
  const [sendEmailMutation, { loading: sendingEmail }] = useMutation(
    M_SEND_PENDING_DOCUMENT_STATUS_EMAIL
  );
```

### 8b. Revert handleSendEmailNotification function

**Find (around line 1044-1067):**
```typescript
  // Handle email notification request
  // TEMPORARY: Using crmApolloClient for sendPendingDocumentStatusEmail (CRM mutation needs CRM backend)
  // TO REVERT: Change back to sendEmailMutation() from useMutation hook
  const handleSendEmailNotification = async () => {
    if (!emailDialogDocument) return;

    setSendingEmail(true);
    try {
      const result = await crmApolloClient.mutate({
        mutation: M_SEND_PENDING_DOCUMENT_STATUS_EMAIL,
        variables: {
          pendingDocumentId: emailDialogDocument.id,
        },
      });
      // ... rest of function with setSendingEmail(false) in finally block
```

**Replace with:**
```typescript
  // Handle email notification request
  const handleSendEmailNotification = async () => {
    if (!emailDialogDocument) return;

    try {
      const result = await sendEmailMutation({
        variables: {
          pendingDocumentId: emailDialogDocument.id,
        },
      });
      // ... rest of function WITHOUT setSendingEmail calls
```

---

## Step 9: Revert Entity Matching Page

**File:** `app/(dashboard)/flow-ai/entity-matching/page.tsx`

### 9a. Remove crmApolloClient import

**Find (around line 61-66):**
```typescript
// TEMPORARY: Import both Flow AI and CRM clients
// flowrmsApolloClient for Flow AI queries (Q_GET_PENDING)
// crmApolloClient for CRM mutations (M_EXECUTE_DOCUMENT_WORKFLOW)
// TO REVERT: Remove crmApolloClient import and change crmApolloClient.mutate back to flowrmsApolloClient.mutate for M_EXECUTE_DOCUMENT_WORKFLOW
import { flowrmsApolloClient, crmApolloClient } from '@/lib/flow-ai/flowrms-apollo';
```

**Replace with:**
```typescript
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
```

### 9b. Revert executeDocumentWorkflow mutation

**Find (around line 435-450):**
```typescript
      // Call executeDocumentWorkflow mutation
      // TEMPORARY: Using crmApolloClient for executeDocumentWorkflow (CRM mutation needs CRM backend)
      // TO REVERT: Change crmApolloClient.mutate back to flowrmsApolloClient.mutate
      console.log('📄 Executing document workflow for pendingId:', pendingId);
      toast.info('Processing document...');

      const result = await crmApolloClient.mutate<{
```

**Replace with:**
```typescript
      // Call executeDocumentWorkflow mutation
      console.log('📄 Executing document workflow for pendingId:', pendingId);
      toast.info('Processing document...');

      const result = await flowrmsApolloClient.mutate<{
```

---

## Step 10: Revert Product Dashboard Factory Search

**File:** `app/(dashboard)/analytics/pages/product-dashboard/index.js`

### 10a. Remove CRM client import

**Find and DELETE these lines (around line 14-16):**
```javascript
// TEMPORARY: Import CRM client for factory search (CRM query needs CRM backend, not Report API)
// TO REVERT: Remove this import and change crmClient.query back to useQuery for FACTORY_SEARCH
import { crmClient } from "@/lib/analytics/apolloClient";
```

### 10b. Revert factory search from crmClient.query back to useQuery

**Find (around line 27-55):**
```javascript
  // TEMPORARY: Using crmClient for factory search (CRM query needs CRM backend, not Report API)
  // TO REVERT: Change back to useQuery hook with default client
  const [factories, setFactories] = React.useState([]);
  const [factoriesLoading, setFactoriesLoading] = React.useState(false);

  // Fetch factories using CRM client
  React.useEffect(() => {
    const fetchFactories = async () => {
      // Skip if dropdown is closed and we've already loaded default
      if (!showFactoryDropdown && hasLoadedDefault) {
        return;
      }

      setFactoriesLoading(true);
      try {
        const { data } = await crmClient.query({
          query: FACTORY_SEARCH,
          variables: {
            searchTerm: showFactoryDropdown ? searchTerm : DEFAULT_FACTORY_NAME,
            limit: 1000,
            useCustomOrder: false,
            published: true,
          },
          fetchPolicy: "network-only",
        });
        setFactories(data?.factorySearch || []);
      } catch (error) {
        console.error("Error fetching factories:", error);
        setFactories([]);
      } finally {
        setFactoriesLoading(false);
      }
    };

    fetchFactories();
  }, [showFactoryDropdown, searchTerm, hasLoadedDefault]);
```

**Replace with:**
```javascript
  // Fetch factories based on search term (or default factory on initial load)
  const {
    data: factoriesData,
    loading: factoriesLoading,
  } = useQuery(FACTORY_SEARCH, {
    variables: {
      searchTerm: showFactoryDropdown ? searchTerm : DEFAULT_FACTORY_NAME,
      limit: 1000,
      useCustomOrder: false,
      published: true,
    },
    skip: showFactoryDropdown ? false : hasLoadedDefault,
  });

  const factories = factoriesData?.factorySearch || [];
```

---

## Step 11: Delete This File

After reverting all changes, delete this file:
```
REVERT_TEMP_API_CHANGES.md
```

---

## Verification

After reverting, all 3 modules should use the same endpoint:
- **CRM:** `NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL`
- **Flow AI:** `NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL` → `NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL`
- **Analytics:** `NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL`

All pointing to: `https://flow-py-backend-staging-2.onrender.com/graphql`

---

## Step 12: Revert useEntityMatching Hook User Search

**File:** `components/flow-ai/hooks/useEntityMatching.ts`

### 12a. Remove crmApolloClient import

**Find (around line 13-17):**
```typescript
// TEMPORARY: Import both Flow AI and CRM clients
// flowrmsApolloClient for Flow AI queries/mutations
// crmApolloClient for CRM queries (userSearch needs CRM backend)
// TO REVERT: Remove crmApolloClient import and change crmApolloClient.query back to flowrmsApolloClient.query for Q_USER_SEARCH
import { flowrmsApolloClient, crmApolloClient } from '@/lib/flow-ai/flowrms-apollo';
```

**Replace with:**
```typescript
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
```

### 12b. Revert handleSearchUsers function

**Find (around line 1270-1295):**
```typescript
  // Search for users (inside or outside reps)
  // TEMPORARY: Using crmApolloClient for userSearch (CRM query needs CRM backend)
  // TO REVERT: Change crmApolloClient.query back to flowrmsApolloClient.query
  const handleSearchUsers = useCallback(
    async (searchTerm: string, type: 'inside' | 'outside', limit = 10): Promise<UserResult[]> => {
      try {
        const result = await crmApolloClient.query<UserSearchResponse>({
```

**Replace with:**
```typescript
  // Search for users (inside or outside reps)
  const handleSearchUsers = useCallback(
    async (searchTerm: string, type: 'inside' | 'outside', limit = 10): Promise<UserResult[]> => {
      try {
        const result = await flowrmsApolloClient.query<UserSearchResponse>({
```

---

## Files Modified Summary

| File | Changes Made |
|------|--------------|
| `.env.local` | Added `NEXT_PUBLIC_REPORT_GRAPHQL_URL_TEMP` |
| `lib/analytics/apolloClient.ts` | Added `crmHttpLink`, `crmClient`, changed `httpLink` to use Report API |
| `app/api/flow-ai/graphql/route.ts` | Changed to use `NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL` |
| `components/analytics/filters/GlobalFilterPane.tsx` | Import `crmClient`, use it for `USER_SEARCH` |
| `components/analytics/filters/GlobalFilterBar.tsx` | Import `crmClient`, use it for `USER_SEARCH` |
| `lib/flow-ai/flowrms-apollo.ts` | Added `crmApolloClient` using `/api/flowrms-api` proxy |
| `app/(dashboard)/flow-ai/queue/page.tsx` | Import `crmApolloClient`, use for `findLandingPages` and `sendPendingDocumentStatusEmail` |
| `app/(dashboard)/flow-ai/entity-matching/page.tsx` | Import `crmApolloClient`, use for `executeDocumentWorkflow` |
| `app/(dashboard)/analytics/pages/product-dashboard/index.js` | Import `crmClient`, use it for `FACTORY_SEARCH` |
| `components/flow-ai/hooks/useEntityMatching.ts` | Import `crmApolloClient`, use it for `Q_USER_SEARCH` |
