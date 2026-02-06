'use client';

import { Badge } from '@/components/ui/badge';
import {
  Download,
  Mail,
  Code,
  Server,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { DataIntakeMethodType } from '@/lib/nemra-pos-data';

export type IntakeMethodOption = {
  id: DataIntakeMethodType;
  label: string;
  icon: LucideIcon;
  description: string;
  recommended?: boolean;
};

export const MANUFACTURER_INTAKE_METHODS: IntakeMethodOption[] = [
  {
    id: 'file',
    label: 'Download File',
    icon: Download,
    description: 'Download CSV or Excel files from the portal',
  },
  {
    id: 'api',
    label: 'API',
    icon: Code,
    description: 'Pull data directly via REST API',
  },
  {
    id: 'sftp',
    label: 'SFTP',
    icon: Server,
    description: 'Files delivered to your SFTP server',
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Receive files via scheduled email delivery',
  },
];

export const REP_INTAKE_METHODS: IntakeMethodOption[] = [
  {
    id: 'flow-rms',
    label: 'Import to Flow RMS',
    icon: Sparkles,
    description: 'Automatically sync POS data to your Flow RMS instance',
    recommended: true,
  },
  {
    id: 'file',
    label: 'Download File',
    icon: Download,
    description: 'Download CSV or Excel files from the portal',
  },
  {
    id: 'api',
    label: 'API',
    icon: Code,
    description: 'Pull data directly via REST API',
  },
  {
    id: 'sftp',
    label: 'SFTP',
    icon: Server,
    description: 'Files delivered to your SFTP server',
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Receive files via scheduled email delivery',
  },
];

interface IntakeMethodSelectorProps {
  selectedMethod: DataIntakeMethodType;
  onMethodChange: (method: DataIntakeMethodType) => void;
  methods: IntakeMethodOption[];
}

export function IntakeMethodSelector({
  selectedMethod,
  onMethodChange,
  methods,
}: IntakeMethodSelectorProps) {
  return (
    <div className="space-y-4">
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        return (
          <div
            key={method.id}
            onClick={() => onMethodChange(method.id)}
            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
              isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{method.label}</p>
                {method.recommended && (
                  <Badge className="bg-blue-100 text-blue-700">Recommended</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{method.description}</p>
            </div>
            {isSelected && (
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

