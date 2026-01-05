'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { stripMarkdown } from '@/lib/flow-ai/markdown-utils';
import { VoiceSettings } from '@/components/flow-ai/flowrms/VoiceSettingsDialog';

interface UseTextToSpeechReturn {
  isPlaying: boolean;
  isSpeaking: (messageId: string) => boolean;
  speak: (text: string, messageId: string, settings?: VoiceSettings) => Promise<void>;
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentMessageId(null);
  }, []);

  const speak = useCallback(async (text: string, messageId: string, settings?: VoiceSettings) => {
    // If already playing this message, stop it
    if (currentMessageId === messageId && isPlaying) {
      stop();
      return;
    }

    // Stop any currently playing audio
    stop();

    // Check if voice is enabled
    if (settings && !settings.enabled) {
      return;
    }

    try {
      setIsPlaying(true);
      setCurrentMessageId(messageId);

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Strip markdown formatting from text before sending to TTS
      const cleanText = stripMarkdown(text);

      // Call the text-to-speech API with voice settings
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: cleanText,
          voiceId: settings?.personality.voiceId,
          speed: settings?.speed || 1.0,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set playback rate based on settings
      if (settings?.speed) {
        audio.playbackRate = settings.speed;
      }

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
        toast.error('Failed to play audio');
      };

      await audio.play();
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, which is expected
        return;
      }
      
      console.error('Error generating speech:', error);
      toast.error('Failed to generate speech. Please try again.');
      setIsPlaying(false);
      setCurrentMessageId(null);
    }
  }, [currentMessageId, isPlaying, stop]);

  const isSpeaking = useCallback((messageId: string) => {
    return isPlaying && currentMessageId === messageId;
  }, [isPlaying, currentMessageId]);

  return {
    isPlaying,
    isSpeaking,
    speak,
    stop,
  };
}





