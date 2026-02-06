'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  Shield,
  CheckCircle,
  Eye,
  Building2,
  History,
  Settings,
  Factory,
  Briefcase,
  Bell,
  FileInput,
  MapPin,
  BarChart3,
  Send,
  Download,
  Route,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Target,
  DollarSign,
  BookOpen,
  Sparkles,
  Boxes,
  Users,
  TableProperties,
  Truck as TruckIcon,
  Warehouse,
  Gift,
  Trophy,
  FlaskConical,
  X,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleType, mockCompanies } from '@/lib/nemra-pos-data';

// Role context
interface RoleContextType {
  currentRole: RoleType;
  setCurrentRole: (role: RoleType) => void;
  company: typeof mockCompanies.distributor;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}

// Navigation item type
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

// Grouped navigation by role
const navGroupsByRole: Record<RoleType, NavGroup[]> = {
  distributor: [
    {
      label: 'Control Panel',
      defaultExpanded: true,
      items: [
        { label: 'Home', href: '/nemra-pos/distributor', icon: LayoutDashboard },
        { label: 'Send Data', href: '/nemra-pos/distributor/send', icon: Upload },
        { label: 'Issues', href: '/nemra-pos/distributor/issues', icon: AlertCircle },
        { label: 'History', href: '/nemra-pos/distributor/history', icon: History },
        { label: 'Messages', href: '/nemra-pos/distributor/messages', icon: MessageSquare },
      ],
    },
    {
      label: 'Setup',
      defaultExpanded: true,
      items: [
        { label: 'Manufacturers', href: '/nemra-pos/distributor/manufacturers', icon: Factory },
        { label: 'Send Method', href: '/nemra-pos/distributor/setup/send-method', icon: Settings },
        { label: 'Mapping', href: '/nemra-pos/distributor/setup/mapping', icon: Shield },
        { label: 'Routing', href: '/nemra-pos/distributor/setup/routing', icon: Route },
        { label: 'Validation', href: '/nemra-pos/distributor/setup/validation', icon: CheckCircle },
        { label: 'FAQ', href: '/nemra-pos/distributor/setup/faq', icon: HelpCircle },
      ],
    },
  ],
  manufacturer: [
    {
      label: 'Control Panel',
      defaultExpanded: true,
      items: [
        { label: 'Dashboard', href: '/nemra-pos/manufacturer', icon: LayoutDashboard },
        { label: 'Messages', href: '/nemra-pos/manufacturer/messages', icon: MessageSquare },
      ],
    },
    {
      label: 'Receiving Data',
      defaultExpanded: true,
      items: [
        { label: 'Received Data', href: '/nemra-pos/manufacturer/received-data', icon: Download },
        { label: 'Lot Orders', href: '/nemra-pos/manufacturer/lot-orders', icon: TruckIcon },
        { label: 'Data Coverage', href: '/nemra-pos/manufacturer/data-coverage', icon: CalendarDays },
        { label: 'Field Coverage', href: '/nemra-pos/manufacturer/field-coverage', icon: CheckCircle },
      ],
    },
    {
      label: 'Sending Data',
      defaultExpanded: true,
      items: [
        { label: 'Send Data', href: '/nemra-pos/manufacturer/send', icon: Upload },
        { label: 'Issues', href: '/nemra-pos/manufacturer/send-issues', icon: AlertCircle },
        { label: 'History', href: '/nemra-pos/manufacturer/send-history', icon: History },
      ],
    },
    {
      label: 'Setup',
      defaultExpanded: true,
      items: [
        { label: 'Distributors', href: '/nemra-pos/manufacturer/distributors', icon: Building2 },
        { label: 'Rep Firms', href: '/nemra-pos/manufacturer/rep-firms', icon: Briefcase },
        { label: 'Receiving Method', href: '/nemra-pos/manufacturer/setup/data-intake-method', icon: Settings },
        { label: 'Send Method', href: '/nemra-pos/manufacturer/setup/send-method', icon: Settings },
        { label: 'Receiving Mapping', href: '/nemra-pos/manufacturer/setup/mapping', icon: Shield },
        { label: 'Sending Mapping', href: '/nemra-pos/manufacturer/setup/send-mapping', icon: Shield },
        { label: 'Routing', href: '/nemra-pos/manufacturer/setup/routing', icon: Route },
        { label: 'Validation', href: '/nemra-pos/manufacturer/setup/validation', icon: CheckCircle },
        { label: 'Commission Config', href: '/nemra-pos/manufacturer/setup/commission-config', icon: Percent },
        { label: 'FAQ', href: '/nemra-pos/manufacturer/setup/faq', icon: HelpCircle },
      ],
    },
    {
      label: 'Extending Data',
      defaultExpanded: true,
      items: [
        { label: 'Inventory Data', href: '/nemra-pos/manufacturer/inventory-data', icon: Warehouse },
        { label: 'Direct Ships', href: '/nemra-pos/manufacturer/direct-ships', icon: TruckIcon },
        { label: 'Incentives', href: '/nemra-pos/manufacturer/incentives', icon: Gift },
      ],
    },
    {
      label: 'Analytics',
      defaultExpanded: true,
      items: [
        { label: 'Highlights', href: '/nemra-pos/manufacturer/analytics/highlights', icon: Sparkles },
        { label: 'Product Categories', href: '/nemra-pos/manufacturer/analytics/categories', icon: Boxes },
        { label: 'Rep Performance', href: '/nemra-pos/manufacturer/analytics/rep-performance', icon: Users },
        { label: 'Coverage', href: '/nemra-pos/manufacturer/analytics/coverage', icon: BarChart3 },
        { label: 'Inventory Risk', href: '/nemra-pos/manufacturer/analytics/inventory-risk', icon: DollarSign },
        { label: 'Incentive ROI', href: '/nemra-pos/manufacturer/analytics/incentive-roi', icon: Trophy },
        { label: 'Action Board', href: '/nemra-pos/manufacturer/analytics/action-board', icon: Target },
        { label: 'Playbooks', href: '/nemra-pos/manufacturer/analytics/playbooks', icon: BookOpen },
        { label: 'Data Viewer', href: '/nemra-pos/manufacturer/data-grid', icon: Eye },
        { label: 'Data Pivots', href: '/nemra-pos/manufacturer/data-pivots', icon: TableProperties },
      ],
    },
  ],
  rep: [
    {
      label: 'Control Panel',
      defaultExpanded: true,
      items: [
        { label: 'Dashboard', href: '/nemra-pos/rep', icon: LayoutDashboard },
        { label: 'Data Coverage', href: '/nemra-pos/rep/data-coverage', icon: CalendarDays },
        { label: 'Field Coverage', href: '/nemra-pos/rep/field-coverage', icon: CheckCircle },
        { label: 'Nudge', href: '/nemra-pos/rep/nudge', icon: Send },
        { label: 'Export', href: '/nemra-pos/rep/export', icon: Download },
        { label: 'Data Viewer', href: '/nemra-pos/rep/data-grid', icon: Eye },
        { label: 'Messages', href: '/nemra-pos/rep/messages', icon: MessageSquare },
      ],
    },
    {
      label: 'Setup',
      defaultExpanded: true,
      items: [
        { label: 'Manufacturers', href: '/nemra-pos/rep/manufacturers', icon: Factory },
        { label: 'Distributors', href: '/nemra-pos/rep/distributors', icon: Building2 },
        { label: 'Data Intake Method', href: '/nemra-pos/rep/setup/data-intake-method', icon: Settings },
        { label: 'Mapping', href: '/nemra-pos/rep/setup/mapping', icon: MapPin },
      ],
    },
  ],
};

