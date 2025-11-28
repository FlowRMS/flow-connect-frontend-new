/**
 * Connected Entities Section Component
 */

import React from 'react';
import type { ConnectedEntities, RepType } from '../types';
import { REP_TYPE_CONFIG, COMPANY_TYPE_CONFIG } from '../constants';

interface ConnectedEntitiesSectionProps {
  entities: ConnectedEntities;
  visibleCategories: string[];
  repType: RepType;
  onToggleCategory: (category: string) => void;
  onToggleAll: () => void;
  onCompanyClick?: (company: any) => void;
}

export function ConnectedEntitiesSection({
  entities,
  visibleCategories,
  repType,
  onToggleCategory,
  onToggleAll,
  onCompanyClick,
}: ConnectedEntitiesSectionProps) {
  const totalEntities = 
    entities.companies.length +
    entities.contacts.length +
    entities['pre-opportunities'].length +
    entities.quotes.length +
    entities.orders.length +
    entities.invoices.length +
    entities.checks.length +
    entities.documents.length;

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Connected Entities</h2>

        {/* Entity Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onToggleAll}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.length === 8
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            All ({totalEntities})
          </button>
          <button
            onClick={() => onToggleCategory('contacts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('contacts')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Contacts ({entities.contacts.length})
          </button>
          <button
            onClick={() => onToggleCategory('companies')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('companies')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Companies ({entities.companies.length})
          </button>
          <button
            onClick={() => onToggleCategory('pre-opportunities')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('pre-opportunities')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Pre-Opportunities ({entities['pre-opportunities'].length})
          </button>
          <button
            onClick={() => onToggleCategory('quotes')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('quotes')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Quotes ({entities.quotes.length})
          </button>
          <button
            onClick={() => onToggleCategory('orders')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('orders')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Orders ({entities.orders.length})
          </button>
          <button
            onClick={() => onToggleCategory('invoices')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('invoices')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Invoices ({entities.invoices.length})
          </button>
          <button
            onClick={() => onToggleCategory('checks')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('checks')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Checks ({entities.checks.length})
          </button>
          <button
            onClick={() => onToggleCategory('documents')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              visibleCategories.includes('documents')
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            Documents ({entities.documents.length})
          </button>
        </div>
      </div>

      {/* Entities Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Contacts */}
          {visibleCategories.includes('contacts') && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)]">Contacts</h3>
              </div>
              <div className="p-4 space-y-3">
                {REP_TYPE_CONFIG[repType].contactTypes.map((contactType) => {
                  const contact = entities.contacts.find(c => c.contactType === contactType);

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

          {/* Companies */}
          {visibleCategories.includes('companies') && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)]">Companies</h3>
              </div>
              <div className="p-4 space-y-3">
                {COMPANY_TYPE_CONFIG[repType].companyTypes.map((companyType) => {
                  const company = entities.companies.find(c => c.companyType === companyType);

                  if (company) {
                    return (
                      <div
                        key={company.id}
                        onClick={() => onCompanyClick?.(company)}
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

          {/* Other entity types - simplified render */}
          {['pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'documents'].map((category) => {
            if (!visibleCategories.includes(category)) return null;

            const categoryData = entities[category as keyof ConnectedEntities];
            if (!Array.isArray(categoryData)) return null;

            return (
              <div key={category} className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)] capitalize">
                    {category.replace('-', ' ')}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {categoryData.map((entity: any) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-[var(--foreground)]">{entity.name}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                            {category === 'pre-opportunities' ? 'Pre-Opportunity' : category.slice(0, -1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                          <span>{entity.id}</span>
                          <span>• {entity.date}</span>
                          {entity.value && <span>• {entity.value}</span>}
                          {entity.size && <span>• {entity.size}</span>}
                          {entity.type && <span>• {entity.type}</span>}
                        </div>
                      </div>
                      {entity.status && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {entity.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
