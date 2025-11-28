/**
 * Grid View Component for Contacts (Placeholder)
 */

import React from 'react';
import type { Contact } from '../types';

interface GridViewProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export default function GridView({ contacts, onContactClick }: GridViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        Grid view coming soon
      </div>
    </div>
  );
}