const roleLabels: Record<RoleType, { label: string; icon: React.ElementType }> = {
  distributor: { label: 'Distributor', icon: Building2 },
  manufacturer: { label: 'Manufacturer', icon: Factory },
  rep: { label: 'Rep Firm', icon: Briefcase },
};

interface CollapsibleNavGroupProps {
  group: NavGroup;
  currentRole: RoleType;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollapsibleNavGroup({ group, currentRole, pathname, isExpanded, onToggle }: CollapsibleNavGroupProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <span>{group.label}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {isExpanded && (
        <div className="space-y-1 mt-1">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== `/nemra-pos/${currentRole}` && pathname == item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NemraPosV2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<RoleType>('distributor');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showPreviewBanner, setShowPreviewBanner] = useState(true);

  // Check if current page is in a preview section
  const isPreviewSection = pathname.includes('/manufacturer/analytics') ||
    pathname.includes('/manufacturer/inventory-data') ||
    pathname.includes('/manufacturer/direct-ships') ||
    pathname.includes('/manufacturer/incentives');

  // Detect role from URL - check for specific role segments
  useEffect(() => {
    if (pathname.includes('/nemra-pos/manufacturer')) {
      setCurrentRole('manufacturer');
    } else if (pathname.includes('/nemra-pos/rep')) {
      setCurrentRole('rep');
    } else if (pathname.includes('/nemra-pos/distributor')) {
      setCurrentRole('distributor');
    }
    // If just /nemra-pos (landing page), keep the current role or default to distributor
  }, [pathname]);

  // Initialize expanded groups based on current role
  useEffect(() => {
    const navGroups = navGroupsByRole[currentRole];
    const initialExpanded: Record<string, boolean> = {};
    navGroups.forEach(group => {
      // Keep existing state or use defaultExpanded
      if (expandedGroups[`${currentRole}-${group.label}`] === undefined) {
        initialExpanded[`${currentRole}-${group.label}`] = group.defaultExpanded ?? true;
      } else {
        initialExpanded[`${currentRole}-${group.label}`] = expandedGroups[`${currentRole}-${group.label}`];
      }
    });
    setExpandedGroups(prev => ({ ...prev, ...initialExpanded }));
  }, [currentRole]);

  const toggleGroup = (groupLabel: string) => {
    const key = `${currentRole}-${groupLabel}`;
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const company = mockCompanies[currentRole];
  const navGroups = navGroupsByRole[currentRole];
  const RoleIcon = roleLabels[currentRole].icon;

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, company }}>
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <aside className="w-64 border-r bg-card flex flex-col">
          {/* Company Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <RoleIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{company.name}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[currentRole].label}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4">
            {navGroups.map((group) => (
              <CollapsibleNavGroup
                key={group.label}
                group={group}
                currentRole={currentRole}
                pathname={pathname}
                isExpanded={expandedGroups[`${currentRole}-${group.label}`] ?? true}
                onToggle={() => toggleGroup(group.label)}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Preview Banner */}
          {isPreviewSection && showPreviewBanner && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-center relative">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Preview Feature — This section is coming soon and is shown for demonstration purposes only.
                </span>
              </div>
              <button
                onClick={() => setShowPreviewBanner(false)}
                className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Header */}
          <header className="h-14 border-b bg-card px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">FlowConnect POS</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 pl-4 border-l">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {company.primaryContact.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <span className="text-sm">{company.primaryContact.name}</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 bg-muted/30 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}
