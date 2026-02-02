'use client';

import { useMemo, useCallback } from 'react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import type { SettingKey } from '@/components/lib/graphql/settings';

import { PicklistKey, PicklistColor } from './enums';
import { getPicklistDefinition } from './config';
import type { PicklistItem, PicklistData, UsePicklistReturn, PicklistSettingsValue } from './types';

const SETTING_KEY: SettingKey = 'PICKLIST_SETTINGS';

export function usePicklist(picklistKey: PicklistKey): UsePicklistReturn {
  const { saveSetting, isLoading, isInitialized, getTenantSettingValue } = useUserSettings();
  const definition = getPicklistDefinition(picklistKey);

  // Get all picklist settings from tenant
  const allPicklistSettings = useMemo((): PicklistSettingsValue => {
    const value = getTenantSettingValue<any>(SETTING_KEY);
    
    // Handle nested JSON strings (backend may have serialized multiple times)
    let parsedValue: any = value;
    while (parsedValue && typeof parsedValue === 'string') {
      try {
        parsedValue = JSON.parse(parsedValue);
      } catch {
        return {};
      }
    }
    
    // Ensure it's an object with the correct structure
    if (parsedValue && typeof parsedValue === 'object') {
      return parsedValue as PicklistSettingsValue;
    }
    
    return {};
  }, [getTenantSettingValue]);

  // Get items: if saved config exists use it, otherwise use defaults
  const items = useMemo(() => {
    const savedData = allPicklistSettings?.[picklistKey] as PicklistData | undefined;
    
    if (savedData?.items?.length) {
      return [...savedData.items].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    return definition.defaultItems;
  }, [allPicklistSettings, picklistKey, definition.defaultItems]);

  const enabledItems = useMemo(
    () => items.filter(item => item.enabled),
    [items]
  );

  const getItemByKey = useCallback(
    (key: string) => items.find(item => item.key === key),
    [items]
  );

  const getLabelByKey = useCallback(
    (key: string) => getItemByKey(key)?.label ?? key,
    [getItemByKey]
  );

  const getColorByKey = useCallback(
    (key: string): PicklistColor | undefined => getItemByKey(key)?.color,
    [getItemByKey]
  );

  const saveItems = useCallback(
    async (newItems: PicklistItem[]): Promise<boolean> => {
      const data: PicklistData = {
        items: newItems,
        lastModified: new Date().toISOString(),
      };
      
      // Merge with existing picklist settings, preserving all other picklists
      const updatedSettings: PicklistSettingsValue = {
        ...(allPicklistSettings || {}),
        [picklistKey]: data,
      };
      
      // Ensure we're passing a plain object, not a string
      // Cast to any because PicklistSettingsValue uses new structure but SettingValue expects old structure
      const result = await saveSetting(SETTING_KEY, updatedSettings as any, 'tenant');
      return !!result;
    },
    [saveSetting, allPicklistSettings, picklistKey]
  );

  return {
    items,
    enabledItems,
    definition,
    isLoading,
    isInitialized,
    saveItems,
    getItemByKey,
    getLabelByKey,
    getColorByKey,
  };
}
