import React from 'react';
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
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col space-y-4">
      {steps.filter((s) => s != null).map((step, index) => {
        const { label, Icon } = getStepConfig(step.step);
        const isRunning = step.status === 'Running' || step.step === currentStep;
        const isCompleted = step.status === 'Completed';
        const isFailed = step.status === 'Failed';
        const isSkipped = step.status === 'Skipped';

        return (
          <div key={step.step + index} className="flex items-start gap-4">
            <div className="relative flex flex-col items-center">
              {/* Vertical line connector */}
              {index !== steps.length - 1 && (
                <div className="absolute top-8 bottom-[-16px] w-0.5 bg-gray-200 dark:bg-gray-800" />
              )}
              
              {/* Status Icon Indicator */}
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-950">
                {isRunning ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isFailed ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 opacity-50" />
                )}
              </div>
            </div>

            <div className={`flex flex-col pt-1 pb-4 ${isSkipped ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isRunning ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
                <span className={`font-medium ${isRunning ? 'text-blue-500' : isFailed ? 'text-red-500' : 'text-foreground'}`}>
                  {label}
                </span>
              </div>
              {step.message && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
                  {step.message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
