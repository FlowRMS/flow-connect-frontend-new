'use client';

import { Plus } from 'lucide-react';

interface AddCustomColumnRowProps {
  onClick: () => void;
  colSpan: number;
}

export function AddCustomColumnRow({ onClick, colSpan }: AddCustomColumnRowProps) {
  return (
    <tr
      className="hover:bg-muted/50 cursor-pointer group"
      onClick={onClick}
    >
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
          <span className="text-sm text-muted-foreground group-hover:text-primary">
            Add custom column...
          </span>
        </div>
      </td>
    </tr>
  );
}
