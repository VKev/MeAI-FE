import React, { useState } from 'react';
import {
  Globe,
  Cpu,
  BookOpen,
  Lightbulb,
  FileText,
  Database,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle
} from 'lucide-react';
import type { ProgressLogStep } from '@/models/ai-schedule.model';
import { cn } from '@/lib/utils';

interface ScheduleProgressTimelineProps {
  steps: ProgressLogStep[];
  currentStep?: string;
}

const getStepConfig = (stepId: string | undefined | null) => {
  if (!stepId) return { label: 'Unknown Step', Icon: Circle };
  if (stepId === 'web_search') return { label: 'Web Search', Icon: Globe };
  if (stepId === 'rag_ready') return { label: 'Knowledge Base Grounding', Icon: Cpu };
  if (stepId === 'indexing_grounding') return { label: 'Brand Voice Analysis', Icon: BookOpen };
  if (stepId === 'recommendation_generation') return { label: 'Idea Generation', Icon: Lightbulb };
  if (stepId.startsWith('draft_generation_')) {
    const platform = stepId.replace('draft_generation_', '');
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    return { label: `Draft Generation (${platformName})`, Icon: FileText };
  }
  if (stepId.startsWith('post_creation_')) {
    const platform = stepId.replace('post_creation_', '');
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    return { label: `Post Creation (${platformName})`, Icon: Database };
  }
  if (stepId === 'asset_linking') return { label: 'Asset Linking', Icon: Paperclip };
  if (stepId === 'publishing') return { label: 'Publishing', Icon: Send };
  
  return { label: stepId, Icon: Circle };
};

export function ScheduleProgressTimeline({ steps, currentStep }: ScheduleProgressTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  if (!steps || steps.length === 0) return null;

  const toggleStep = (key: string) => {
    setExpandedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col space-y-3.5">
      {steps.filter((s) => s != null).map((step, index) => {
        const { label, Icon } = getStepConfig(step.step);
        const isRunning = step.status === 'Running' || step.step === currentStep;
        const isCompleted = step.status === 'Completed';
        const isFailed = step.status === 'Failed';
        const isSkipped = step.status === 'Skipped';
        const stepKey = `${step.step}_${index}`;
        const isExpanded = !!expandedSteps[stepKey];

        const hasLongMessage = step.message && step.message.length > 100;
        const displayMessage = step.message 
          ? (hasLongMessage && !isExpanded ? `${step.message.slice(0, 100)}...` : step.message)
          : '';

        return (
          <div key={stepKey} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center flex-none">
              {/* Vertical line connector */}
              {index !== steps.length - 1 && (
                <div className="absolute top-6 bottom-[-14px] w-0.5 bg-white/5 dark:bg-white/10" />
              )}
              
              {/* Status Icon Indicator */}
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#080a12] border border-white/5">
                {isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : isFailed ? (
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                ) : (
                  <Circle className="h-2.5 w-2.5 text-slate-600 opacity-60" />
                )}
              </div>
            </div>

            <div className={cn("flex-1 min-w-0 flex flex-col pt-0.5 pb-2.5", isSkipped && "opacity-50")}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", isRunning ? "text-violet-400 animate-pulse" : "text-slate-400")} />
                  <span className={cn(
                    "text-[12px] font-bold truncate leading-none", 
                    isRunning ? "text-violet-400" : isFailed ? "text-rose-400" : "text-slate-200"
                  )}>
                    {label}
                  </span>
                </div>
                {step.status && (
                  <span className={cn(
                    "text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-none leading-none border-none",
                    isRunning && "bg-violet-500/10 text-violet-400",
                    isCompleted && "bg-emerald-500/10 text-emerald-400",
                    isFailed && "bg-rose-500/10 text-rose-400",
                    isSkipped && "bg-slate-500/10 text-slate-500"
                  )}>
                    {step.status}
                  </span>
                )}
              </div>
              
              {step.message && (
                <div className="mt-1.5">
                  <p className="text-[11px] font-mono leading-normal text-slate-400 bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-lg break-words max-w-full">
                    {displayMessage}
                    {hasLongMessage && (
                      <button
                        onClick={() => toggleStep(stepKey)}
                        className="ml-2 text-violet-400 hover:text-violet-300 font-bold hover:underline select-none leading-none"
                      >
                        {isExpanded ? 'show less' : 'expand'}
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
