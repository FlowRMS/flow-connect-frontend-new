import { useState } from 'react';
import type { DetailTabType, DistributorQuote, QuoteFile, Recipient, LineItem } from '../types';
import type { Submittal } from '../../../lib/types/submittals';
import { mockQuoteFiles } from '../data';
import { mockSubmittals } from '../../../lib/data/submittals-mock';

// ============================================
// PDF Template Type
// ============================================

export interface PdfTemplate {
  companyLogo: boolean;
  companyName: string;
  companyAddress: string;
  includeProjectDetails: boolean;
  includeProductList: boolean;
  includeSpecSheets: boolean;
  includeJustification: boolean;
  headerText: string;
  footerText: string;
  customMessage: string;
}

// ============================================
// Generated PDF Data Type
// ============================================

export interface GeneratedPdfData {
  manufacturer: string;
  builder: string;
  project: string;
  products: { sku: string; description: string; qty: number; value: number }[];
  justification: string;
  totalValue: number;
}

// ============================================
// Rep Types
// ============================================

export interface AvailableRep {
  id: string;
  name: string;
}

export interface AvailableManufacturer {
  id: string;
  name: string;
}

// ============================================
// Price Level Type
// ============================================

export interface PriceLevel {
  id: number;
  percent: number;
  description: string;
}

// ============================================
// Rep Commission Split Type
// ============================================

export interface RepCommissionSplit {
  repId: string;
  repName: string;
  percentage: number;
}

// ============================================
// Available Data (would come from API in real app)
// ============================================

export const availableEndUsers = [
  'Turner Construction',
  'Hensel Phelps',
  'McCarthy Building',
  'Skanska USA',
  'Clark Construction',
  'Webcor Builders',
  'DPR Construction',
  'Swinerton',
  'Holder Construction',
  'Brasfield & Gorrie',
];

export const availableOutsideReps: AvailableRep[] = [
  { id: 'or-1', name: 'Richard Utley' },
  { id: 'or-2', name: 'Mike Thompson' },
  { id: 'or-3', name: 'Sarah Williams' },
  { id: 'or-4', name: 'Tom Davis' },
  { id: 'or-5', name: 'Chris Martin' },
  { id: 'or-6', name: 'Lisa Brown' },
  { id: 'or-7', name: 'Brian Clark' },
  { id: 'or-8', name: 'Amy Johnson' },
  { id: 'or-9', name: 'Michelle Lee' },
  { id: 'or-10', name: 'Kevin White' },
];

export const availableInsideReps: AvailableRep[] = [
  { id: 'ir-1', name: 'Jennifer Adams' },
  { id: 'ir-2', name: 'Mark Stevens' },
  { id: 'ir-3', name: 'Rachel Green' },
  { id: 'ir-4', name: 'David Miller' },
  { id: 'ir-5', name: 'Emily Chen' },
  { id: 'ir-6', name: 'Jason Park' },
  { id: 'ir-7', name: 'Nicole Turner' },
  { id: 'ir-8', name: 'Andrew Scott' },
];

export const availableManufacturers: AvailableManufacturer[] = [
  { id: 'mfr-1', name: 'Acuity Brands' },
  { id: 'mfr-2', name: 'Cree Lighting' },
  { id: 'mfr-3', name: 'RAB Lighting' },
  { id: 'mfr-4', name: 'Lithonia' },
  { id: 'mfr-5', name: 'Lutron' },
  { id: 'mfr-6', name: 'Cooper Lighting' },
  { id: 'mfr-7', name: 'Signify' },
  { id: 'mfr-8', name: 'Eaton' },
  { id: 'mfr-9', name: 'Schneider Electric' },
  { id: 'mfr-10', name: 'ABB' },
  { id: 'mfr-11', name: 'Kenall' },
  { id: 'mfr-12', name: 'Waldmann' },
  { id: 'mfr-13', name: 'Kichler' },
  { id: 'mfr-14', name: 'WAC Lighting' },
  { id: 'mfr-15', name: 'Hubbell' },
];

// ============================================
// Hook Return Type
// ============================================

export interface UseQuoteDetailStateReturn {
  // Detail tab state
  detailTab: DetailTabType;
  setDetailTab: React.Dispatch<React.SetStateAction<DetailTabType>>;

