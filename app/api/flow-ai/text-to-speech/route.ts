import { NextRequest } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Lazy-initialize Eleven Labs client to avoid build-time errors when API key is not set
let elevenlabs: ElevenLabsClient | null = null;

function getElevenLabsClient(): ElevenLabsClient | null {
  if (!process.env.ELEVENLABS_API_KEY) {
    return null;
  }
  if (!elevenlabs) {
    elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return elevenlabs;
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId: requestVoiceId } = await request.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if API key is configured
    const client = getElevenLabsClient();
    if (!client) {
      console.error('ELEVENLABS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Text-to-speech service is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use voice ID from request, environment variable, or default
    const voiceId = requestVoiceId || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

    // Generate speech using Eleven Labs with turbo model for MUCH faster generation
    // eleven_turbo_v2_5 is optimized for speed and low latency
    const audioStream = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_turbo_v2_5',
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
      },
    });

    // Stream directly to client without buffering for immediate playback
    return new Response(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('Error generating speech:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate speech' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
