'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdvancedFilters from './AdvancedFilters';

type Job = {
  id: string;
  name: string;
  status: 'Backlog' | 'Bidding' | 'Active' | 'On Hold' | 'Won';
  type: string;
  value: string;
  startDate: string;
  gc: string;
  ec: string;
  owner: string;
  tags: string[];
};

function JobCard({ job, isDragging, onClick }: { job: Job; isDragging?: boolean; onClick?: () => void }) {
  const ownerInitials = job.owner.split(' ').map(n => n[0]).join('');
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500'];
  const colorIndex = job.id.charCodeAt(job.id.length - 1) % ownerColors.length;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" className="mt-1 accent-gray-400" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{job.name}</h4>
        </div>
        <div className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold`}>
          {ownerInitials}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{job.id}</span>
      </div>

      {job.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {job.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableJobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} isDragging={isDragging} onClick={onClick} />
    </div>
  );
}

type DuplicateGroup = {
  id: string;
  jobs: Job[];
  reason: string;
};

export default function JobsContent() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDedupeModal, setShowDedupeModal] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState<'keep' | 'combine'>('keep');
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<DuplicateGroup | null>(null);
  const [primaryJob, setPrimaryJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['contacts', 'companies', 'pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'documents']);
  const [repType, setRepType] = useState<'electrical' | 'plumbing' | 'hvac' | 'building-materials'>('electrical');
  const [showRepTypeModal, setShowRepTypeModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const jobFilterOptions = [
    { id: 'job-id', label: 'Job ID', type: 'text' as const },
    { id: 'job-name', label: 'Job Name', type: 'text' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
    { id: 'job-type', label: 'Job Type', type: 'dropdown' as const },
    { id: 'value-min', label: 'Min Value', type: 'number' as const },
    { id: 'value-max', label: 'Max Value', type: 'number' as const },
    { id: 'start-date', label: 'Start Date', type: 'date' as const },
    { id: 'gc', label: 'General Contractor', type: 'dropdown' as const },
    { id: 'ec', label: 'Electrical Contractor', type: 'dropdown' as const },
    { id: 'owner', label: 'Owner', type: 'dropdown' as const },
    { id: 'territory', label: 'Territory', type: 'dropdown' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
  ];

  const initialJobs: Job[] = [
    {
      id: 'J-001',
      name: 'Downtown Plaza Renovation',
      status: 'Active',
      type: 'Commercial',
      value: '$2.3M',
      startDate: '2024-03-15',
      gc: 'Turner Construction',
      ec: 'Miller Electric',
      owner: 'Sarah Johnson',
      tags: ['Lighting', 'Controls'],
    },
    {
      id: 'J-002',
      name: 'TechCorp HQ Expansion',
      status: 'Bidding',
      type: 'Office',
      value: '$1.8M',
      startDate: '2024-04-01',
      gc: 'Hensel Phelps',
      ec: 'Summit Electric',
      owner: 'Marcus Chen',
      tags: ['HVAC', 'Data Center'],
    },
    {
      id: 'J-003',
      name: 'Riverside Medical Center',
      status: 'Active',
      type: 'Healthcare',
      value: '$4.2M',
      startDate: '2024-02-20',
      gc: 'McCarthy Building',
      ec: 'Johnson Controls',
      owner: 'Sarah Johnson',
      tags: ['Critical Systems'],
    },
    {
      id: 'J-004',
      name: 'Harbor View Apartments',
      status: 'Won',
      type: 'Residential',
      value: '$890K',
      startDate: '2024-05-10',
      gc: 'Swinerton Builders',
      ec: 'Bay Area Electric',
      owner: 'Marcus Chen',
      tags: ['Multi-family'],
    },
    {
      id: 'J-005',
      name: 'University Lab Building',
      status: 'Bidding',
      type: 'Education',
      value: '$3.1M',
      startDate: '2024-06-01',
      gc: 'Skanska USA',
      ec: 'Prime Electric',
      owner: 'David Torres',
      tags: ['Lab Systems', 'Specialty'],
    },
    {
      id: 'J-006',
      name: 'Westside Mall Renovation',
      status: 'On Hold',
      type: 'Retail',
      value: '$1.2M',
      startDate: '2024-07-15',
      gc: 'Layton Construction',
      ec: 'Advanced Electric',
      owner: 'Sarah Johnson',
      tags: ['Retail'],
    },
    {
      id: 'J-007',
      name: 'City Center Office Tower',
      status: 'Backlog',
      type: 'Office',
      value: '$5.5M',
      startDate: '2024-08-01',
      gc: 'Turner Construction',
      ec: 'Summit Electric',
      owner: 'Marcus Chen',
      tags: ['High-rise', 'Commercial'],
    },
    {
      id: 'J-008',
      name: 'Airport Terminal Expansion',
      status: 'Backlog',
      type: 'Infrastructure',
      value: '$12.3M',
      startDate: '2024-09-01',
      gc: 'Hensel Phelps',
      ec: 'Miller Electric',
      owner: 'David Torres',
      tags: ['Infrastructure', 'Critical'],
    },
  ];

  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  // Mock duplicate groups - in production, this would come from an API
  const duplicateGroups: DuplicateGroup[] = [
    {
      id: 'dupe-1',
      jobs: [
        initialJobs[0], // Downtown Plaza Renovation
        {
          id: 'J-009',
          name: 'Downtown Plaza Renovation',
          status: 'Active',
          type: 'Commercial',
          value: '$2.3M',
          startDate: '2024-03-15',
          gc: 'Turner Construction',
          ec: 'Miller Electric Co.',
          owner: 'Sarah Johnson',
          tags: ['Lighting', 'Controls'],
        },
      ],
      reason: 'Similar job name',
    },
    {
      id: 'dupe-2',
      jobs: [
        initialJobs[1], // TechCorp HQ Expansion
        {
          id: 'J-010',
          name: 'TechCorp HQ Expansion Phase 1',
          status: 'Bidding',
          type: 'Office',
          value: '$1.8M',
          startDate: '2024-04-01',
          gc: 'Hensel Phelps',
          ec: 'Summit Electric',
          owner: 'Marcus Chen',
          tags: ['HVAC', 'Data Center'],
        },
      ],
      reason: 'Similar job name and GC',
    },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const stages = [
    { name: 'Backlog' as const },
    { name: 'Bidding' as const },
    { name: 'Active' as const },
    { name: 'On Hold' as const },
    { name: 'Won' as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Backlog':
        return 'bg-gray-500 text-white';
      case 'Bidding':
        return 'bg-blue-500 text-white';
      case 'Active':
        return 'bg-yellow-500 text-white';
      case 'On Hold':
        return 'bg-purple-500 text-white';
      case 'Won':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetStage = stages.find(s => `stage-${s.name}` === overId);

    if (targetStage) {
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === activeId
            ? { ...job, status: targetStage.name }
            : job
        )
      );
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeJob = activeId ? jobs.find(job => job.id === activeId) : null;

  // Rep type configurations
  const repTypeConfig = {
    electrical: {
      label: 'Electrical Rep',
      contactTypes: ['EC', 'GC', 'EE', 'Owner', 'Architect', 'Distributor'],
    },
    plumbing: {
      label: 'Plumbing Rep',
      contactTypes: ['Mechanical Contractor', 'Plumber', 'Engineer', 'GC'],
    },
    hvac: {
      label: 'HVAC Rep',
      contactTypes: ['Mechanical Contractor', 'Design Engineer', 'Commissioning Agent'],
    },
    'building-materials': {
      label: 'Building Materials Rep',
      contactTypes: ['Architect', 'GC', 'Installer', 'Distributor'],
    },
  };

  // Company type mappings for each rep type
  const companyTypeConfig = {
    electrical: {
      companyTypes: ['EC', 'GC', 'EE', 'Owner', 'Architect', 'Distributor'],
    },
    plumbing: {
      companyTypes: ['Mechanical Contractor', 'Plumber', 'Engineer', 'GC'],
    },
    hvac: {
      companyTypes: ['Mechanical Contractor', 'Design Engineer', 'Commissioning Agent'],
    },
    'building-materials': {
      companyTypes: ['Architect', 'GC', 'Installer', 'Distributor'],
    },
  };

  // Mock connected entities data
  const connectedEntities = {
    companies: [
      { id: 'CO-001', name: 'Turner Construction', companyType: 'GC', contacts: 3 },
      { id: 'CO-002', name: 'Miller Electric', companyType: 'EC', contacts: 2 },
      { id: 'CO-003', name: 'ABC Distributors', companyType: 'Distributor', contacts: 1 },
      { id: 'CO-004', name: 'Design Associates', companyType: 'EE', contacts: 2 },
    ],
    contacts: [
      { id: 'C-001', name: 'John Smith', role: 'Project Manager', company: 'Turner Construction', phone: '(555) 123-4567', contactType: 'GC' },
      { id: 'C-002', name: 'Sarah Williams', role: 'Estimator', company: 'Miller Electric', phone: '(555) 234-5678', contactType: 'EC' },
      { id: 'C-003', name: 'Mike Johnson', role: 'Superintendent', company: 'Turner Construction', phone: '(555) 345-6789', contactType: 'GC' },
      { id: 'C-004', name: 'Emily Chen', role: 'Electrical Engineer', company: 'Design Associates', phone: '(555) 456-7890', contactType: 'EE' },
      { id: 'C-005', name: 'Robert Taylor', role: 'Owner Representative', company: 'Plaza Development LLC', phone: '(555) 567-8901', contactType: 'Owner' },
    ],
    'pre-opportunities': [
      { id: 'PO-001', name: 'Hospital Expansion Opportunity', value: '$3.5M', date: '03/05/2024', status: 'Qualification' },
      { id: 'PO-002', name: 'Office Complex Lighting', value: '$1.2M', date: '03/12/2024', status: 'Researching' },
    ],
    quotes: [
      { id: 'Q-001', name: 'Initial Lighting Quote', value: '$2.3M', date: '03/01/2024', status: 'Approved' },
      { id: 'Q-002', name: 'Revised Controls Quote', value: '$450K', date: '03/10/2024', status: 'Pending' },
    ],
    orders: [
      { id: 'O-001', name: 'LED Fixtures Order', value: '$1.2M', date: '03/20/2024', status: 'Shipped' },
      { id: 'O-002', name: 'Control Systems', value: '$380K', date: '03/25/2024', status: 'Processing' },
    ],
    invoices: [
      { id: 'INV-001', name: 'Deposit Invoice', value: '$500K', date: '03/15/2024', status: 'Paid' },
      { id: 'INV-002', name: 'Progress Payment 1', value: '$800K', date: '04/01/2024', status: 'Outstanding' },
    ],
    checks: [
      { id: 'CHK-001', name: 'Deposit Payment', value: '$500K', date: '03/18/2024', status: 'Cleared' },
    ],
    documents: [
      { id: 'DOC-001', name: 'Contract Agreement.pdf', size: '2.3 MB', date: '03/01/2024', type: 'Contract' },
      { id: 'DOC-002', name: 'Site Plans.dwg', size: '15.7 MB', date: '03/05/2024', type: 'Drawing' },
      { id: 'DOC-003', name: 'Specifications.pdf', size: '4.1 MB', date: '03/08/2024', type: 'Specification' },
    ],
  };

  const toggleCategory = (category: string) => {
    if (visibleCategories.includes(category)) {
      setVisibleCategories(visibleCategories.filter(c => c !== category));
    } else {
      setVisibleCategories([...visibleCategories, category]);
    }
  };

  const toggleAllCategories = () => {
    if (visibleCategories.length === 8) {
      setVisibleCategories([]);
    } else {
      setVisibleCategories(['contacts', 'companies', 'pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'documents']);
    }
  };

  // Mock detailed company data
  const getCompanyDetails = (companyId: string) => {
    const companyData: Record<string, any> = {
      'CO-001': {
        id: 'CO-001',
        name: 'Turner Construction',
        companyType: 'GC',
        address: '375 Hudson Street, New York, NY 10014',
        phone: '(212) 229-6000',
        website: 'www.turnerconstruction.com',
        linkedin: 'https://linkedin.com/company/turner-construction',
        contacts: [
          { id: 'C-001', name: 'John Smith', role: 'Project Manager', email: 'john.smith@turner.com', phone: '(555) 123-4567', department: 'Operations' },
          { id: 'C-003', name: 'Mike Johnson', role: 'Superintendent', email: 'mike.j@turner.com', phone: '(555) 345-6789', department: 'Field Operations' },
          { id: 'C-006', name: 'Lisa Anderson', role: 'Estimator', email: 'lisa.a@turner.com', phone: '(555) 678-9012', department: 'Preconstruction' },
          { id: 'C-007', name: 'Tom Bradley', role: 'Safety Director', email: 'tom.b@turner.com', phone: '(555) 789-0123', department: 'Safety' },
        ],
        activeJobs: [
          { id: 'J-001', name: 'Downtown Plaza Renovation', value: '$2.3M', status: 'Active', role: 'GC' },
          { id: 'J-003', name: 'Riverside Medical Center', value: '$4.2M', status: 'Active', role: 'GC' },
        ],
        notes: 'Preferred GC for large commercial projects. Strong safety record.',
      },
      'CO-002': {
        id: 'CO-002',
        name: 'Miller Electric',
        companyType: 'EC',
        address: '1250 Industrial Blvd, Dallas, TX 75207',
        phone: '(214) 555-3000',
        website: 'www.millerelectric.com',
        linkedin: 'https://linkedin.com/company/miller-electric',
        contacts: [
          { id: 'C-002', name: 'Sarah Williams', role: 'Estimator', email: 'sarah.w@millerelectric.com', phone: '(555) 234-5678', department: 'Estimating' },
          { id: 'C-008', name: 'David Chen', role: 'Project Manager', email: 'david.c@millerelectric.com', phone: '(555) 890-1234', department: 'Project Management' },
        ],
        activeJobs: [
          { id: 'J-001', name: 'Downtown Plaza Renovation', value: '$2.3M', status: 'Active', role: 'EC' },
        ],
        notes: 'Reliable electrical contractor. Good pricing on LED systems.',
      },
    };
    return companyData[companyId];
  };

  // Company Detail View
  if (selectedCompany) {
    const companyDetails = getCompanyDetails(selectedCompany.id);

    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        {/* Back Button and Header */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedCompany(null)}
            className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Job
          </button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{companyDetails.name}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {companyDetails.companyType}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{companyDetails.id}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5l5 5-5 5M7 5L2 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit Company
            </button>
          </div>
        </div>

        {/* Company Information Card */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Information</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Address</label>
              <input
                type="text"
                defaultValue={companyDetails.address}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Phone</label>
              <input
                type="text"
                defaultValue={companyDetails.phone}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Website</label>
              <input
                type="text"
                defaultValue={companyDetails.website}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div className="col-span-3">
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">LinkedIn Profile</label>
              <input
                type="text"
                defaultValue={companyDetails.linkedin || ''}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Contacts at Company */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Contacts at {companyDetails.name}</h2>
            <button className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
              + Add Contact
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {companyDetails.contacts.map((contact: any) => (
                <div
                  key={contact.id}
                  className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] mb-1">{contact.name}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{contact.role}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {contact.department}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C7.82 21 2 15.18 2 8V7a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Jobs</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {companyDetails.activeJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[var(--foreground)]">{job.name}</h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          {job.status}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {job.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                        <span>{job.id}</span>
                        <span>• {job.value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (selectedJob) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        {/* Back Button and Header */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedJob(null)}
            className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Jobs
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{selectedJob.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedJob.id} • {selectedJob.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRepTypeModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                title="Rep Type Settings"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="3"/>
                  <path d="M10 1v2m0 14v2M3.93 3.93l1.41 1.41m9.9 9.9l1.41 1.41M1 10h2m14 0h2M4.34 15.66l1.41-1.41m9.9-9.9l1.41-1.41" strokeLinecap="round"/>
                </svg>
                <span className="text-sm">{repTypeConfig[repType].label}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5l5 5-5 5M7 5L2 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Job
              </button>
            </div>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Job Details</h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Value</label>
              <input
                type="text"
                defaultValue={selectedJob.value}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base font-semibold text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Start Date</label>
              <input
                type="date"
                defaultValue={selectedJob.startDate}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">General Contractor</label>
              <input
                type="text"
                defaultValue={selectedJob.gc}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Electrical Contractor</label>
              <input
                type="text"
                defaultValue={selectedJob.ec}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Owner</label>
              <input
                type="text"
                defaultValue={selectedJob.owner}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div className="col-span-3">
              <label className="text-sm text-[var(--muted-foreground)] mb-2 block">Tags</label>
              <div className="flex gap-2 flex-wrap items-center">
                {selectedJob.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full text-sm flex items-center gap-2">
                    {tag}
                    <button className="hover:text-red-500 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </span>
                ))}
                <button className="px-3 py-1 border border-dashed border-[var(--border)] text-[var(--muted-foreground)] rounded-full text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                  + Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Entities Section */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Connected Entities</h2>

            {/* Entity Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={toggleAllCategories}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.length === 8
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                All ({connectedEntities.companies.length + connectedEntities.contacts.length + connectedEntities['pre-opportunities'].length + connectedEntities.quotes.length + connectedEntities.orders.length + connectedEntities.invoices.length + connectedEntities.checks.length + connectedEntities.documents.length})
              </button>
              <button
                onClick={() => toggleCategory('contacts')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('contacts')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Contacts ({connectedEntities.contacts.length})
              </button>
              <button
                onClick={() => toggleCategory('companies')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('companies')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Companies ({connectedEntities.companies.length})
              </button>
              <button
                onClick={() => toggleCategory('pre-opportunities')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('pre-opportunities')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Pre-Opportunities ({connectedEntities['pre-opportunities'].length})
              </button>
              <button
                onClick={() => toggleCategory('quotes')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('quotes')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Quotes ({connectedEntities.quotes.length})
              </button>
              <button
                onClick={() => toggleCategory('orders')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('orders')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Orders ({connectedEntities.orders.length})
              </button>
              <button
                onClick={() => toggleCategory('invoices')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('invoices')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Invoices ({connectedEntities.invoices.length})
              </button>
              <button
                onClick={() => toggleCategory('checks')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('checks')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Checks ({connectedEntities.checks.length})
              </button>
              <button
                onClick={() => toggleCategory('documents')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('documents')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Documents ({connectedEntities.documents.length})
              </button>
            </div>
          </div>

          {/* Entities Grid - 2 Columns */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Contacts Card */}
              {visibleCategories.includes('contacts') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Contacts</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {repTypeConfig[repType].contactTypes.map((contactType) => {
                      const contact = connectedEntities.contacts.find(c => c.contactType === contactType);

                      if (contact) {
                        return (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-medium text-[var(--foreground)]">{contact.name}</h4>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {contactType}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                <span>{contact.id}</span>
                                <span>• {contact.role}</span>
                                <span>• {contact.company}</span>
                                <span>• {contact.phone}</span>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={contactType}
                            className="flex items-center justify-between p-3 border border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]/10"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-medium text-[var(--muted-foreground)] italic">No contact assigned</h4>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                                  {contactType}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--muted-foreground)]">Add a {contactType} contact for this job</p>
                            </div>
                            <button className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
                              + Add
                            </button>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}

              {/* Companies Card */}
              {visibleCategories.includes('companies') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Companies</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {companyTypeConfig[repType].companyTypes.map((companyType) => {
                      const company = connectedEntities.companies.find(c => c.companyType === companyType);

                      if (company) {
                        return (
                          <div
                            key={company.id}
                            onClick={() => setSelectedCompany(company)}
                            className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-medium text-[var(--foreground)]">{company.name}</h4>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  {companyType}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                <span>{company.id}</span>
                                <span>• {company.contacts} contacts</span>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={companyType}
                            className="flex items-center justify-between p-3 border border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]/10"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-medium text-[var(--muted-foreground)] italic">No company assigned</h4>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                                  {companyType}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--muted-foreground)]">Add a {companyType} company for this job</p>
                            </div>
                            <button className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
                              + Add
                            </button>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}

              {/* Pre-Opportunities Card */}
              {visibleCategories.includes('pre-opportunities') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Pre-Opportunities</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {connectedEntities['pre-opportunities'].map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Pre-Opportunity
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{entity.id}</span>
                            <span>• {entity.date}</span>
                            <span>• {entity.value}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entity.status === 'Qualification' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {entity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes Card */}
              {visibleCategories.includes('quotes') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Quotes</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {connectedEntities.quotes.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Quote
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{entity.id}</span>
                            <span>• {entity.date}</span>
                            <span>• {entity.value}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entity.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Card */}
              {visibleCategories.includes('orders') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Orders</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {connectedEntities.orders.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Order
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{entity.id}</span>
                            <span>• {entity.date}</span>
                            <span>• {entity.value}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entity.status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices Card */}
              {visibleCategories.includes('invoices') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Invoices</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {connectedEntities.invoices.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Invoice
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{entity.id}</span>
                            <span>• {entity.date}</span>
                            <span>• {entity.value}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entity.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {entity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checks Card */}
              {visibleCategories.includes('checks') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Checks</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {connectedEntities.checks.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Check
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{entity.id}</span>
                            <span>• {entity.date}</span>
                            <span>• {entity.value}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {entity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Card */}
              {visibleCategories.includes('documents') && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Documents</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {connectedEntities.documents.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Document
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{entity.id}</span>
                            <span>• {entity.date}</span>
                            <span>• {entity.size}</span>
                            <span>• {entity.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rep Type Settings Modal */}
        {showRepTypeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Select Rep Type</h2>
                <button
                  onClick={() => setShowRepTypeModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Choose your rep type to customize contact types and terminology
                </p>
                {(Object.keys(repTypeConfig) as Array<keyof typeof repTypeConfig>).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setRepType(type);
                      setShowRepTypeModal(false);
                    }}
                    className={`w-full text-left p-4 border rounded-lg transition-all ${
                      repType === type
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-[var(--foreground)]">{repTypeConfig[type].label}</h3>
                      {repType === type && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--primary)]">
                          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Contact types: {repTypeConfig[type].contactTypes.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDedupeModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Find Duplicates ({duplicateGroups.length})
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Kanban View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="10" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={jobFilterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Job
            </button>
          </div>
        </div>
      </div>


      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageJobs = getJobsByStatus(stage.name);

              return (
                <SortableContext
                  key={stage.name}
                  id={`stage-${stage.name}`}
                  items={stageJobs.map(job => job.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-3 py-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-900">
                          {stage.name}
                          <span className="ml-2 text-gray-500 font-normal">{stageJobs.length}</span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                      id={`stage-${stage.name}`}
                      className="min-h-[500px]"
                    >
                      {stageJobs.map((job) => (
                        <SortableJobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                      ))}
                    </div>

                    {/* Add Card Button */}
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-2">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      New
                    </button>
                  </div>
                </SortableContext>
              );
            })}
          </div>

          <DragOverlay>
            {activeJob ? <JobCard job={activeJob} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Job Name
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Value
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              GC
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              EC
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Tags
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3">
                  <h3 className="font-medium text-[var(--foreground)] mb-1">{job.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{job.id}</p>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.type}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-medium text-[var(--foreground)]">{job.value}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.gc}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.ec}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deduplication Modal - List of Duplicate Groups */}
      {showDedupeModal && mergeStrategy === 'keep' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Potential Duplicate Jobs</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Found {duplicateGroups.length} groups of potential duplicates
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDedupeModal(false);
                  setSelectedDuplicateGroup(null);
                  setPrimaryJob(null);
                }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {duplicateGroups.map((group) => (
                <div key={group.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--muted)]/30 px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-[var(--foreground)]">Duplicate Group</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                          Reason: {group.reason}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const jobToKeep = primaryJob && selectedDuplicateGroup?.id === group.id
                              ? primaryJob
                              : group.jobs[0].id;
                            console.log('Keep job:', jobToKeep, 'Delete others');
                            setShowDedupeModal(false);
                            setSelectedDuplicateGroup(null);
                            setPrimaryJob(null);
                          }}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Keep & Merge
                        </button>
                        <button
                          onClick={() => {
                            setMergeStrategy('combine');
                            setSelectedDuplicateGroup(group);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Combine Information
                        </button>
                        <button
                          onClick={() => console.log('Skip group:', group.id)}
                          className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {group.jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          setSelectedDuplicateGroup(group);
                          setPrimaryJob(job.id);
                        }}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedDuplicateGroup?.id === group.id && primaryJob === job.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-[var(--foreground)]">{job.name}</h4>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {job.id}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                              <div>
                                <span className="text-[var(--muted-foreground)]">Status: </span>
                                <span className="text-[var(--foreground)] font-medium">{job.status}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Type: </span>
                                <span className="text-[var(--foreground)]">{job.type}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Value: </span>
                                <span className="text-[var(--foreground)]">{job.value}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Start Date: </span>
                                <span className="text-[var(--foreground)]">{job.startDate}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">GC: </span>
                                <span className="text-[var(--foreground)]">{job.gc}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">EC: </span>
                                <span className="text-[var(--foreground)]">{job.ec}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Owner: </span>
                                <span className="text-[var(--foreground)]">{job.owner}</span>
                              </div>
                            </div>
                            {job.tags.length > 0 && (
                              <div className="mt-3 flex gap-1.5 flex-wrap">
                                {job.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Combine Information Modal */}
      {showDedupeModal && mergeStrategy === 'combine' && selectedDuplicateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Combine Job Information</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Select which information to keep for the merged job
                </p>
              </div>
              <button
                onClick={() => {
                  setMergeStrategy('keep');
                  setSelectedDuplicateGroup(null);
                }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 10l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Review Combined Information</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Click on each field below to select which value to keep in the merged job. All other duplicate jobs will be deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Job Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Job Name</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDuplicateGroup.jobs.map((job) => (
                      <button
                        key={job.id}
                        className="text-left p-3 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                      >
                        <div className="font-medium text-[var(--foreground)]">{job.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">From {job.id}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDuplicateGroup.jobs.map((job) => (
                      <button
                        key={job.id}
                        className="text-left p-3 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                      >
                        <div className="font-medium text-[var(--foreground)]">{job.status}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">From {job.id}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Value</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDuplicateGroup.jobs.map((job) => (
                      <button
                        key={job.id}
                        className="text-left p-3 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                      >
                        <div className="font-medium text-[var(--foreground)]">{job.value}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">From {job.id}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GC */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">General Contractor</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDuplicateGroup.jobs.map((job) => (
                      <button
                        key={job.id}
                        className="text-left p-3 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                      >
                        <div className="font-medium text-[var(--foreground)]">{job.gc}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">From {job.id}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EC */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Electrical Contractor</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDuplicateGroup.jobs.map((job) => (
                      <button
                        key={job.id}
                        className="text-left p-3 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                      >
                        <div className="font-medium text-[var(--foreground)]">{job.ec}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">From {job.id}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setMergeStrategy('keep');
                    setSelectedDuplicateGroup(null);
                  }}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    console.log('Merge jobs with selected fields');
                    setShowDedupeModal(false);
                    setMergeStrategy('keep');
                    setSelectedDuplicateGroup(null);
                  }}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Merge Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
