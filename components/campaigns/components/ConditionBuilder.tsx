/**
 * Condition Builder Component
 * Reusable component for building rule conditions
 */

import React from 'react';
import type { RuleConditionGroup, RuleCondition } from '../types';
import { getFieldsForEntity, getOperatorsForFieldType } from '../utils';

interface ConditionBuilderProps {
  conditionGroups: RuleConditionGroup[];
  onAddCondition: (groupId: string) => void;
  onRemoveCondition: (groupId: string, conditionId: string) => void;
  onUpdateCondition: (groupId: string, conditionId: string, field: string, value: any) => void;
  onAddConditionGroup: () => void;
  onRemoveConditionGroup: (groupId: string) => void;
  onUpdateGroupLogic: (groupId: string, logic: 'AND' | 'OR') => void;
}

export default function ConditionBuilder({
  conditionGroups,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onAddConditionGroup,
  onRemoveConditionGroup,
  onUpdateGroupLogic,
}: ConditionBuilderProps) {
  return (
    <div className="space-y-4">
      {conditionGroups.map((group, groupIndex) => (
        <div key={group.id} className="border border-[var(--border)] rounded-lg p-4">
          {groupIndex > 0 && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Group Logic:</span>
                <select
                  value={group.logic}
                  onChange={(e) => onUpdateGroupLogic(group.id, e.target.value as 'AND' | 'OR')}
                  className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:12px] bg-[position:right_8px_center] bg-no-repeat"
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
                <span className="text-xs text-[var(--muted-foreground)]">with previous group</span>
              </div>
              <button
                onClick={() => onRemoveConditionGroup(group.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-3">
            {group.conditions.map((condition, conditionIndex) => {
              const selectedField = getFieldsForEntity(condition.entity).find(f => f.value === condition.field);
              const availableOperators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];

              return (
                <div key={condition.id}>
                  {conditionIndex > 0 && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 border-t border-[var(--border)]"></div>
                      <span className="text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                        {group.logic}
                      </span>
                      <div className="flex-1 border-t border-[var(--border)]"></div>
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <select
                        value={condition.entity}
                        onChange={(e) => onUpdateCondition(group.id, condition.id, 'entity', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                      >
                        <option value="">Select entity...</option>
                        <option value="Contact">Contact</option>
                        <option value="Job">Job</option>
                        <option value="Company">Company</option>
                        <option value="Pre-Opportunity">Pre-Opportunity</option>
                        <option value="Quote">Quote</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <select
                        value={condition.field}
                        onChange={(e) => onUpdateCondition(group.id, condition.id, 'field', e.target.value)}
                        disabled={!condition.entity}
                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                      >
                        <option value="">Select field...</option>
                        {getFieldsForEntity(condition.entity).map(field => (
                          <option key={field.value} value={field.value}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <select
                        value={condition.operator}
                        onChange={(e) => onUpdateCondition(group.id, condition.id, 'operator', e.target.value)}
                        disabled={!condition.field}
                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                      >
                        <option value="">Operator...</option>
                        {availableOperators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => onUpdateCondition(group.id, condition.id, 'value', e.target.value)}
                        placeholder="Value..."
                        disabled={!condition.operator}
                        className="w-full px-2 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {group.conditions.length > 1 && (
                        <button
                          onClick={() => onRemoveCondition(group.id, condition.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onAddCondition(group.id)}
            className="mt-3 flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add {group.logic} condition
          </button>
        </div>
      ))}

      <button
        onClick={onAddConditionGroup}
        className="mt-3 flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
        </svg>
        Add OR condition group
      </button>
    </div>
  );
}
