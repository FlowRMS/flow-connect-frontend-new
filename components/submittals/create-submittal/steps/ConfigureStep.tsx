'use client';

import React from 'react';
import type { TransmittalPurpose, SubmittalConfig } from '../../../../lib/types/submittals';
import { TRANSMITTAL_PURPOSES } from '../constants';

interface ConfigureStepProps {
  submittalName: string;
  setSubmittalName: (name: string) => void;
  transmittalPurpose: TransmittalPurpose;
  setTransmittalPurpose: (purpose: TransmittalPurpose) => void;
  notes: string;
  setNotes: (notes: string) => void;
  config: SubmittalConfig;
  updateConfig: (key: keyof SubmittalConfig, value: boolean) => void;
}

export function ConfigureStep({
  submittalName,
  setSubmittalName,
  transmittalPurpose,
  setTransmittalPurpose,
  notes,
  setNotes,
  config,
  updateConfig,
}: ConfigureStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Submittal Name *
        </label>
        <input
          type="text"
          value={submittalName}
          onChange={(e) => setSubmittalName(e.target.value)}
          placeholder="Enter submittal name..."
          className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Transmittal Purpose
        </label>
        <select
          value={transmittalPurpose}
          onChange={(e) => setTransmittalPurpose(e.target.value as TransmittalPurpose)}
          className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        >
          {TRANSMITTAL_PURPOSES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Submittal Configuration Options */}
      <div className="pt-4 border-t border-[var(--border)]">
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Submittal Configuration</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <ConfigCheckbox label="Lamps" checked={config.includeLamps} onChange={(v) => updateConfig('includeLamps', v)} />
          <ConfigCheckbox label="Accessories" checked={config.includeAccessories} onChange={(v) => updateConfig('includeAccessories', v)} />
          <ConfigCheckbox label="CQ" checked={config.includeCQ} onChange={(v) => updateConfig('includeCQ', v)} />
          <ConfigCheckbox label="From Orders" checked={config.includeFromOrders} onChange={(v) => updateConfig('includeFromOrders', v)} />
          <ConfigCheckbox label="Roll up kits" checked={config.rollUpKits} onChange={(v) => updateConfig('rollUpKits', v)} />
          <ConfigCheckbox label="Roll up Accessories" checked={config.rollUpAccessories} onChange={(v) => updateConfig('rollUpAccessories', v)} />
          <ConfigCheckbox label="Zero Quantity Items" checked={config.includeZeroQuantityItems} onChange={(v) => updateConfig('includeZeroQuantityItems', v)} />
          <ConfigCheckbox label="Drop Descriptions" checked={config.dropDescriptions} onChange={(v) => updateConfig('dropDescriptions', v)} />
          <ConfigCheckbox label="Drop Line Notes" checked={config.dropLineNotes} onChange={(v) => updateConfig('dropLineNotes', v)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes or comments..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
        />
      </div>
    </div>
  );
}

function ConfigCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--primary)] w-4 h-4"
      />
      <span className="text-sm text-[var(--foreground)]">{label}</span>
    </label>
  );
}
