# FlowMail Implementation Plan

## Overview
FlowMail is a new email feature for the CRM that allows users to view, read, and compose emails with full context about contacts and their related activities, jobs, quotes, notes, and tasks. It includes AI-powered email generation with customizable styles.

## Key Features

### 1. Email List View
- Display all emails in a sortable, filterable list
- Filter by: sender, receiver, subject, body content, attachments, contacts in email
- Sort by: date, sender, subject, etc.
- Switch between different view modes if desired
- Click an email to enter reading/writing mode

### 2. Email Reading/Writing Mode
- Full email content display
- Reply/Forward capabilities
- **Right sidebar** showing all context for contacts in the email:
  - Recent activity
  - Notes
  - Tasks
  - Related jobs (clickable, expandable in modal)
  - Related quotes (clickable, expandable in modal)
  - Other connected entities

### 3. Compose Email
- New email composition
- Same right sidebar with contact context
- Rich text editor for email body
- Attachment support (mock)
- Recipient selection with contact autocomplete

### 4. AI Email Generation
- **"Auto Generate Email"** button - analyzes all contacts in the email and generates appropriate email based on context
- **"Auto Generate Email with Prompt"** button - user provides guidance, AI generates email based on context + prompt
- Uses mock AI responses (simulated generation)

### 5. Email Style Settings
- **Tone Styles**: Formal, Friendly, Professional, Casual, Urgent, etc.
- **Full Templates**: Complete email templates with placeholders
- Save, edit, and delete custom styles
- Select default style for generation
- Apply styles when generating emails

## Technical Implementation

### Files to Create

1. **`/app/flowmail/page.tsx`** - Page wrapper (follows existing pattern)
2. **`/components/FlowmailContent.tsx`** - Main content component
3. **`/components/FlowmailContextSidebar.tsx`** - Right sidebar with contact context
4. **`/components/FlowmailComposeModal.tsx`** - Compose new email modal (optional, could be inline)
5. **`/components/FlowmailStyleSettings.tsx`** - Email style management component

### Files to Modify

1. **`/components/Sidebar.tsx`** - Add FlowMail navigation link

### Data Types

```typescript
// Email Types
type Email = {
  id: string;
  threadId: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  subject: string;
  body: string;
  bodyHtml: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachments: boolean;
  attachments: Attachment[];
  labels: string[];
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive';
  provider: 'gmail' | 'microsoft365';
};

type EmailParticipant = {
  email: string;
  name: string;
  contactId?: string; // Link to CRM contact if exists
};

type Attachment = {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
};

type EmailThread = {
  id: string;
  subject: string;
  participants: EmailParticipant[];
  emails: Email[];
  lastMessageDate: string;
  unreadCount: number;
};

// Style Types
type EmailToneStyle = {
  id: string;
  name: string;
  description: string;
  tone: 'formal' | 'friendly' | 'professional' | 'casual' | 'urgent' | 'custom';
  customInstructions?: string;
  isDefault: boolean;
  createdDate: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: 'follow-up' | 'introduction' | 'quote-request' | 'thank-you' | 'meeting' | 'custom';
  placeholders: string[]; // e.g., ['{{contact_name}}', '{{company}}', '{{job_name}}']
  createdDate: string;
};

// Context Types (for sidebar)
type ContactContext = {
  contact: Contact;
  recentActivity: Activity[];
  notes: Note[];
  tasks: Task[];
  jobs: Job[];
  quotes: Quote[];
  companies: Company[];
};
```

### Component Structure

```
FlowmailContent
├── Header (title, compose button, view toggles)
├── Filters Bar (AdvancedFilters component)
├── Main Content Area
│   ├── Email List (when no email selected)
│   │   └── Email Row (clickable)
│   └── Email View (when email selected)
│       ├── Email Header (subject, participants, date)
│       ├── Email Body
│       ├── Reply/Forward Actions
│       ├── AI Generation Buttons
│       │   ├── "Auto Generate Email"
│       │   └── "Auto Generate Email with Prompt"
│       └── Compose Area (for replies)
└── Context Sidebar (right side, always visible when viewing/composing)
    ├── Contact Tabs (switch between contacts in email)
    ├── Recent Activity Section
    ├── Notes Section (expandable)
    ├── Tasks Section (expandable)
    ├── Jobs Section (expandable, click opens modal)
    ├── Quotes Section (expandable, click opens modal)
    └── Style Settings Section
        ├── Current Style Display
        └── "Manage Styles" button
```

