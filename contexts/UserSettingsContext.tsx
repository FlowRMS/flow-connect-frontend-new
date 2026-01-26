'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  type SettingKey,
  type Setting,
  type SettingValue,
  type QuoteSettingsValue,
  type OrderSettingsValue,
  type InvoiceSettingsValue,
  type ChatSettingsValue,
  type SidebarSettingsValue,
  type FlowAISettingsValue,
  type PicklistSettingsValue,
  type PicklistValue,
  getMySettings,
  getTenantSettings,
  saveMySetting,
  saveTenantSetting,
  deleteMySetting,
  deleteTenantSetting,
  parseSettingValue,
  getEffectiveSetting,
} from '@/components/lib/graphql/settings';

// ============================================================================
// Types
// ============================================================================

export type SettingScope = 'my' | 'tenant';

interface UserSettingsContextType {
  // Loading state
  isLoading: boolean;
  isInitialized: boolean;

  // Raw settings data
  mySettings: Map<SettingKey, Setting>;
  tenantSettings: Map<SettingKey, Setting>;

  // Get effective setting (personal overrides tenant)
  getSetting: <T extends SettingValue>(key: SettingKey) => T | null;
  getMySettingValue: <T extends SettingValue>(key: SettingKey) => T | null;
  getTenantSettingValue: <T extends SettingValue>(key: SettingKey) => T | null;

  // Typed getters
  getQuoteSettings: () => QuoteSettingsValue | null;
  getOrderSettings: () => OrderSettingsValue | null;
  getInvoiceSettings: () => InvoiceSettingsValue | null;
  getChatSettings: () => ChatSettingsValue | null;
  getSidebarSettings: () => SidebarSettingsValue | null;

  // Save settings
  saveSetting: (key: SettingKey, value: SettingValue, scope: SettingScope) => Promise<boolean>;

  // Delete settings
  deleteSettingByScope: (key: SettingKey, scope: SettingScope) => Promise<boolean>;

  // Check if setting exists
  hasSettingInScope: (key: SettingKey, scope: SettingScope) => boolean;

