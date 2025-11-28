# Campaigns & Rules Module

This module contains the refactored Campaigns & Rules (Email Helper) section of the application, following clean code principles and modular architecture.

## Structure

```
campaigns/
├── components/          # Reusable UI components
│   ├── ConditionBuilder.tsx      # Rule/campaign condition builder
│   └── StaticListBuilder.tsx     # Manual contact selection with filters
├── config/             # Configuration files (future use)
├── hooks/              # Custom React hooks
│   ├── useCampaignState.ts      # Campaign state management
│   └── useRuleState.ts          # Rule state management
├── modals/             # Modal components
│   └── AIModal.tsx              # AI generation modal
├── views/              # Main view components
│   ├── CampaignsListView.tsx    # Campaigns list table
│   ├── NewCampaignView.tsx      # New campaign creation form
│   ├── NewRuleView.tsx          # New rule creation form
│   └── RulesListView.tsx        # Rules list table
├── CampaignsContent.tsx         # Main container component
├── constants.ts                 # Constants and configurations
├── index.ts                     # Module exports
├── mockData.ts                  # Mock/dummy data
├── types.ts                     # TypeScript type definitions
└── utils.ts                     # Utility functions
```

## Key Features

### Modular Architecture
- **Separation of Concerns**: Each component has a single responsibility
- **Reusable Components**: Shared components like ConditionBuilder and StaticListBuilder
- **Custom Hooks**: State management logic extracted into reusable hooks
- **Type Safety**: Comprehensive TypeScript types and interfaces

### Components

#### CampaignsContent (Main Container)
The primary component that orchestrates all views and manages tab navigation.

#### View Components
- **CampaignsListView**: Displays campaigns in a table format
- **RulesListView**: Displays rules in a table format
- **NewCampaignView**: Campaign creation interface with three list types (Static, Criteria, Dynamic)
- **NewRuleView**: Rule creation interface with condition builder

#### Reusable Components
- **ConditionBuilder**: Complex rule/criteria builder with AND/OR logic groups
- **StaticListBuilder**: Contact selection with advanced filtering
- **AIModal**: AI-powered generation modal

### State Management

#### useCampaignState Hook
Manages all campaign-related state:
- Tab navigation
- Campaign configuration (list type, recipients, email content)
- Filtering (search, companies, types, tags)
- Condition groups for criteria/dynamic lists
- AI modal state

#### useRuleState Hook
Manages all rule-related state:
- Rule configuration (communication type, audience)
- Condition groups for triggers
- Send pace and limits

### Data Flow

1. **Mock Data** (`mockData.ts`): Contains dummy data for contacts, campaigns, and rules
2. **State Hooks**: Manage component state and provide actions
3. **Utils**: Provide helper functions for filtering, formatting, and validation
4. **Constants**: Define reusable configurations and mappings

### Type Safety

All components use TypeScript with strict typing:
- `Contact`, `Campaign`, `Rule` types
- `RuleCondition`, `RuleConditionGroup` types
- `ListType`, `SendPace`, `CommunicationType` types
- Proper typing for all functions and components

## Usage

```tsx
import CampaignsContent from '@/components/campaigns/CampaignsContent';

// Or use the wrapper
import EmailHelperContent from '@/components/EmailHelperContent';
```

## Dummy Data Preserved

All dummy/mock data has been preserved in `mockData.ts`:
- 8 sample contacts
- 4 sample campaigns
- 4 sample rules

## Best Practices Followed

1. **Single Responsibility**: Each component does one thing well
2. **DRY (Don't Repeat Yourself)**: Shared logic extracted into hooks and utils
3. **Type Safety**: Full TypeScript coverage
4. **Clean Code**: Clear naming, proper comments, organized structure
5. **Maintainability**: Easy to find, update, and test code
6. **Scalability**: Easy to add new features or views

## Future Enhancements

- Add API integration (replace mock data)
- Add validation and error handling
- Add unit tests
- Add analytics tracking
- Add export/import functionality
- Add campaign/rule templates