  // Submittal state
  submittals: Submittal[];
  setSubmittals: React.Dispatch<React.SetStateAction<Submittal[]>>;
  editingSubmittalId: string | null;
  setEditingSubmittalId: React.Dispatch<React.SetStateAction<string | null>>;
  showSubmittalConfigModal: boolean;
  setShowSubmittalConfigModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSubmittalForDetail: Submittal | null;
  setSelectedSubmittalForDetail: React.Dispatch<React.SetStateAction<Submittal | null>>;
  showCreateSubmittalModal: boolean;
  setShowCreateSubmittalModal: React.Dispatch<React.SetStateAction<boolean>>;
  printSubmittal: Submittal | null;
  setPrintSubmittal: React.Dispatch<React.SetStateAction<Submittal | null>>;
  showCreatePdfModal: boolean;
  setShowCreatePdfModal: React.Dispatch<React.SetStateAction<boolean>>;

  // Approval request state
  showApprovalRequestModal: boolean;
  setShowApprovalRequestModal: React.Dispatch<React.SetStateAction<boolean>>;
  showMarkApprovalModal: boolean;
  setShowMarkApprovalModal: React.Dispatch<React.SetStateAction<boolean>>;

  // PDF and email state
  showPdfPreviewModal: boolean;
  setShowPdfPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
  showEditTemplateModal: boolean;
  setShowEditTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSendEmailModal: boolean;
  setShowSendEmailModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedManufacturerForApproval: string | null;
  setSelectedManufacturerForApproval: React.Dispatch<React.SetStateAction<string | null>>;
  pdfTemplate: PdfTemplate;
  setPdfTemplate: React.Dispatch<React.SetStateAction<PdfTemplate>>;
  generatedPdfData: GeneratedPdfData | null;
  setGeneratedPdfData: React.Dispatch<React.SetStateAction<GeneratedPdfData | null>>;

  // Quote files state
  quoteFiles: QuoteFile[];
  setQuoteFiles: React.Dispatch<React.SetStateAction<QuoteFile[]>>;

  // Spec sheet selections
  specSheetSelections: Set<string>;
  setSpecSheetSelections: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Distributor state
  showDistributorModal: boolean;
  setShowDistributorModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDistributorQuote: DistributorQuote | null;
  setSelectedDistributorQuote: React.Dispatch<React.SetStateAction<DistributorQuote | null>>;

  // Collapsed sections
  collapsedSections: Set<string>;
  setCollapsedSections: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Quote settings state
  quotePriceLevels: PriceLevel[];
  setQuotePriceLevels: React.Dispatch<React.SetStateAction<PriceLevel[]>>;
  priceLevelColors: string[];
  showEndUserPerLine: boolean;
  setShowEndUserPerLine: React.Dispatch<React.SetStateAction<boolean>>;
  showSetEndUserModal: boolean;
  setShowSetEndUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedEndUser: string;
  setSelectedEndUser: React.Dispatch<React.SetStateAction<string>>;
  headerEndUser: string;
  setHeaderEndUser: React.Dispatch<React.SetStateAction<string>>;
  endUserSameAsCustomer: boolean;
  setEndUserSameAsCustomer: React.Dispatch<React.SetStateAction<boolean>>;
  customerPartNumberSource: 'soldTo' | 'endUser';
  setCustomerPartNumberSource: React.Dispatch<React.SetStateAction<'soldTo' | 'endUser'>>;

  // Sections state
  showSections: boolean;
  setShowSections: React.Dispatch<React.SetStateAction<boolean>>;
  showSectionsModal: boolean;
  setShowSectionsModal: React.Dispatch<React.SetStateAction<boolean>>;
  sectionDisplayMode: 'column' | 'lineShelf';
  setSectionDisplayMode: React.Dispatch<React.SetStateAction<'column' | 'lineShelf'>>;

