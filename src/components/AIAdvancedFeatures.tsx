import React, { useState } from 'react';
import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";
import { Mic, Video, Brain, Volume2, Loader2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function AIAdvancedFeatures() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleVideoUnderstand = async () => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Analyze this video for key information.",
        // Assuming video input is handled elsewhere or passed as part
      });
      setResult(response.text || 'No output');
    } catch (e) {
      setResult('Error: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    setLoading(true);
    try {
        // Assuming audio input is handled elsewhere
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Transcribe this audio.",
      });
      setResult(response.text || 'No output');
    } catch (e) {
      setResult('Error: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplexQuery = async (query: string) => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: query,
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
      });
      setResult(response.text || 'No output');
    } catch (e) {
      setResult('Error: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async (text: string) => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
          },
        },
      });
      setResult('Audio generated');
    } catch (e) {
      setResult('Error: ' + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e222d] p-6 rounded-3xl border border-white/5 space-y-4">
      <h2 className="text-xl font-bold text-white">Advanced AI Features</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={handleVideoUnderstand} className="p-4 bg-[#101114] rounded-xl flex items-center gap-3 text-white hover:bg-[#2a2e39]">
          <Video size={20} /> Video Understanding
        </button>
        <button onClick={handleTranscribe} className="p-4 bg-[#101114] rounded-xl flex items-center gap-3 text-white hover:bg-[#2a2e39]">
          <Mic size={20} /> Transcribe Audio
        </button>
        <button onClick={() => handleComplexQuery("Explain quantum computing")} className="p-4 bg-[#101114] rounded-xl flex items-center gap-3 text-white hover:bg-[#2a2e39]">
          <Brain size={20} /> Complex Query (Thinking)
        </button>
        <button onClick={() => handleTTS("Hello, how can I help you today?")} className="p-4 bg-[#101114] rounded-xl flex items-center gap-3 text-white hover:bg-[#2a2e39]">
          <Volume2 size={20} /> Generate Speech
        </button>
      </div>
      {loading && <Loader2 className="animate-spin text-blue-500 mx-auto" />}
      {result && <div className="p-4 bg-[#101114] rounded-xl text-gray-300 text-sm">{result}</div>}
    </div>
  );
}
