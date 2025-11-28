/**
 * Custom Hook for Rule State Management
 */

import { useState } from 'react';
import type {
  SendPace,
  CommunicationType,
  RuleConditionGroup,
} from '../types';
import { DEFAULT_MAX_PER_DAY, DEFAULT_SEND_PACE } from '../constants';
import { generateConditionId, generateGroupId } from '../utils';

export function useRuleState() {
  // Rule configuration
  const [communicationType, setCommunicationType] = useState<CommunicationType>('email');
  const [isInternalCommunication, setIsInternalCommunication] = useState(false);
  const [sendPace, setSendPace] = useState<SendPace>(DEFAULT_SEND_PACE);
  const [maxPerDay, setMaxPerDay] = useState(DEFAULT_MAX_PER_DAY);
  const [useAIPersonalization, setUseAIPersonalization] = useState(true);

  // Rule condition groups
  const [ruleConditionGroups, setRuleConditionGroups] = useState<RuleConditionGroup[]>([
    {
      id: '1',
      logic: 'AND',
      conditions: [
        { id: '1-1', entity: '', field: '', operator: '', value: '' }
      ]
    }
  ]);

  // Rule condition handlers
  const addCondition = (groupId: string) => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                { 
                  id: generateConditionId(groupId, group.conditions.length),
                  entity: '', 
                  field: '', 
                  operator: '', 
                  value: '' 
                }
              ]
            }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
          : group
      )
    );
  };

  const updateCondition = (groupId: string, conditionId: string, field: string, value: any) => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map(c =>
                c.id === conditionId ? { ...c, [field]: value } : c
              )
            }
          : group
      )
    );
  };

  const addConditionGroup = () => {
    const newGroupId = generateGroupId(ruleConditionGroups.length);
    setRuleConditionGroups([
      ...ruleConditionGroups,
      {
        id: newGroupId,
        logic: 'AND',
        conditions: [
          { 
            id: `${newGroupId}-1`, 
            entity: '', 
            field: '', 
            operator: '', 
            value: '' 
          }
        ]
      }
    ]);
  };

  const removeConditionGroup = (groupId: string) => {
    setRuleConditionGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, logic } : group
      )
    );
  };

  return {
    // Rule configuration
    communicationType,
    setCommunicationType,
    isInternalCommunication,
    setIsInternalCommunication,
    sendPace,
    setSendPace,
    maxPerDay,
    setMaxPerDay,
    useAIPersonalization,
    setUseAIPersonalization,

    // Rule conditions
    ruleConditionGroups,
    setRuleConditionGroups,
    addCondition,
    removeCondition,
    updateCondition,
    addConditionGroup,
    removeConditionGroup,
    updateGroupLogic,
  };
}
