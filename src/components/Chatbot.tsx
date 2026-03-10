import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, MapPin } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function Chatbot() {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; links?: { title: string, uri: string }[] }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: input,
        config: {
          tools: [{ googleSearch: {} }, { googleMaps: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const links = chunks?.map(chunk => ({
        title: chunk.web?.title || chunk.maps?.title || 'Source',
        uri: chunk.web?.uri || chunk.maps?.uri || '#'
      })) || [];

      const botMessage = { role: 'bot' as const, text: response.text || "Sorry, I couldn't generate a response.", links };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Error: Could not connect to AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
        <Bot className="text-[#22c55e]" />
        <h2 className="text-[var(--text-primary)] font-bold">AI Assistant</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'bot' && <Bot className="text-[var(--text-secondary)]" />}
            <div className={`p-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-[#22c55e] text-black' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
              {msg.links && msg.links.length > 0 && (
                <div className="mt-2 text-xs text-blue-400">
                  {msg.links.map((link, j) => (
                    <a key={j} href={link.uri} target="_blank" rel="noopener noreferrer" className="block underline">{link.title}</a>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && <User className="text-[#22c55e]" />}
          </div>
        ))}
        {loading && <div className="text-[var(--text-secondary)] text-sm">Thinking...</div>}
      </div>
      <div className="p-4 border-t border-[var(--border-color)] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
          className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none"
        />
        <button onClick={sendMessage} className="bg-[#22c55e] p-3 rounded-xl text-black">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
