'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideCategory =
  | 'overview'
  | 'crm'
  | 'flowai'
  | 'email'
  | 'quotes'
  | 'financial'
  | 'analytics'
  | 'foundational'
  | 'tips';

interface GuideSection {
  id: GuideCategory;
  title: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  keywords: string[];
}

interface SearchableContent {
  category: GuideCategory;
  title: string;
  description: string;
  keywords: string[];
  subsection?: string;
}

const sections: GuideSection[] = [
  {
    id: 'overview',
    title: 'Getting Started',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    keywords: ['start', 'begin', 'welcome', 'introduction', 'setup', 'navigation', 'sidebar', 'search'],
  },
  {
    id: 'crm',
    title: 'CRM Hub',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-500',
    keywords: ['activity', 'feed', 'tasks', 'notes', 'jobs', 'pre-opportunities', 'kanban', 'dashboard'],
  },
  {
    id: 'flowai',
    title: 'Flow AI',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    keywords: ['ai', 'upload', 'document', 'processing', 'automation', 'templates', 'chat', 'entity matching', 'extract'],
  },
  {
    id: 'email',
    title: 'Email',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M22 7l-10 7L2 7"/>
      </svg>
    ),
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
    keywords: ['email', 'campaign', 'rules', 'ingestion', 'inbox', 'automation'],
  },
  {
    id: 'quotes',
    title: 'Quotes',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M8 13h8M8 17h8M8 9h2"/>
      </svg>
    ),
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-500',
    keywords: ['quote', 'proposal', 'pipeline', 'pricing', 'line items', 'discovery', 'negotiation'],
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    color: '#22c55e',
    gradient: 'from-green-500 to-emerald-500',
    keywords: ['orders', 'invoices', 'commissions', 'adjustments', 'acknowledgements', 'payments', 'credits'],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18"/>
        <path d="M18 17V9M13 17V5M8 17v-3"/>
      </svg>
    ),
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-500',
    keywords: ['analytics', 'reports', 'dashboard', 'pivot', 'commission', 'gap', 'charts', 'metrics'],
  },
  {
    id: 'foundational',
    title: 'Data & Entities',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-500',
    keywords: ['contacts', 'companies', 'customers', 'products', 'manufacturers', 'entities', 'data'],
  },
  {
    id: 'tips',
    title: 'Pro Tips',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71"/>
        <circle cx="12" cy="12" r="5"/>
      </svg>
    ),
    color: '#f97316',
    gradient: 'from-orange-500 to-red-500',
    keywords: ['tips', 'shortcuts', 'keyboard', 'pdf', 'export', 'views', 'filters', 'advanced'],
  },
];

