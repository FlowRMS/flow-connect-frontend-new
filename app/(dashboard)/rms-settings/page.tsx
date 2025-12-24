import { Suspense } from 'react';
import RMSSettingsContent from '@/components/rms-settings/RMSSettingsContent';

export default function RMSSettingsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <RMSSettingsContent />
    </Suspense>
  );
}
