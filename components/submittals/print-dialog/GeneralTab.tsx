'use client';

import React from 'react';

interface GeneralTabProps {
  outputType: 'pdf' | 'email' | 'email_link';
  setOutputType: (type: 'pdf' | 'email' | 'email_link') => void;
  includeCoverLetter: boolean;
  setIncludeCoverLetter: (v: boolean) => void;
  includeTransmittal: boolean;
  setIncludeTransmittal: (v: boolean) => void;
  includeSubmittalLetter: boolean;
  setIncludeSubmittalLetter: (v: boolean) => void;
  includePages: boolean;
  setIncludePages: (v: boolean) => void;
  includeTypeCoverPage: boolean;
  setIncludeTypeCoverPage: (v: boolean) => void;
  showQuantities: boolean;
  setShowQuantities: (v: boolean) => void;
  hideDescriptions: boolean;
  setHideDescriptions: (v: boolean) => void;
  hideNotes: boolean;
  setHideNotes: (v: boolean) => void;
  saveAsAttachment: boolean;
  setSaveAsAttachment: (v: boolean) => void;
  showLeadTimes: boolean;
  setShowLeadTimes: (v: boolean) => void;
  useCustomerLogo: boolean;
  setUseCustomerLogo: (v: boolean) => void;
  printDuplex: boolean;
  setPrintDuplex: (v: boolean) => void;
  capFileSize: string;
  setCapFileSize: (v: string) => void;
}

export function GeneralTab({
  outputType, setOutputType,
  includeCoverLetter, setIncludeCoverLetter,
  includeTransmittal, setIncludeTransmittal,
  includeSubmittalLetter, setIncludeSubmittalLetter,
  includePages, setIncludePages,
  includeTypeCoverPage, setIncludeTypeCoverPage,
  showQuantities, setShowQuantities,
  hideDescriptions, setHideDescriptions,
  hideNotes, setHideNotes,
  saveAsAttachment, setSaveAsAttachment,
  showLeadTimes, setShowLeadTimes,
  useCustomerLogo, setUseCustomerLogo,
  printDuplex, setPrintDuplex,
  capFileSize, setCapFileSize,
}: GeneralTabProps) {
  return (
    <div className="space-y-6">
      {/* Output To */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-[var(--foreground)]">Output to:</span>
          <div className="flex items-center gap-4">
            <RadioOption label="PDF" checked={outputType === 'pdf'} onChange={() => setOutputType('pdf')} />
            <RadioOption label="Send Message (email)" checked={outputType === 'email'} onChange={() => setOutputType('email')} />
            <RadioOption label="Send Message (email as link)" checked={outputType === 'email_link'} onChange={() => setOutputType('email_link')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Include */}
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Include</h4>
          <div className="space-y-2">
            <Checkbox label="Cover letter (title page)" checked={includeCoverLetter} onChange={setIncludeCoverLetter} />
            <Checkbox label="Transmittal" checked={includeTransmittal} onChange={setIncludeTransmittal} />
            <Checkbox label="Submittal Letter" checked={includeSubmittalLetter} onChange={setIncludeSubmittalLetter} />
            <Checkbox label="Pages" checked={includePages} onChange={setIncludePages} />
            <Checkbox label="Type Cover Page" checked={includeTypeCoverPage} onChange={setIncludeTypeCoverPage} className="pl-5" />
          </div>
        </div>

        {/* Right Column - Options */}
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Options</h4>
          <div className="space-y-2">
            <Checkbox label="Show Quantities" checked={showQuantities} onChange={setShowQuantities} />
            <div className="flex items-center gap-4">
              <Checkbox label="Hide Descriptions" checked={hideDescriptions} onChange={setHideDescriptions} />
              <Checkbox label="Hide Notes" checked={hideNotes} onChange={setHideNotes} />
            </div>
            <Checkbox label="Save as attachment" checked={saveAsAttachment} onChange={setSaveAsAttachment} />
            <Checkbox label="Show Lead Times (shipping estimates)" checked={showLeadTimes} onChange={setShowLeadTimes} />
            <Checkbox label="Use Customer Logo" checked={useCustomerLogo} onChange={setUseCustomerLogo} />
          </div>
        </div>
      </div>

      {/* Finishing */}
      <div>
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Finishing</h4>
        <div className="space-y-3">
          <Checkbox label="Print front and back (duplex on)" checked={printDuplex} onChange={setPrintDuplex} />
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--foreground)]">Cap file size to</span>
            <input
              type="text"
              value={capFileSize}
              onChange={(e) => setCapFileSize(e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            <span className="text-sm text-[var(--foreground)]">MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RadioOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="accent-[var(--primary)]" />
      <span className="text-sm text-[var(--foreground)]">{label}</span>
    </label>
  );
}

function Checkbox({ label, checked, onChange, className = '' }: { label: string; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer ${className}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[var(--primary)] rounded" />
      <span className="text-sm text-[var(--foreground)]">{label}</span>
    </label>
  );
}
