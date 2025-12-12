'use client';

import React, { useState, useEffect } from 'react';

type Activity = {
  id: string;
  type: 'task' | 'note' | 'quote';
  description: string;
  date: string;
  basePoints: number;
  tags: string[];
  appliedMultiplier: number;
  finalPoints: number;
};

type PersonCredit = {
  id: string;
  name: string;
  totalPoints: number;
  creditPercentage: number;
  activities: Activity[];
};

type SeekCreditDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'quote' | 'preopportunity';
  entityId: string;
};

// Mock data for demo
const mockPeopleCredits: PersonCredit[] = [
  {
    id: '1',
    name: 'John Smith',
    totalPoints: 215,
    creditPercentage: 45,
    activities: [
      {
        id: 'a1',
        type: 'quote',
        description: 'Created initial quote Q-2024-001',
        date: '2024-12-08',
        basePoints: 50,
        tags: ['large'],
        appliedMultiplier: 2.0,
        finalPoints: 100,
      },
      {
        id: 'a2',
        type: 'task',
        description: 'Follow-up call with client',
        date: '2024-12-07',
        basePoints: 10,
        tags: ['urgent'],
        appliedMultiplier: 1.5,
        finalPoints: 15,
      },
      {
        id: 'a3',
        type: 'note',
        description: 'Added client requirements documentation',
        date: '2024-12-06',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
      {
        id: 'a4',
        type: 'task',
        description: 'Coordinated with engineering team',
        date: '2024-12-05',
        basePoints: 10,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 10,
      },
      {
        id: 'a5',
        type: 'quote',
        description: 'Updated quote with revised pricing',
        date: '2024-12-09',
        basePoints: 50,
        tags: ['large'],
        appliedMultiplier: 1.5,
        finalPoints: 75,
      },
      {
        id: 'a6',
        type: 'note',
        description: 'Meeting notes from client discussion',
        date: '2024-12-04',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
      {
        id: 'a7',
        type: 'note',
        description: 'Technical specifications documented',
        date: '2024-12-03',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
    ],
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    totalPoints: 145,
    creditPercentage: 30,
    activities: [
      {
        id: 'b1',
        type: 'task',
        description: 'Site visit and measurements',
        date: '2024-12-08',
        basePoints: 10,
        tags: ['urgent'],
        appliedMultiplier: 1.5,
        finalPoints: 15,
      },
      {
        id: 'b2',
        type: 'note',
        description: 'Site visit notes and photos',
        date: '2024-12-08',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
      {
        id: 'b3',
        type: 'quote',
        description: 'Created alternative quote option',
        date: '2024-12-07',
        basePoints: 50,
        tags: ['large'],
        appliedMultiplier: 2.0,
        finalPoints: 100,
      },
      {
        id: 'b4',
        type: 'task',
        description: 'Vendor pricing research',
        date: '2024-12-06',
        basePoints: 10,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 10,
      },
      {
        id: 'b5',
        type: 'note',
        description: 'Vendor comparison notes',
        date: '2024-12-05',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
      {
        id: 'b6',
        type: 'task',
        description: 'Client presentation prep',
        date: '2024-12-04',
        basePoints: 10,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 10,
      },
    ],
  },
  {
    id: '3',
    name: 'Mike Davis',
    totalPoints: 120,
    creditPercentage: 25,
    activities: [
      {
        id: 'c1',
        type: 'task',
        description: 'Technical specification review',
        date: '2024-12-09',
        basePoints: 10,
        tags: ['urgent'],
        appliedMultiplier: 1.5,
        finalPoints: 15,
      },
      {
        id: 'c2',
        type: 'task',
        description: 'Cost analysis and breakdown',
        date: '2024-12-08',
        basePoints: 10,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 10,
      },
      {
        id: 'c3',
        type: 'quote',
        description: 'Created supplemental quote',
        date: '2024-12-07',
        basePoints: 50,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 50,
      },
      {
        id: 'c4',
        type: 'note',
        description: 'Cost breakdown documentation',
        date: '2024-12-06',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
      {
        id: 'c5',
        type: 'task',
        description: 'Product availability check',
        date: '2024-12-05',
        basePoints: 10,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 10,
      },
      {
        id: 'c6',
        type: 'note',
        description: 'Product lead time notes',
        date: '2024-12-05',
        basePoints: 5,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 5,
      },
      {
        id: 'c7',
        type: 'task',
        description: 'Quality review of specifications',
        date: '2024-12-04',
        basePoints: 10,
        tags: ['urgent'],
        appliedMultiplier: 1.5,
        finalPoints: 15,
      },
      {
        id: 'c8',
        type: 'task',
        description: 'Coordinated with project manager',
        date: '2024-12-03',
        basePoints: 10,
        tags: [],
        appliedMultiplier: 1.0,
        finalPoints: 10,
      },
    ],
  },
];

export default function SeekCreditDialog({ isOpen, onClose, entityType, entityId }: SeekCreditDialogProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const selectedPerson = mockPeopleCredits.find(p => p.id === selectedPersonId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Credit for Sale</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {entityType === 'quote' ? 'Quote' : 'Pre-Opportunity'} #{entityId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedPerson ? (
            // List of people with their credits
            <div className="space-y-3">
              {mockPeopleCredits.map((person) => (
                <button
                  key={person.id}
                  onClick={() => setSelectedPersonId(person.id)}
                  className="w-full p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--muted)]/30 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[var(--foreground)]">{person.name}</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-[var(--muted-foreground)]">Points</div>
                        <div className="font-semibold text-[var(--foreground)]">{person.totalPoints}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--muted-foreground)]">Credit</div>
                        <div className="font-semibold text-[var(--primary)]">{person.creditPercentage}%</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {person.activities.filter(a => a.type === 'task').length} Tasks
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      {person.activities.filter(a => a.type === 'note').length} Notes
                    </span>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      {person.activities.filter(a => a.type === 'quote').length} Quotes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Detailed activity breakdown for selected person
            <div>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setSelectedPersonId(null)}
                  className="text-[var(--primary)] hover:underline text-sm flex items-center gap-1"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 16l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              </div>

              <div className="mb-6 p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{selectedPerson.name}</h3>
                <div className="flex gap-6">
                  <div>
                    <div className="text-sm text-[var(--muted-foreground)]">Total Points</div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">{selectedPerson.totalPoints}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--muted-foreground)]">Credit Percentage</div>
                    <div className="text-2xl font-bold text-[var(--primary)]">{selectedPerson.creditPercentage}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--muted-foreground)]">Activities</div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">{selectedPerson.activities.length}</div>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase">Activity Breakdown</h4>
              <div className="space-y-2">
                {selectedPerson.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            activity.type === 'task' ? 'bg-blue-100 text-blue-700' :
                            activity.type === 'note' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </span>
                          {activity.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">{activity.description}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{activity.date}</p>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {activity.basePoints} × {activity.appliedMultiplier.toFixed(1)}
                        </div>
                        <div className="text-lg font-semibold text-[var(--primary)]">
                          {activity.finalPoints} pts
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
