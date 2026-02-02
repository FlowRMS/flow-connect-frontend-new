'use client';

import { PicklistColor, PICKLIST_COLOR_OPTIONS } from '../enums';

interface ColorPickerProps {
  value?: PicklistColor;
  onChange: (color: PicklistColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div 
      className="grid gap-2"
      style={{ 
        gridTemplateColumns: 'repeat(6, 28px)',
        width: 'fit-content'
      }}
    >
      {PICKLIST_COLOR_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0 ${
            value === option.key
              ? 'border-[var(--foreground)] scale-110 ring-2 ring-offset-1 ring-[var(--primary)]'
              : 'border-transparent'
          }`}
          style={{ backgroundColor: option.key }}
          title={option.name}
        />
      ))}
    </div>
  );
}
