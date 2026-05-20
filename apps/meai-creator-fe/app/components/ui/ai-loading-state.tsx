import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const DEFAULT_STEPS = [
  "Analyzing source content...",
  "Extracting publishing intent...",
  "Optimizing engagement tone...",
  "Generating improved draft...",
  "Finalizing refinements..."
];

interface Props {
  steps?: string[];
}

export default function AiLoadingState({ steps }: Props) {
  const activeSteps = steps || DEFAULT_STEPS;
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % activeSteps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeSteps.length]);

  return (
    <div className="w-full min-h-[340px] rounded-[28px] border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />

      <div className="relative w-40 h-40 flex items-center justify-center scale-90">
        {/* Orbit 1 (Outer) */}
        <div className="absolute w-full h-full border border-amber-500/20 rounded-full animate-[spin_8s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500/40 rounded-full blur-[2px]" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        </div>

        {/* Orbit 2 (Middle, rotating opposite direction) */}
        <div className="absolute w-28 h-28 border border-orange-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse]">
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
        </div>

        {/* Orbit 3 (Inner) */}
        <div className="absolute w-16 h-16 border border-white/20 rounded-full animate-[spin_3s_linear_infinite]">
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
        </div>

        {/* Central Core */}
        <div className="relative z-10 w-12 h-12 bg-linear-to-tr from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
          
          {/* Core ripples */}
          <div className="absolute inset-0 rounded-full border border-amber-500/50 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Main Status Text */}
      <div className="mt-8 h-6 relative flex items-center justify-center overflow-hidden w-full px-12">
        {activeSteps.map((text, i) => (
          <p
            key={i}
            className={`absolute text-sm font-medium text-amber-200 transition-all duration-1000 tracking-wide text-center leading-relaxed ${
              i === stepIndex 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            {text}
          </p>
        ))}
      </div>

      {/* Elapsed Counter */}
      <div className="mt-10 opacity-40">
        <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
          Processing • {elapsed}s
        </p>
      </div>
    </div>
  );
}
