import type { Submittal, SubmittalConfig, TransmittalPurpose } from '../../../lib/types/submittals';

// Recipient type that can be passed from quote
export interface QuoteRecipient {
  id: string;
  name: string;
  company: string;
  role: 'customer' | 'architect' | 'engineer' | 'gc' | 'ec' | 'other';
  email: string;
}

// Line item type that can be passed from quote
export interface QuoteLineItem {
  id: string;
  catalogNumber: string;
  manufacturer: string;
  description: string;
  quantity: number;
}

// Quote for submittal display
export interface QuoteForSubmittal {
  id: string;
  quoteId: string;
  name: string;
  customer: string;
  itemCount: number;
  recipients: QuoteRecipient[];
}

// Step types
export type Step = 'select-quote' | 'select-recipients' | 'select-items' | 'configure' | 'review';

// Manual contact state
export interface ManualContacts {
  architectName: string;
  architectCompany: string;
  engineerName: string;
  engineerCompany: string;
  otherContactName: string;
  otherContactCompany: string;
}

// Props for CreateSubmittalModal
export interface CreateSubmittalModalProps {
  onClose: () => void;
  onCreate: (submittal: Partial<Submittal>) => void | Promise<void>;
  preselectedQuoteId?: string;
  preselectedQuoteName?: string;
  quoteRecipients?: QuoteRecipient[];
  quoteLineItems?: QuoteLineItem[];
}

// Create submittal hook return type
export interface UseCreateSubmittalReturn {
  // Step state
  step: Step;
  setStep: (step: Step) => void;
  steps: string[];
  currentStepIndex: number;
  canProceed: boolean;

  // Quote selection
  selectedQuoteIds: Set<string>;
  setSelectedQuoteIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  quoteSearch: string;
  setQuoteSearch: (search: string) => void;
  filteredQuotes: QuoteForSubmittal[];
  isSearchingQuotes: boolean;
  isLoadingQuoteDetails: boolean;
  selectedQuotes: QuoteForSubmittal[];
  selectedQuote: QuoteForSubmittal | null;

  // Recipients
  recipients: QuoteRecipient[];
  selectedRecipientIds: Set<string>;
  toggleRecipient: (id: string) => void;
  selectedRecipients: QuoteRecipient[];

  // Manual contacts
  manualContacts: ManualContacts;
  setManualContacts: React.Dispatch<React.SetStateAction<ManualContacts>>;

  // Items
  lineItems: QuoteLineItem[];
  selectedItemIds: Set<string>;
  toggleItem: (id: string) => void;
  toggleAllItems: () => void;

  // Configuration
  submittalName: string;
  setSubmittalName: (name: string) => void;
  transmittalPurpose: TransmittalPurpose;
  setTransmittalPurpose: (purpose: TransmittalPurpose) => void;
  notes: string;
  setNotes: (notes: string) => void;
  config: SubmittalConfig;
  updateConfig: (key: keyof SubmittalConfig, value: boolean) => void;

  // Navigation
  handleNext: () => void;
  handleBack: () => void;
  handleCreate: () => Promise<void>;

  // Loading state
  isCreating: boolean;
}
