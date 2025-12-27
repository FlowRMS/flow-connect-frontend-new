'use client';

import React from 'react';
import {
  mockLinkedPreOpps,
  mockLinkedOrders,
  mockLinkedInvoices,
  mockLinkedCommissionStatements,
  mockLinkedContacts,
  mockLinkedCompanies,
  mockLinkedTags,
} from '../data';

export function LinkedObjectsTab() {
  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Linked Objects</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Related entities connected to this quote</p>
      </div>

      {/* Pre-Opportunities */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Pre-Opportunities</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedPreOpps.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Link Pre-Opp</button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {mockLinkedPreOpps.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{item.id}</span>
                <span className="text-sm text-[var(--foreground)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[var(--foreground)]">${item.value.toLocaleString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
              <rect x="2" y="3" width="20" height="18" rx="2"/>
              <path d="M8 7h8M8 11h8M8 15h4"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Orders</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedOrders.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Link Order</button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {mockLinkedOrders.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{item.id}</span>
                <span className="text-sm text-[var(--foreground)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[var(--foreground)]">${item.value.toLocaleString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'shipped' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M9 13h6M9 17h3"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Invoices</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedInvoices.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Link Invoice</button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {mockLinkedInvoices.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{item.id}</span>
                <span className="text-sm text-[var(--foreground)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[var(--foreground)]">${item.value.toLocaleString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Statements */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Commission Statements</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedCommissionStatements.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Link Statement</button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {mockLinkedCommissionStatements.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{item.id}</span>
                <span className="text-sm text-[var(--foreground)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-green-600">${item.value.toLocaleString()}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Contacts</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedContacts.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Link Contact</button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {mockLinkedContacts.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-xs font-medium">
                  {item.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{item.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{item.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[var(--foreground)]">{item.company}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{item.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Companies */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Companies</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedCompanies.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Link Company</button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {mockLinkedCompanies.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                  {item.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{item.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{item.city}, {item.state}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'Customer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
            </svg>
            <span className="font-medium text-[var(--foreground)]">Tags</span>
            <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{mockLinkedTags.length}</span>
          </div>
          <button className="text-xs text-[var(--primary)] hover:underline">+ Add Tag</button>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {mockLinkedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
              <button className="ml-1 hover:opacity-70">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
