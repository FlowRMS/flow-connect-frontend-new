# Jobs Module - Technical Documentation

## Table of Contents
1. [Module Overview](#1-module-overview)
2. [Job Entity & Data Types](#2-job-entity--data-types)
3. [UI Components Architecture](#3-ui-components-architecture)
4. [API Endpoints & Data Flow](#4-api-endpoints--data-flow)
5. [State Management](#5-state-management)
6. [Views (Kanban & List)](#6-views-kanban--list)
7. [Drag-and-Drop Functionality](#7-drag-and-drop-functionality)
8. [Job Status Workflow](#8-job-status-workflow)
9. [Job Detail View](#9-job-detail-view)
10. [Company Links (Specifiers & Awardees)](#10-company-links-specifiers--awardees)
11. [Modals & Actions](#11-modals--actions)
12. [Filtering & Sorting](#12-filtering--sorting)
13. [Special Features & Edge Cases](#13-special-features--edge-cases)

---

## 1. Module Overview

**Location**: `/components/jobs/` and `/app/(dashboard)/jobs/`

**Purpose**: Comprehensive job management with Kanban board and list views, drag-and-drop status changes, company links, and full CRUD operations.

**Technologies**: Next.js 15+, React, TypeScript, TanStack React Query, Framer Motion, dnd-kit, Tailwind CSS

### File Structure
```
components/jobs/
├── JobsContent.tsx (951 lines)          # Main container
├── JobCard.tsx (174 lines)              # Card display
├── SortableJobCard.tsx (56 lines)       # Drag wrapper
├── constants.ts                          # Color palettes, configs
├── types.ts                              # Type definitions
├── utils.ts                              # Helper functions
├── config/
│   └── filterConfig.ts                   # Filter/sort options
├── hooks/
│   └── useJobsState.ts                   # State management
├── detail/
│   ├── JobDetailView.tsx (128 lines)
│   ├── JobDetailHeader.tsx (186 lines)
│   ├── JobDetailsForm.tsx (466 lines)
│   ├── JobCompanyLinksSection.tsx (783 lines)
│   ├── JobAddressesSection.tsx (259 lines)
│   └── TagsEditor.tsx (88 lines)
├── views/
│   ├── KanbanView.tsx (225 lines)
│   └── ListView.tsx (193 lines)
└── modals/
    ├── DeleteJobConfirmModal.tsx (84 lines)
    ├── RepTypeModal.tsx (65 lines)
    └── AddLinkModal.tsx (665 lines)
```

---

## 2. Job Entity & Data Types

### API Job Type (from GraphQL)
```typescript
interface Job {
  id: string;                              // UUID
  jobName: string;
  jobType: string;
  status: { id: string; name: string };
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  createdBy: { email, firstName, fullName, id, lastName };
  requesterId: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  tags: string | string[] | undefined;
}
```

### UI Job Type
```typescript
interface Job {
  id: string;
  name: string;
  status: string;
  type: string;
  value: string;
  startDate: string;
  endDate: string;
  gc: string;                              // General Contractor
  ec: string;                              // Electrical Contractor
  owner: string;
  description: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  requesterId: string;
}
```

### Job Landing Page (List View)
```typescript
interface JobLandingPage {
  id: string;
  jobName: string;
  statusName: string;
  jobOwner: string;
  jobType: string;
  description: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  tags: string[];
}
```

---

## 3. UI Components Architecture

### Component Hierarchy
```
JobsContent.tsx
├── Header (search, filters, sort, create)
├── ViewMode Toggle (Kanban/List)
├── KanbanView.tsx
│   ├── DroppableColumn (per status)
│   │   └── SortableJobCard
│   │       └── JobCard
│   └── DragOverlay
├── ListView.tsx
│   └── Table Rows → JobCard
└── JobDetailView.tsx
    ├── JobDetailHeader.tsx
    ├── JobDetailsForm.tsx
    ├── JobCompanyLinksSection.tsx
    │   ├── CompanyLinksPane (Specifiers)
    │   ├── CompanyLinksPane (Awardees)
    │   └── AddCompanyModal
    ├── JobAddressesSection.tsx
    ├── ConnectedEntitiesSection.tsx
    └── Modals...
```

---

## 4. API Endpoints & Data Flow

### GraphQL Queries

#### GET_JOB_STATUSES
```graphql
query GetJobStatuses {
  jobStatuses { id, name }
}
```

#### GET_JOB
```graphql
query GetJob($id: UUID!) {
  job(id: $id) {
    id, jobName, jobType, status { id, name }, description, startDate, endDate,
    createdAt, createdBy { email, firstName, fullName, id, lastName },
    additionalInformation, structuralInformation, structuralDetails, requesterId, tags
  }
}
```

#### FIND_JOB_LANDING_PAGES
```graphql
query FindJobLandingPages($filters: [Filter!], $orderBy: [OrderBy!], $limit: Int, $offset: Int) {
  findLandingPages(sourceType: JOBS, filters: $filters, orderBy: $orderBy, limit: $limit, offset: $offset) {
    records { ... JobLandingPage fields }
    total
  }
}
```

### Mutations

#### CREATE_JOB
```typescript
interface JobInput {
  jobName: string;
  statusId: UUID;                          // Required
  jobType: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
  structuralInformation?: string;
  structuralDetails?: string;
  tags?: string;                           // Comma-separated
  requesterId?: string;
}
```

#### UPDATE_JOB
Same input with `id` field.

#### DELETE_JOB
```graphql
mutation DeleteJob($id: UUID!) { deleteJob(id: $id) }
```

### Company Links API
```graphql
query GetJobSpecifiers($jobId: UUID!) {
  jobSpecifiers(jobId: $jobId) { id, jobId, companyId, role, createdAt, company { ... } }
}

query GetJobAwardees($jobId: UUID!) {
  jobAwardees(jobId: $jobId) { ... }
}

mutation AddCompanyToJob($input: AddCompanyToJobInput!) {
  addCompanyToJob(input: $input) { ... }
}

mutation RemoveCompanyFromJob($input: RemoveCompanyFromJobInput!) {
  removeCompanyFromJob(input: $input)
}
```

---

## 5. State Management

### useJobsState Hook

**Inputs**: `landingPageJobs: JobLandingPage[]`, `apiStatuses: JobStatus[]`

**State**:
```typescript
viewMode: 'kanban' | 'list'
jobs: Job[]
stages: JobStage[]
selectedJob: Job | null
isEditing: boolean
editFormData: Partial<Job>
activeId: string | null                    // Dragging job ID
overId: string | null                      // Hover target ID
showCreateJobModal: boolean
showRepTypeModal: boolean
activeFilters: ActiveFilter[]
clientSortColumns: OrderBy[]
repType: RepType
visibleCategories: string[]
uniqueJobNames, uniqueStatuses, uniqueTypes, uniqueCreators: string[]
```

---

## 6. Views (Kanban & List)

### Kanban View
- **Grid Layout**: 1-5 columns based on status count
- **Columns**: One per job status/stage
- **Features**:
  - Column headers with color indicator and count
  - Add Job button per column (pre-fills status)
  - Drag-drop cards between columns
  - Empty state per column
  - Visual feedback on drag-over (blue highlight)

### List View
- **Grid-based table**: 12-column responsive
- **Columns**: Done (checkbox), Job Name, Status, Type, Owner, Dates, Tags
- **Interactive**: Row click to select
- **Checkbox**: Marks job as complete (status change)

---

## 7. Drag-and-Drop Functionality

### DnD Kit Setup
- **Library**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Sensors**: PointerSensor with 8px activation
- **Collision**: Custom hybrid (pointer + rect intersection)

### Events
```typescript
onDragStart: setActiveId(event.active.id)
onDragOver: setOverId(event.over?.id || null)
onDragEnd:
  1. Extract target status from column ID: "stage-{StatusName}"
  2. Find job by active ID
  3. If same status, cancel
  4. Find status ID from apiStatuses
  5. Call updateJobMutation
  6. Show toast
onDragCancel: Reset activeId/overId
```

### Visual Feedback
- **Dragging**: 1.02x scale, increased shadow, border color change
- **Drop Target**: Blue-50 background, ring highlight
- **DragOverlay**: 0.9 opacity, follows cursor, z-50

---

## 8. Job Status Workflow

### Default Stages
1. Backlog (Gray)
2. Bidding (Blue)
3. Active (Yellow)
4. On Hold (Purple)
5. Won (Green)

### Completion Detection
Status is "complete" if matches: Won, Complete, Completed, Done, Closed (case-insensitive)

### Status Change Methods
1. **Drag-Drop (Kanban)**: Drag to new column → UPDATE_JOB with statusId
2. **Checkbox (List)**: Check → find completion status, Uncheck → find active status
3. **Manual Edit**: In detail view, status not directly editable

---

## 9. Job Detail View

### Sections
1. **Header Card**: Name, status badge, type, owner avatar, Edit/Save/Cancel/Delete
2. **Details Form**: Job Name, Type, Value, Start/End Date, GC, EC, Description, Additional Info, Structural Info, Tags
3. **Company Links**: Side-by-side Specifiers & Awardees panes
4. **Addresses**: With Google Maps, types (BILLING, SHIPPING, MAILING, OTHER)
5. **Connected Entities**: Companies, Contacts, Pre-opportunities, Quotes, Orders, Invoices, Checks, Files

### Date Picker
- Custom styled with portal rendering
- Smart positioning (above if no space below)
- Gradient blue header
- Validation: End date cannot be before start date

---

## 10. Company Links (Specifiers & Awardees)

### Roles
- **Specifier (SPECIFIER)**: Company that specified/designed work
- **Awardee (AWARDEE)**: Company that won/was awarded work

### Add Company Modal
- Search companies (debounced 300ms)
- Filter out already linked
- Add with loading state
- Toast on success

---

## 11. Modals & Actions

### CreateJobModal
- Opens from header or column "Add Job"
- Optional default status pre-filled
- Success toast + list refresh

### RepTypeModal
- Select rep type (Electrical, Plumbing, HVAC, Building Materials)
- Currently disabled (Electrical only)

### DeleteConfirmModal
- Warning with "Are you sure?"
- Cancel/Delete buttons, loading state

### AddLinkModal
- Entity type selection grid
- Search with debouncing
- Multi-select with "Select All"
- Progress indicator during linking
- Entity Types: Company, Contact, Task, Note, Pre-Opportunity, Quote, Order, Invoice, Check, Factory, Customer, Product

---

## 12. Filtering & Sorting

### Available Filters
| ID | Label | Type | Enabled |
|----|-------|------|---------|
| job-name | Job Name | dropdown | ✅ |
| status | Status | dropdown | ✅ |
| job-type | Job Type | dropdown | ✅ |
| created-by | Created By | dropdown | ✅ |
| job-id | Job ID | text | ❌ |
| value-min/max | Value | number | ❌ |
| start-date | Start Date | date | ❌ |

### Sort Options
1. Job Name
2. Status
3. Job Type
4. Created Date
5. Start Date

### Filter Operators
EQ, NE, IN, ILIKE, LIKE, BEGINS_WITH, ENDS_WITH, IS_NULL, IS_NOT_NULL

---

## 13. Special Features & Edge Cases

### Infinite Pagination
- 50 items per page, 300px threshold
- Deduplication by ID

### Tag Handling
- Input: String `"tag1,tag2"` or Array `["tag1", "tag2"]`
- Mixed format support
- Tag colors based on keywords (BID, BUY, COMPLETE, etc.)

### Owner Initials & Colors
```typescript
getOwnerInitials(name) = name.split(' ').map(n => n[0]).join('')
// 4 colors: orange, teal, green, purple (by ID last char)
```

### Status Color Mapping
- OPEN: blue
- IN PROGRESS/ACTIVE: amber
- BID/BIDDING: orange
- BUY: green
- COMPLETE/WON/DONE: purple

### Unsaved Changes Guard
- `useUnsavedChangesGuard` hook
- Modal confirmation before navigation
- Save handler via ref

### Hydration Safety
```typescript
const [isMounted, setIsMounted] = useState(false)
useEffect(() => setIsMounted(true), [])
if (!isMounted) return <LoadingState />
```

### URL-Based Navigation
```
/jobs          → List view
/jobs?id={id}  → Detail view
```
Uses `isIntentionalClearRef` to prevent re-selection after navigation.

### Related Entities
Uses `useRelatedEntities(jobId, 'JOBS')` returning: companies, contacts, customers, preOpportunities, tasks, notes, quotes, orders, invoices, checks, files.
