import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Loader2, Play } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function VideoGenerator() {
  const [image, setImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateVideo = async () => {
    if (!image) return;
    setLoading(true);
    
    // Check key selection
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }

    try {
      const base64Image = image.split(',')[1];
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'Animate this scene',
        image: {
          imageBytes: base64Image,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
          },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#101114] p-6 rounded-2xl border border-white/5 space-y-4">
      <h2 className="text-white font-bold text-lg">Animate Image with Veo</h2>
      <input type="file" onChange={handleUpload} className="hidden" id="img-upload" />
      <label htmlFor="img-upload" className="flex items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer text-gray-500 hover:text-white">
        <Upload className="mr-2" /> Upload Image
      </label>
      {image && <img src={image} className="w-full rounded-xl" />}
      <button 
        onClick={generateVideo} 
        disabled={loading || !image}
        className="w-full bg-[#22c55e] text-black font-bold p-3 rounded-xl flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Play />} Generate Video
      </button>
      {videoUrl && <video src={videoUrl} controls className="w-full rounded-xl" />}
    </div>
  );
}
