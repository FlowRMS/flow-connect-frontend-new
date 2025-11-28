# Email Ingestion Module

Clean, modular implementation of the email ingestion feature following best practices.

## Structure

```
email-ingestion/
├── EmailIngestionContent.tsx   # Main container component
├── index.ts                    # Module exports
├── types.ts                    # TypeScript type definitions
├── constants.ts                # Configuration and constants
├── utils.ts                    # Helper functions
├── mockData.ts                 # Dummy data for development
├── config/
│   └── filterConfig.ts        # Filter and sort configuration
├── hooks/
│   └── useEmailsState.ts      # State management hook
├── views/
│   ├── CardView.tsx           # Card view component
│   └── SpreadsheetView.tsx    # Spreadsheet view component
└── detail/
    └── EmailDetailModal.tsx   # Email detail modal component
```

## Features

- **Card View**: Displays emails in an expandable card layout
- **Spreadsheet View**: Displays emails in a table format
- **Status Filtering**: Filter by All, Needs Attention, or Processed
- **Entity Detection**: Automatically links contacts, companies, jobs, and pre-opportunities
- **Document Detection**: Identifies quotes, orders, invoices, and checks
- **Suggested Tasks**: AI-generated task suggestions based on email content
- **Email Processing**: Mark emails as processed with one click

## Usage

```tsx
import { EmailIngestionContent } from '@/components/email-ingestion';

// In your page component
<EmailIngestionContent />
```

## Design Principles

1. **Separation of Concerns**: Each file has a single, well-defined purpose
2. **Component Composition**: Views are composed from smaller, reusable components
3. **Type Safety**: Full TypeScript coverage with explicit types
4. **Clean Code**: No code duplication, clear naming conventions
5. **Maintainability**: Easy to extend and modify individual features

## Data Flow

1. `mockData.ts` provides the initial email data
2. `useEmailsState.ts` manages all component state
3. Main container (`EmailIngestionContent.tsx`) orchestrates views
4. Views (`CardView`, `SpreadsheetView`) handle presentation
5. Modal (`EmailDetailModal`) shows detailed email information

## Future Enhancements

- Advanced filtering and sorting
- Real-time email ingestion
- Custom entity detection rules
- Email threading and conversations
- Export functionality