  // Refresh settings from API
  refreshSettings: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mySettings, setMySettings] = useState<Map<SettingKey, Setting>>(new Map());
  const [tenantSettings, setTenantSettings] = useState<Map<SettingKey, Setting>>(new Map());

  // Load all settings on mount
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mySettingsArray, tenantSettingsArray] = await Promise.all([
        getMySettings(),
        getTenantSettings(),
      ]);

      const myMap = new Map<SettingKey, Setting>();
      for (const setting of mySettingsArray) {
        myMap.set(setting.key, setting);
      }

      const tenantMap = new Map<SettingKey, Setting>();
      for (const setting of tenantSettingsArray) {
        tenantMap.set(setting.key, setting);
      }

      setMySettings(myMap);
      setTenantSettings(tenantMap);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Get effective setting (my overrides tenant)
  const getSetting = useCallback(
    <T extends SettingValue>(key: SettingKey): T | null => {
      const mySetting = mySettings.get(key) || null;
      const tenantSetting = tenantSettings.get(key) || null;
      return getEffectiveSetting<T>(mySetting, tenantSetting);
    },
    [mySettings, tenantSettings]
  );

  // Get my setting value only
  const getMySettingValue = useCallback(
    <T extends SettingValue>(key: SettingKey): T | null => {
      const setting = mySettings.get(key);
      return setting ? parseSettingValue<T>(setting) : null;
    },
    [mySettings]
  );

  // Get tenant setting value only
  const getTenantSettingValue = useCallback(
    <T extends SettingValue>(key: SettingKey): T | null => {
      const setting = tenantSettings.get(key);
      return setting ? parseSettingValue<T>(setting) : null;
    },
    [tenantSettings]
  );

  // Typed getters
  const getQuoteSettings = useCallback(
    (): QuoteSettingsValue | null => getSetting<QuoteSettingsValue>('QUOTE_SETTINGS'),
    [getSetting]
  );

  const getOrderSettings = useCallback(
    (): OrderSettingsValue | null => getSetting<OrderSettingsValue>('ORDER_SETTINGS'),
    [getSetting]
  );

  const getInvoiceSettings = useCallback(
    (): InvoiceSettingsValue | null => getSetting<InvoiceSettingsValue>('INVOICE_SETTINGS'),
    [getSetting]
  );

  const getChatSettings = useCallback(
    (): ChatSettingsValue | null => getSetting<ChatSettingsValue>('CHAT_SETTINGS'),
    [getSetting]
  );

  const getSidebarSettings = useCallback(
    (): SidebarSettingsValue | null => getSetting<SidebarSettingsValue>('SIDEBAR_SETTINGS'),
    [getSetting]
  );


  // Save setting to the appropriate scope
  const saveSettingHandler = useCallback(
    async (key: SettingKey, value: SettingValue, scope: SettingScope): Promise<boolean> => {
      try {
        const result =
          scope === 'my' ? await saveMySetting(key, value) : await saveTenantSetting(key, value);

        if (result) {
          // Update local state
          if (scope === 'my') {
            setMySettings((prev) => {
              const newMap = new Map(prev);
              newMap.set(key, result);
              return newMap;
            });
          } else {
            setTenantSettings((prev) => {
              const newMap = new Map(prev);
              newMap.set(key, result);
              return newMap;
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to save setting:', error);
        return false;
      }
    },
    []
  );

  // Delete setting from the appropriate scope
  const deleteSettingByScope = useCallback(
    async (key: SettingKey, scope: SettingScope): Promise<boolean> => {
      try {
        const success =
          scope === 'my' ? await deleteMySetting(key) : await deleteTenantSetting(key);

        if (success) {
          // Update local state
          if (scope === 'my') {
            setMySettings((prev) => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          } else {
            setTenantSettings((prev) => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }
        }
        return success;
      } catch (error) {
        console.error('Failed to delete setting:', error);
        return false;
      }
    },
    []
  );

  // Check if setting exists in scope
  const hasSettingInScope = useCallback(
    (key: SettingKey, scope: SettingScope): boolean => {
      if (scope === 'my') {
        return mySettings.has(key);
      }
      return tenantSettings.has(key);
    },
    [mySettings, tenantSettings]
  );

  // Refresh settings from API
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  return (
    <UserSettingsContext.Provider
      value={{
        isLoading,
        isInitialized,
        mySettings,
        tenantSettings,
        getSetting,
        getMySettingValue,
        getTenantSettingValue,
        getQuoteSettings,
        getOrderSettings,
        getInvoiceSettings,
        getChatSettings,
        getSidebarSettings,
        saveSetting: saveSettingHandler,
        deleteSettingByScope,
        hasSettingInScope,
        refreshSettings,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useUserSettings(): UserSettingsContextType {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}

// ============================================================================
// Specific Setting Hooks (for convenience)
// ============================================================================

export function useQuoteSettings() {
  const { getMySettingValue, getTenantSettingValue, saveSetting, isLoading, isInitialized, mySettings, tenantSettings } =
    useUserSettings();

  const settings = useMemo(() => {
    const mySetting = mySettings.get('QUOTE_SETTINGS');
    const tenantSetting = tenantSettings.get('QUOTE_SETTINGS');
    return getEffectiveSetting<QuoteSettingsValue>(mySetting || null, tenantSetting || null);
  }, [mySettings, tenantSettings]);

  const mySettingsValue = useMemo(
    () => getMySettingValue<QuoteSettingsValue>('QUOTE_SETTINGS'),
    [getMySettingValue]
  );

  const tenantSettingsValue = useMemo(
    () => getTenantSettingValue<QuoteSettingsValue>('QUOTE_SETTINGS'),
    [getTenantSettingValue]
  );

  const saveSettingsHandler = useCallback(
    (value: QuoteSettingsValue, scope: SettingScope) => saveSetting('QUOTE_SETTINGS', value, scope),
    [saveSetting]
  );

  return {
    settings,
    mySettings: mySettingsValue,
    tenantSettings: tenantSettingsValue,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}

export function useOrderSettings() {
  const { getMySettingValue, getTenantSettingValue, saveSetting, isLoading, isInitialized, mySettings, tenantSettings } =
    useUserSettings();

  const settings = useMemo(() => {
    const mySetting = mySettings.get('ORDER_SETTINGS');
    const tenantSetting = tenantSettings.get('ORDER_SETTINGS');
    return getEffectiveSetting<OrderSettingsValue>(mySetting || null, tenantSetting || null);
  }, [mySettings, tenantSettings]);

  const mySettingsValue = useMemo(
    () => getMySettingValue<OrderSettingsValue>('ORDER_SETTINGS'),
    [getMySettingValue]
  );

  const tenantSettingsValue = useMemo(
    () => getTenantSettingValue<OrderSettingsValue>('ORDER_SETTINGS'),
    [getTenantSettingValue]
  );

  const saveSettingsHandler = useCallback(
    (value: OrderSettingsValue, scope: SettingScope) => saveSetting('ORDER_SETTINGS', value, scope),
    [saveSetting]
  );

  return {
    settings,
    mySettings: mySettingsValue,
    tenantSettings: tenantSettingsValue,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}

export function useInvoiceSettings() {
  const { getMySettingValue, getTenantSettingValue, saveSetting, isLoading, isInitialized, mySettings, tenantSettings } =
    useUserSettings();

  const settings = useMemo(() => {
    const mySetting = mySettings.get('INVOICE_SETTINGS');
    const tenantSetting = tenantSettings.get('INVOICE_SETTINGS');
    return getEffectiveSetting<InvoiceSettingsValue>(mySetting || null, tenantSetting || null);
  }, [mySettings, tenantSettings]);

  const mySettingsValue = useMemo(
    () => getMySettingValue<InvoiceSettingsValue>('INVOICE_SETTINGS'),
    [getMySettingValue]
  );

  const tenantSettingsValue = useMemo(
    () => getTenantSettingValue<InvoiceSettingsValue>('INVOICE_SETTINGS'),
    [getTenantSettingValue]
  );

  const saveSettingsHandler = useCallback(
    (value: InvoiceSettingsValue, scope: SettingScope) => saveSetting('INVOICE_SETTINGS', value, scope),
    [saveSetting]
  );

  return {
    settings,
    mySettings: mySettingsValue,
    tenantSettings: tenantSettingsValue,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}

export function useChatSettings() {
  const { getMySettingValue, getTenantSettingValue, saveSetting, isLoading, isInitialized, mySettings, tenantSettings } =
    useUserSettings();

  const settings = useMemo(() => {
    const mySetting = mySettings.get('CHAT_SETTINGS');
    const tenantSetting = tenantSettings.get('CHAT_SETTINGS');
    return getEffectiveSetting<ChatSettingsValue>(mySetting || null, tenantSetting || null);
  }, [mySettings, tenantSettings]);

  const mySettingsValue = useMemo(
    () => getMySettingValue<ChatSettingsValue>('CHAT_SETTINGS'),
    [getMySettingValue]
  );

  const tenantSettingsValue = useMemo(
    () => getTenantSettingValue<ChatSettingsValue>('CHAT_SETTINGS'),
    [getTenantSettingValue]
  );

  const saveSettingsHandler = useCallback(
    (value: ChatSettingsValue, scope: SettingScope) => saveSetting('CHAT_SETTINGS', value, scope),
    [saveSetting]
  );

  return {
    settings,
    mySettings: mySettingsValue,
    tenantSettings: tenantSettingsValue,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}

export function useSidebarSettings() {
  const { getMySettingValue, getTenantSettingValue, saveSetting, isLoading, isInitialized, mySettings, tenantSettings } =
    useUserSettings();

  const settings = useMemo(() => {
    const mySetting = mySettings.get('SIDEBAR_SETTINGS');
    const tenantSetting = tenantSettings.get('SIDEBAR_SETTINGS');
    return getEffectiveSetting<SidebarSettingsValue>(mySetting || null, tenantSetting || null);
  }, [mySettings, tenantSettings]);

  const mySettingsValue = useMemo(
    () => getMySettingValue<SidebarSettingsValue>('SIDEBAR_SETTINGS'),
    [getMySettingValue]
  );

  const tenantSettingsValue = useMemo(
    () => getTenantSettingValue<SidebarSettingsValue>('SIDEBAR_SETTINGS'),
    [getTenantSettingValue]
  );

  const saveSettingsHandler = useCallback(
    (value: SidebarSettingsValue, scope: SettingScope) => saveSetting('SIDEBAR_SETTINGS', value, scope),
    [saveSetting]
  );

  return {
    settings,
    mySettings: mySettingsValue,
    tenantSettings: tenantSettingsValue,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}

export function useFlowAISettings() {
  const { getMySettingValue, getTenantSettingValue, saveSetting, isLoading, isInitialized, mySettings, tenantSettings } =
    useUserSettings();

  const settings = useMemo(() => {
    const mySetting = mySettings.get('FLOW_AI_SETTINGS');
    const tenantSetting = tenantSettings.get('FLOW_AI_SETTINGS');
    return getEffectiveSetting<FlowAISettingsValue>(mySetting || null, tenantSetting || null);
  }, [mySettings, tenantSettings]);

  const mySettingsValue = useMemo(
    () => getMySettingValue<FlowAISettingsValue>('FLOW_AI_SETTINGS'),
    [getMySettingValue]
  );

  const tenantSettingsValue = useMemo(
    () => getTenantSettingValue<FlowAISettingsValue>('FLOW_AI_SETTINGS'),
    [getTenantSettingValue]
  );

  const saveSettingsHandler = useCallback(
    (value: FlowAISettingsValue, scope: SettingScope) => saveSetting('FLOW_AI_SETTINGS', value, scope),
    [saveSetting]
  );

  return {
    settings,
    mySettings: mySettingsValue,
    tenantSettings: tenantSettingsValue,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}

/**
 * Generic hook for picklist settings
 * All picklists are stored under a single PICKLIST_SETTINGS key
 * Only tenant scope is supported (no my settings)
 * 
 * @param picklistKey - The specific picklist to work with (e.g., 'orderTypes', 'lostReasons')
 */
export function usePicklistSettings(picklistKey: string) {
  const { saveSetting, isLoading, isInitialized, tenantSettings } = useUserSettings();
  
  const settingKey: SettingKey = 'PICKLIST_SETTINGS';

  // Get all picklist settings
  const allPicklistSettings = useMemo(() => {
    const tenantSetting = tenantSettings.get(settingKey);
    return tenantSetting ? parseSettingValue<PicklistSettingsValue>(tenantSetting) : null;
  }, [tenantSettings]);

  // Get specific picklist value
  const settings = useMemo(() => {
    return allPicklistSettings?.[picklistKey] || null;
  }, [allPicklistSettings, picklistKey]);

  const saveSettingsHandler = useCallback(
    async (value: PicklistValue): Promise<boolean> => {
      // Merge with existing picklist settings, updating only the specific picklist
      const updatedSettings: PicklistSettingsValue = {
        ...allPicklistSettings,
        [picklistKey]: value,
      };
      // Only save to tenant scope (no my settings for picklists)
      return saveSetting(settingKey, updatedSettings, 'tenant');
    },
    [saveSetting, allPicklistSettings, picklistKey]
  );

  return {
    settings,
    saveSettings: saveSettingsHandler,
    isLoading,
    isInitialized,
  };
}