### State Management

```typescript
// Main state variables
const [viewMode, setViewMode] = useState<'list' | 'email' | 'compose'>('list');
const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
const [emails, setEmails] = useState<Email[]>(mockEmails);
const [filters, setFilters] = useState<FilterState>({});
const [searchQuery, setSearchQuery] = useState('');

// Compose state
const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward' | null>(null);
const [draftEmail, setDraftEmail] = useState<Partial<Email>>({});

// Context sidebar state
const [selectedContactContext, setSelectedContactContext] = useState<ContactContext | null>(null);
const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['activity']));

// Modal state for jobs/quotes
const [showJobModal, setShowJobModal] = useState(false);
const [showQuoteModal, setShowQuoteModal] = useState(false);
const [selectedJob, setSelectedJob] = useState<Job | null>(null);
const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

// AI generation state
const [isGenerating, setIsGenerating] = useState(false);
const [showPromptModal, setShowPromptModal] = useState(false);
const [generationPrompt, setGenerationPrompt] = useState('');

// Style settings state
const [showStyleSettings, setShowStyleSettings] = useState(false);
const [toneStyles, setToneStyles] = useState<EmailToneStyle[]>(defaultToneStyles);
const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
const [selectedToneStyle, setSelectedToneStyle] = useState<EmailToneStyle | null>(null);
```

### Mock Data Requirements

1. **Mock Emails** - 15-20 sample emails with realistic content
2. **Mock Email Threads** - Group some emails into conversations
3. **Mock Contact Links** - Connect emails to existing mock contacts
4. **Mock Activity** - Recent activities for contacts in emails
5. **Default Tone Styles** - 5-6 preset tone options
6. **Default Templates** - 4-5 common email templates

### UI/UX Details

#### Email List View
- Table/list format with columns: checkbox, star, from, subject, snippet, date, attachments icon
- Row hover highlights
- Click row to open email
- Bulk actions for selected emails

#### Email View
- Full email displayed
- Thread view showing conversation history
- Reply box at bottom
- AI buttons prominently placed above reply box

#### Context Sidebar (Right Side)
- Fixed width (350-400px)
- Scrollable independently
- Collapsible sections with headers
- Contact avatar and name at top
- Tabs if multiple contacts in email
- Job/Quote items show mini-preview, click for full modal

#### Style Settings
- Modal or slide-out panel
- Two tabs: "Tone Styles" and "Templates"
- List of saved styles with edit/delete
- "Add New" button for each type
- Set default toggle

### AI Generation Flow (Mock)

1. User clicks "Auto Generate Email"
2. System shows loading state (1-2 seconds)
3. Mock response generated based on:
   - Contact names and companies
   - Selected tone style
   - Recent activity context
4. Generated text populated in compose area

For "Auto Generate with Prompt":
1. User clicks button
2. Modal opens with prompt input
3. User enters guidance (e.g., "Ask about the status of their quote")
4. System generates email incorporating prompt
5. Generated text populated in compose area

## Implementation Order

1. **Phase 1: Basic Structure**
   - Create page and content component
   - Add sidebar navigation link
   - Implement email list view with mock data
   - Basic filtering and sorting

2. **Phase 2: Email View & Compose**
   - Email reading view
   - Reply/forward functionality
   - Compose new email
   - Basic compose form

3. **Phase 3: Context Sidebar**
   - Build sidebar component
   - Show contact context (activity, notes, tasks)
   - Add jobs and quotes sections
   - Implement expandable modals for jobs/quotes

4. **Phase 4: AI Generation**
   - Auto Generate Email button (mock)
   - Auto Generate with Prompt button (mock)
   - Loading states and animations

5. **Phase 5: Style Settings**
   - Tone styles management
   - Templates management
   - Apply styles to generation
   - Save/edit/delete functionality

## Notes

- All data is mock data for now
- Email provider integration (Gmail/Microsoft 365) is mocked
- AI generation uses simulated responses
- Follow existing component patterns from QuotesContent and TakeoffsContent
- Use existing CSS variables for consistent styling
- Reuse AdvancedFilters component for filtering
