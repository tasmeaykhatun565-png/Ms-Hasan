import React from 'react';
import Chatbot from './Chatbot';
import VideoGenerator from './VideoGenerator';
import LiveAudioChat from './LiveAudioChat';
import AIAdvancedFeatures from './AIAdvancedFeatures';

export default function AIFeaturesDashboard() {
  return (
    <div className="h-full overflow-y-auto p-4 pb-24 bg-[#101114] space-y-6">
      <h1 className="text-2xl font-black text-white mb-6">AI Features</h1>
      <LiveAudioChat />
      <VideoGenerator />
      <AIAdvancedFeatures />
      <div className="h-[500px]">
        <Chatbot />
      </div>
    </div>
  );
}
