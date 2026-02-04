import { useState, useMemo } from 'react';
import type {
  Submittal,
  SubmittalStakeholder,
  TransmittalPurpose,
  TransmittalAttachment,
} from '../../../lib/types/submittals';
import type { PrintSettings } from './types';

export type TabId = 'general' | 'transmittal' | 'selected-pages' | 'addressed-to';

interface UsePrintDialogParams {
  submittal: Submittal;
  resubmitMode: boolean;
  resubmitItemIds: string[];
  onPrint: (settings: PrintSettings) => void;
  onClose: () => void;
}

export function usePrintDialog({
  submittal,
  resubmitMode,
  resubmitItemIds,
  onPrint,
  onClose,
}: UsePrintDialogParams) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // Output Type
  const [outputType, setOutputType] = useState<'pdf' | 'email' | 'email_link'>('pdf');

  // General Tab - Include Options
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [includeTransmittal, setIncludeTransmittal] = useState(true);
  const [includeSubmittalLetter, setIncludeSubmittalLetter] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [includeTypeCoverPage, setIncludeTypeCoverPage] = useState(false);

  // General Tab - Options
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
  const [transmittedFor, setTransmittedFor] = useState<Set<TransmittalPurpose>>(
    resubmitMode ? new Set(['resubmit_for_approval']) : new Set()
  );
  const [transmittedForOther, setTransmittedForOther] = useState('');
  const [copies, setCopies] = useState(1);

  // Selected Pages Tab
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
        includePages,
        includeTypeCoverPage,
        showQuantities,
        showDescriptions: !hideDescriptions,
        showLeadTimes,
        hideNotes,
        useCustomerLogo,
        printDuplex,
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
      saveAsAttachment,
    };
    onPrint(settings);
  };

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // General tab state
    outputType,
    setOutputType,
    includeCoverLetter,
    setIncludeCoverLetter,
    includeTransmittal,
    setIncludeTransmittal,
    includeSubmittalLetter,
    setIncludeSubmittalLetter,
    includePages,
    setIncludePages,
    includeTypeCoverPage,
    setIncludeTypeCoverPage,
    showQuantities,
    setShowQuantities,
    hideDescriptions,
    setHideDescriptions,
    hideNotes,
    setHideNotes,
    saveAsAttachment,
    setSaveAsAttachment,
    showLeadTimes,
    setShowLeadTimes,
    useCustomerLogo,
    setUseCustomerLogo,
    printDuplex,
    setPrintDuplex,
    capFileSize,
    setCapFileSize,

    // Transmittal tab state
    attachedItems,
    toggleAttached,
    attachedOther,
    setAttachedOther,
    transmittedFor,
    toggleTransmittedFor,
    transmittedForOther,
    setTransmittedForOther,
    copies,
    setCopies,

    // Selected pages tab state
    selectedItemIds,
    toggleItemSelection,
    selectAllItems,
    selectNoneItems,

    // Addressed to tab state
    allContacts,
    selectedContactIds,
    toggleContactSelection,
    selectAllContacts,
    selectNoneContacts,

    // Actions
    handlePrint,
  };
}
