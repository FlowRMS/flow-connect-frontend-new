# Dashboard Module

Clean, modular implementation of the Activity Feed dashboard component.

## Structure

```
components/dashboard/
├── DashboardContent.tsx       # Main component
├── index.ts                   # Module exports
├── types.ts                   # TypeScript interfaces and types
├── constants.ts               # Constants and configurations
├── utils.ts                   # Utility functions
├── mockData.ts               # Mock activity data
├── components/               # Reusable sub-components
│   ├── ActivityCard.tsx
│   ├── ActivityFilterButtons.tsx
│   ├── StatusFilterButtons.tsx
│   └── DashboardActionButtons.tsx
├── config/                   # Configuration files
│   └── filterConfig.ts
└── hooks/                    # Custom React hooks
    └── useDashboardFilters.ts
```

## Key Features

- **Modular Architecture**: Each concern is separated into its own file
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reusable Components**: All UI elements are broken down into reusable components
- **Custom Hooks**: State management logic extracted into custom hooks
- **Clean Utils**: Helper functions properly organized and documented
- **No Functionality Change**: UI and behavior remain identical to the original

## Usage

```tsx
import DashboardContent from './components/DashboardContent';
// or
import DashboardContent from './components/dashboard';
```

## Components

### ActivityCard
Renders individual activity items with avatar, tags, mentions, and metadata.

### ActivityFilterButtons
Handles the activity type filter buttons (Calls, Emails, Notes, etc.)

### StatusFilterButtons
Manages the Upcoming/Completed status filter buttons.

### DashboardActionButtons
Renders the action buttons (Add Job, Create Pre-Opportunity, etc.)

## Hooks

### useDashboardFilters
Manages filter state for both activity types and status filters.

```tsx
const {
  activeFilters,
  statusFilters,
  toggleFilter,
  toggleStatusFilter,
  selectAll,
  clearAll,
} = useDashboardFilters();
```

## Utils

- `getInitials(name)` - Extract initials from a name
- `getAvatarColor(name)` - Get consistent avatar color for a name
- `filterActivities(activities, typeFilters, statusFilters)` - Filter activities
- `sortActivitiesByDate(activities)` - Sort activities by date (newest first)
- `getStatusBadgeClass(status)` - Get CSS classes for status badges
- `capitalize(str)` - Capitalize first letter

## Mock Data

All dummy data is preserved in `mockData.ts` with full activity details including:
- Activity types (call, email, note, meeting, task, job, pre-opportunity, contact)
- Status (upcoming/completed)
- Tags, mentions, likes, comments
- Entity relationships

## Design Pattern

This module follows the same pattern as the Jobs module:
- Clear separation of concerns
- Single responsibility principle
- Easy to test and maintain
- Scalable for future enhancements
