/**
 * Types for the MentionInput component
 */

export type MentionType = 'CUSTOMER' | 'CONTACT' | 'COMPANY' | 'FACTORY';

export interface Mention {
  id: string;
  type: MentionType;
  name: string;
  startIndex: number;
  endIndex: number;
}

export interface MentionSearchResult {
  id: string;
  type: MentionType;
  name: string;
  subtitle?: string;
}

export interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  mentions: Mention[];
  onMentionsChange: (mentions: Mention[]) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

// Category configuration for visual styling
export interface MentionCategory {
  type: MentionType;
  label: string;
  singularLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string; // SVG path
}

export const MENTION_CATEGORIES: MentionCategory[] = [
  {
    type: 'CUSTOMER',
    label: 'Customers',
    singularLabel: 'Customer',
    color: '#ec4899', // pink-500
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    type: 'CONTACT',
    label: 'Contacts',
    singularLabel: 'Contact',
    color: '#10b981', // emerald-500
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    type: 'COMPANY',
    label: 'Companies',
    singularLabel: 'Company',
    color: '#8b5cf6', // violet-500
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    type: 'FACTORY',
    label: 'Factories',
    singularLabel: 'Factory',
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M12 7v.01M12 11v.01M12 15v.01',
  },
];

export const getMentionCategory = (type: MentionType): MentionCategory => {
  return MENTION_CATEGORIES.find(c => c.type === type) || MENTION_CATEGORIES[0];
};
