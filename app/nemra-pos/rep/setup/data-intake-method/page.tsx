'use client';

import { MethodPreferencePanel } from '@/components/method-preference';

export default function RepDataIntakeMethodPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Intake Method</h1>
        <p className="text-muted-foreground">Choose how you want to receive POS data from manufacturers</p>
      </div>

      <MethodPreferencePanel
        mode="receive"
        role="rep"
      />
    </div>
  );
}
