import { Suspense } from 'react';
import AdminSettingsContent from '@/components/admin/AdminSettingsContent';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <AdminSettingsContent />
    </Suspense>
  );
}
