import { Suspense } from 'react';
import SettingsContent from '@/components/SettingsContent';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <SettingsContent />
    </Suspense>
  );
}
