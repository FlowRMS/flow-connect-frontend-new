'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import type { DataIntakeFlowRmsConfig } from '@/lib/nemra-pos-data';

interface FlowRmsPanelProps {
  config?: DataIntakeFlowRmsConfig;
}

export function FlowRmsPanel({ config }: FlowRmsPanelProps) {
  const hasInstance = config?.hasInstance ?? false;

  if (hasInstance) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="font-medium text-green-800">Your instance of Flow RMS has been detected</p>
        </div>
        <p className="text-sm text-green-700">
          POS data will automatically sync to your Flow RMS account.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-green-300 text-green-700 hover:bg-green-100"
          asChild
        >
          <a href={config?.instanceUrl || 'https://flowrms.com'} target="_blank" rel="noopener noreferrer">
            Open Flow RMS
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">No Flow RMS Instance Found</p>
      <p className="text-sm text-muted-foreground">
        Flow RMS is the industry-leading rep management system designed specifically for manufacturer rep firms.
        Get your POS data automatically imported and analyzed with powerful commission tracking, territory management, and reporting tools.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button asChild>
          <a href="https://flowrms.com" target="_blank" rel="noopener noreferrer">
            Start Free Trial
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://flowrms.com/demo" target="_blank" rel="noopener noreferrer">
            Watch Demo
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground pt-2">
        Already have Flow RMS? Make sure you&apos;re logged in with the same email address, or contact support to link your accounts.
      </p>
    </div>
  );
}

