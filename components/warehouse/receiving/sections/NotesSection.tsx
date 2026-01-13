import React from 'react';

interface NotesSectionProps {
  notes?: string | null;
}

export default function NotesSection({ notes }: NotesSectionProps) {
  if (!notes) return null;
  return (
    <div className="mt-4 bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Notes</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{notes}</p>
    </div>
  );
}
