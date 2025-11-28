/**
 * Rules List View Component
 */

import React from 'react';
import type { Rule } from '../types';
import { getStatusColor, formatDate } from '../utils';

interface RulesListViewProps {
  rules: Rule[];
}

export default function RulesListView({ rules }: RulesListViewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="col-span-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Rule Name
          </div>
          <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Trigger
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Emails Sent
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Last Triggered
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
            >
              <div className="col-span-4">
                <h3 className="font-medium text-[var(--foreground)] mb-1">{rule.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">{rule.subject}</p>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="text-sm text-[var(--foreground)]">{rule.trigger}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(rule.status)}`}>
                  {rule.status}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--foreground)]">{rule.emailsSent}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {rule.lastTriggered ? formatDate(rule.lastTriggered) : 'Never'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
