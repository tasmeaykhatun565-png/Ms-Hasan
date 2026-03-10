import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Copy, Check, X, ArrowRight, Zap, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface Signal {
  id: string;
  asset: string;
  assetShortName: string;
  type: 'UP' | 'DOWN';
  entryPrice: number;
  timeframe: string;
  confidence: number;
  timestamp: number;
  expiry: number;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED';
}

interface SignalGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAsset: {
    name: string;
    shortName: string;
    payout: number;
    flag: string;
    category: string;
  };
  currentPrice: number;
  onApplySignal: (signal: Signal) => void;
  investmentAmount: number;
  currencySymbol: string;
}

export const SignalGenerator: React.FC<SignalGeneratorProps> = ({
  isOpen,
  onClose,
  currentAsset,
  currentPrice,
  onApplySignal,
  investmentAmount,
  currencySymbol
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Reset state when opened
  useEffect(() => {
    if (isOpen && !currentSignal) {
      generateSignal();
    }
  }, [isOpen]);

  // Countdown timer for signal expiry
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentSignal && currentSignal.status === 'ACTIVE') {
      setCurrentSignal(prev => prev ? { ...prev, status: 'EXPIRED' } : null);
    }
  }, [countdown, currentSignal]);

  const generateSignal = () => {
    setIsGenerating(true);
    setCurrentSignal(null);

    // Simulate AI analysis delay
    setTimeout(() => {
      const isUp = Math.random() > 0.5;
      const confidence = 85 + Math.floor(Math.random() * 14); // 85-99%
      const duration = 60; // 1 minute expiry

      const newSignal: Signal = {
        id: Math.random().toString(36).substr(2, 9),
        asset: currentAsset.name,
        assetShortName: currentAsset.shortName,
        type: isUp ? 'UP' : 'DOWN',
        entryPrice: currentPrice,
        timeframe: '1m',
        confidence: confidence,
        timestamp: Date.now(),
        expiry: Date.now() + duration * 1000,
        status: 'ACTIVE'
      };

      setCurrentSignal(newSignal);
      setCountdown(duration);
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = () => {
    if (!currentSignal) return;
    
    const text = `
🔥 AI TRADING SIGNAL 🔥
Asset: ${currentSignal.assetShortName}
Direction: ${currentSignal.type === 'UP' ? 'BUY 🟢' : 'SELL 🔴'}
Timeframe: ${currentSignal.timeframe}
Confidence: ${currentSignal.confidence}%
Entry: ${currentSignal.entryPrice.toFixed(5)}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (currentSignal && currentSignal.status === 'ACTIVE') {
      onApplySignal(currentSignal);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#1e222d] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#161920]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Brain size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Signal Generator</h3>
              <p className="text-[10px] text-gray-400">Powered by Neural Networks</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                <Brain className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={32} />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-white font-bold animate-pulse">Analyzing Market Data...</h4>
                <p className="text-xs text-gray-400">Scanning indicators, volume & volatility</p>
              </div>
            </div>
          ) : currentSignal ? (
            <div className="space-y-6">
              {/* Asset Info */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{currentAsset.flag}</div>
                  <div>
                    <div className="font-bold text-white">{currentAsset.name}</div>
                    <div className="text-xs text-gray-400">{currentAsset.category} • {currentAsset.payout}% Payout</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Current Price</div>
                  <div className="font-mono font-bold text-white">{currentPrice.toFixed(5)}</div>
                </div>
              </div>

              {/* Signal Card */}
              <div className={cn(
                "relative overflow-hidden rounded-2xl border-2 p-6 text-center space-y-4",
                currentSignal.type === 'UP' 
                  ? "bg-green-500/10 border-green-500/50" 
                  : "bg-red-500/10 border-red-500/50"
              )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black/30 px-2 py-1 rounded text-white/80">
                    {currentSignal.timeframe} Expiry
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider bg-black/30 px-2 py-1 rounded text-white/80 flex items-center gap-1">
                    <Target size={12} /> {currentSignal.confidence}% Confidence
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-2",
                    currentSignal.type === 'UP' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {currentSignal.type === 'UP' ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                  </div>
                  <h2 className={cn(
                    "text-3xl font-black uppercase tracking-tight",
                    currentSignal.type === 'UP' ? "text-green-500" : "text-red-500"
                  )}>
                    {currentSignal.type === 'UP' ? 'CALL / BUY' : 'PUT / SELL'}
                  </h2>
                </div>

                {currentSignal.status === 'ACTIVE' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-400">
                    <Clock size={12} />
                    <span>Signal expires in {countdown}s</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-[#2a2e39] hover:bg-[#343a46] text-white font-bold py-3 rounded-xl transition active:scale-[0.98]"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  <span>{copied ? 'Copied!' : 'Copy Signal'}</span>
                </button>
                
                <button 
                  onClick={handleApply}
                  disabled={currentSignal.status !== 'ACTIVE'}
                  className={cn(
                    "flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition active:scale-[0.98] shadow-lg",
                    currentSignal.status === 'ACTIVE'
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Zap size={18} className={currentSignal.status === 'ACTIVE' ? "fill-current" : ""} />
                  <span>Apply Trade</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-gray-500">
                  Trade Amount: <span className="text-white font-bold">{currencySymbol}{investmentAmount}</span> • 
                  Potential Profit: <span className="text-green-500 font-bold">
                    +{currencySymbol}{(investmentAmount * (currentAsset.payout / 100)).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-white font-bold">Signal Expired</h3>
                <p className="text-sm text-gray-400">Please generate a new signal.</p>
              </div>
              <button 
                onClick={generateSignal}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition"
              >
                Generate New Signal
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
