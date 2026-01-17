import type { TransmittalPurpose } from '../../../lib/types/submittals';
import type { QuoteRecipient } from './types';

export const TRANSMITTAL_PURPOSES: { value: TransmittalPurpose; label: string }[] = [
  { value: 'prior_approval', label: 'Prior Approval' },
  { value: 'approval', label: 'Approval' },
  { value: 'approval_as_submitted', label: 'Approval as Submitted' },
  { value: 'review_and_comment', label: 'Review and Comment' },
  { value: 'for_your_use', label: 'For Your Use' },
  { value: 'record', label: 'Record' },
  { value: 'bids_due_on', label: 'Bids Due On' },
];

export const ROLE_LABELS: Record<QuoteRecipient['role'], string> = {
  customer: 'Customer',
  architect: 'Architect',
  engineer: 'Engineer',
  gc: 'General Contractor',
  ec: 'Electrical Contractor',
  other: 'Other',
};

export const ROLE_COLORS: Record<QuoteRecipient['role'], { bg: string; text: string }> = {
  customer: { bg: 'bg-blue-100', text: 'text-blue-700' },
  architect: { bg: 'bg-purple-100', text: 'text-purple-700' },
  engineer: { bg: 'bg-green-100', text: 'text-green-700' },
  gc: { bg: 'bg-orange-100', text: 'text-orange-700' },
  ec: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};
