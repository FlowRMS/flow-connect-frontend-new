# Companies Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Company Entity & Data Types](#2-company-entity--data-types)
3. [UI Components](#3-ui-components)
4. [API Endpoints & GraphQL Operations](#4-api-endpoints--graphql-operations)
5. [Views & Navigation](#5-views--navigation)
6. [Filtering, Sorting & Search](#6-filtering-sorting--search)
7. [State Management & Hooks](#7-state-management--hooks)
8. [Modals & Dialogs](#8-modals--dialogs)
9. [Company Hierarchy System](#9-company-hierarchy-system)
10. [Related Entities Integration](#10-related-entities-integration)
11. [Special Features & Auto-Population](#11-special-features--auto-population)
12. [Actions & Operations](#12-actions--operations)
13. [Error Handling & Edge Cases](#13-error-handling--edge-cases)

---

## 1. Module Overview

### Directory Structure
```
/components/companies/
  ├── CompaniesContent.tsx           (Main container component)
  ├── types.ts                        (UI type definitions)
  ├── constants.ts                    (Constants and configurations)
  ├── utils.ts                        (Utility functions)
  ├── config/
  │   └── filterConfig.ts             (Filter & sort option configurations)
  ├── hooks/
  │   └── useCompaniesState.ts        (State management hook)
  ├── detail/
  │   ├── CompanyDetailView.tsx       (Detail view container)
  │   ├── CompanyDetailHeader.tsx     (Detail header with actions)
  │   ├── CompanyInfoForm.tsx         (Info form component)
  │   ├── CompanyRelatedEntities.tsx  (Related entities section)
  │   └── DeleteConfirmModal.tsx      (Delete confirmation)
  ├── modals/
  │   ├── ManageCompanyTypesModal.tsx (Company types management)
  │   ├── SelectChildCompaniesModal.tsx (Child companies selection)
  │   ├── AddLinkModal.tsx            (Link to other entities)
  │   └── AddTaskNoteLinkModal.tsx    (Link tasks/notes)
  └── views/
      ├── grid/
      │   ├── GridView.tsx            (Card grid display)
      │   └── components/
      │       └── CompaniesGridSkeleton.tsx
      └── list/
          ├── ListView.tsx             (Table list display)
          └── components/
              └── CompaniesTableSkeleton.tsx

/app/(dashboard)/companies/
  ├── page.tsx                        (Companies list page)
  └── new/
      └── page.tsx                    (Create new company page)

/lib/graphql/
  ├── companies.ts                    (Company GraphQL queries & mutations)
  ├── company-types.ts                (Company type operations)
  └── types.ts                        (Shared GraphQL type definitions)
```

### Entry Point
- **Route**: `/companies`
- **Component**: `CompaniesContent` (client component)
- **Page Wrapper**: `/app/(dashboard)/companies/page.tsx`

---

## 2. Company Entity & Data Types

### UI Company Type (Display Format)
**Location**: `components/companies/types.ts`

```typescript
interface Company {
  id: string;
  name: string;
  type: string[];                           // Array of type names
  website: string;
  phone: string;
  email?: string;
  address: string;
  tags: string[];
  lists: string[];
  territory: string;
  contactCount: number;
  jobCount: number;
  lastActivity: string;                     // ISO date string
  followers: string[];

  // Extended fields
  companyTypeId?: string;                   // UUID reference to CompanyType
  companyTypeName?: string;                 // Display name
  companySourceType?: string;               // Raw API type (for filtering)

  // Commission rates (for manufacturers)
  standardCommissionRate?: number;          // e.g., 0.10 for 10%
  warehouseCommissionRate?: number;

  // User tracking
  createdBy: string;

  // Advanced fields
  addresses?: CompanyAddress[];
  manufacturerInfo?: ManufacturerInfo;
  salesReps?: SalesRepAssignment[];
  isDocumentSpecific?: boolean;             // Excludes from document searches
  isWarehouseManufacturer?: boolean;

  // Hierarchy fields
  hierarchyRole?: CompanyHierarchyRole;     // 'none', 'parent', 'grandparent'
  parentCompanyId?: string;
  parentCompanyName?: string;
  grandparentCompanyId?: string;
  grandparentCompanyName?: string;
  childCompanies?: ChildCompanyRef[];
  childParentCompanies?: ChildCompanyRef[];
}
```

### GraphQL Company Type (API Format)
**Location**: `components/lib/graphql/types.ts`

```typescript
interface Company {
  id: string;
  name: string;
  companyTypeId?: string | null;
  companyType?: CompanyTypeRef | null;      // { id, name }
  parentCompanyId?: string | null;
  phone?: string | null;
  website?: string | null;
  tags?: string | string[] | null;
  standardCommissionRate?: number | null;
  warehouseCommissionRate?: number | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

interface CompanyLandingPage {
  id: string;
  name: string;
  companySourceType?: string;               // Type name from landing page
  companyTypeId?: string;
  companyType?: CompanyTypeRef;
  phone?: string;
  website?: string;
  standardCommissionRate?: number;
  warehouseCommissionRate?: number;
  createdBy?: string;
  createdAt?: string;
  tags?: string[];
}
```

### Company Input Types
```typescript
interface CompanyInput {
  name: string;                             // Required
  companyTypeId: string;                    // Required, UUID reference
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;                            // Comma-separated
  standardCommissionRate?: number;
  warehouseCommissionRate?: number;
}

interface UpdateCompanyInput {
  name?: string;
  companyTypeId?: string;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
  standardCommissionRate?: number;
  warehouseCommissionRate?: number;
}
```

### Supporting Type Definitions

#### CompanyAddress
```typescript
interface CompanyAddress {
  id: string;
  types: AddressType[];                    // 'shipping' | 'billing' | 'mailing'
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary?: boolean;
}
```

#### ManufacturerInfo
```typescript
interface ManufacturerInfo {
  factoryAccountNumber?: string;
  factoryEmail?: string;
  logoUrl?: string;
  freightDiscountType?: 'ADD' | 'SUBTRACT' | 'NONE';
  leadTime?: string;
  paymentTerms?: string;
  baseCommissionRate?: number;
  commissionDiscountRate?: number;
  overallDiscountRate?: number;
  externalTerms?: string;
  additionalInformation?: string;
  freightTerms?: string;
  externalPaymentTerms?: string;
}
```

#### SalesRepAssignment
```typescript
interface SalesRepAssignment {
  id: string;
  repId: string;
  repName: string;
  repType: 'inside' | 'outside';
  commissionSplit: number;                  // Percentage as decimal
}
```

#### CompanyType (from Database)
```typescript
interface CompanyType {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}
```

#### CompanyHierarchyRole
```typescript
type CompanyHierarchyRole = 'none' | 'parent' | 'grandparent';

interface ChildCompanyRef {
  id: string;
  name: string;
  companyTypeId?: string;
  companyTypeName?: string;
}
```

### Company Source Types (Fixed Categories)
```typescript
type CompanySourceType =
  | 'CUSTOMER'
  | 'MANUFACTURER'
  | 'ENGINEERING_FIRM'
  | 'CONSULTING_ENGINEER'
  | 'ELECTRICAL_ENGINEER'
  | 'MEP_ENGINEER'
  | 'ARCHITECT'
  | 'LIGHTING_DESIGNER'
  | 'SPECIFIER'
  | 'ELECTRICAL_CONTRACTOR'
  | 'GENERAL_CONTRACTOR'
  | 'DESIGN_BUILD_FIRM'
  | 'EPC'
  | 'SYSTEMS_INTEGRATOR'
  | 'CONTROLS_CONTRACTOR'
  | 'LOW_VOLTAGE_CONTRACTOR'
  | 'BUILDING_OWNER'
  | 'DEVELOPER'
  | 'PROPERTY_MANAGEMENT_COMPANY'
  | 'FACILITY_MANAGEMENT_COMPANY'
  | 'UTILITY_COMPANY'
  | 'MUNICIPALITY_PUBLIC_AUTHORITY'
  | 'AHJ'
  | 'COMMISSIONING_AGENT'
  | 'TESTING_INSPECTION_AGENCY'
  | 'ENERGY_PROGRAM_ADMINISTRATOR'
  | 'TRADE_ASSOCIATION';
```

---

## 3. UI Components

### CompaniesContent (Main Container)
**Location**: `components/companies/CompaniesContent.tsx`
**Type**: Client Component ('use client')

#### Responsibilities
- Orchestrates all companies list functionality
- Manages view switching (grid/list)
- Handles search, filtering, and sorting
- Manages company selection and detail navigation
- Handles infinite scroll pagination
- Integrates with unsaved changes guard

#### Key Features
1. **Search**: Debounced search (300ms delay), minimum 2 characters, uses API search endpoint
2. **Filtering**: Server-side filters via AdvancedFilters, column-level filters, default excludes MANUFACTURER
3. **Sorting**: Multi-column sort support with drag-and-drop reordering
4. **Views**: Grid view (card-based) and List view (table-based)
5. **Pagination**: Infinite scroll with useInfiniteScroll hook

#### Props
None (container component)

#### State Management
Uses `useCompaniesState` hook for viewMode, selectedCompany, isEditing, editFormData, activeFilters, clientSortColumns

### CompanyDetailView
**Location**: `components/companies/detail/CompanyDetailView.tsx`

#### Tabs
1. **Overview** - Basic info (name, type, phone, website, tags, parent company)
2. **Factory Info** - Manufacturer-specific fields
3. **Sales Reps** - Sales rep assignments
4. **Addresses** - Company addresses (CRUD operations)
5. **Emails** - Email communication history
6. **Meetings** - Meeting history
7. **Connected Entities** - Related jobs, contacts, notes, quotes, orders

#### Key Features
- Sticky tabs navigation
- Scroll-based tab detection
- Dynamic dropdowns for company type and parent company
- Address management with Google Maps integration
- Alias management

### GridView & ListView
Grid: Responsive 1-3 columns, card-based with avatars and badges
List: Fixed table with sticky header, sortable and filterable columns

---

## 4. API Endpoints & GraphQL Operations

### Location: `components/lib/graphql/companies.ts`

#### Query: GET_COMPANIES
```graphql
query GetCompanies {
  companies {
    id, name, companyTypeId, companyType { id, name }, parentCompanyId,
    phone, website, tags, createdBy { email, firstName, fullName, id, lastName }, createdAt
  }
}
```

#### Query: GET_COMPANY
```graphql
query GetCompany($id: UUID!) {
  company(id: $id) { ... same fields ... }
}
```

#### Mutation: CREATE_COMPANY
```graphql
mutation CreateCompany($input: CompanyInput!) {
  createCompany(input: $input) { ... }
}
```
**Input Fields**: name (required), companyTypeId (required), parentCompanyId, phone, website, tags (comma-separated), standardCommissionRate, warehouseCommissionRate

#### Mutation: UPDATE_COMPANY
```graphql
mutation UpdateCompany($id: UUID!, $input: CompanyInput!) {
  updateCompany(id: $id, input: $input) { ... }
}
```

#### Mutation: DELETE_COMPANY
```graphql
mutation DeleteCompany($id: UUID!) {
  deleteCompany(id: $id)
}
```

#### Query: FIND_COMPANY_LANDING_PAGES (Pagination with Filters)
```graphql
query FindCompanyLandingPages($filters: [Filter!], $orderBy: [OrderBy!], $limit: Int, $offset: Int) {
  findLandingPages(sourceType: COMPANIES, filters: $filters, orderBy: $orderBy, limit: $limit, offset: $offset) {
    records { ... on CompanyLandingPage { id, name, companySourceType, createdAt, createdBy, phone, website, tags } }
    total
  }
}
```

### Filter Types
```typescript
type FilterOperator = 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'ILIKE' | 'BEGINS_WITH' | 'ENDS_WITH' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL';
```

### Available Filter Columns
- `name`, `companySourceType`, `phone`, `website`, `createdBy`, `id`, `createdAt`

---

## 5. Views & Navigation

### Routes
```
/companies              → Companies list page
/companies?id=<uuid>    → Companies list with detail panel
/companies/new          → Create new company
```

### Navigation Flows
- Click company → ID added to URL → Detail view renders
- Back button → URL cleared → List view
- Create → Navigate to `/companies/new` → Success redirects to detail

### URL State Management
Uses Next.js search parameters to sync URL with selected company for deep linking, bookmarking, and sharing.

---

## 6. Filtering, Sorting & Search

### Filter Configuration
```typescript
// Available filters
{ id: 'name', label: 'Company Name', type: 'text', columnName: 'name' }
{ id: 'type', label: 'Company Type', type: 'companyType', columnName: 'companySourceType' }
{ id: 'phone', label: 'Phone', type: 'text', columnName: 'phone' }
{ id: 'website', label: 'Website', type: 'text', columnName: 'website' }
{ id: 'createdBy', label: 'Created By', type: 'text', columnName: 'createdBy' }
```

### Sort Options
```typescript
{ columnName: 'name', label: 'Company Name' }
{ columnName: 'companySourceType', label: 'Company Type' }
{ columnName: 'createdAt', label: 'Created Date' }
```

### Default Filter
Always excludes MANUFACTURER companies (shown at `/manufacturers` instead):
```typescript
{ operator: 'NE', columnName: 'companySourceType', value: 'MANUFACTURER' }
```

---

## 7. State Management & Hooks

### useCompaniesState Hook
**Location**: `components/companies/hooks/useCompaniesState.ts`

```typescript
// Returns
{
  viewMode, setViewMode,
  selectedType, setSelectedType,
  companies, filteredCompanies,
  selectedCompany, setSelectedCompany,
  isEditing, setIsEditing,
  editFormData, setEditFormData,
  deleteConfirmId, setDeleteConfirmId,
  activeFilters, setActiveFilters,
  clientSortColumns, setClientSortColumns,
  uniqueCompanyNames, uniqueCompanyTypes, uniqueCreatedBy,
  handleFiltersChange, handleMultiSortChange, handleStartEdit, handleCancelEdit
}
```

### API Hooks
- `useCompanyTypes()`: Fetch all company types
- `useCRMCompanyLandingPagesInfinite(filters, orderBy)`: Paginated list
- `useCRMCompany(id)`: Single company details
- `useDeleteCRMCompany()`: Delete mutation
- `useUpdateCRMCompany()`: Update mutation
- `useCreateCRMCompany()`: Create mutation

---

## 8. Modals & Dialogs

### ManageCompanyTypesModal
Create, edit, delete company types with display order management.

### SelectChildCompaniesModal
Multi-select child companies for parent/grandparent hierarchy roles.

### DeleteConfirmModal
Confirmation before deletion with loading state.

### AddLinkModal
Link company to jobs, contacts, quotes, orders, invoices.

---

## 9. Company Hierarchy System

### Hierarchy Roles
- **none**: No hierarchy role
- **parent**: Has child customer companies
- **grandparent**: Has child parent companies

### Hierarchy Fields
```typescript
hierarchyRole?: 'none' | 'parent' | 'grandparent';
parentCompanyId?: string;
parentCompanyName?: string;
childCompanies?: ChildCompanyRef[];
childParentCompanies?: ChildCompanyRef[];
```

### Self-parenting Prevention
Parent company selector excludes current company ID.

---

## 10. Related Entities Integration

### Related Entity Types
Contacts, Jobs, Tasks, Notes, Quotes, Orders, Invoices, Checks, Pre-Opportunities, Products

### Fetching
```typescript
useRelatedEntities(company.id, 'COMPANY')
```

### Entity Linking API
```typescript
createLink(source: { type: string; id: string }, target: { type: string; id: string })
deleteLink(sourceId: string, targetId: string)
```

---

## 11. Special Features & Auto-Population

### Dynamic Company Types
Managed via ManageCompanyTypesModal, stored as UUID references.

### Commission Rates
- `standardCommissionRate`: Direct commission
- `warehouseCommissionRate`: Warehouse distribution commission
Both stored as decimals (0.10 = 10%).

### Address Management
Multiple addresses per company with types (shipping, billing, mailing), Google Maps integration.

### Tags
Stored as comma-separated strings in API, parsed to arrays for UI.

### Manufacturer-Specific Fields
Factory Info tab shows: factoryAccountNumber, factoryEmail, logoUrl, freightDiscountType, leadTime, paymentTerms, etc.

---

## 12. Actions & Operations

### Create Company
Required: name, companyTypeId
Optional: parentCompanyId, phone, website, tags, commission rates
On success: redirect to `/companies?id=<newId>`

### Edit Company
Fields: name, phone, website, companyTypeId, tags, parentCompanyId
Save triggers validation, API update, local state update, toast notification.

### Delete Company
Confirmation dialog, post-delete navigation to list, toast notification.

---

## 13. Error Handling & Edge Cases

### Company Not Found
Displays error banner with retry option.

### Race Condition Prevention
Uses `isIntentionalClearRef` flag to prevent reselection after navigation.

### Hydration Safety
Uses mounted state to prevent SSR mismatches.

### Tag Format Handling
Handles both string and array formats from API.

### Pagination Deduplication
Infinite scroll deduplicates by ID to prevent duplicates.

### Form Data Initialization
Auto-populates editFormData when company selected to fix "can't edit until refresh" bug.
