'use client';

import React, { useState } from 'react';

type Activity = {
  id: string;
  type: 'task' | 'note' | 'pre_quote' | 'quote';
  description: string;
  date: string;
  points: number;
  tags?: string[];
};

type SalesPerson = {
  id: string;
  name: string;
  totalPoints: number;
  percentage: number;
  activities: Activity[];
};

type CreditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quoteName?: string;
};

const activityTypeLabels: Record<string, string> = {
  task: 'Task',
  note: 'Note',
  pre_quote: 'Pre-Quote',
  quote: 'Quote',
};

const activityTypeColors: Record<string, { bg: string; text: string }> = {
  task: { bg: 'bg-blue-100', text: 'text-blue-700' },
  note: { bg: 'bg-green-100', text: 'text-green-700' },
  pre_quote: { bg: 'bg-orange-100', text: 'text-orange-700' },
  quote: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function CreditModal({ isOpen, onClose, quoteName }: CreditModalProps) {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  if (!isOpen) return null;

  // Mock data - in real app this would come from API based on quote activities
  const salesPeople: SalesPerson[] = [
    {
      id: '1',
      name: 'John Smith',
      totalPoints: 215,
      percentage: 45,
      activities: [
        { id: 'a1', type: 'quote', description: 'Created initial quote', date: '2024-12-08', points: 50, tags: ['large'] },
        { id: 'a2', type: 'task', description: 'Customer follow-up call', date: '2024-12-07', points: 15, tags: ['urgent'] },
        { id: 'a3', type: 'quote', description: 'Quote revision v2', date: '2024-12-06', points: 50 },
        { id: 'a4', type: 'note', description: 'Customer meeting notes', date: '2024-12-05', points: 5 },
        { id: 'a5', type: 'pre_quote', description: 'Initial pricing discussion', date: '2024-12-04', points: 25 },
        { id: 'a6', type: 'task', description: 'Sent product specs', date: '2024-12-03', points: 10 },
        { id: 'a7', type: 'quote', description: 'Quote revision v3', date: '2024-12-02', points: 50 },
        { id: 'a8', type: 'note', description: 'Technical requirements gathered', date: '2024-12-01', points: 10 },
      ],
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      totalPoints: 145,
      percentage: 30,
      activities: [
        { id: 'b1', type: 'pre_quote', description: 'Budget qualification', date: '2024-12-07', points: 25 },
        { id: 'b2', type: 'task', description: 'Site visit coordination', date: '2024-12-06', points: 15, tags: ['urgent'] },
        { id: 'b3', type: 'note', description: 'Site survey notes', date: '2024-12-05', points: 5 },
        { id: 'b4', type: 'quote', description: 'Quote assistance - pricing review', date: '2024-12-04', points: 50, tags: ['large'] },
        { id: 'b5', type: 'task', description: 'Manufacturer coordination', date: '2024-12-03', points: 10 },
        { id: 'b6', type: 'pre_quote', description: 'Technical scope review', date: '2024-12-02', points: 25 },
        { id: 'b7', type: 'note', description: 'Customer requirements summary', date: '2024-12-01', points: 5 },
        { id: 'b8', type: 'task', description: 'Contract preparation', date: '2024-11-30', points: 10 },
      ],
    },
    {
      id: '3',
      name: 'Mike Davis',
      totalPoints: 120,
      percentage: 25,
      activities: [
        { id: 'c1', type: 'task', description: 'Initial lead qualification', date: '2024-12-05', points: 10 },
        { id: 'c2', type: 'note', description: 'Lead source documentation', date: '2024-12-04', points: 5 },
        { id: 'c3', type: 'pre_quote', description: 'Preliminary estimate', date: '2024-12-03', points: 25 },
        { id: 'c4', type: 'task', description: 'Customer introduction', date: '2024-12-02', points: 10 },
        { id: 'c5', type: 'quote', description: 'Quote review and edits', date: '2024-12-01', points: 50, tags: ['large'] },
        { id: 'c6', type: 'note', description: 'Competitor analysis', date: '2024-11-30', points: 5 },
        { id: 'c7', type: 'task', description: 'Follow-up email', date: '2024-11-29', points: 15, tags: ['urgent'] },
      ],
    },
  ];

  const totalPoints = salesPeople.reduce((sum, p) => sum + p.totalPoints, 0);
  const selectedPersonData = salesPeople.find(p => p.id === selectedPerson);

  // Group activities by type for the selected person
  const getActivityBreakdown = (person: SalesPerson) => {
    const breakdown: Record<string, { count: number; points: number }> = {
      task: { count: 0, points: 0 },
      note: { count: 0, points: 0 },
      pre_quote: { count: 0, points: 0 },
      quote: { count: 0, points: 0 },
    };

    person.activities.forEach(activity => {
      breakdown[activity.type].count++;
      breakdown[activity.type].points += activity.points;
    });

    return breakdown;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-500/30 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Sale Credit</h2>
            {quoteName && (
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{quoteName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedPerson ? (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--muted)]/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)]">{salesPeople.length}</p>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Contributors</p>
                </div>
                <div className="bg-[var(--muted)]/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)]">{totalPoints}</p>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Total Points</p>
                </div>
                <div className="bg-[var(--muted)]/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {salesPeople.reduce((sum, p) => sum + p.activities.length, 0)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Activities</p>
                </div>
              </div>

              {/* Salespeople List */}
              {salesPeople.map((person) => {
                const breakdown = getActivityBreakdown(person);
                return (
                  <button
                    key={person.id}
                    onClick={() => setSelectedPerson(person.id)}
                    className="w-full p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--foreground)]">{person.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{person.activities.length} activities</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase">Points</div>
                          <div className="font-bold text-[var(--foreground)]">{person.totalPoints}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase">Credit</div>
                          <div className="font-bold text-[var(--primary)]">{person.percentage}%</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors">
                          <path d="M8 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* Activity type badges */}
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(breakdown).map(([type, data]) => data.count > 0 && (
                        <span
                          key={type}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${activityTypeColors[type].bg} ${activityTypeColors[type].text}`}
                        >
                          {data.count} {activityTypeLabels[type]}{data.count !== 1 ? 's' : ''} ({data.points} pts)
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : selectedPersonData && (
            <div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="flex items-center gap-1 text-[var(--primary)] hover:underline mb-4 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to all contributors
              </button>

              {/* Person Summary */}
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-lg">
                    {selectedPersonData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">{selectedPersonData.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{selectedPersonData.activities.length} activities</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)]">{selectedPersonData.totalPoints}</div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--primary)]">{selectedPersonData.percentage}%</div>
                      <div className="text-xs text-[var(--muted-foreground)] uppercase">Credit</div>
                    </div>
                  </div>
                </div>

                {/* Breakdown by type */}
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(getActivityBreakdown(selectedPersonData)).map(([type, data]) => (
                    <div key={type} className={`rounded-lg p-3 ${activityTypeColors[type].bg}`}>
                      <div className={`text-lg font-bold ${activityTypeColors[type].text}`}>{data.points}</div>
                      <div className={`text-xs ${activityTypeColors[type].text} opacity-80`}>
                        {data.count} {activityTypeLabels[type]}{data.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity List */}
              <div>
                <h4 className="font-semibold text-[var(--foreground)] mb-3">Activity History</h4>
                <div className="space-y-2">
                  {selectedPersonData.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${activityTypeColors[activity.type].bg} ${activityTypeColors[activity.type].text}`}>
                          {activityTypeLabels[activity.type]}
                        </span>
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{activity.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[var(--muted-foreground)]">{activity.date}</span>
                            {activity.tags && activity.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-[var(--primary)] whitespace-nowrap">
                        +{activity.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex-shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