// Comprehensive searchable content index
const searchableContent: SearchableContent[] = [
  // Overview
  { category: 'overview', title: 'Universal Search', description: 'Search across all entities using Ctrl+K', keywords: ['search', 'find', 'ctrl+k', 'keyboard'] },
  { category: 'overview', title: 'Sidebar Navigation', description: 'Collapsible sidebar for navigating modules', keywords: ['sidebar', 'navigation', 'menu', 'modules'] },
  { category: 'overview', title: 'AI Uploader Button', description: 'Quick access to AI document processing', keywords: ['ai', 'upload', 'button', 'purple'] },

  // CRM
  { category: 'crm', title: 'Activity Feed', description: 'Real-time dashboard of all CRM activities', keywords: ['activity', 'feed', 'dashboard', 'recent'], subsection: 'Activity Feed' },
  { category: 'crm', title: 'Create Job', description: 'Add new jobs from activity feed or jobs page', keywords: ['create', 'job', 'new', 'add'], subsection: 'Jobs' },
  { category: 'crm', title: 'Job Kanban View', description: 'Drag and drop jobs between status columns', keywords: ['kanban', 'drag', 'drop', 'status', 'board'], subsection: 'Jobs' },
  { category: 'crm', title: 'Job Details', description: 'View and edit job information, linked entities', keywords: ['job', 'details', 'edit', 'view'], subsection: 'Jobs' },
  { category: 'crm', title: 'Task Views', description: 'Grid, List, Kanban, Spreadsheet, Calendar views', keywords: ['task', 'view', 'grid', 'list', 'kanban', 'calendar', 'spreadsheet'], subsection: 'Tasks' },
  { category: 'crm', title: 'Task Priority', description: 'Set task priority levels for organization', keywords: ['priority', 'urgent', 'high', 'medium', 'low'], subsection: 'Tasks' },
  { category: 'crm', title: 'Task Reminders', description: 'Set due dates and reminder notifications', keywords: ['reminder', 'due', 'date', 'notification'], subsection: 'Tasks' },
  { category: 'crm', title: 'Notes', description: 'Create notes linked to contacts, jobs, companies', keywords: ['note', 'memo', 'linked', 'text'], subsection: 'Notes' },
  { category: 'crm', title: 'Pre-Opportunities', description: 'Track early-stage leads before formal quotes', keywords: ['pre-opportunity', 'lead', 'prospect', 'early'], subsection: 'Pre-Opportunities' },

  // Flow AI
  { category: 'flowai', title: 'Document Upload', description: 'Upload PDFs, images, spreadsheets for AI processing', keywords: ['upload', 'document', 'pdf', 'image', 'spreadsheet'], subsection: 'AI Upload' },
  { category: 'flowai', title: 'Document Types', description: 'Orders, quotes, invoices, checks, acknowledgements', keywords: ['document', 'type', 'order', 'quote', 'invoice', 'check'], subsection: 'AI Upload' },
  { category: 'flowai', title: 'Field Extraction', description: 'AI automatically extracts data from documents', keywords: ['extract', 'field', 'data', 'automatic', 'ai'], subsection: 'AI Upload' },
  { category: 'flowai', title: 'Processing Queue', description: 'Monitor document processing status', keywords: ['queue', 'processing', 'status', 'monitor'], subsection: 'Queue' },
  { category: 'flowai', title: 'Upload Templates', description: 'Create templates for different manufacturers', keywords: ['template', 'manufacturer', 'preset', 'configuration'], subsection: 'Templates' },
  { category: 'flowai', title: 'Entity Matching', description: 'Match uploaded entities to existing records', keywords: ['entity', 'matching', 'duplicate', 'link', 'match'], subsection: 'Entity Matching' },
  { category: 'flowai', title: 'Flow Chat', description: 'AI assistant for questions and insights', keywords: ['chat', 'assistant', 'ai', 'question', 'help'], subsection: 'Flow Chat' },
  { category: 'flowai', title: 'Voice Input', description: 'Speak to the AI assistant', keywords: ['voice', 'speech', 'microphone', 'talk'], subsection: 'Flow Chat' },

  // Email
  { category: 'email', title: 'Email Campaigns', description: 'Create and send email campaigns', keywords: ['campaign', 'send', 'email', 'marketing'], subsection: 'Campaigns' },
  { category: 'email', title: 'Email Rules', description: 'Automate email handling with rules', keywords: ['rule', 'automation', 'trigger', 'action'], subsection: 'Rules' },
  { category: 'email', title: 'Email Ingestion', description: 'Process incoming emails into CRM records', keywords: ['ingestion', 'incoming', 'process', 'import'], subsection: 'Ingestion' },

  // Quotes
  { category: 'quotes', title: 'Quote Pipeline', description: 'Track quotes through sales stages', keywords: ['pipeline', 'stage', 'discovery', 'proposal', 'negotiation'], subsection: 'Pipeline' },
  { category: 'quotes', title: 'Create Quote', description: 'Create new quotes with line items', keywords: ['create', 'new', 'quote', 'line item'], subsection: 'Creating Quotes' },
  { category: 'quotes', title: 'Quote Kanban', description: 'Drag quotes between pipeline stages', keywords: ['kanban', 'drag', 'drop', 'stage'], subsection: 'Kanban View' },
  { category: 'quotes', title: 'Quote PDF', description: 'Generate professional PDF quotes', keywords: ['pdf', 'generate', 'export', 'document'], subsection: 'PDF Export' },

  // Financial
  { category: 'financial', title: 'Orders List', description: 'View and manage all orders', keywords: ['order', 'list', 'view', 'manage'], subsection: 'Orders' },
  { category: 'financial', title: 'Order Details', description: 'View order line items and information', keywords: ['order', 'detail', 'line item', 'information'], subsection: 'Orders' },
  { category: 'financial', title: 'Create Order', description: 'Create new orders manually', keywords: ['create', 'new', 'order', 'manual'], subsection: 'Orders' },
  { category: 'financial', title: 'Invoices', description: 'Track and manage invoices', keywords: ['invoice', 'billing', 'payment'], subsection: 'Invoices' },
  { category: 'financial', title: 'Commission Checks', description: 'View commission payments', keywords: ['commission', 'check', 'payment', 'earnings'], subsection: 'Commissions' },
  { category: 'financial', title: 'Adjustments', description: 'Manage order adjustments and credits', keywords: ['adjustment', 'credit', 'correction'], subsection: 'Adjustments' },

  // Analytics
  { category: 'analytics', title: 'Order Dashboard', description: 'Overview of all orders with metrics', keywords: ['order', 'dashboard', 'metrics', 'overview'], subsection: 'Dashboards' },
  { category: 'analytics', title: 'Product Dashboard', description: 'Product performance analytics', keywords: ['product', 'performance', 'analytics'], subsection: 'Dashboards' },
  { category: 'analytics', title: 'Commission Gap Reports', description: 'Find missing commissions', keywords: ['commission', 'gap', 'missing', 'report'], subsection: 'Reports' },
  { category: 'analytics', title: 'Pivot Tables', description: 'Multi-dimensional data analysis', keywords: ['pivot', 'table', 'analysis', 'dimension'], subsection: 'Pivot Tables' },
  { category: 'analytics', title: 'Global Filters', description: 'Filter all analytics by date, entity', keywords: ['filter', 'global', 'date', 'entity'], subsection: 'Filters' },

  // Foundational
  { category: 'foundational', title: 'Contacts', description: 'Manage contact information and relationships', keywords: ['contact', 'person', 'relationship'], subsection: 'Contacts' },
  { category: 'foundational', title: 'Contact Types', description: 'Filter contacts by type', keywords: ['type', 'filter', 'category'], subsection: 'Contacts' },
  { category: 'foundational', title: 'Companies', description: 'Store company information', keywords: ['company', 'business', 'organization'], subsection: 'Companies' },
  { category: 'foundational', title: 'Customers', description: 'Manage customer accounts', keywords: ['customer', 'account', 'buyer'], subsection: 'Customers' },
  { category: 'foundational', title: 'Products', description: 'Product catalog management', keywords: ['product', 'catalog', 'item'], subsection: 'Products' },
  { category: 'foundational', title: 'Manufacturers', description: 'Manufacturer relationships', keywords: ['manufacturer', 'vendor', 'supplier'], subsection: 'Manufacturers' },

  // Tips
  { category: 'tips', title: 'Keyboard Shortcuts', description: 'Speed up your workflow with shortcuts', keywords: ['keyboard', 'shortcut', 'ctrl', 'hotkey'], subsection: 'Shortcuts' },
  { category: 'tips', title: 'PDF Builder', description: 'Generate custom PDFs for any entity', keywords: ['pdf', 'builder', 'export', 'print'], subsection: 'PDF Builder' },
  { category: 'tips', title: 'Advanced Filters', description: 'Complex filtering on any list', keywords: ['filter', 'advanced', 'complex', 'query'], subsection: 'Filters' },
  { category: 'tips', title: 'View Modes', description: 'Switch between different view layouts', keywords: ['view', 'mode', 'grid', 'list', 'kanban'], subsection: 'Views' },
  { category: 'tips', title: 'Bulk Actions', description: 'Select and update multiple items', keywords: ['bulk', 'multiple', 'batch', 'select'], subsection: 'Bulk Operations' },
];

