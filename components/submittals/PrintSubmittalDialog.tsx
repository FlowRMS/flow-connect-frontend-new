'use client';

import React, { useState, useMemo } from 'react';
import type {
  Submittal,
  SubmittalStakeholder,
  TransmittalPurpose,
  TransmittalAttachment,
  SubmittalOutputOptions,
} from '../../lib/types/submittals';

// Export the PrintSettings type for use in parent components
export interface PrintSettings {
  outputType: 'pdf' | 'email' | 'email_link';
  outputOptions: SubmittalOutputOptions;
  transmittal: {
    attached: TransmittalAttachment[];
    attachedOther: string;
    transmittedFor: TransmittalPurpose[];
    transmittedForOther: string;
    copies: number;
  };
  selectedItemIds: string[];
  capFileSize: string;
}

interface PrintSubmittalDialogProps {
  submittal: Submittal;
  onClose: () => void;
  onPrint: (settings: PrintSettings) => void;
  // Resubmit mode - pre-selects items that need resubmission
  resubmitMode?: boolean;
  resubmitItemIds?: string[];
}

type TabId = 'general' | 'transmittal' | 'selected-pages' | 'addressed-to';

// Transmittal Attached options - matching legacy system
const TRANSMITTAL_ATTACHED: { value: TransmittalAttachment | 'plans' | 'submittals'; label: string }[] = [
  { value: 'drawings', label: 'Drawings' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'prints', label: 'Prints' },
  { value: 'information', label: 'Information' },
  { value: 'plans', label: 'Plans' },
  { value: 'submittals', label: 'Submittals' },
];

// Transmittal For options - matching legacy system exactly
const TRANSMITTAL_FOR: { value: TransmittalPurpose; label: string }[] = [
  { value: 'prior_approval', label: 'Prior Approval' },
  { value: 'resubmit_for_approval', label: 'Resubmittal for Approval' },
  { value: 'record', label: 'Record' },
  { value: 'approval', label: 'Approval' },
  { value: 'corrections', label: 'Corrections' },
  { value: 'bids_due_on', label: 'Bids Due On' },
  { value: 'approval_as_submitted', label: 'Approval as Submitted' },
  { value: 'for_your_use', label: 'Your Use' },
  { value: 'approval_as_noted', label: 'Approval as Noted' },
  { value: 'review_and_comment', label: 'Review and Comment' },
];

const ROLE_LABELS: Record<SubmittalStakeholder['role'], string> = {
  customer: 'Customer',
  architect: 'Architect',
  engineer: 'Engineer',
  gc: 'General Contractor',
  ec: 'Electrical Contractor',
  other: 'Other',
};

