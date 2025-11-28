# Report Scheduler Module

Clean, modular implementation of the Report Scheduler feature following best practices and separation of concerns.

## Directory Structure

```
report-scheduler/
├── ReportSchedulerContent.tsx    # Main container component
├── index.ts                       # Module exports
├── types.ts                       # TypeScript interfaces and types
├── constants.ts                   # Configuration and constants
├── mockData.ts                    # Mock/dummy data for preview
├── hooks/
│   └── useReportSchedulerState.ts # State management hook
├── views/
│   ├── ReportListView.tsx        # Table view of scheduled reports
│   └── CreateReportView.tsx      # Form to create reports
├── modals/
│   └── ReportPreviewModal.tsx    # Preview modal wrapper
└── components/
    └── PreviewContent.tsx        # Report preview rendering logic
```

## Architecture

### Main Component
- **ReportSchedulerContent.tsx**: Main container that orchestrates all sub-components and handles business logic

### State Management
- **useReportSchedulerState**: Custom hook managing all component state including form data, reports list, and UI state

### Views
- **ReportListView**: Displays scheduled reports in a table format with toggle controls
- **CreateReportView**: Form interface for configuring new reports

### Modals
- **ReportPreviewModal**: Modal wrapper for report preview functionality

### Components
- **PreviewContent**: Renders preview data for different report types (Notes, Tasks, Jobs, Pre-Opportunities)

### Data Layer
- **types.ts**: All TypeScript interfaces (Report, ReportType, DateFilter, etc.)
- **constants.ts**: Configuration arrays and lookup tables
- **mockData.ts**: Dummy data for reports and preview content

## Key Features

- ✅ Clean separation of concerns
- ✅ Modular and maintainable code structure
- ✅ TypeScript for type safety
- ✅ Reusable components
- ✅ Custom hooks for state management
- ✅ Mock data preserved for development
- ✅ Follows same pattern as Jobs module

## Usage

```tsx
import ReportSchedulerContent from '@/components/report-scheduler';

// Use in a page
<ReportSchedulerContent />
```

## Related Files

- `/components/ReportSchedulerContent.tsx` - Legacy export for backward compatibility
- `/app/report-scheduler/page.tsx` - Page that uses this component
