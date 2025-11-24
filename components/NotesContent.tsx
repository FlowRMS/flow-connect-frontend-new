'use client';

import React, { useState } from 'react';
import NoteModal from './NoteModal';
import AdvancedFilters from './AdvancedFilters';

type Note = {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdDate: string;
  tags: string[];
  entityType?: string;
  entityName?: string;
  mentions: string[];
  attachments: number;
  comments: number;
};

export default function NotesContent() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'read'>('grid');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);

  const noteFilterOptions = [
    { id: 'note-id', label: 'Note ID', type: 'text' as const },
    { id: 'title', label: 'Title', type: 'text' as const },
    { id: 'content', label: 'Content', type: 'text' as const },
    { id: 'created-by', label: 'Created By', type: 'dropdown' as const },
    { id: 'created-date', label: 'Created Date', type: 'date' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
    { id: 'entity-type', label: 'Entity Type', type: 'dropdown' as const },
    { id: 'entity-name', label: 'Entity Name', type: 'dropdown' as const },
    { id: 'mentions', label: 'Mentions', type: 'dropdown' as const },
    { id: 'has-attachments', label: 'Has Attachments', type: 'dropdown' as const },
  ];

  const initialNotes: Note[] = [
    {
      id: 'N-001',
      title: 'Downtown Plaza - Lighting Meeting Notes',
      content: 'Met with Turner Construction PM and Miller Electric to discuss lighting control requirements. Key takeaways: Need dimming on all zones, prefer wireless controls, budget is flexible for quality system. Action: Send quote for Lutron system by Friday.',
      createdBy: 'Sarah Johnson',
      createdDate: '2024-11-22',
      tags: ['Meeting', 'Lighting', 'Controls'],
      entityType: 'Job',
      entityName: 'Downtown Plaza Renovation',
      mentions: ['@Turner Construction', '@Miller Electric'],
      attachments: 2,
      comments: 3,
    },
    {
      id: 'N-002',
      title: 'TechCorp HQ - HVAC Controls Opportunity',
      content: 'Initial conversation with facility manager. Building has aging pneumatic controls that need replacement. Looking at BACnet system with web interface. Timeline: Design in Q1, install Q2. Estimated value: $300K. Competitors: Johnson Controls, Honeywell.',
      createdBy: 'Marcus Chen',
      createdDate: '2024-11-21',
      tags: ['Opportunity', 'HVAC', 'Controls'],
      entityType: 'Pre-Opportunity',
      entityName: 'TechCorp HVAC Controls',
      mentions: ['@David Torres'],
      attachments: 1,
      comments: 5,
    },
    {
      id: 'N-003',
      title: 'Riverside Medical - Site Visit Observations',
      content: 'Walked the job site today. Panel locations approved, but need to coordinate with EC on conduit routing. Critical: All work in patient areas must be done after hours. Safety protocols are strict - need badging for all technicians. Follow up with McCarthy PM on schedule.',
      createdBy: 'Sarah Johnson',
      createdDate: '2024-11-20',
      tags: ['Site Visit', 'Healthcare', 'Coordination'],
      entityType: 'Job',
      entityName: 'Riverside Medical Center',
      mentions: ['@McCarthy Building'],
      attachments: 5,
      comments: 2,
    },
    {
      id: 'N-004',
      title: 'Q4 Strategy - West Territory',
      content: 'Focus areas for Q4: Push LED retrofits to existing healthcare clients, develop relationships with new GCs in commercial sector, attend NECA regional meeting. Goals: 3 new GC relationships, 5 LED proposals submitted, close University Lab deal.',
      createdBy: 'Sarah Johnson',
      createdDate: '2024-11-19',
      tags: ['Strategy', 'Planning'],
      mentions: [],
      attachments: 0,
      comments: 1,
    },
    {
      id: 'N-005',
      title: 'Miller Electric - Q1 Pricing Discussion',
      content: 'Call with Jennifer Walsh re: upcoming price increases. LED fixtures going up 8% in January, controls staying flat. Discussed stocking programs - they want to carry more inventory if we can improve delivery. Need factory approval on consignment.',
      createdBy: 'Marcus Chen',
      createdDate: '2024-11-18',
      tags: ['Pricing', 'EC', 'Distributor'],
      entityType: 'Contact',
      entityName: 'Jennifer Walsh',
      mentions: ['@Miller Electric'],
      attachments: 1,
      comments: 0,
    },
    {
      id: 'N-006',
      title: 'University Lab - Factory Engineering Support',
      content: 'Spoke with factory engineering about custom panel requirements. They can meet the specs but need 12-week lead time. Cost adder is $15K. Waiting on electrical drawings from engineer to finalize quote. Check back next week.',
      createdBy: 'David Torres',
      createdDate: '2024-11-17',
      tags: ['Engineering', 'Education', 'Custom'],
      entityType: 'Job',
      entityName: 'University Lab Building',
      mentions: [],
      attachments: 3,
      comments: 4,
    },
    {
      id: 'N-007',
      title: 'Skanska - Lunch and Learn Presentation',
      content: 'Presented new LED product line to Skanska estimating team (8 people attended). Good engagement, lots of questions about energy savings and rebates. They\'re working on 3 upcoming education projects that could be good fits. Follow up: Send product sheets and case studies.',
      createdBy: 'Sarah Johnson',
      createdDate: '2024-11-16',
      tags: ['Lunch-and-Learn', 'GC', 'Education'],
      entityType: 'Company',
      entityName: 'Skanska USA',
      mentions: [],
      attachments: 4,
      comments: 2,
    },
    {
      id: 'N-008',
      title: 'Harbor View Apartments - Bid Strategy',
      content: 'Reviewed bid package with team. Multi-family project, 120 units. Standard spec but tight budget. Strategy: Use value line fixtures, minimize customization, leverage factory rebate program. Target price: $890K. Submission deadline: Friday.',
      createdBy: 'Marcus Chen',
      createdDate: '2024-11-15',
      tags: ['Bidding', 'Residential', 'Strategy'],
      entityType: 'Job',
      entityName: 'Harbor View Apartments',
      mentions: ['@Bay Area Electric'],
      attachments: 2,
      comments: 6,
    },
    {
      id: 'N-009',
      title: 'Prime Electric - Relationship Building',
      content: 'Coffee meeting with Rachel Kim, their new Chief Estimator. She came from commercial background, looking to learn more about our education/institutional products. Very engaged, asked about training opportunities. This could be a great relationship - they do a lot of university work.',
      createdBy: 'David Torres',
      createdDate: '2024-11-14',
      tags: ['Relationship', 'EC', 'Education'],
      entityType: 'Contact',
      entityName: 'Rachel Kim',
      mentions: ['@Prime Electric'],
      attachments: 0,
      comments: 1,
    },
    {
      id: 'N-010',
      title: 'Trade Show Planning - LightFair 2025',
      content: 'Planning meeting for LightFair booth. Budget approved: $50K. Goals: Launch new product line, meet with top 20 distributors, schedule 30+ customer meetings. Team: All three reps attending. Need to coordinate travel and hotel by end of month.',
      createdBy: 'Marcus Chen',
      createdDate: '2024-11-13',
      tags: ['Trade Show', 'Planning', 'Events'],
      mentions: ['@Sarah Johnson', '@David Torres'],
      attachments: 1,
      comments: 8,
    },
  ];

  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  const tagOptions = ['All', ...allTags.sort()];

  const filteredNotes = notes.filter(note => {
    const matchesTag = selectedTag === 'All' || note.tags.includes(selectedTag);
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Notes</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
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
              <button
                onClick={() => setViewMode('read')}
                className={`p-2 rounded ${viewMode === 'read' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Read View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={noteFilterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button
              onClick={() => setShowSummarizeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Summarize with FlowChat
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              New Note
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search notes by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>


      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Note Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-[var(--foreground)] text-base">{note.title}</h3>
                </div>
                <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="4" r="1.5"/>
                    <circle cx="10" cy="10" r="1.5"/>
                    <circle cx="10" cy="16" r="1.5"/>
                  </svg>
                </button>
              </div>

              {/* Note Content */}
              <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-3">
                {note.content}
              </p>

              {/* Entity Link */}
              {note.entityType && note.entityName && (
                <div className="mb-3 flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                    {note.entityType}
                  </span>
                  <span className="text-[var(--muted-foreground)]">{note.entityName}</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {note.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Mentions */}
              {note.mentions.length > 0 && (
                <div className="mb-3 text-xs text-[var(--muted-foreground)]">
                  {note.mentions.map((mention, idx) => (
                    <span key={idx} className="text-[var(--primary)] mr-2">{mention}</span>
                  ))}
                </div>
              )}

              {/* Note Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-xs font-semibold`}>
                    {getInitials(note.createdBy)}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {note.createdBy} · {formatDate(note.createdDate)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  {note.attachments > 0 && (
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2l-8 8-4-4" strokeLinecap="round"/>
                        <path d="M3 10l6 6 11-11" strokeLinecap="round"/>
                      </svg>
                      {note.attachments}
                    </div>
                  )}
                  {note.comments > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNote(note);
                      }}
                      className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                      </svg>
                      {note.comments}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="p-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                    {getInitials(note.createdBy)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] text-base mb-1">{note.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span>{note.createdBy}</span>
                          <span>·</span>
                          <span>{formatDate(note.createdDate)}</span>
                        </div>
                      </div>
                      <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                          <circle cx="10" cy="4" r="1.5"/>
                          <circle cx="10" cy="10" r="1.5"/>
                          <circle cx="10" cy="16" r="1.5"/>
                        </svg>
                      </button>
                    </div>

                    {/* Note Content */}
                    <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                      {note.content}
                    </p>

                    {/* Entity Link */}
                    {note.entityType && note.entityName && (
                      <div className="mb-2 flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                          {note.entityType}
                        </span>
                        <span className="text-[var(--muted-foreground)]">{note.entityName}</span>
                      </div>
                    )}

                    {/* Tags and Metadata */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex gap-1.5 flex-wrap">
                        {note.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {note.attachments > 0 && (
                        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2l-8 8-4-4" strokeLinecap="round"/>
                            <path d="M3 10l6 6 11-11" strokeLinecap="round"/>
                          </svg>
                          {note.attachments}
                        </div>
                      )}
                      {note.comments > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNote(note);
                          }}
                          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                          </svg>
                          {note.comments}
                        </button>
                      )}
                      {note.mentions.length > 0 && (
                        <div className="flex gap-1 text-xs">
                          {note.mentions.map((mention, idx) => (
                            <span key={idx} className="text-[var(--primary)]">{mention}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Read View */}
      {viewMode === 'read' && (
        <div className="max-w-4xl mx-auto space-y-8">
          {filteredNotes.map((note, index) => (
            <div key={note.id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
              {/* Note Header */}
              <div className="border-b border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">{note.title}</h2>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-sm font-semibold`}>
                        {getInitials(note.createdBy)}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        <span className="font-medium text-[var(--foreground)]">{note.createdBy}</span>
                        <span className="mx-2">·</span>
                        <span>{formatDate(note.createdDate)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)] font-mono">{note.id}</span>
                </div>

                {/* Entity Link */}
                {note.entityType && note.entityName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                      {note.entityType}
                    </span>
                    <span className="text-[var(--foreground)]">{note.entityName}</span>
                  </div>
                )}
              </div>

              {/* Note Content */}
              <div className="px-6 py-5">
                <div className="prose prose-sm max-w-none text-[var(--foreground)]">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </div>

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tags:</span>
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mentions */}
                {note.mentions.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Mentioned:</span>
                    {note.mentions.map((mention, idx) => (
                      <span key={idx} className="text-sm text-[var(--primary)] font-medium">{mention}</span>
                    ))}
                  </div>
                )}

                {/* Attachments */}
                {note.attachments > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-[var(--muted-foreground)]">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2l-8 8-4-4" strokeLinecap="round"/>
                      <path d="M3 10l6 6 11-11" strokeLinecap="round"/>
                    </svg>
                    <span>{note.attachments} attachment{note.attachments !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              {note.comments > 0 && (
                <div className="border-t border-[var(--border)] bg-[var(--muted)]/10 px-6 py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm font-semibold text-[var(--foreground)]">{note.comments} Comment{note.comments !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Sample Comments */}
                  <div className="space-y-4">
                    {/* Comment 1 */}
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        DT
                      </div>
                      <div className="flex-1">
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[var(--foreground)]">David Torres</span>
                            <span className="text-xs text-[var(--muted-foreground)]">2 days ago</span>
                          </div>
                          <p className="text-sm text-[var(--foreground)]">
                            Great notes! I'll follow up with them on the pricing details.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comment 2 */}
                    {note.comments > 1 && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          MC
                        </div>
                        <div className="flex-1">
                          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-[var(--foreground)]">Marcus Chen</span>
                              <span className="text-xs text-[var(--muted-foreground)]">1 day ago</span>
                            </div>
                            <p className="text-sm text-[var(--foreground)]">
                              Thanks for capturing this. Let's discuss in our next team meeting.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Note Divider */}
              {index < filteredNotes.length - 1 && (
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mt-8" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-12 text-center">
          <svg className="mx-auto mb-4 w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No notes found</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Note Modal */}
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}

      {/* Summarize Modal */}
      {showSummarizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Summarize with FlowChat</h2>
                  <p className="text-sm text-white/80">Select filters to generate AI summary</p>
                </div>
              </div>
              <button
                onClick={() => setShowSummarizeModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-4 py-2.5 border-2 border-purple-600 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
                    All Time
                  </button>
                  <button className="px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Yesterday
                  </button>
                  <button className="px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Last Week
                  </button>
                  <button className="px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Current Year
                  </button>
                </div>
              </div>

              {/* Created By Filter */}
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Created By</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" defaultChecked />
                    <span className="text-sm">All Users</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm">Sarah Johnson</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm">Marcus Chen</span>
                  </label>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {['Meeting', 'Opportunity', 'Site Visit', 'Strategy', 'Pricing', 'Follow-up'].map((tag) => (
                    <label key={tag} className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-full hover:bg-[var(--muted)] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Entity Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm">Job</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm">Pre-Opportunity</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm">Contact</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm">Company</span>
                  </label>
                </div>
              </div>

              {/* Summary Options */}
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">Summary Type</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border-2 border-purple-600 bg-purple-50 rounded-lg cursor-pointer transition-colors">
                    <input type="radio" name="summaryType" className="w-4 h-4 accent-purple-600" defaultChecked />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-purple-900">Brief Overview</div>
                      <div className="text-xs text-purple-700">High-level summary with key points</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="radio" name="summaryType" className="w-4 h-4 accent-purple-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Detailed Analysis</div>
                      <div className="text-xs text-[var(--muted-foreground)]">In-depth summary with insights and trends</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors">
                    <input type="radio" name="summaryType" className="w-4 h-4 accent-purple-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Action Items</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Focus on next steps and tasks</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[var(--muted)]/30 px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
              <div className="text-sm text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">{filteredNotes.length}</span> notes selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSummarizeModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md">
                  Generate Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