// Quick links data
const quickLinks = [
  { label: 'Create a Job', category: 'crm' as GuideCategory, icon: '📁', color: '#3b82f6' },
  { label: 'Upload Documents', category: 'flowai' as GuideCategory, icon: '📤', color: '#8b5cf6' },
  { label: 'Create a Quote', category: 'quotes' as GuideCategory, icon: '📄', color: '#10b981' },
  { label: 'View Orders', category: 'financial' as GuideCategory, icon: '🛒', color: '#22c55e' },
  { label: 'Add Contact', category: 'foundational' as GuideCategory, icon: '👤', color: '#06b6d4' },
  { label: 'View Analytics', category: 'analytics' as GuideCategory, icon: '📊', color: '#ec4899' },
  { label: 'Keyboard Shortcuts', category: 'tips' as GuideCategory, icon: '⌨️', color: '#f97316' },
  { label: 'PDF Builder', category: 'tips' as GuideCategory, icon: '📋', color: '#ef4444' },
];

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  steps?: { step: string; description: string }[];
  tips?: string[];
}

function FeatureCard({ icon, title, description, color, steps, tips }: FeatureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
          border: `1px solid ${color}30`
        }}
      />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          {(steps || tips) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>

        {/* Expandable content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {steps && steps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Step-by-Step</p>
                <ol className="space-y-2">
                  {steps.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.step}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {tips && tips.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pro Tips</p>
                <ul className="space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span style={{ color }} className="mt-0.5">&#10003;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KeyboardShortcut({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">{action}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-slate-400 text-xs">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform cursor-default">
      <div
        className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function SearchResultItem({
  result,
  onClick
}: {
  result: SearchableContent;
  onClick: () => void;
}) {
  const section = sections.find(s => s.id === result.category);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${section?.color}20`, color: section?.color }}
      >
        {section?.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{result.title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.description}</div>
      </div>
      <div className="flex-shrink-0">
        <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
          {section?.title}
        </span>
      </div>
    </button>
  );
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeSection, setActiveSection] = useState<GuideCategory>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    return searchableContent.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const descMatch = item.description.toLowerCase().includes(query);
      const keywordMatch = item.keywords.some(k => k.toLowerCase().includes(query));
      return titleMatch || descMatch || keywordMatch;
    }).slice(0, 8); // Limit to 8 results
  }, [searchQuery]);

  const handleSearchResultClick = useCallback((result: SearchableContent) => {
    setActiveSection(result.category);
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  const handleQuickLinkClick = useCallback((category: GuideCategory) => {
    setActiveSection(category);
  }, []);

  if (!mounted || !isOpen) return null;

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Welcome to FlowCRM</h2>
                    <p className="text-white/80 text-sm">Your complete manufacturing sales solution</p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed max-w-2xl">
                  FlowCRM is designed to streamline your entire sales workflow - from initial contact to final commission.
                  With AI-powered document processing, intelligent automation, and comprehensive analytics,
                  you&apos;ll close more deals faster.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Quick Links
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleQuickLinkClick(link.category)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">What You Can Do</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  value="8+"
                  label="Module Categories"
                  color="#6366f1"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                />
                <StatCard
                  value="50+"
                  label="Features"
                  color="#3b82f6"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>}
                />
                <StatCard
                  value="AI"
                  label="Powered"
                  color="#8b5cf6"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>}
                />
                <StatCard
                  value="Real-time"
                  label="Sync"
                  color="#10b981"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>}
                />
              </div>
            </div>

            {/* Navigation Tips */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </span>
                  Universal Search
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  The search bar in the top navigation is your fastest way to find anything. Search for contacts, jobs, orders, quotes, and more instantly.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 bg-white dark:bg-slate-900/50 rounded-lg px-3 py-2">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">K</kbd>
                    <span className="ml-2">Open Search</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type any name, number, or keyword to find matching records across all modules.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  </span>
                  AI Uploader
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  The purple &quot;AI Uploader&quot; button in the top-right gives you instant access to our AI document processing. Upload orders, quotes, invoices, and more.
                </p>
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <span className="text-purple-500">&#10003;</span>
                    Drag and drop any document
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-purple-500">&#10003;</span>
                    AI extracts data automatically
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-purple-500">&#10003;</span>
                    Review and submit to CRM
                  </p>
                </div>
              </div>
            </div>

            {/* Getting Started Steps */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Start Guide</h3>
              <div className="space-y-3">
                {[
                  { step: 1, title: 'Explore the Sidebar', desc: 'Click the menu icon or use the sidebar to navigate between modules. The sidebar groups features into logical categories like CRM, Flow AI, Financial, and Analytics.', tip: 'Hover over collapsed sidebar items to see the full menu' },
                  { step: 2, title: 'Set Up Your Foundation', desc: 'Start by importing or creating your Contacts, Companies, and Products. These are the building blocks for everything else in the system.', tip: 'Use Flow AI to bulk import existing data' },
                  { step: 3, title: 'Create Your First Job', desc: 'Jobs are your projects and deals. Create a new job from the Activity Feed or Jobs page. Link it to contacts and companies.', tip: 'Drag jobs between kanban columns to update status' },
                  { step: 4, title: 'Use AI Features', desc: 'Upload documents through Flow AI to automatically extract and organize data. The AI will match entities and suggest data to import.', tip: 'Create templates for different manufacturers to improve accuracy' },
                  { step: 5, title: 'Track with Analytics', desc: 'Use the Analytics module to gain insights into your sales performance, commission tracking, and identify opportunities.', tip: 'Set up global filters to focus on specific date ranges or entities' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1"/>
                          <circle cx="12" cy="12" r="5"/>
                        </svg>
                        {item.tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'crm':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">CRM Hub</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your central command center for sales operations</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                title="Activity Feed"
                description="Your real-time dashboard showing all recent activities across jobs, contacts, companies, tasks, notes, and pre-opportunities. This is your home base."
                color="#3b82f6"
                steps={[
                  { step: 'View All Activities', description: 'The feed shows all recent activities across your CRM in chronological order' },
                  { step: 'Filter by Type', description: 'Use the filter buttons to show only Jobs, Contacts, Companies, Tasks, Notes, or Pre-Opportunities' },
                  { step: 'Filter by Status', description: 'Toggle Active, Complete, or All to filter by status' },
                  { step: 'Create New Items', description: 'Click the action buttons to quickly create new Jobs, Tasks, Notes, or Pre-Opportunities' },
                  { step: 'Click to View Details', description: 'Click any activity card to navigate to its full detail page' },
                ]}
                tips={[
                  'The feed auto-refreshes to show the latest activities',
                  'Use Advanced Filters for complex queries',
                  'Activity counts show at the top of each filter button',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>}
                title="Jobs"
                description="Track your projects and deals through customizable status stages. Visualize your pipeline with Kanban boards or view as a list."
                color="#8b5cf6"
                steps={[
                  { step: 'Create a Job', description: 'Click "Add Job" button, fill in job name, type, dates, and optional description' },
                  { step: 'View in Kanban', description: 'See all jobs organized by status columns (Backlog, Active, Quoted, Won, Lost, Complete)' },
                  { step: 'Drag to Change Status', description: 'Drag any job card to a different column to update its status instantly' },
                  { step: 'Click for Details', description: 'Click any job to see full details, linked entities, and edit information' },
                  { step: 'Link Entities', description: 'In detail view, link contacts, companies, quotes, orders, and more to the job' },
                ]}
                tips={[
                  'Toggle between Kanban and List view using the icons in the header',
                  'Use "Find Duplicates" to identify and merge duplicate jobs',
                  'Jobs can have tags for additional categorization',
                  'Set GC (General Contractor) and EC (End Customer) on jobs',
                  'Add structural information and additional details in edit mode',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
                title="Tasks"
                description="Manage your to-do items with five different view options. Track priorities, due dates, assignees, and link tasks to other entities."
                color="#10b981"
                steps={[
                  { step: 'Create a Task', description: 'Click "Add Task", enter title, description, set priority, due date, and optional reminder' },
                  { step: 'Choose Your View', description: 'Switch between Grid, List, Kanban, Spreadsheet, or Calendar views' },
                  { step: 'Set Priority', description: 'Choose from Urgent, High, Medium, or Low priority levels' },
                  { step: 'Assign Tasks', description: 'Assign tasks to team members for accountability' },
                  { step: 'Mark Complete', description: 'Click the checkbox to mark tasks as complete' },
                ]}
                tips={[
                  'Kanban view: Drag tasks between status columns (Not Started, In Progress, Completed, Deferred)',
                  'Spreadsheet view: Edit multiple fields inline like Excel',
                  'Calendar view: See tasks by due date on a calendar',
                  'Add tags to categorize and filter tasks',
                  'Set reminders to get notified before due dates',
                  'Bulk select tasks for batch updates or deletion',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>}
                title="Notes"
                description="Create and organize notes for meetings, calls, and ideas. Link notes to contacts, jobs, or companies for context."
                color="#f59e0b"
                steps={[
                  { step: 'Create a Note', description: 'Click "Add Note", enter title and content' },
                  { step: 'Link to Entities', description: 'Associate the note with relevant contacts, jobs, or companies' },
                  { step: 'Organize with Views', description: 'Switch between Grid and List views' },
                  { step: 'Search Notes', description: 'Use the search bar to find notes by content or title' },
                ]}
                tips={[
                  'Notes are searchable across all content',
                  'Use notes for meeting summaries, call logs, and ideas',
                  'Link to multiple entities to provide context',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                title="Pre-Opportunities"
                description="Early-stage leads and potential deals before they become formal quotes. Perfect for tracking initial prospect conversations."
                color="#ec4899"
                steps={[
                  { step: 'Create Pre-Opportunity', description: 'Click "Add Pre-Opportunity" with a name and estimated value' },
                  { step: 'Link to Entities', description: 'Associate with customers, factories, and jobs' },
                  { step: 'Track Progress', description: 'Update status and notes as the opportunity develops' },
                  { step: 'Convert to Quote', description: 'When ready, create a formal quote from the pre-opportunity' },
                ]}
                tips={[
                  'Use for early prospecting before formal quotes',
                  'Track estimated values for pipeline forecasting',
                  'Link to the job when one is created',
                ]}
              />
            </div>
          </div>
        );

      case 'flowai':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Flow AI</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered document processing & automation</p>
              </div>
            </div>

            {/* AI Highlight Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Instant Document Processing</h3>
                  <p className="text-white/80 text-sm">Upload orders, quotes, invoices, checks, and acknowledgements. Our AI extracts all the data automatically - no manual entry required!</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                title="AI Document Upload"
                description="Drag and drop documents to instantly extract data using advanced AI. Supports PDFs, images (PNG, JPG), and spreadsheets."
                color="#8b5cf6"
                steps={[
                  { step: 'Select Document Type', description: 'Choose the type: Order, Quote, Invoice, Commission Check, or Acknowledgement' },
                  { step: 'Upload Your File', description: 'Drag and drop or click to browse. Supports PDF, images, and Excel files' },
                  { step: 'AI Extracts Data', description: 'The AI reads the document and extracts all relevant fields automatically' },
                  { step: 'Review Extraction', description: 'Check the extracted data, make any corrections if needed' },
                  { step: 'Match Entities', description: 'Link extracted companies/contacts to existing CRM records' },
                  { step: 'Submit to CRM', description: 'Approve and submit the data to create/update records' },
                ]}
                tips={[
                  'Higher quality scans/images = better extraction accuracy',
                  'Use templates for documents from the same manufacturer',
                  'You can upload multiple pages of the same document',
                  'AI learns from your corrections over time',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                title="Processing Queue"
                description="Monitor all your document processing jobs in real-time. Track status, view results, retry failed documents."
                color="#06b6d4"
                steps={[
                  { step: 'View Queue', description: 'See all documents in processing, completed, or failed states' },
                  { step: 'Check Status', description: 'Each document shows its current processing stage' },
                  { step: 'View Results', description: 'Click any item to see the extracted data' },
                  { step: 'Retry Failed', description: 'Re-process failed documents with one click' },
                ]}
                tips={[
                  'Queue updates in real-time as documents process',
                  'Failed documents show the error reason',
                  'You can delete queue items you no longer need',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
                title="Upload Templates"
                description="Create custom templates for different manufacturers and document types. Templates improve extraction accuracy and speed."
                color="#f59e0b"
                steps={[
                  { step: 'Create Template', description: 'Click "New Template" and give it a name' },
                  { step: 'Select Manufacturer', description: 'Associate the template with a specific manufacturer' },
                  { step: 'Define Field Mappings', description: 'Specify which fields to extract and where they appear' },
                  { step: 'Save & Use', description: 'Save the template, then select it when uploading matching documents' },
                ]}
                tips={[
                  'Create one template per manufacturer for best results',
                  'Templates remember field positions and formats',
                  'Share templates with your team for consistency',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>}
                title="Entity Matching"
                description="AI-powered matching of uploaded entities (companies, contacts, customers) to existing CRM records. Prevent duplicates and maintain data quality."
                color="#6366f1"
                steps={[
                  { step: 'View Extracted Entities', description: 'See all companies/contacts extracted from your document' },
                  { step: 'Review AI Suggestions', description: 'AI suggests matches to existing records with confidence scores' },
                  { step: 'Confirm or Override', description: 'Accept the suggested match or search for a different record' },
                  { step: 'Create New if Needed', description: 'If no match exists, create a new entity record' },
                  { step: 'Bulk Process', description: 'Use bulk actions to process multiple matches at once' },
                ]}
                tips={[
                  'Higher confidence scores indicate better matches',
                  'You can filter by match status (matched, unmatched, needs review)',
                  'Creating accurate matches improves future AI suggestions',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>}
                title="Flow Chat"
                description="Chat with an AI assistant to get help, ask questions about your data, and get intelligent insights about your business."
                color="#ec4899"
                steps={[
                  { step: 'Open Chat', description: 'Click the chat icon or navigate to Flow Chat' },
                  { step: 'Ask a Question', description: 'Type your question in natural language' },
                  { step: 'Review Answer', description: 'AI provides answers with references to your data' },
                  { step: 'Follow Up', description: 'Ask follow-up questions for more detail' },
                ]}
                tips={[
                  'Ask about trends, comparisons, and summaries',
                  'Use voice input by clicking the microphone icon',
                  'Chat history is saved for reference',
                  'AI can generate reports and suggestions',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a2 2 0 002 2h2"/><path d="M18 9v3a2 2 0 01-2 2h-2"/></svg>}
                title="Data Workflows"
                description="Automate repetitive data processing tasks with customizable workflows. Chain actions together for complex automation."
                color="#10b981"
                steps={[
                  { step: 'Create Workflow', description: 'Define the trigger that starts your workflow' },
                  { step: 'Add Steps', description: 'Add processing steps like extraction, matching, submission' },
                  { step: 'Configure Actions', description: 'Set up what happens at each step' },
                  { step: 'Activate', description: 'Turn on the workflow to start processing' },
                ]}
                tips={[
                  'Workflows run automatically when triggered',
                  'Monitor workflow runs in the queue',
                  'Create different workflows for different document types',
                ]}
              />
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email Management</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Campaigns, rules, and email processing</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>}
                title="Campaigns & Rules"
                description="Create email campaigns and set up automated rules to handle incoming emails. Define triggers, conditions, and actions for complete automation."
                color="#f59e0b"
                steps={[
                  { step: 'Create Campaign', description: 'Define your campaign name, audience, and content' },
                  { step: 'Set Up Rules', description: 'Create rules with triggers (e.g., "when email from X arrives")' },
                  { step: 'Define Actions', description: 'Choose what happens: create contact, assign task, notify user, etc.' },
                  { step: 'Activate Rules', description: 'Enable rules to start automatic processing' },
                ]}
                tips={[
                  'Rules can chain multiple actions together',
                  'Use conditions to filter which emails trigger rules',
                  'Track campaign performance with built-in analytics',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/><path d="M12 14v6" strokeLinecap="round"/><path d="M9 17l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                title="Email Ingestion"
                description="Automatically process incoming emails and extract relevant information. Create CRM records from email content and attachments."
                color="#f97316"
                steps={[
                  { step: 'View Inbox', description: 'See all ingested emails in Card or Spreadsheet view' },
                  { step: 'Process Email', description: 'Click an email to process it into CRM records' },
                  { step: 'Extract Data', description: 'AI extracts contacts, companies, and attachments' },
                  { step: 'Create Records', description: 'Create new contacts, jobs, or notes from email content' },
                  { step: 'Link Attachments', description: 'Process email attachments through Flow AI' },
                ]}
                tips={[
                  'Switch between Card and Spreadsheet views',
                  'Filter emails by date, sender, or status',
                  'Process attachments directly to AI upload',
                  'Link emails to existing CRM records',
                ]}
              />
            </div>

            {/* Email Integration Note */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800/30">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                Email Integration Setup
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                To use email features, connect your email account in Settings &gt; Integrations.
                We support Gmail and Office 365 integrations.
              </p>
            </div>
          </div>
        );

      case 'quotes':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M8 13h8M8 17h8M8 9h2"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quotes Management</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Create, manage, and track your sales quotes</p>
              </div>
            </div>

            <FeatureCard
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>}
              title="Quotes"
              description="Create professional quotes for your customers. Track quotes through your sales pipeline from initial discovery to closed won."
              color="#10b981"
              steps={[
                { step: 'Create New Quote', description: 'Click "New Quote" and select customer, job (optional), and payment terms' },
                { step: 'Add Line Items', description: 'Add products with quantities, pricing, and discounts' },
                { step: 'Set Quote Details', description: 'Configure quote date, expiration, freight terms, and notes' },
                { step: 'Track Pipeline', description: 'Move quotes through stages: Discovery → Prospect → Qualification → Proposal → Negotiation → Closed' },
                { step: 'Generate PDF', description: 'Export professional PDF quotes for customers' },
                { step: 'Convert to Order', description: 'When won, convert the quote to an order' },
              ]}
              tips={[
                'Use Kanban view to visualize your quote pipeline',
                'Drag quotes between stages to update status',
                'Filter by date: Today, This Week, Last Week, or All',
                'Search by quote number or customer name',
                'Track pipeline value and win rates in the header',
                'Set expiration dates to follow up on stale quotes',
                'Add factory and end user information for context',
              ]}
            />

            {/* Quote Pipeline Visual */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Quote Pipeline Stages</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                  { name: 'Discovery', color: 'bg-gray-100 text-gray-700', desc: 'Initial contact' },
                  { name: 'Prospect', color: 'bg-slate-100 text-slate-700', desc: 'Qualified lead' },
                  { name: 'Qualification', color: 'bg-blue-100 text-blue-700', desc: 'Assessing needs' },
                  { name: 'Proposal', color: 'bg-purple-100 text-purple-700', desc: 'Quote sent' },
                  { name: 'Negotiation', color: 'bg-yellow-100 text-yellow-700', desc: 'Discussing terms' },
                  { name: 'Closed Won', color: 'bg-green-100 text-green-700', desc: 'Deal won!' },
                  { name: 'Closed Lost', color: 'bg-red-100 text-red-700', desc: 'Deal lost' },
                ].map((stage, i, arr) => (
                  <React.Fragment key={stage.name}>
                    <div className={`px-4 py-3 rounded-lg text-center whitespace-nowrap ${stage.color} dark:bg-opacity-30`}>
                      <div className="text-sm font-medium">{stage.name}</div>
                      <div className="text-[10px] opacity-75">{stage.desc}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600 flex-shrink-0">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Quote Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Quote Fields</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Quote Number (auto-generated)</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Sold-To Customer</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Bill-To Customer</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Quote Date & Expiration</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Payment & Freight Terms</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Line Items with Pricing</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Line Item Details</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Product selection</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Quantity & Unit Price</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Discounts (% or fixed)</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Line totals</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span> Subtotal, Discount, Total</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Financial Management</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Orders, invoices, commissions, and more</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
                title="Orders"
                description="Manage all your orders in one place. View order details, line items, track status, and manage the entire order lifecycle."
                color="#22c55e"
                steps={[
                  { step: 'View Orders', description: 'Browse all orders with search, sort, and filter options' },
                  { step: 'Quick Date Filters', description: 'Filter by Today, This Week, This Month, or custom date ranges' },
                  { step: 'Click for Details', description: 'Select an order to view full details in the sidebar' },
                  { step: 'View Line Items', description: 'See all products, quantities, and pricing on the order' },
                  { step: 'Create New Order', description: 'Click "New Order" to manually create an order' },
                  { step: 'Bulk Actions', description: 'Select multiple orders for batch status updates' },
                ]}
                tips={[
                  'Use column filters to narrow down results',
                  'Click column headers to sort',
                  'Order details show linked invoices and commissions',
                  'Create credits and acknowledgements from orders',
                  'Search by order number, customer, or PO number',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 12h8M8 16h4"/><circle cx="16" cy="16" r="2"/></svg>}
                title="Invoices"
                description="Track and manage all invoices from your manufacturers. View invoice details, line items, and payment status."
                color="#3b82f6"
                steps={[
                  { step: 'Browse Invoices', description: 'View all invoices with filtering and sorting' },
                  { step: 'View Details', description: 'Click an invoice to see full information' },
                  { step: 'See Line Items', description: 'Review all products and amounts on the invoice' },
                  { step: 'Track Status', description: 'Monitor payment status and due dates' },
                ]}
                tips={[
                  'Invoices link to related orders and commissions',
                  'Filter by manufacturer, date, or status',
                  'Export invoice data for reporting',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
                title="Commissions"
                description="Track commission checks and payments from manufacturers. View detailed breakdowns and identify commission gaps."
                color="#8b5cf6"
                steps={[
                  { step: 'View Commission Checks', description: 'See all commission checks received' },
                  { step: 'Check Details', description: 'Click a check to see the full breakdown' },
                  { step: 'View Check Lines', description: 'See individual line items on the commission check' },
                  { step: 'Track by Manufacturer', description: 'Filter commissions by manufacturer' },
                  { step: 'Create New', description: 'Manually create commission records if needed' },
                ]}
                tips={[
                  'Use Commission Gap Reports in Analytics to find missing commissions',
                  'Link commissions to original orders for traceability',
                  'Track commission rates by manufacturer',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>}
                title="Adjustments"
                description="Manage order adjustments, credits, and corrections. Keep your financial records accurate and complete."
                color="#f59e0b"
                steps={[
                  { step: 'View Adjustments', description: 'Browse all adjustment records' },
                  { step: 'Create Adjustment', description: 'Create new adjustments linked to orders' },
                  { step: 'Specify Reason', description: 'Document the reason for the adjustment' },
                  { step: 'Track History', description: 'View full adjustment history for any order' },
                ]}
                tips={[
                  'Adjustments maintain audit trail for compliance',
                  'Link adjustments to original orders',
                  'Use for returns, credits, and corrections',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                title="Acknowledgements"
                description="Track order acknowledgements from manufacturers. Confirm orders and manage delivery expectations."
                color="#06b6d4"
                steps={[
                  { step: 'View Acknowledgements', description: 'See all order acknowledgements received' },
                  { step: 'Match to Orders', description: 'Acknowledgements link to original orders' },
                  { step: 'Track Dates', description: 'Monitor expected ship dates and delivery info' },
                  { step: 'Identify Discrepancies', description: 'Compare acknowledgement to original order' },
                ]}
                tips={[
                  'Upload acknowledgements via Flow AI for automatic processing',
                  'Discrepancies are highlighted for review',
                  'Track delivery commitments from manufacturers',
                ]}
              />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17V9M13 17V5M8 17v-3"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive insights into your business</p>
              </div>
            </div>

            {/* Analytics Categories */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Order Dashboard', desc: 'Sales metrics, trends, and top performers', icon: '📊', color: 'pink' },
                { name: 'Product Dashboard', desc: 'Product sales and performance analysis', icon: '📦', color: 'purple' },
                { name: 'Commission Gap', desc: 'Find missing commission payments', icon: '💰', color: 'green' },
                { name: 'Orders Detail', desc: 'Detailed order-level reporting', icon: '📋', color: 'blue' },
                { name: 'Check Detail', desc: 'Commission check line details', icon: '✓', color: 'emerald' },
                { name: 'Quote Detail', desc: 'Quote conversion and performance', icon: '📄', color: 'teal' },
                { name: 'Order Split Rate', desc: 'Analyze split commissions', icon: '📈', color: 'indigo' },
                { name: 'Order Pivot', desc: 'Multi-dimensional order analysis', icon: '🔄', color: 'violet' },
                { name: 'Check Pivot', desc: 'Pivot table for check data', icon: '🔄', color: 'amber' },
                { name: 'Quote Pivot', desc: 'Quote data pivot analysis', icon: '🔄', color: 'orange' },
                { name: 'Commission by State', desc: 'Geographic commission breakdown', icon: '🗺️', color: 'cyan' },
                { name: 'Invoice Detail', desc: 'Invoice-level reporting', icon: '🧾', color: 'slate' },
              ].map((report) => (
                <div key={report.name} className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default">
                  <span className="text-2xl mb-2 block">{report.icon}</span>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">{report.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{report.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800/30">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Analytics Features</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Global Filters</h5>
                  <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Filter by date range
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Filter by manufacturer
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Filter by customer
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Filter by sales rep
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Report Features</h5>
                  <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Export to Excel
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Column configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Multi-column sorting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-pink-500">&#10003;</span>
                      Save custom views
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How to Use Analytics */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">How to Use Analytics</h4>
              <ol className="space-y-3">
                {[
                  { step: 'Navigate to Analytics', desc: 'Click Analytics in the sidebar to access all reports' },
                  { step: 'Set Global Filters', desc: 'Use the filter bar at the top to set date range and entity filters' },
                  { step: 'Choose a Report', desc: 'Select the report type from the sidebar navigation' },
                  { step: 'Configure Columns', desc: 'Click the column config icon to show/hide columns' },
                  { step: 'Sort & Filter', desc: 'Click column headers to sort, use column filters for specific values' },
                  { step: 'Export Data', desc: 'Click Export to download data to Excel' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.step}</span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );

      case 'foundational':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Foundational Data</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Core entities that power your CRM</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                title="Contacts"
                description="Manage all your business contacts. Store contact information, track relationships, and link contacts to companies, jobs, and other entities."
                color="#06b6d4"
                steps={[
                  { step: 'Create Contact', desc: 'Click "Add Contact" and fill in name, email, phone, and company' },
                  { step: 'Set Contact Type', desc: 'Categorize as Customer, Vendor, Partner, etc.' },
                  { step: 'Link to Entities', desc: 'Associate with companies, jobs, orders' },
                  { step: 'View in Grid/List', desc: 'Switch between card grid and list views' },
                  { step: 'Edit Details', desc: 'Click any contact to view and edit full details' },
                ].map(s => ({ step: s.step, description: s.desc }))}
                tips={[
                  'Filter contacts by type using the tabs',
                  'Use "Find Duplicates" to clean up your data',
                  'Contact cards show key info at a glance',
                  'Search by name, email, or phone number',
                  'Link multiple contacts to jobs for team tracking',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 6h6M9 10h6M9 14h6M9 18h6"/></svg>}
                title="Companies"
                description="Store company information including addresses, contacts, and relationships. Companies link to contacts, jobs, orders, and more."
                color="#3b82f6"
                steps={[
                  { step: 'Create Company', desc: 'Add company name, address, phone, website' },
                  { step: 'Add Address', desc: 'Use Google Maps integration for accurate addresses' },
                  { step: 'Link Contacts', desc: 'Associate employees and contacts with the company' },
                  { step: 'View Relationships', desc: 'See all linked jobs, orders, invoices' },
                ].map(s => ({ step: s.step, description: s.desc }))}
                tips={[
                  'Companies are used for GC and EC on jobs',
                  'Address autocomplete makes entry fast',
                  'View company history across all modules',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
                title="Customers"
                description="Your customer database for order management. Customers are used as Sold-To and Bill-To on quotes and orders."
                color="#8b5cf6"
                steps={[
                  { step: 'Create Customer', desc: 'Add customer name and billing information' },
                  { step: 'Set Account Info', desc: 'Configure payment terms and credit limits' },
                  { step: 'View History', desc: 'See all orders, quotes, and invoices' },
                  { step: 'Link to Company', desc: 'Associate customer with a company record' },
                ].map(s => ({ step: s.step, description: s.desc }))}
                tips={[
                  'Customers appear in Sold-To dropdowns',
                  'Track customer-specific pricing and terms',
                  'View customer purchase history',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>}
                title="Products"
                description="Your product catalog for quotes and orders. Products include pricing, descriptions, and manufacturer information."
                color="#10b981"
                steps={[
                  { step: 'Browse Products', desc: 'Search and filter your product catalog' },
                  { step: 'View Details', desc: 'See product specifications, pricing, manufacturer' },
                  { step: 'Edit Product', desc: 'Update product information as needed' },
                  { step: 'Use in Quotes', desc: 'Select products when creating quote line items' },
                ].map(s => ({ step: s.step, description: s.desc }))}
                tips={[
                  'Products are searchable by name, SKU, or manufacturer',
                  'Pricing information flows to quotes and orders',
                  'Import products in bulk via Flow AI',
                ]}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/><path d="M9 10h.01M15 10h.01"/></svg>}
                title="Manufacturers"
                description="Manage manufacturer relationships. Manufacturers link to products, orders, commissions, and upload templates."
                color="#f59e0b"
                steps={[
                  { step: 'View Manufacturers', desc: 'Browse all manufacturer profiles' },
                  { step: 'See Products', desc: 'View all products from a manufacturer' },
                  { step: 'Track Orders', desc: 'Filter orders by manufacturer' },
                  { step: 'Commission Tracking', desc: 'View commission history by manufacturer' },
                ].map(s => ({ step: s.step, description: s.desc }))}
                tips={[
                  'Create upload templates per manufacturer for AI processing',
                  'Track commission rates by manufacturer',
                  'View manufacturer performance in Analytics',
                ]}
              />
            </div>
          </div>
        );

      case 'tips':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71"/>
                  <circle cx="12" cy="12" r="5"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pro Tips & Shortcuts</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Work smarter with these power user tips</p>
              </div>
            </div>

            {/* PDF Builder Feature */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M9 13h6M9 17h6"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">PDF Builder</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                    Generate professional, customizable PDFs for quotes, orders, and invoices. Add your logo, customize fields, and export with one click.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">How to Use</h5>
                      <ol className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <li>1. Go to any quote, order, or invoice detail page</li>
                        <li>2. Click the PDF/Export icon in the header</li>
                        <li>3. Customize fields, logo, and notes</li>
                        <li>4. Preview and download your PDF</li>
                      </ol>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Customization Options</h5>
                      <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <li>&#10003; Your organization logo</li>
                        <li>&#10003; Header and footer notes</li>
                        <li>&#10003; Show/hide specific fields</li>
                        <li>&#10003; Line item columns</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Grid */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">⌨️</span> Keyboard Shortcuts
                </h4>
                <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700">
                  <KeyboardShortcut keys={['Ctrl', 'K']} action="Open Universal Search" />
                  <KeyboardShortcut keys={['Esc']} action="Close modals & sidebars" />
                  <KeyboardShortcut keys={['Ctrl', 'S']} action="Save current form" />
                  <KeyboardShortcut keys={['Enter']} action="Confirm actions" />
                  <KeyboardShortcut keys={['Tab']} action="Navigate between fields" />
                  <KeyboardShortcut keys={['Shift', 'Tab']} action="Navigate backwards" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🔍</span> Advanced Filtering
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Every list in FlowCRM supports advanced filtering. Click the filter icon to access powerful filter options.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">&#10003;</span>
                    <span><strong>Equals:</strong> Exact match for a value</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">&#10003;</span>
                    <span><strong>Contains:</strong> Partial text match</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">&#10003;</span>
                    <span><strong>In:</strong> Match multiple values</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">&#10003;</span>
                    <span><strong>Date Range:</strong> Filter by date range</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* View Modes */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Available View Modes</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { name: 'Grid', icon: '▦', desc: 'Card-based layout showing key info', best: 'Quick overview' },
                  { name: 'List', icon: '≡', desc: 'Compact rows with more items visible', best: 'Scanning many items' },
                  { name: 'Kanban', icon: '▧', desc: 'Drag & drop cards between columns', best: 'Status workflows' },
                  { name: 'Spreadsheet', icon: '▤', desc: 'Excel-like inline editing', best: 'Bulk updates' },
                  { name: 'Calendar', icon: '📅', desc: 'Items on date calendar', best: 'Due date tracking' },
                ].map((view) => (
                  <div key={view.name} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                    <span className="text-2xl block mb-1">{view.icon}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white block">{view.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">{view.desc}</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 block mt-1">Best for: {view.best}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* More Tips */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">📎</span> Linked Entities
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Most entities in FlowCRM can be linked together. When viewing details, scroll down to see the &quot;Connected Entities&quot; section.
                </p>
                <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <li>&#10003; Jobs link to Contacts, Companies, Quotes, Orders</li>
                  <li>&#10003; Contacts link to Companies, Jobs, Notes</li>
                  <li>&#10003; Orders link to Invoices, Commissions, Acknowledgements</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span> Quick Tips
                </h4>
                <ul className="space-y-2">
                  {[
                    'Click column headers to sort any table',
                    'Drag the sidebar edge to resize it',
                    'Double-click items in spreadsheet view to edit',
                    'Use bulk select + actions for batch updates',
                    'Star or tag items for quick access later',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="text-orange-500 mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Files & Settings */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                  </svg>
                  Files Management
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Access all uploaded files in one place. Files are automatically organized by the entities they&apos;re linked to.
                </p>
                <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <li>&#10003; Filter files by type, date, or entity</li>
                  <li>&#10003; Preview files without downloading</li>
                  <li>&#10003; Link files to multiple entities</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4"/>
                  </svg>
                  Settings & Integrations
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Configure your account, manage team members, and connect email integrations.
                </p>
                <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <li>&#10003; Gmail integration for email features</li>
                  <li>&#10003; Office 365 integration</li>
                  <li>&#10003; Organization settings and branding</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[95vw] max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">User Guide</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">FlowCRM Help Center</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search guide..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length >= 2);
                }}
                onFocus={() => setShowSearchResults(searchQuery.length >= 2)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                  {searchResults.map((result, i) => (
                    <SearchResultItem
                      key={`${result.category}-${result.title}-${i}`}
                      result={result}
                      onClick={() => handleSearchResultClick(result)}
                    />
                  ))}
                </div>
              </div>
            )}

            {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  No results found for &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-white dark:bg-slate-700 shadow-sm'
                      : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      activeSection === section.id
                        ? `bg-gradient-to-br ${section.gradient} text-white`
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {section.icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    activeSection === section.id
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {section.title}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              FlowCRM v1.0 &middot; Need help? Contact support
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">/</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {sections.find(s => s.id === activeSection)?.title}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
