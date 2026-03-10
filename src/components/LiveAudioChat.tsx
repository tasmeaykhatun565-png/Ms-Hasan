import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Loader2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function LiveAudioChat() {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<any>(null);

  const startLive = async () => {
    setLoading(true);
    try {
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setLoading(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              // ... decode and play audio ...
              console.log("Received audio chunk");
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const stopLive = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      setIsLive(false);
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center gap-4">
      <h2 className="text-[var(--text-primary)] font-bold text-lg">Live Audio Chat</h2>
      <button 
        onClick={isLive ? stopLive : startLive}
        className={`p-6 rounded-full ${isLive ? 'bg-red-500' : 'bg-[#22c55e]'} text-black`}
      >
        {loading ? <Loader2 className="animate-spin" /> : isLive ? <MicOff size={32} /> : <Mic size={32} />}
      </button>
      <p className="text-[var(--text-secondary)] text-sm">{isLive ? 'Listening...' : 'Click to start conversation'}</p>
    </div>
  );
}
