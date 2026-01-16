'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { useChatSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import type { ChatSettingsValue } from '@/components/lib/graphql/settings';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

// Voice personalities matching VoiceSettingsDialog
const VOICE_PERSONALITIES = [
  {
    id: 'clint',
    name: 'Clint',
    voiceId: 'fbIG6gEosVIM95R5qOna',
    description: 'Professional, clear, and friendly',
    emoji: '💼',
  },
  {
    id: 'river',
    name: 'River',
    voiceId: 'SAz9YHcvj6GT2YYXdXww',
    description: 'Mature, confident, and authoritative',
    emoji: '💻',
  },
  {
    id: 'bella',
    name: 'Bella',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    description: 'Warm, enthusiastic, and energetic',
    emoji: '🎨',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    description: 'Calm, reassuring, and knowledgeable',
    emoji: '🏫',
  },
  {
    id: 'lily',
    name: 'Lily',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    description: 'Young, bright, and helpful',
    emoji: '✨',
  },
];

const defaultChatSettings: ChatSettingsValue = {
  followUpSuggestions: true,
  vectorSearch: false,
  ttsEnabled: true,
  voicePersonalityId: 'bella',
  speakingSpeed: 1.0,
};

interface ToggleSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
      <div className="flex-1">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function ChatSettingsTab() {
  const { settings, mySettings, tenantSettings, saveSettings, isLoading, isInitialized } = useChatSettings();
  const [scope, setScope] = useState<SettingScope>('my');
  const [localSettings, setLocalSettings] = useState<ChatSettingsValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the active settings based on scope
  const activeSettings = scope === 'my' ? mySettings : tenantSettings;

  // Initialize local settings when context loads or scope changes
  // Merge with defaults to handle missing fields from old schema
  useEffect(() => {
    if (isInitialized) {
      const settingsToUse = {
        ...defaultChatSettings,
        ...(activeSettings || {}),
      };
      setLocalSettings(settingsToUse);
      setHasChanges(false);
    }
  }, [isInitialized, activeSettings, scope]);

  const handleBooleanChange = useCallback((key: keyof ChatSettingsValue, value: boolean) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setHasChanges(true);
  }, []);

  const handleVoiceChange = useCallback((voiceId: string) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, voicePersonalityId: voiceId };
    });
    setHasChanges(true);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, speakingSpeed: speed };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      const success = await saveSettings(localSettings, scope);
      if (success) {
        showSuccessToast(`Chat settings saved to ${scope === 'my' ? 'My Settings' : 'Tenant Settings'}`);
        setHasChanges(false);
      } else {
        showErrorToast('Failed to save chat settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save chat settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(defaultChatSettings);
    setHasChanges(true);
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  const selectedVoice = VOICE_PERSONALITIES.find(v => v.id === localSettings.voicePersonalityId) || VOICE_PERSONALITIES[2];

  // Ensure all settings have valid values for display (handles old schema data)
  const speakingSpeed = localSettings.speakingSpeed ?? 1.0;
  const followUpSuggestions = localSettings.followUpSuggestions ?? true;
  const vectorSearch = localSettings.vectorSearch ?? false;
  const ttsEnabled = localSettings.ttsEnabled ?? true;
  const voicePersonalityId = localSettings.voicePersonalityId ?? 'bella';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Chat Settings</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Customize your AI assistant's voice and speaking style
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              hasChanges && !isSaving
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <SettingsScopeToggle
        scope={scope}
        onChange={setScope}
        hasMySettings={!!mySettings}
        hasTenantSettings={!!tenantSettings}
      />

      {/* Chat Configuration */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <h3 className="text-base font-semibold text-[var(--foreground)]">Chat Configuration</h3>
        </div>
        <div className="space-y-3">
          <ToggleSwitch
            label="Follow-up Suggestions"
            description="Show suggested follow-up questions"
            checked={followUpSuggestions}
            onChange={(value) => handleBooleanChange('followUpSuggestions', value)}
          />
          <ToggleSwitch
            label="Vector Search"
            description="Use semantic search for better context"
            checked={vectorSearch}
            onChange={(value) => handleBooleanChange('vectorSearch', value)}
          />
        </div>
      </div>

      {/* Text-to-Speech */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 010 7.07"/>
              <path d="M19.07 4.93a10 10 0 010 14.14"/>
            </svg>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Text-to-Speech</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Enable voice responses</p>
            </div>
          </div>
          <button
            onClick={() => handleBooleanChange('ttsEnabled', !ttsEnabled)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              ttsEnabled
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]'
            }`}
          >
            {ttsEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Voice Personality - Only show when TTS is enabled */}
      {ttsEnabled && (
        <>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Voice Personality</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Choose the voice that best fits your preference
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VOICE_PERSONALITIES.map((voice) => {
                const isSelected = voicePersonalityId === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[var(--primary)] text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        Active
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center text-xl">
                        {voice.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-[var(--foreground)]">{voice.name}</h4>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {voice.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speaking Speed */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
                <h3 className="text-base font-semibold text-[var(--foreground)]">Speaking Speed</h3>
              </div>
              <span className="px-3 py-1 bg-[var(--muted)] rounded-md text-sm font-mono font-medium text-[var(--foreground)]">
                {speakingSpeed.toFixed(1)}x
              </span>
            </div>
            <div className="space-y-3">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speakingSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>0.5x (Slower)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Faster)</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]/50">
              <p className="text-xs text-[var(--muted-foreground)]">
                <strong>Tip:</strong> Adjust the speed to match your listening preference.
                Slower speeds are great for detailed information, while faster speeds work well for quick updates.
              </p>
            </div>
          </div>

          {/* Current Selection Preview */}
          <div className="p-4 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center text-xl">
                {selectedVoice.emoji}
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--foreground)]">Current Voice</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {selectedVoice.name} at {speakingSpeed.toFixed(1)}x
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-500 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">How settings are applied</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              These settings control your Flow Chat experience.
              Personal settings (My Settings) override tenant-wide settings.
              Changes will take effect immediately when you open Flow Chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatSettingsTab;
