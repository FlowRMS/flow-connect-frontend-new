import { NextRequest, NextResponse } from 'next/server';
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
    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const client = getElevenLabsClient();
    if (!client) {
      console.error('ELEVENLABS_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Speech-to-text service is not configured' },
        { status: 500 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use Eleven Labs speech-to-text
    const transcription = await client.speechToText.convert({
      file: buffer,
      modelId: 'scribe_v2',
    });

    // Extract text from response
    const resultText = typeof transcription === 'string' 
      ? transcription 
      : (transcription as { text?: string }).text || '';

    return NextResponse.json({ text: resultText });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