  // Commission splits state
  showCommissionSplits: boolean;
  setShowCommissionSplits: React.Dispatch<React.SetStateAction<boolean>>;
  showCommissionSplitsModal: boolean;
  setShowCommissionSplitsModal: React.Dispatch<React.SetStateAction<boolean>>;
  commissionSplitsModalItem: LineItem | null;
  setCommissionSplitsModalItem: React.Dispatch<React.SetStateAction<LineItem | null>>;
  applyToAllLines: boolean;
  setApplyToAllLines: React.Dispatch<React.SetStateAction<boolean>>;
  quoteOutsideRep: string;
  setQuoteOutsideRep: React.Dispatch<React.SetStateAction<string>>;
  splitCommission: boolean;
  setSplitCommission: React.Dispatch<React.SetStateAction<boolean>>;
  showRepSplitsModal: boolean;
  setShowRepSplitsModal: React.Dispatch<React.SetStateAction<boolean>>;
  repCommissionSplits: RepCommissionSplit[];
  setRepCommissionSplits: React.Dispatch<React.SetStateAction<RepCommissionSplit[]>>;
  quoteInsideRep: string;
  setQuoteInsideRep: React.Dispatch<React.SetStateAction<string>>;
  splitInsideCommission: boolean;
  setSplitInsideCommission: React.Dispatch<React.SetStateAction<boolean>>;
  showInsideRepSplitsModal: boolean;
  setShowInsideRepSplitsModal: React.Dispatch<React.SetStateAction<boolean>>;
  insideRepCommissionSplits: RepCommissionSplit[];
  setInsideRepCommissionSplits: React.Dispatch<React.SetStateAction<RepCommissionSplit[]>>;
  lineItemRepDropdown: string | null;
  setLineItemRepDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  lineItemRepSearch: string;
  setLineItemRepSearch: React.Dispatch<React.SetStateAction<string>>;
  showLineItemRepSplitsModal: boolean;
  setShowLineItemRepSplitsModal: React.Dispatch<React.SetStateAction<boolean>>;
  lineItemRepSplitsTarget: string | null;
  setLineItemRepSplitsTarget: React.Dispatch<React.SetStateAction<string | null>>;
  lineItemRepSplits: RepCommissionSplit[];
  setLineItemRepSplits: React.Dispatch<React.SetStateAction<RepCommissionSplit[]>>;
  showInsideRepSplits: boolean;
  setShowInsideRepSplits: React.Dispatch<React.SetStateAction<boolean>>;
  lineItemInsideRepDropdown: string | null;
  setLineItemInsideRepDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  lineItemInsideRepSearch: string;
  setLineItemInsideRepSearch: React.Dispatch<React.SetStateAction<string>>;
  showLineItemInsideRepSplitsModal: boolean;
  setShowLineItemInsideRepSplitsModal: React.Dispatch<React.SetStateAction<boolean>>;
  lineItemInsideRepSplitsTarget: string | null;
  setLineItemInsideRepSplitsTarget: React.Dispatch<React.SetStateAction<string | null>>;
  lineItemInsideRepSplits: RepCommissionSplit[];
  setLineItemInsideRepSplits: React.Dispatch<React.SetStateAction<RepCommissionSplit[]>>;

  // Dropdown states
  showStageDropdown: boolean;
  setShowStageDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showTypeDropdown: boolean;
  setShowTypeDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showVersionDropdown: boolean;
  setShowVersionDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showActionsDropdown: boolean;
  setShowActionsDropdown: React.Dispatch<React.SetStateAction<boolean>>;

  // Duplicate quote modal state
  showDuplicateQuoteModal: boolean;
  setShowDuplicateQuoteModal: React.Dispatch<React.SetStateAction<boolean>>;
  duplicateQuoteNumber: string;
  setDuplicateQuoteNumber: React.Dispatch<React.SetStateAction<string>>;
  duplicateCustomer: string;
  setDuplicateCustomer: React.Dispatch<React.SetStateAction<string>>;
  duplicatePercentIncrease: number;
  setDuplicatePercentIncrease: React.Dispatch<React.SetStateAction<number>>;
  duplicateCopyNotes: boolean;
  setDuplicateCopyNotes: React.Dispatch<React.SetStateAction<boolean>>;

