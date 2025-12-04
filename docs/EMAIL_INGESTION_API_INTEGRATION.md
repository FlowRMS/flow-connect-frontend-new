# Email Ingestion API Integration

This document describes the integration of the Python AI Service GraphQL API with the Email Ingestion UI.

## Overview

The email ingestion feature has been updated to connect to the Python AI Service API at `https://staging.py.ai.flowrms.com/graphql` instead of using mock data.

## Changes Made

### 1. Environment Configuration

Added new environment variable in [`.env.local`](.env.local):
```env
NEXT_PUBLIC_PYTHON_AI_GRAPHQL_URL=https://staging.py.ai.flowrms.com/graphql
```

### 2. TypeScript Types

Updated [components/email-ingestion/types.ts](components/email-ingestion/types.ts) to match the API schema:

- **EmailStatusAPI**: `'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'`
- **Email**: Main email entity with all API fields
  - `id`, `externalId`, `conversationId`
  - `fromEmail`, `toEmail`, `subject`, `body`
  - `status`, `userId`, `createdAt`
  - AI-processed fields: `summary`, `category`, `sentiment`, `urgency`, `requiresResponse`, `classificationConfidence`, `extractedEntities`, `suggestedActions`
  - `attachments`: Array of EmailAttachment objects
- **EmailAttachment**: Attachment metadata including document classification

### 3. GraphQL Client

Created [components/lib/email-graphql.ts](components/lib/email-graphql.ts) with:

**Queries:**
- `fetchEmails(status?)` - Get all emails or filter by status
- `fetchEmail(emailId)` - Get single email by ID

**Mutations:**
- `updateEmailStatus(input)` - Update email status
- `deleteEmail(emailId)` - Delete email
- `deleteEmailAttachment(attachmentId)` - Delete attachment

The client uses the same authentication strategy as the CRM API (SSO tokens, Token Server, or manual tokens).

### 4. React Query Hooks

Created [components/hooks/useEmailApi.ts](components/hooks/useEmailApi.ts) with:

- `useEmails(status?)` - Query hook for fetching emails
- `useEmail(emailId)` - Query hook for fetching single email
- `useUpdateEmailStatus()` - Mutation hook for updating status
- `useDeleteEmail()` - Mutation hook for deleting email
- `useDeleteEmailAttachment()` - Mutation hook for deleting attachment

### 5. Utility Functions

Updated [components/email-ingestion/utils.ts](components/email-ingestion/utils.ts) with:

- `parseExtractedEntities()` - Parse JSON extracted entities
- `mapStatusToFilter()` - Map API status to UI filter status
- `emailNeedsAttention()` - Check if email needs attention
- `getStatusDisplayName()` - Get friendly status name
- `formatFileSize()` - Format bytes to human-readable
- `getUrgencyColor()` - Get color classes for urgency
- `getSentimentColor()` - Get color classes for sentiment
- Updated `getStatusColor()` and `getDocumentTypeColor()` for API types

### 6. State Management

Updated [components/email-ingestion/hooks/useEmailsState.ts](components/email-ingestion/hooks/useEmailsState.ts):

- Replaced mock data with `useEmails()` API hook
- Added `isLoading` and `error` states
- Updated `handleProcessEmail()` to call API mutation
- Client-side filtering based on status

### 7. UI Components

#### EmailIngestionContent
Updated [components/email-ingestion/EmailIngestionContent.tsx](components/email-ingestion/EmailIngestionContent.tsx):
- Added loading spinner state
- Added error state with retry button
- Conditionally render views only when data is loaded

#### CardView
Updated [components/email-ingestion/views/CardView.tsx](components/email-ingestion/views/CardView.tsx):
- Display `fromEmail` and `toEmail` instead of `sender`/`recipient`
- Show AI summary with icon
- Display attachments with document type classification
- Show metadata: category, sentiment, requires response
- Show extracted entities from AI processing
- Display suggested actions instead of tasks
- Updated status badge to use API statuses
- Show urgency badge if present

#### SpreadsheetView
Needs to be updated (pending)

#### EmailDetailModal
Needs to be updated (pending)

## API Schema Mapping

### Email Status Mapping

| API Status | UI Filter | Description |
|-----------|-----------|-------------|
| `PENDING` | Needs Attention | Email waiting for processing |
| `PROCESSING` | Needs Attention | Email being processed by AI |
| `PROCESSED` | Processed | Email successfully processed |
| `FAILED` | Needs Attention | Email processing failed |

### Data Structure Example

```json
{
  "id": "ee482f38-cc4b-49d0-861a-b5ed9d5b98bb",
  "fromEmail": "Jamal@flowrms.com",
  "toEmail": "flowbot+staging1@flowrms.com",
  "subject": "Bulk attachments",
  "body": "Here is bunch\r\n",
  "status": "PROCESSED",
  "createdAt": "2025-12-04T12:41:13.185783+00:00",
  "summary": "The email contains a brief message...",
  "category": "other",
  "sentiment": "neutral",
  "urgency": "low",
  "requiresResponse": false,
  "classificationConfidence": 0.8,
  "extractedEntities": "{\"jobs\":[],\"dates\":[],\"amounts\":[],\"contacts\":[],\"products\":[],\"companies\":[],\"reference_numbers\":[]}",
  "suggestedActions": ["Request clarification..."],
  "attachments": [
    {
      "id": "78552fc3-9573-4494-8eca-0cb7fab1a5ad",
      "name": "PPI - 11 - 2025 COMMISSION BACKUP CHECK 707455.csv",
      "contentType": "text/csv",
      "size": 27826,
      "documentType": "payment_receipt",
      "documentDescription": "The filename contains 'COMMISSION BACKUP CHECK'...",
      "classificationConfidence": 0.6
    }
  ]
}
```

## Authentication

The email API uses the same authentication as the CRM API:

1. **SSO Tokens** (Priority 1): From FlowRMS redirect
2. **Token Server** (Priority 2): Local token server at `http://127.0.0.1:8000`
3. **Manual Tokens** (Priority 3): Configured in FlowCRM Auth settings

Tokens are automatically refreshed when expired (401/403 responses).

## Next Steps

1. ✅ Complete SpreadsheetView update
2. ✅ Complete EmailDetailModal update
3. Test with real API data
4. Add error handling and toast notifications
5. Implement attachment download functionality
6. Add email search/filtering capabilities

## Testing

To test the integration:

1. Ensure you have valid authentication tokens
2. Navigate to `/email-ingestion` page
3. The UI should load real emails from the API
4. Click on an email to view details
5. Use "Mark as Processed" to update email status
6. Verify status updates are persisted to the API

## Troubleshooting

### Authentication Errors
- Check that `NEXT_PUBLIC_PYTHON_AI_GRAPHQL_URL` is set correctly
- Verify your authentication tokens are valid
- Check browser console for detailed error messages

### No Emails Showing
- Verify the API is returning data in the correct format
- Check network tab for GraphQL responses
- Ensure email status filtering is working correctly

### Failed to Update Status
- Check that the `updateEmailStatus` mutation is being called
- Verify the email ID is valid
- Check for GraphQL errors in the response
