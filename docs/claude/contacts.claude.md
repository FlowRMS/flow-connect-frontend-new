# Contacts Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Contact Entity & Data Types](#2-contact-entity--data-types)
3. [API Endpoints & GraphQL Operations](#3-api-endpoints--graphql-operations)
4. [UI Components](#4-ui-components)
5. [State Management](#5-state-management)
6. [Features & Functionality](#6-features--functionality)
7. [Hooks & Custom Logic](#7-hooks--custom-logic)
8. [Modals & User Interactions](#8-modals--user-interactions)
9. [Entity Relationships](#9-entity-relationships)
10. [Data Flow & Navigation](#10-data-flow--navigation)
11. [Filter & Sort System](#11-filter--sort-system)
12. [Error Handling & Loading States](#12-error-handling--loading-states)

---

## 1. Module Overview

**Location**: `/components/contacts/` and `/app/(dashboard)/contacts/`

**Purpose**: Comprehensive contact management system allowing users to create, view, edit, and manage contact records with advanced filtering, sorting, searching, and linking to other entities.

### File Structure
```
components/contacts/
├── ContactsContent.tsx              # Main container component
├── constants.ts                      # Contact constants and enums
├── types.ts                          # Type definitions and mappers
├── utils.ts                          # Utility functions
├── config/
│   └── filterConfig.ts              # Filter and sort configuration
├── hooks/
│   └── useContactsState.ts          # Main state management hook
├── detail/
│   ├── ContactDetailView.tsx        # Full contact detail page
│   ├── ContactDetailHeader.tsx      # Header component
│   ├── ContactInfoForm.tsx          # Contact information form
│   ├── ContactRelatedEntities.tsx   # Related entities display
│   └── DeleteConfirmModal.tsx       # Delete confirmation modal
├── modals/
│   ├── CreateContactModal.tsx       # New contact creation modal
│   ├── AddLinkModal.tsx             # Link entities modal
│   └── AddTaskNoteLinkModal.tsx     # Link tasks/notes modal
└── views/
    ├── ListView.tsx                 # Table view with infinite scroll
    ├── GridView.tsx                 # Card-based grid view
    ├── ContactsTableHeader.tsx      # Table header with filters
    ├── ContactsTableSkeleton.tsx    # Loading skeleton
    └── ContactsEmptyState.tsx       # Empty state display
```

---

## 2. Contact Entity & Data Types

### UI Contact Type
```typescript
interface Contact {
  id: string;                           // UUID from backend
  name: string;                         // Full name (firstName + lastName)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedIn?: string;                    // LinkedIn profile URL
  company: string;                      // Associated company name
  companyId?: string;                   // Associated company UUID
  role: string;                         // GC, EC, ARCHITECT, ENGINEER, DISTRIBUTOR, OWNER
  contactType: string[];                // DEPRECATED - always empty
  tags: string[];
  lists: string[];                      // DEPRECATED - always empty
  territory: string;
  lastActivity: string;                 // DEPRECATED - use createdAt
  createdAt: string;
  createdBy: string;
  notes?: string;
  addresses?: ContactAddress[];
  customFields?: CustomFieldValue[];
  isWarehouseContact?: boolean;
  warehouseRole?: string;
}
```

### API Contact Types
```typescript
// Backend Contact entity
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  notes?: string | null;
  tags?: string | string[] | null;      // Can be "tag1,tag2" or ["tag1","tag2"]
  territory?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

// Input type for creating contacts
interface ContactInput {
  firstName: string;                     // Required
  lastName: string;                      // Required
  email?: string;
  phone?: string;
  role?: string;                         // GC, EC, ARCHITECT, ENGINEER, DISTRIBUTOR, OWNER
  companyId?: string;
  notes?: string;
  tags?: string;                         // Comma-separated: "tag1, tag2"
  territory?: string;
}

// Landing page view for list display
interface ContactLandingPage {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyName?: string;                  // Pre-fetched company name
  createdBy?: string;
  createdAt?: string;
  tags?: string[];
}
```

### Contact Roles (Constants)
```typescript
const CONTACT_ROLES = ['GC', 'EC', 'ARCHITECT', 'ENGINEER', 'DISTRIBUTOR', 'OWNER'] as const;
type ContactRole = typeof CONTACT_ROLES[number];
```

---

## 3. API Endpoints & GraphQL Operations

### GraphQL Queries

#### GET_CONTACT (Single Contact)
```graphql
query GetContact($id: UUID!) {
  contact(id: $id) {
    id, firstName, lastName, email, phone, role, notes, tags, territory, createdAt
  }
}
```

#### FIND_CONTACT_LANDING_PAGES (Paginated List)
```graphql
query FindContactLandingPages($filters: [Filter!], $orderBy: [OrderBy!], $limit: Int, $offset: Int) {
  findLandingPages(sourceType: CONTACTS, filters: $filters, orderBy: $orderBy, limit: $limit, offset: $offset) {
    records { id, firstName, lastName, email, phone, role, companyName, createdBy, createdAt, tags }
    total
  }
}
```

#### CREATE_CONTACT
```graphql
mutation CreateContact($input: ContactInput!) {
  createContact(input: $input) { ... }
}
```
**Note**: Empty strings for `companyId` and `role` are filtered out before sending.

#### UPDATE_CONTACT
```graphql
mutation UpdateContact($id: UUID!, $input: ContactInput!) {
  updateContact(id: $id, input: $input) { ... }
}
```

#### DELETE_CONTACT
```graphql
mutation DeleteContact($id: UUID!) {
  deleteContact(id: $id)
}
```
After deletion, user is automatically redirected to `/contacts` list.

#### GET_JOBS_BY_CONTACT
```graphql
query GetJobsByContact($contactId: UUID!) {
  jobsByContact(contactId: $contactId) { id, jobName, jobType, description, status { id, name }, startDate, createdAt }
}
```

#### GET_CONTACTS_BY_COMPANY
```graphql
query GetContactsByCompany($companyId: UUID!) {
  contactsByCompany(companyId: $companyId) { ... }
}
```

### Filter Operations
```typescript
type FilterOperator = 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'ILIKE' | 'BEGINS_WITH' | 'ENDS_WITH' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL';
```

### Filter Fields
- `firstName`, `lastName`, `email`, `phone`, `role`, `companyName`, `territory`, `createdBy`, `createdAt`

---

## 4. UI Components

### ContactsContent (Main Container)
**Features**:
- View mode toggle (list/grid)
- Search with debounce (300ms, min 2 chars)
- Advanced filters with column filter sync
- Sort controls (multi-sort support)
- Quick filters for contact roles
- Infinite scroll pagination
- Header with icon animation
- Error state with retry

### ContactDetailView
**6 Tabs**:
1. **Overview**: Personal info, company, role, tags, warehouse settings
2. **Sales Reps**: Coming soon
3. **Addresses**: With Google Maps integration
4. **Emails**: Coming soon
5. **Meetings**: Coming soon
6. **Connected Entities**: Companies, jobs, tasks, etc.

**Editing Capabilities**: First Name, Last Name, Email, Phone, Role, Company (searchable), Territory, Tags, LinkedIn, Warehouse contact toggle

**Scroll-Spy**: Tab navigation updates as user scrolls, clicking tabs smoothly scrolls to section.

### ListView
- HTML table with sticky header
- Column filtering (per-column)
- 6 columns: Name, Company, Role, Tags, Created At, Created By
- Row click to open detail
- Infinite scroll (200px threshold)

### GridView
- Responsive grid (1-4 columns based on screen)
- Card per contact with avatar, name, role, email, phone, company
- Hover state with shadow

---

## 5. State Management

### useContactsState Hook

```typescript
// State Variables
viewMode: 'list' | 'grid';
selectedContact: Contact | null;
searchQuery: string;
debouncedSearchQuery: string;          // 300ms debounce
isSearching: boolean;
showCreateModal: boolean;
isEditing: boolean;
editFormData: Partial<Contact>;
hasLocalEdits: boolean;
deleteConfirmId: string | null;
activeFilters: ActiveFilter[];
columnFilters: Record<string, ActiveFilter[]>;
clientSortColumns: ActiveSort[];
serverFilters: LandingPageFilter[];
serverOrderBy: LandingPageOrderBy[];

// Key Methods
setViewMode, setSelectedContact, setSearchQuery
handleFilterChange, handleFiltersChange, handleColumnFiltersChange
handleSortChange, handleMultiSortChange
handleStartEdit, handleSaveEdit, handleCancelEdit, handleEditFormChange
handleDeleteContact
fetchNextPage, refetch
```

### Data Synchronization
- If `debouncedSearchQuery.length >= 2`: Use search results
- Otherwise: Use paginated API results with server filters and sorting
- Filters sync between AdvancedFilters and ColumnFilters using refs to prevent infinite loops

---

## 6. Features & Functionality

### Contact CRUD

#### Create
- Modal with sections: Personal Information, Work Information, Additional Details
- Required: First Name, Last Name
- Company search with filtering
- Success toast and automatic refetch

#### Read
- URL parameter `?id=` triggers detail view
- Full contact fetch from API
- Related entities display

#### Update
- In-place editing with Save/Cancel
- Success notification and list refresh
- Unsaved changes warning

#### Delete
- Confirmation modal
- Post-deletion navigation to list
- Success toast

### Search
- Debounced (300ms), minimum 2 characters
- Searches: Name, Email, Phone, Role
- Loading spinner in search icon

### Advanced Filtering
- **Text**: firstName, lastName, createdBy
- **Company**: Dropdown with search
- **Role**: Predefined roles
- **Date**: createdAt
- **Quick Filters**: Role buttons (All, GC, EC, etc.)

### Sorting
- Fields: firstName, lastName, companyName, role, createdAt, createdBy
- Multi-sort support

### Pagination
- Infinite scroll with `useScrollPagination`
- Threshold: 200px from bottom
- Auto page concatenation

### Address Management
- Add/Edit/Delete with Google Maps
- Types: BILLING, SHIPPING, MAILING, OTHER
- Primary address marking

### Related Entity Linking
- Linkable: Companies, Jobs, Tasks, Notes, Quotes, Orders, Invoices, Files, Checks
- Quick link buttons and unlink on hover

---

## 7. Hooks & Custom Logic

### API Hooks
- `useCRMContact(id)`: Single contact
- `useCRMContactLandingPagesInfinite(filters, orderBy)`: Paginated list
- `useCreateCRMContact()`, `useUpdateCRMContact()`, `useDeleteCRMContact()`: Mutations

### Supporting Hooks
- `useScrollPagination`: Scroll detection for pagination
- `useFlowChat`: Sets entity context for chatbot
- `useAddressesBySource`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress`: Address CRUD
- `useRelatedEntities`, `useCRMJobsByContact`: Related data
- `useCreateCRMLink`, `useDeleteCRMLinkByEntities`: Entity linking
- `useFilterSync`: Synchronizes Advanced and Column filters

---

## 8. Modals & User Interactions

### CreateContactModal
- Three sections with icons
- Required field indicators
- Portaled custom selects
- Form validation
- Loading state during submission

### ContactDetailView Modals
- **RoleSelect**: Portaled dropdown
- **CompanySearchSelect**: Portaled with search
- **GoogleMapsAddressModal**: Address creation/editing
- **DeleteConfirmModal**: Simple confirmation

### AddLinkModal
- Entity type toggle (Company/Job)
- Search with server-side filtering
- Excludes already-linked entities
- Selection state with checkmark

---

## 9. Entity Relationships

```
Contact
├── Company (via companyId, optional)
├── Jobs (via link table, multiple)
├── Addresses (via sourceId='CONTACT')
├── Connected Entities (generic)
│   ├── Companies, Customers, Jobs, Tasks, Notes
│   ├── Quotes, Orders, Invoices, Files, Checks
└── Created By (User)
```

---

## 10. Data Flow & Navigation

### URL-Driven Navigation
- `/contacts`: Show list view
- `/contacts?id=<uuid>`: Load contact, show detail

### Selection Flow
1. Click contact in list
2. `setSelectedContact(contact)`
3. URL updates to `?id=<contactId>`
4. Full contact fetched
5. Detail view renders

### Creation Flow
1. Add Contact button → `setShowCreateModal(true)`
2. Fill form → Submit
3. API call → Success: toast + close + refetch

---

## 11. Filter & Sort System

### Filter Configuration
```typescript
[
  { id: 'first-name', label: 'First Name', type: 'text', columnName: 'firstName' },
  { id: 'last-name', label: 'Last Name', type: 'text', columnName: 'lastName' },
  { id: 'company', label: 'Company', type: 'company', columnName: 'companyName' },
  { id: 'role', label: 'Role', type: 'dropdown', columnName: 'role', options: CONTACT_ROLES },
  { id: 'created-by', label: 'Created By', type: 'text', columnName: 'createdBy' },
  { id: 'created-at', label: 'Created At', type: 'date', columnName: 'createdAt' },
]
```

### Filter Synchronization
Three systems kept in sync:
1. **AdvancedFilters**: Modal-based UI stored in `activeFilters`
2. **ColumnFilters**: Per-column inline filters stored in `columnFilters`
3. **ServerFilters**: API-ready format stored in `serverFilters`

---

## 12. Error Handling & Loading States

### Error States
- List errors: Red banner with retry button
- Detail errors: Toast notifications

### Loading States
- Initial: `ContactsTableSkeleton` (8 row placeholders)
- Pagination: Bottom loading indicator
- Search: Spinning loader in search icon
- Detail: "Loading Contact Details..." text
- Save/Delete: Button spinners

### Toast Notifications
```typescript
contactToasts.createSuccess(name)
contactToasts.updateSuccess(name)
contactToasts.deleteSuccess(name)
contactToasts.createError(msg)
contactToasts.updateError(msg)
contactToasts.deleteError(msg)
```

### Unsaved Changes Guard
- Tracks `hasLocalEdits`
- Modal on navigation: Save / Discard / Cancel

---

## Additional Features

### Warehouse Contact Classification
- `isWarehouseContact`: Boolean toggle
- `warehouseRole`: Text field (conditional)

### Tag System
- Comma-separated string format in API
- Parsed to array for display
- Blue badge pills

### Avatar System
- Color from last character of ID
- Initials from name parts

### Duplicate Detection (Placeholder)
- `showDedupeModal` and `duplicateGroups` state exists
- Feature not yet implemented
