'use client';

import { useState } from 'react';
import { Volume2, Settings2, User, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/flow-ai/ui/dialog';
import { Button } from '@/components/flow-ai/ui/button';
import { Label } from '@/components/flow-ai/ui/label';
import { Slider } from '@/components/flow-ai/ui/slider';
import { Switch } from '@/components/flow-ai/ui/switch';
import { cn } from '@/lib/flow-ai/cn';
import { Badge } from '@/components/flow-ai/ui/badge';

export interface VoicePersonality {
  id: string;
  name: string;
  voiceId: string;
  description: string;
  avatar: string;
  color: string;
  emoji: string;
}

export interface VoiceSettings {
  personality: VoicePersonality;
  speed: number;
  enabled: boolean;
}

export const VOICE_PERSONALITIES: VoicePersonality[] = [
  {
    id: 'clint',
    name: 'Clint',
    voiceId: 'fbIG6gEosVIM95R5qOna',
    description: 'Professional, clear, and friendly',
    avatar: '👩‍💼',
    color: 'from-blue-500 to-blue-600',
    emoji: '💼',
  },
  {
    id: 'river',
    name: 'River',
    voiceId: 'SAz9YHcvj6GT2YYXdXww',
    description: 'Mature, confident, and authoritative',
    avatar: '👨‍💻',
    color: 'from-indigo-500 to-indigo-600',
    emoji: '💻',
  },
  {
    id: 'bella',
    name: 'Bella',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    description: 'Warm, enthusiastic, and energetic',
    avatar: '👩‍🎨',
    color: 'from-pink-500 to-rose-600',
    emoji: '🎨',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    description: 'Calm, reassuring, and knowledgeable',
    avatar: '👨‍🏫',
    color: 'from-green-500 to-emerald-600',
    emoji: '🏫',
  },
  {
    id: 'lily',
    name: 'Lily',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    description: 'Young, bright, and helpful',
    avatar: '👧',
    color: 'from-purple-500 to-violet-600',
    emoji: '✨',
  },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  personality: VOICE_PERSONALITIES[2], // Bella
  speed: 1.0,
  enabled: true,
};

interface VoiceSettingsDialogProps {
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disableSuggestions?: boolean;
  enableVectorSearch?: boolean;
  onDisableSuggestionsChange?: (value: boolean) => void;
  onEnableVectorSearchChange?: (value: boolean) => void;
}

export function VoiceSettingsDialog({
  settings,
  onSettingsChange,
  open,
  onOpenChange,
  disableSuggestions = false,
  enableVectorSearch = false,
  onDisableSuggestionsChange,
  onEnableVectorSearchChange,
}: VoiceSettingsDialogProps) {
  const [tempSettings, setTempSettings] = useState<VoiceSettings>(settings);

  const handlePersonalitySelect = (personality: VoicePersonality) => {
    const newSettings = { ...tempSettings, personality };
    setTempSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSpeedChange = (value: number[]) => {
    const newSettings = { ...tempSettings, speed: value[0] };
    setTempSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleToggle = () => {
    const newSettings = { ...tempSettings, enabled: !tempSettings.enabled };
    setTempSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const formatSpeed = (speed: number): string => {
    return `${speed.toFixed(1)}x`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden md:inline">Chat Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Chat Settings</DialogTitle>
              <DialogDescription className="text-sm">
                Customize your AI assistant&apos;s voice and speaking style
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Chat Configuration Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Chat Configuration</Label>
            </div>

            <div className="space-y-3">
              {/* Disable Suggestions Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">Follow-up Suggestions</p>
                  <p className="text-xs text-muted-foreground">Show suggested follow-up questions</p>
                </div>
                <Switch
                  checked={!disableSuggestions}
                  onCheckedChange={(checked) => onDisableSuggestionsChange?.(!checked)}
                />
              </div>

              {/* Vector Search Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">Vector Search</p>
                  <p className="text-xs text-muted-foreground">Use semantic search for better context</p>
                </div>
                <Switch
                  checked={enableVectorSearch}
                  onCheckedChange={(checked) => onEnableVectorSearchChange?.(checked)}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Enable/Disable Voice */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Text-to-Speech</p>
                <p className="text-xs text-muted-foreground">Enable voice responses</p>
              </div>
            </div>
            <Button
              variant={tempSettings.enabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggle}
              className="min-w-[80px]"
            >
              {tempSettings.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {tempSettings.enabled && (
            <>
              {/* Voice Personality Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <Label className="text-base font-semibold">Voice Personality</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose the voice that best fits your preference
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VOICE_PERSONALITIES.map((personality) => {
                    const isSelected = tempSettings.personality.id === personality.id;
                    return (
                      <button
                        key={personality.id}
                        onClick={() => handlePersonalitySelect(personality)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all duration-200",
                          "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                          "text-left group",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card/50 hover:border-primary/50"
                        )}
                      >
                        {/* Selected Badge */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2">
                            <Badge className="shadow-lg bg-primary text-primary-foreground border-0">     
                              <Sparkles className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Avatar with Gradient */}
                          <div
                            className={cn(
                              "flex items-center justify-center w-12 h-12 rounded-full text-2xl",
                              "bg-gradient-to-br shadow-sm",
                              personality.color,
                              isSelected && "ring-2 ring-primary ring-offset-2"
                            )}
                          >
                            {personality.avatar}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{personality.name}</h4>
                              <span className="text-lg">{personality.emoji}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {personality.description}
                            </p>
                          </div>
                        </div>

                        {/* Hover Effect - Subtle Hue Only */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                            "bg-gradient-to-br pointer-events-none mix-blend-overlay",
                            personality.color
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speaking Speed Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Speaking Speed</Label>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {formatSpeed(tempSettings.speed)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Slider
                    value={[tempSettings.speed]}
                    onValueChange={handleSpeedChange}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>0.5x (Slower)</span>
                    <span>1.0x (Normal)</span>
                    <span>2.0x (Faster)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> Adjust the speed to match your listening preference.         
                    Slower speeds are great for detailed information, while faster speeds work well for quick updates.
                  </p>
                </div>
              </div>

              {/* Current Selection Preview */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full text-xl",
                      "bg-gradient-to-br shadow-sm",
                      tempSettings.personality.color
                    )}
                  >
                    {tempSettings.personality.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Current Voice</p>
                    <p className="text-xs text-muted-foreground">
                      {tempSettings.personality.name} at {formatSpeed(tempSettings.speed)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}









