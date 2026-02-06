'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

interface MappingLegendProps {
  showPotNote?: boolean;
}

export function MappingLegend({ showPotNote = false }: MappingLegendProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Requirement Levels</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            <Badge variant="default" className="text-xs mr-2">Required</Badge>
            Must be mapped for rep credit
          </p>
          <p>
            <Badge variant="default" className="text-xs mr-2">One Required</Badge>
            At least one field in this group must be mapped
          </p>
          <p>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 mr-2">Highly Suggested</Badge>
            Recommended for accuracy and audits
          </p>
          <p>
            <Badge variant="outline" className="text-xs mr-2">Optional</Badge>
            Nice to have
          </p>
        </div>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Visibility</p>
        <p className="text-xs text-muted-foreground">
          Required fields are always visible. Toggle optional fields to control
          what manufacturers and reps can see.
        </p>
        {showPotNote && (
          <p className="text-xs text-muted-foreground mt-2">
            <strong>POT Note:</strong> Transfer Branch fields are typically visible to manufacturers for inventory flow analysis.
          </p>
        )}
      </div>
    </div>
  );
}

export function RepMappingLegend() {
  return (
    <div className="p-4 bg-muted rounded-lg mt-6">
      <p className="text-sm font-medium mb-3">Legend</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Field is being sent to you</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            <span>Field is not being sent</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-600" />
            <span>Field is visible to you</span>
          </div>
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-yellow-600" />
            <span>Field is hidden (by manufacturer or distributor)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
