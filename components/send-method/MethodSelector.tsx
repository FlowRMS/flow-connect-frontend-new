'use client';

import { Badge } from '@/components/ui/badge';
import { Upload, Mail, Code, Server, type LucideIcon } from 'lucide-react';
import type { SendMethodType } from '@/lib/nemra-pos-data';

export type SendMethodOption = {
  id: SendMethodType;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const DEFAULT_SEND_METHODS: SendMethodOption[] = [
  {
    id: 'file',
    label: 'Upload a File',
    icon: Upload,
    description: 'Upload CSV or Excel files manually',
  },
  {
    id: 'api',
    label: 'API',
    icon: Code,
    description: 'Connect directly via REST API for automated sends',
  },
  {
    id: 'sftp',
    label: 'SFTP',
    icon: Server,
    description: 'For scheduled batch sends',
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Forward reports to a dedicated email address',
  },
];

interface MethodSelectorProps {
  selectedMethod: SendMethodType;
  onMethodChange: (method: SendMethodType) => void;
  methods?: SendMethodOption[];
}

export function MethodSelector({
  selectedMethod,
  onMethodChange,
  methods = DEFAULT_SEND_METHODS,
}: MethodSelectorProps) {
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
              <p className="font-medium">{method.label}</p>
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