export default function PrintSubmittalDialog({
  submittal,
  onClose,
  onPrint,
  resubmitMode = false,
  resubmitItemIds = [],
}: PrintSubmittalDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // Output Type
  const [outputType, setOutputType] = useState<'pdf' | 'email' | 'email_link'>('pdf');

  // General Tab - Include Options (matching legacy: Cover letter, Transmittal, Submittal Letter, Pages, Type Cover Page)
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [includeTransmittal, setIncludeTransmittal] = useState(true);
  const [includeSubmittalLetter, setIncludeSubmittalLetter] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [includeTypeCoverPage, setIncludeTypeCoverPage] = useState(false);

  // General Tab - Options (matching legacy layout)
  const [showQuantities, setShowQuantities] = useState(false);
  const [hideDescriptions, setHideDescriptions] = useState(false);
  const [hideNotes, setHideNotes] = useState(false);
  const [saveAsAttachment, setSaveAsAttachment] = useState(false);
  const [showLeadTimes, setShowLeadTimes] = useState(false);
  const [useCustomerLogo, setUseCustomerLogo] = useState(true);

  // General Tab - Finishing
  const [printDuplex, setPrintDuplex] = useState(false);
  const [capFileSize, setCapFileSize] = useState('none');

  // Transmittal Tab
  const [attachedItems, setAttachedItems] = useState<Set<string>>(new Set());
  const [attachedOther, setAttachedOther] = useState('');
  // In resubmit mode, auto-select "Resubmittal for Approval"
  const [transmittedFor, setTransmittedFor] = useState<Set<TransmittalPurpose>>(
    resubmitMode ? new Set(['resubmit_for_approval']) : new Set()
  );
  const [transmittedForOther, setTransmittedForOther] = useState('');
  const [copies, setCopies] = useState(1);

  // Selected Pages Tab - in resubmit mode, pre-select only items that need resubmission
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    resubmitMode && resubmitItemIds.length > 0
      ? new Set(resubmitItemIds)
      : new Set(submittal.items.map(item => item.id))
  );

  // Addressed To Tab
  const allContacts = useMemo(() => {
    const contacts: SubmittalStakeholder[] = [
      ...submittal.customers,
      ...submittal.engineers,
      ...submittal.architects,
    ];
    return contacts;
  }, [submittal]);

  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Toggle functions
  const toggleAttached = (value: string) => {
    setAttachedItems(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleTransmittedFor = (value: TransmittalPurpose) => {
    setTransmittedFor(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  const selectAllItems = () => {
    setSelectedItemIds(new Set(submittal.items.map(item => item.id)));
  };

  const selectNoneItems = () => {
    setSelectedItemIds(new Set());
  };

  const selectAllContacts = () => {
    setSelectedContactIds(new Set(allContacts.map(c => c.contactId)));
  };

  const selectNoneContacts = () => {
    setSelectedContactIds(new Set());
  };

  const handlePrint = () => {
    const settings: PrintSettings = {
      outputType,
      outputOptions: {
        includeCoverPage: includeCoverLetter,
        includeTransmittalPage: includeTransmittal,
        includeFixtureSummary: includeSubmittalLetter,
        showQuantities,
        showDescriptions: !hideDescriptions,
        showLeadTimes,
        useCustomerLogo,
        attachments: Array.from(attachedItems) as TransmittalAttachment[],
        transmittedFor: Array.from(transmittedFor),
        addressedTo: allContacts.filter(c => selectedContactIds.has(c.contactId)),
        selectedItemIds: Array.from(selectedItemIds),
      },
      transmittal: {
        attached: Array.from(attachedItems) as TransmittalAttachment[],
        attachedOther,
        transmittedFor: Array.from(transmittedFor),
        transmittedForOther,
        copies,
      },
      selectedItemIds: Array.from(selectedItemIds),
      capFileSize,
    };
    onPrint(settings);
    onClose();
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'transmittal', label: 'Transmittal' },
    { id: 'selected-pages', label: 'Selected Pages' },
    { id: 'addressed-to', label: 'Addressed To' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {resubmitMode ? 'Resubmit' : 'Print'} Submittal
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {submittal.jobName}{submittal.jobLocation ? ` - ${submittal.jobLocation}` : ''}
              {resubmitMode && (
                <span className="ml-2 text-amber-600">
                  (Rev {submittal.currentRevision + 1})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--muted)]/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'bg-[var(--card)] text-[var(--foreground)] border-t-2 border-l border-r border-[var(--border)] border-t-[var(--primary)] -mb-px rounded-t-lg'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Output To */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-[var(--foreground)]">Output to:</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="outputType"
                        checked={outputType === 'pdf'}
                        onChange={() => setOutputType('pdf')}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">PDF</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="outputType"
                        checked={outputType === 'email'}
                        onChange={() => setOutputType('email')}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Send Message (email)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="outputType"
                        checked={outputType === 'email_link'}
                        onChange={() => setOutputType('email_link')}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Send Message (email as link)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Include */}
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Include</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCoverLetter}
                        onChange={(e) => setIncludeCoverLetter(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Cover letter (title page)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTransmittal}
                        onChange={(e) => setIncludeTransmittal(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Transmittal</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSubmittalLetter}
                        onChange={(e) => setIncludeSubmittalLetter(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Submittal Letter</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePages}
                        onChange={(e) => setIncludePages(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Pages</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer pl-5">
                      <input
                        type="checkbox"
                        checked={includeTypeCoverPage}
                        onChange={(e) => setIncludeTypeCoverPage(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Type Cover Page</span>
                    </label>
                  </div>
                </div>

                {/* Right Column - Options */}
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showQuantities}
                        onChange={(e) => setShowQuantities(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Show Quantities</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideDescriptions}
                          onChange={(e) => setHideDescriptions(e.target.checked)}
                          className="w-4 h-4 accent-[var(--primary)] rounded"
                        />
                        <span className="text-sm text-[var(--foreground)]">Hide Descriptions</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideNotes}
                          onChange={(e) => setHideNotes(e.target.checked)}
                          className="w-4 h-4 accent-[var(--primary)] rounded"
                        />
                        <span className="text-sm text-[var(--foreground)]">Hide Notes</span>
                      </label>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAsAttachment}
                        onChange={(e) => setSaveAsAttachment(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Save as attachment</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLeadTimes}
                        onChange={(e) => setShowLeadTimes(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Show Lead Times (shipping estimates)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomerLogo}
                        onChange={(e) => setUseCustomerLogo(e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Use Customer Logo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Finishing */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Finishing</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printDuplex}
                      onChange={(e) => setPrintDuplex(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)] rounded"
                    />
                    <span className="text-sm text-[var(--foreground)]">Print front and back (duplex on)</span>
                  </label>
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
          )}

          {/* Transmittal Tab */}
          {activeTab === 'transmittal' && (
            <div className="space-y-6">
              {/* Attached */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Attached</h4>
                <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                  {TRANSMITTAL_ATTACHED.map(item => (
                    <label key={item.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachedItems.has(item.value)}
                        onChange={() => toggleAttached(item.value)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm text-[var(--foreground)]">Other:</span>
                  <input
                    type="text"
                    value={attachedOther}
                    onChange={(e) => setAttachedOther(e.target.value)}
                    className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              {/* For */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">For</h4>
                <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                  {TRANSMITTAL_FOR.map(item => (
                    <label key={item.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transmittedFor.has(item.value)}
                        onChange={() => toggleTransmittedFor(item.value)}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm text-[var(--foreground)]">Other:</span>
                  <input
                    type="text"
                    value={transmittedForOther}
                    onChange={(e) => setTransmittedForOther(e.target.value)}
                    className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              {/* Copies */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Copies</h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--foreground)]">Copies:</span>
                  <input
                    type="number"
                    min="1"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">(prints on the transmittal only - does not affect printing)</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Pages Tab */}
          {activeTab === 'selected-pages' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--foreground)]">Only print these pages</p>

              {/* Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                        <th className="w-10 px-3 py-2 text-left font-medium text-[var(--foreground)]">Sel</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Manufacturer</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Part</th>
                        <th className="px-3 py-2 text-center font-medium text-[var(--foreground)]">Page</th>
                        <th className="px-3 py-2 text-center font-medium text-[var(--foreground)]">Page</th>
                        <th className="px-3 py-2 text-center font-medium text-[var(--foreground)]">Page</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {submittal.items.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-[var(--muted)]/30 transition-colors cursor-pointer ${
                            selectedItemIds.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                          }`}
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedItemIds.has(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 accent-[var(--primary)] rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-[var(--foreground)] font-medium italic">{item.fixtureType}</td>
                          <td className="px-3 py-2 text-[var(--foreground)] italic">{item.manufacturer}</td>
                          <td className="px-3 py-2 text-[var(--foreground)] italic">{item.catalogNumber}</td>
                          <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">-</td>
                          <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">-</td>
                          <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-[var(--foreground)]">
                  Types {selectedItemIds.size} of {submittal.items.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllItems}
                    className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectNoneItems}
                    className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    Select None
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Addressed To Tab */}
          {activeTab === 'addressed-to' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--foreground)]">Address a copy to ...</p>

              {/* Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                        <th className="w-10 px-3 py-2 text-left font-medium text-[var(--foreground)]">Sel</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Company</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Role</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">EMail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {allContacts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-12 text-center text-[var(--muted-foreground)]">
                            {/* Empty state - just like the legacy system shows empty table */}
                          </td>
                        </tr>
                      ) : (
                        allContacts.map((contact) => (
                          <tr
                            key={contact.contactId}
                            className={`hover:bg-[var(--muted)]/30 transition-colors cursor-pointer ${
                              selectedContactIds.has(contact.contactId) ? 'bg-[var(--primary)]/5' : ''
                            }`}
                            onClick={() => toggleContactSelection(contact.contactId)}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedContactIds.has(contact.contactId)}
                                onChange={() => toggleContactSelection(contact.contactId)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 accent-[var(--primary)] rounded"
                              />
                            </td>
                            <td className="px-3 py-2 text-[var(--foreground)]">{contact.contactName}</td>
                            <td className="px-3 py-2 text-[var(--foreground)]">{contact.companyName || ''}</td>
                            <td className="px-3 py-2 text-[var(--foreground)]">{ROLE_LABELS[contact.role]}</td>
                            <td className="px-3 py-2 text-[var(--foreground)]">{contact.email || ''}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                >
                  Add Contact
                </button>
                <button
                  onClick={selectNoneContacts}
                  className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                >
                  Select None
                </button>
                <button
                  onClick={selectAllContacts}
                  className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                >
                  Select All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Print and Cancel buttons on left like legacy */}
        <div className="flex items-center justify-start gap-2 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={handlePrint}
            className={`px-5 py-2 text-sm font-medium text-white rounded transition-colors ${
              resubmitMode
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
            }`}
          >
            {resubmitMode ? 'Generate Resubmittal' : 'Print'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
