/**
 * Custom Hook for Campaign and Rule State Management
 */

import { useState } from 'react';
import type {
  Contact,
  TabType,
  ListType,
  SendPace,
  CommunicationType,
  AIContext,
  RuleConditionGroup,
} from '../types';
import { DEFAULT_MAX_PER_DAY, DEFAULT_SEND_PACE } from '../constants';
import { generateConditionId, generateGroupId } from '../utils';

export function useCampaignState() {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');

  // Campaign configuration
  const [listType, setListType] = useState<ListType>('static');
  const [recipientList, setRecipientList] = useState<Contact[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendPace, setSendPace] = useState<SendPace>(DEFAULT_SEND_PACE);
  const [maxPerDay, setMaxPerDay] = useState(DEFAULT_MAX_PER_DAY);
  const [useAIPersonalization, setUseAIPersonalization] = useState(true);

  // Filtering for static list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Campaign condition groups (for criteria/dynamic lists)
  const [campaignConditionGroups, setCampaignConditionGroups] = useState<RuleConditionGroup[]>([
    {
      id: '1',
      logic: 'AND',
      conditions: [
        { id: '1-1', entity: '', field: '', operator: '', value: '' }
      ]
    }
  ]);

  // AI modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiContext, setAIContext] = useState<AIContext>(null);

  // Edit mode
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Campaign name and description
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');

  // Schedule settings
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Campaign condition handlers
  const addCampaignCondition = (groupId: string) => {
    setCampaignConditionGroups(groups =>
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

  const removeCampaignCondition = (groupId: string, conditionId: string) => {
    setCampaignConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
          : group
      )
    );
  };

  const updateCampaignCondition = (groupId: string, conditionId: string, field: string, value: any) => {
    setCampaignConditionGroups(groups =>
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

  const addCampaignConditionGroup = () => {
    const newGroupId = generateGroupId(campaignConditionGroups.length);
    setCampaignConditionGroups([
      ...campaignConditionGroups,
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

  const removeCampaignConditionGroup = (groupId: string) => {
    setCampaignConditionGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const updateCampaignGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setCampaignConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, logic } : group
      )
    );
  };

  // Recipient list handlers
  const addToRecipientList = (contact: Contact) => {
    if (!recipientList.find(c => c.id === contact.id)) {
      setRecipientList([...recipientList, contact]);
    }
  };

  // Add multiple contacts at once (fixes multi-selection bug)
  const addMultipleToRecipientList = (contacts: Contact[]) => {
    setRecipientList(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newContacts = contacts.filter(c => !existingIds.has(c.id));
      return [...prev, ...newContacts];
    });
  };

  const removeFromRecipientList = (contactId: string) => {
    setRecipientList(recipientList.filter(c => c.id !== contactId));
  };

  const clearRecipientList = () => {
    setRecipientList([]);
  };

  // Filter handlers
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCompanies([]);
    setSelectedTypes([]);
    setSelectedTags([]);
    setSelectedContactIds([]);
  };

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Campaign configuration
    listType,
    setListType,
    recipientList,
    setRecipientList,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
    sendPace,
    setSendPace,
    maxPerDay,
    setMaxPerDay,
    useAIPersonalization,
    setUseAIPersonalization,

    // Filtering
    searchQuery,
    setSearchQuery,
    selectedCompanies,
    setSelectedCompanies,
    selectedTypes,
    setSelectedTypes,
    selectedTags,
    setSelectedTags,
    selectedContactIds,
    setSelectedContactIds,
    openDropdown,
    setOpenDropdown,

    // Campaign conditions
    campaignConditionGroups,
    setCampaignConditionGroups,
    addCampaignCondition,
    removeCampaignCondition,
    updateCampaignCondition,
    addCampaignConditionGroup,
    removeCampaignConditionGroup,
    updateCampaignGroupLogic,

    // Recipient list actions
    addToRecipientList,
    addMultipleToRecipientList,
    removeFromRecipientList,
    clearRecipientList,

    // Filter actions
    clearAllFilters,

    // AI modal
    showAIModal,
    setShowAIModal,
    aiPrompt,
    setAIPrompt,
    aiContext,
    setAIContext,

    // Edit mode
    editingCampaignId,
    setEditingCampaignId,

    // Campaign name and description
    campaignName,
    setCampaignName,
    campaignDescription,
    setCampaignDescription,

    // Schedule settings
    sendImmediately,
    setSendImmediately,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
  };
}
