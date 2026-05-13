import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const LOADING_TEXTS = [
  "MeAI is analyzing your content...",
  "Gathering context and keywords...",
  "Applying creative magic...",
  "Refining sentence structures...",
  "Almost there..."
];

export default function AiLoadingState() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[300px] rounded-[24px] border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />

      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Orbit 1 (Outer) */}
        <div className="absolute w-full h-full border border-amber-500/10 rounded-full animate-[spin_8s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500/40 rounded-full blur-[2px]" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        </div>

        {/* Orbit 2 (Middle, rotating opposite direction) */}
        <div className="absolute w-28 h-28 border border-orange-500/20 rounded-full animate-[spin_5s_linear_infinite_reverse]">
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
        </div>

        {/* Orbit 3 (Inner) */}
        <div className="absolute w-16 h-16 border border-white/10 rounded-full animate-[spin_3s_linear_infinite]">
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
        </div>

        {/* Central Core */}
        <div className="relative z-10 w-12 h-12 bg-linear-to-tr from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
          
          {/* Core ripples */}
          <div className="absolute inset-0 rounded-full border border-amber-500/50 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Dynamic Text */}
      <div className="mt-8 h-6 relative flex items-center justify-center overflow-hidden w-full">
        {LOADING_TEXTS.map((text, i) => (
          <p
            key={i}
            className={`absolute text-sm font-medium text-amber-200/80 transition-all duration-500 ${
              i === textIndex 
                ? 'opacity-100 transform-none' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
