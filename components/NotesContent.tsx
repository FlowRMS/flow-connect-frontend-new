'use client';

import React, { useState } from 'react';

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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Notes</h1>
          </div>
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
      <div className="mb-6">
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

      {/* Tag Filters */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedTag === tag
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {tag}
              {tag === 'All' && <span className="ml-2 text-xs opacity-75">({notes.length})</span>}
              {tag !== 'All' && (
                <span className="ml-2 text-xs opacity-75">
                  ({notes.filter(n => n.tags.includes(tag)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pb-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
            </svg>
            Sort
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
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
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                    </svg>
                    {note.comments}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </main>
  );
}
