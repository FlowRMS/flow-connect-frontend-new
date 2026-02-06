import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { SeverityConfig } from './types';
import type { IssueSeverity } from '@/lib/nemra-pos-data';

export const severityConfig: Record<IssueSeverity, SeverityConfig> = {
  blocking: {
    label: 'Blocking',
    sublabel: 'Must fix before sending',
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    headerBg: 'bg-red-100',
  },
  warning: {
    label: 'Warning',
    sublabel: 'Send allowed',
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    iconColor: 'text-yellow-600',
    badgeBg: 'bg-yellow-100',
    headerBg: 'bg-yellow-100',
  },
  fyi: {
    label: 'FYI',
    sublabel: 'Informational',
    icon: Info,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    iconColor: 'text-slate-500',
    badgeBg: 'bg-slate-100',
    headerBg: 'bg-slate-100',
  },
};