  // Create order from quote modal state
  showCreateOrderFromQuoteModal: boolean;
  setShowCreateOrderFromQuoteModal: React.Dispatch<React.SetStateAction<boolean>>;
  createOrderSelectAll: boolean;
  setCreateOrderSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
  createOrderSelectedItems: { id: string; selected: boolean; quantity: number }[];
  setCreateOrderSelectedItems: React.Dispatch<React.SetStateAction<{ id: string; selected: boolean; quantity: number }[]>>;

  // Overage and price modals
  showSetOverageModal: boolean;
  setShowSetOverageModal: React.Dispatch<React.SetStateAction<boolean>>;
  overageModalTab: 'percentage' | 'targetPrice' | 'targetMargin';
  setOverageModalTab: React.Dispatch<React.SetStateAction<'percentage' | 'targetPrice' | 'targetMargin'>>;
  overageInputPercent: string;
  setOverageInputPercent: React.Dispatch<React.SetStateAction<string>>;
  overageInputTargetPrice: string;
  setOverageInputTargetPrice: React.Dispatch<React.SetStateAction<string>>;
  overageInputTargetMargin: string;
  setOverageInputTargetMargin: React.Dispatch<React.SetStateAction<string>>;
  showCopyPriceModal: 'l1' | 'l2' | 'l3' | null;
  setShowCopyPriceModal: React.Dispatch<React.SetStateAction<'l1' | 'l2' | 'l3' | null>>;
  showPriceLookupModal: string | null;
  setShowPriceLookupModal: React.Dispatch<React.SetStateAction<string | null>>;
  priceLookupTargetPrice: string;
  setPriceLookupTargetPrice: React.Dispatch<React.SetStateAction<string>>;
  expandedLineItems: Set<string>;
  setExpandedLineItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  showOverageCalculator: boolean;
  setShowOverageCalculator: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarTargetSell: string;
  setSidebarTargetSell: React.Dispatch<React.SetStateAction<string>>;
  sidebarTargetOveragePercent: string;
  setSidebarTargetOveragePercent: React.Dispatch<React.SetStateAction<string>>;
  sidebarTargetOverageAmount: string;
  setSidebarTargetOverageAmount: React.Dispatch<React.SetStateAction<string>>;
  showMinOverageModal: boolean;
  setShowMinOverageModal: React.Dispatch<React.SetStateAction<boolean>>;
  minOverageInput: string;
  setMinOverageInput: React.Dispatch<React.SetStateAction<string>>;
  showAutoCalcModal: boolean;
  setShowAutoCalcModal: React.Dispatch<React.SetStateAction<boolean>>;
  autoCalcMode: 'overage' | 'commission';
  setAutoCalcMode: React.Dispatch<React.SetStateAction<'overage' | 'commission'>>;
  autoCalcTargetOverage: string;
  setAutoCalcTargetOverage: React.Dispatch<React.SetStateAction<string>>;
  autoCalcTargetCommission: string;
  setAutoCalcTargetCommission: React.Dispatch<React.SetStateAction<string>>;

  // Save and revert state
  showSaveDropdown: boolean;
  setShowSaveDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showRevertModal: boolean;
  setShowRevertModal: React.Dispatch<React.SetStateAction<boolean>>;

  // Credit and convert modals
  showCreditModal: boolean;
  setShowCreditModal: React.Dispatch<React.SetStateAction<boolean>>;
  showConvertToOrderModal: boolean;
  setShowConvertToOrderModal: React.Dispatch<React.SetStateAction<boolean>>;
  showQuotePdfPreview: boolean;
  setShowQuotePdfPreview: React.Dispatch<React.SetStateAction<boolean>>;

  // Field editing state
  editingField: 'billTo' | 'soldTo' | 'job' | null;
  setEditingField: React.Dispatch<React.SetStateAction<'billTo' | 'soldTo' | 'job' | null>>;
  fieldSearchQuery: string;
  setFieldSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  // Recipient state
  selectedRecipient: Recipient | null;
  setSelectedRecipient: React.Dispatch<React.SetStateAction<Recipient | null>>;
  recipientQuoteVersion: number;
  setRecipientQuoteVersion: React.Dispatch<React.SetStateAction<number>>;
  showCompareView: boolean;
  setShowCompareView: React.Dispatch<React.SetStateAction<boolean>>;
  showRecipientDropdown: boolean;
  setShowRecipientDropdown: React.Dispatch<React.SetStateAction<boolean>>;

