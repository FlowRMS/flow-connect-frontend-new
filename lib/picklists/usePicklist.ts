'use client';

import { useMemo, useCallback } from 'react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import type { SettingKey } from '@/components/lib/graphql/settings';

import { PicklistKey, PicklistColor } from './enums';
import { getPicklistDefinition } from './config';
import type { PicklistItem, PicklistData, UsePicklistReturn, PicklistSettingsValue } from './types';

const SETTING_KEY: SettingKey = 'PICKLIST_SETTINGS';

export function usePicklist(picklistKey: PicklistKey): UsePicklistReturn {
  const { saveSetting, isLoading, isInitialized, tenantSettings } = useUserSettings();
  const definition = getPicklistDefinition(picklistKey);

  // Get all picklist settings from tenant
  const allPicklistSettings = useMemo((): PicklistSettingsValue | null => {
    const tenantSetting = tenantSettings.get(SETTING_KEY);
    if (!tenantSetting) return null;
    // The value is already parsed by the context
    return tenantSetting as PicklistSettingsValue;
  }, [tenantSettings]);

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
      
      const updatedSettings: PicklistSettingsValue = {
        ...allPicklistSettings,
        [picklistKey]: data,
      };
      
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