  // Summary and header visibility
  showSummaryBar: boolean;
  setShowSummaryBar: React.Dispatch<React.SetStateAction<boolean>>;
  showHeaderFields: boolean;
  setShowHeaderFields: React.Dispatch<React.SetStateAction<boolean>>;

  // Line details modal
  showLineDetailsModal: boolean;
  setShowLineDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  lineDetailsModalItem: LineItem | null;
  setLineDetailsModalItem: React.Dispatch<React.SetStateAction<LineItem | null>>;

  // Admin settings
  adminShowSalesCredit: boolean;
  setAdminShowSalesCredit: React.Dispatch<React.SetStateAction<boolean>>;

  // Quote view mode
  quoteViewMode: 'overage' | 'simple';
  setQuoteViewMode: React.Dispatch<React.SetStateAction<'overage' | 'simple'>>;
  showViewModeDropdown: boolean;
  setShowViewModeDropdown: React.Dispatch<React.SetStateAction<boolean>>;

  // Available data lists
  availableEndUsers: string[];
  availableOutsideReps: AvailableRep[];
  availableInsideReps: AvailableRep[];
  availableManufacturers: AvailableManufacturer[];
}

// ============================================
// useQuoteDetailState Hook
// ============================================

export function useQuoteDetailState(): UseQuoteDetailStateReturn {
  // ============================================
  // Detail tab state
  // ============================================
  const [detailTab, setDetailTab] = useState<DetailTabType>('lines');

  // ============================================
  // Submittal state
  // ============================================
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [editingSubmittalId, setEditingSubmittalId] = useState<string | null>(null);
  const [showSubmittalConfigModal, setShowSubmittalConfigModal] = useState(false);
  const [selectedSubmittalForDetail, setSelectedSubmittalForDetail] = useState<Submittal | null>(null);
  const [showCreateSubmittalModal, setShowCreateSubmittalModal] = useState(false);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);
  const [showCreatePdfModal, setShowCreatePdfModal] = useState(false);

  // ============================================
  // Approval request state
  // ============================================
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [showMarkApprovalModal, setShowMarkApprovalModal] = useState(false);

  // ============================================
  // PDF and email state
  // ============================================
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [selectedManufacturerForApproval, setSelectedManufacturerForApproval] = useState<string | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>({
    companyLogo: true,
    companyName: 'FlowConnect Lighting',
    companyAddress: '123 Main Street, Suite 400\nAnytown, ST 12345',
    includeProjectDetails: true,
    includeProductList: true,
    includeSpecSheets: true,
    includeJustification: true,
    headerText: 'Manufacturer Approval Request',
    footerText: 'Thank you for your consideration. Please respond within 5 business days.',
    customMessage: '',
  });
  const [generatedPdfData, setGeneratedPdfData] = useState<GeneratedPdfData | null>(null);

  // ============================================
  // Quote files state
  // ============================================
  const [quoteFiles, setQuoteFiles] = useState<QuoteFile[]>(mockQuoteFiles);

  // ============================================
  // Spec sheet selections
  // ============================================
  const [specSheetSelections, setSpecSheetSelections] = useState<Set<string>>(new Set());

  // ============================================
  // Distributor state
  // ============================================
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [selectedDistributorQuote, setSelectedDistributorQuote] = useState<DistributorQuote | null>(null);

  // ============================================
  // Collapsed sections
  // ============================================
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // ============================================
  // Quote settings state
  // ============================================
  const [quotePriceLevels, setQuotePriceLevels] = useState<PriceLevel[]>([
    { id: 1, percent: 10, description: 'Standard contractor' },
    { id: 2, percent: 15, description: 'Preferred contractor' },
    { id: 3, percent: 20, description: 'List price / MSRP' },
  ]);

  const priceLevelColors = ['text-blue-600', 'text-purple-600', 'text-orange-600', 'text-green-600', 'text-pink-600', 'text-cyan-600', 'text-red-600', 'text-indigo-600'];

  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState('');
  const [headerEndUser, setHeaderEndUser] = useState('');
  const [endUserSameAsCustomer, setEndUserSameAsCustomer] = useState(true);
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<'soldTo' | 'endUser'>('soldTo');

  // ============================================
  // Sections state
  // ============================================
  const [showSections, setShowSections] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<'column' | 'lineShelf'>('column');

  // ============================================
  // Commission splits state
  // ============================================
  const [showCommissionSplits, setShowCommissionSplits] = useState(false);
  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);
  const [applyToAllLines, setApplyToAllLines] = useState(false);

  // Quote-level outside rep commission splits
  const [quoteOutsideRep, setQuoteOutsideRep] = useState<string>('');
  const [splitCommission, setSplitCommission] = useState(false);
  const [showRepSplitsModal, setShowRepSplitsModal] = useState(false);
  const [repCommissionSplits, setRepCommissionSplits] = useState<RepCommissionSplit[]>([]);

  // Quote-level inside rep commission splits
  const [quoteInsideRep, setQuoteInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepCommissionSplits, setInsideRepCommissionSplits] = useState<RepCommissionSplit[]>([]);

  // Line item outside rep splits
  const [lineItemRepDropdown, setLineItemRepDropdown] = useState<string | null>(null);
  const [lineItemRepSearch, setLineItemRepSearch] = useState('');
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<RepCommissionSplit[]>([]);

  // Inside rep commission splits settings
  const [showInsideRepSplits, setShowInsideRepSplits] = useState(false);

  // Line item inside rep splits
  const [lineItemInsideRepDropdown, setLineItemInsideRepDropdown] = useState<string | null>(null);
  const [lineItemInsideRepSearch, setLineItemInsideRepSearch] = useState('');
  const [showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal] = useState(false);
  const [lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget] = useState<string | null>(null);
  const [lineItemInsideRepSplits, setLineItemInsideRepSplits] = useState<RepCommissionSplit[]>([]);

  // ============================================
  // Dropdown states
  // ============================================
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // ============================================
  // Duplicate quote modal state
  // ============================================
  const [showDuplicateQuoteModal, setShowDuplicateQuoteModal] = useState(false);
  const [duplicateQuoteNumber, setDuplicateQuoteNumber] = useState('');
  const [duplicateCustomer, setDuplicateCustomer] = useState('');
  const [duplicatePercentIncrease, setDuplicatePercentIncrease] = useState(0);
  const [duplicateCopyNotes, setDuplicateCopyNotes] = useState(true);

  // ============================================
  // Create order from quote modal state
  // ============================================
  const [showCreateOrderFromQuoteModal, setShowCreateOrderFromQuoteModal] = useState(false);
  const [createOrderSelectAll, setCreateOrderSelectAll] = useState(true);
  const [createOrderSelectedItems, setCreateOrderSelectedItems] = useState<{ id: string; selected: boolean; quantity: number }[]>([]);

  // ============================================
  // Overage and price modals
  // ============================================
  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [overageModalTab, setOverageModalTab] = useState<'percentage' | 'targetPrice' | 'targetMargin'>('percentage');
  const [overageInputPercent, setOverageInputPercent] = useState('10');
  const [overageInputTargetPrice, setOverageInputTargetPrice] = useState('');
  const [overageInputTargetMargin, setOverageInputTargetMargin] = useState('');
  const [showCopyPriceModal, setShowCopyPriceModal] = useState<'l1' | 'l2' | 'l3' | null>(null);
  const [showPriceLookupModal, setShowPriceLookupModal] = useState<string | null>(null);
  const [priceLookupTargetPrice, setPriceLookupTargetPrice] = useState('');
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());
  const [showOverageCalculator, setShowOverageCalculator] = useState(false);
  const [sidebarTargetSell, setSidebarTargetSell] = useState('');
  const [sidebarTargetOveragePercent, setSidebarTargetOveragePercent] = useState('');
  const [sidebarTargetOverageAmount, setSidebarTargetOverageAmount] = useState('');
  const [showMinOverageModal, setShowMinOverageModal] = useState(false);
  const [minOverageInput, setMinOverageInput] = useState('');
  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [autoCalcMode, setAutoCalcMode] = useState<'overage' | 'commission'>('overage');
  const [autoCalcTargetOverage, setAutoCalcTargetOverage] = useState('');
  const [autoCalcTargetCommission, setAutoCalcTargetCommission] = useState('');

  // ============================================
  // Save and revert state
  // ============================================
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);

  // ============================================
  // Credit and convert modals
  // ============================================
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
  const [showQuotePdfPreview, setShowQuotePdfPreview] = useState(false);

  // ============================================
  // Field editing state
  // ============================================
  const [editingField, setEditingField] = useState<'billTo' | 'soldTo' | 'job' | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');

  // ============================================
  // Recipient state
  // ============================================
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipientQuoteVersion, setRecipientQuoteVersion] = useState(1);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // ============================================
  // Summary and header visibility
  // ============================================
  const [showSummaryBar, setShowSummaryBar] = useState(true);
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // ============================================
  // Line details modal
  // ============================================
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  // ============================================
  // Admin settings
  // ============================================
  const [adminShowSalesCredit, setAdminShowSalesCredit] = useState(false);

  // ============================================
  // Quote view mode
  // ============================================
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  return {
    // Detail tab state
    detailTab,
    setDetailTab,

    // Submittal state
    submittals,
    setSubmittals,
    editingSubmittalId,
    setEditingSubmittalId,
    showSubmittalConfigModal,
    setShowSubmittalConfigModal,
    selectedSubmittalForDetail,
    setSelectedSubmittalForDetail,
    showCreateSubmittalModal,
    setShowCreateSubmittalModal,
    printSubmittal,
    setPrintSubmittal,
    showCreatePdfModal,
    setShowCreatePdfModal,

    // Approval request state
    showApprovalRequestModal,
    setShowApprovalRequestModal,
    showMarkApprovalModal,
    setShowMarkApprovalModal,

    // PDF and email state
    showPdfPreviewModal,
    setShowPdfPreviewModal,
    showEditTemplateModal,
    setShowEditTemplateModal,
    showSendEmailModal,
    setShowSendEmailModal,
    selectedManufacturerForApproval,
    setSelectedManufacturerForApproval,
    pdfTemplate,
    setPdfTemplate,
    generatedPdfData,
    setGeneratedPdfData,

    // Quote files state
    quoteFiles,
    setQuoteFiles,

    // Spec sheet selections
    specSheetSelections,
    setSpecSheetSelections,

    // Distributor state
    showDistributorModal,
    setShowDistributorModal,
    selectedDistributorQuote,
    setSelectedDistributorQuote,

    // Collapsed sections
    collapsedSections,
    setCollapsedSections,

    // Quote settings state
    quotePriceLevels,
    setQuotePriceLevels,
    priceLevelColors,
    showEndUserPerLine,
    setShowEndUserPerLine,
    showSetEndUserModal,
    setShowSetEndUserModal,
    selectedEndUser,
    setSelectedEndUser,
    headerEndUser,
    setHeaderEndUser,
    endUserSameAsCustomer,
    setEndUserSameAsCustomer,
    customerPartNumberSource,
    setCustomerPartNumberSource,

    // Sections state
    showSections,
    setShowSections,
    showSectionsModal,
    setShowSectionsModal,
    sectionDisplayMode,
    setSectionDisplayMode,

    // Commission splits state
    showCommissionSplits,
    setShowCommissionSplits,
    showCommissionSplitsModal,
    setShowCommissionSplitsModal,
    commissionSplitsModalItem,
    setCommissionSplitsModalItem,
    applyToAllLines,
    setApplyToAllLines,
    quoteOutsideRep,
    setQuoteOutsideRep,
    splitCommission,
    setSplitCommission,
    showRepSplitsModal,
    setShowRepSplitsModal,
    repCommissionSplits,
    setRepCommissionSplits,
    quoteInsideRep,
    setQuoteInsideRep,
    splitInsideCommission,
    setSplitInsideCommission,
    showInsideRepSplitsModal,
    setShowInsideRepSplitsModal,
    insideRepCommissionSplits,
    setInsideRepCommissionSplits,
    lineItemRepDropdown,
    setLineItemRepDropdown,
    lineItemRepSearch,
    setLineItemRepSearch,
    showLineItemRepSplitsModal,
    setShowLineItemRepSplitsModal,
    lineItemRepSplitsTarget,
    setLineItemRepSplitsTarget,
    lineItemRepSplits,
    setLineItemRepSplits,
    showInsideRepSplits,
    setShowInsideRepSplits,
    lineItemInsideRepDropdown,
    setLineItemInsideRepDropdown,
    lineItemInsideRepSearch,
    setLineItemInsideRepSearch,
    showLineItemInsideRepSplitsModal,
    setShowLineItemInsideRepSplitsModal,
    lineItemInsideRepSplitsTarget,
    setLineItemInsideRepSplitsTarget,
    lineItemInsideRepSplits,
    setLineItemInsideRepSplits,

    // Dropdown states
    showStageDropdown,
    setShowStageDropdown,
    showTypeDropdown,
    setShowTypeDropdown,
    showVersionDropdown,
    setShowVersionDropdown,
    showActionsDropdown,
    setShowActionsDropdown,

    // Duplicate quote modal state
    showDuplicateQuoteModal,
    setShowDuplicateQuoteModal,
    duplicateQuoteNumber,
    setDuplicateQuoteNumber,
    duplicateCustomer,
    setDuplicateCustomer,
    duplicatePercentIncrease,
    setDuplicatePercentIncrease,
    duplicateCopyNotes,
    setDuplicateCopyNotes,

    // Create order from quote modal state
    showCreateOrderFromQuoteModal,
    setShowCreateOrderFromQuoteModal,
    createOrderSelectAll,
    setCreateOrderSelectAll,
    createOrderSelectedItems,
    setCreateOrderSelectedItems,

    // Overage and price modals
    showSetOverageModal,
    setShowSetOverageModal,
    overageModalTab,
    setOverageModalTab,
    overageInputPercent,
    setOverageInputPercent,
    overageInputTargetPrice,
    setOverageInputTargetPrice,
    overageInputTargetMargin,
    setOverageInputTargetMargin,
    showCopyPriceModal,
    setShowCopyPriceModal,
    showPriceLookupModal,
    setShowPriceLookupModal,
    priceLookupTargetPrice,
    setPriceLookupTargetPrice,
    expandedLineItems,
    setExpandedLineItems,
    showOverageCalculator,
    setShowOverageCalculator,
    sidebarTargetSell,
    setSidebarTargetSell,
    sidebarTargetOveragePercent,
    setSidebarTargetOveragePercent,
    sidebarTargetOverageAmount,
    setSidebarTargetOverageAmount,
    showMinOverageModal,
    setShowMinOverageModal,
    minOverageInput,
    setMinOverageInput,
    showAutoCalcModal,
    setShowAutoCalcModal,
    autoCalcMode,
    setAutoCalcMode,
    autoCalcTargetOverage,
    setAutoCalcTargetOverage,
    autoCalcTargetCommission,
    setAutoCalcTargetCommission,

    // Save and revert state
    showSaveDropdown,
    setShowSaveDropdown,
    showRevertModal,
    setShowRevertModal,

    // Credit and convert modals
    showCreditModal,
    setShowCreditModal,
    showConvertToOrderModal,
    setShowConvertToOrderModal,
    showQuotePdfPreview,
    setShowQuotePdfPreview,

    // Field editing state
    editingField,
    setEditingField,
    fieldSearchQuery,
    setFieldSearchQuery,

    // Recipient state
    selectedRecipient,
    setSelectedRecipient,
    recipientQuoteVersion,
    setRecipientQuoteVersion,
    showCompareView,
    setShowCompareView,
    showRecipientDropdown,
    setShowRecipientDropdown,

    // Summary and header visibility
    showSummaryBar,
    setShowSummaryBar,
    showHeaderFields,
    setShowHeaderFields,

    // Line details modal
    showLineDetailsModal,
    setShowLineDetailsModal,
    lineDetailsModalItem,
    setLineDetailsModalItem,

    // Admin settings
    adminShowSalesCredit,
    setAdminShowSalesCredit,

    // Quote view mode
    quoteViewMode,
    setQuoteViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,

    // Available data lists
    availableEndUsers,
    availableOutsideReps,
    availableInsideReps,
    availableManufacturers,
  };
}

export default useQuoteDetailState;
