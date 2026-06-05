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
  terminalStatus?: 'Completed' | 'Failed';
}

const formatStepLabel = (stepId: string) => {
  const clean = stepId.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!clean) return 'Automation Step';

  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
};

const getStepId = (step: ProgressLogStep, currentStep?: string) => {
  const candidates = [
    step.step,
    step.stepId,
    step.stepCode,
    step.currentStep,
    step.action,
    step.name,
    step.title,
    step.status === 'Running' ? currentStep : undefined
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
};

const getStepTimestamp = (step: ProgressLogStep) => {
  const timestamp = step.timestampUtc || step.timestamp || step.createdAt;
  if (!timestamp) return null;

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getStepConfig = (stepId: string | undefined | null) => {
  const normalizedStepId = stepId?.trim();
  if (!normalizedStepId) return { label: 'Automation Step', Icon: Circle };

  const code = normalizedStepId.toLowerCase();
  if (code === 'web_search') return { label: 'Web Search', Icon: Globe };
  if (code === 'rag_ready') return { label: 'Knowledge Base Grounding', Icon: Cpu };
  if (code === 'indexing_grounding') return { label: 'Brand Voice Analysis', Icon: BookOpen };
  if (code === 'recommendation_generation') return { label: 'Idea Generation', Icon: Lightbulb };
  if (code.startsWith('draft_generation_')) {
    const platform = normalizedStepId.replace(/^draft_generation_/i, '');
    const platformName = formatStepLabel(platform);
    return { label: `Draft Generation (${platformName})`, Icon: FileText };
  }
  if (code.startsWith('post_creation_')) {
    const platform = normalizedStepId.replace(/^post_creation_/i, '');
    const platformName = formatStepLabel(platform);
    return { label: `Post Creation (${platformName})`, Icon: Database };
  }
  if (code === 'asset_linking') return { label: 'Asset Linking', Icon: Paperclip };
  if (code === 'publishing') return { label: 'Publishing', Icon: Send };

  if (code.includes('search')) return { label: formatStepLabel(normalizedStepId), Icon: Globe };
  if (code.includes('rag') || code.includes('knowledge'))
    return { label: formatStepLabel(normalizedStepId), Icon: Cpu };
  if (code.includes('index') || code.includes('grounding'))
    return { label: formatStepLabel(normalizedStepId), Icon: BookOpen };
  if (code.includes('recommend') || code.includes('idea'))
    return { label: formatStepLabel(normalizedStepId), Icon: Lightbulb };
  if (code.includes('draft') || code.includes('content'))
    return { label: formatStepLabel(normalizedStepId), Icon: FileText };
  if (code.includes('post') || code.includes('save'))
    return { label: formatStepLabel(normalizedStepId), Icon: Database };
  if (code.includes('asset') || code.includes('media') || code.includes('image'))
    return { label: formatStepLabel(normalizedStepId), Icon: Paperclip };
  if (code.includes('publish')) return { label: formatStepLabel(normalizedStepId), Icon: Send };

  return { label: formatStepLabel(normalizedStepId), Icon: Circle };
};

export function ScheduleProgressTimeline({ steps, currentStep, terminalStatus }: ScheduleProgressTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  if (!steps || steps.length === 0) return null;

  const toggleStep = (key: string) => {
    setExpandedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleSteps = steps.filter((s): s is ProgressLogStep => s != null);
  const lastRunningStepIndex = visibleSteps.reduce(
    (lastIndex, step, index) => (step.status === 'Running' ? index : lastIndex),
    -1
  );

  return (
    <div className='flex flex-col space-y-4 pt-2'>
      {visibleSteps.map((step, index) => {
        const stepId = getStepId(step, currentStep);
        const { label, Icon } = getStepConfig(stepId);
        const displayStatus =
          terminalStatus === 'Completed' && step.status === 'Running'
            ? 'Completed'
            : terminalStatus === 'Failed' && step.status === 'Running'
              ? stepId === currentStep || index === lastRunningStepIndex
                ? 'Failed'
                : 'Completed'
              : step.status;
        const isCompleted = displayStatus === 'Completed';
        const isFailed = displayStatus === 'Failed';
        const isSkipped = displayStatus === 'Skipped';
        const isRunning =
          displayStatus === 'Running' ||
          (!terminalStatus && !isCompleted && !isFailed && !isSkipped && stepId === currentStep);
        const stepKey = `${stepId || step.message || 'automation_step'}_${index}`;
        const isExpanded = !!expandedSteps[stepKey];
        const timestamp = getStepTimestamp(step);

        const hasLongMessage = step.message && step.message.length > 100;
        const displayMessage = step.message
          ? hasLongMessage && !isExpanded
            ? `${step.message.slice(0, 100)}...`
            : step.message
          : '';

        return (
          <div key={stepKey} className='relative group flex items-start gap-4'>
            <div className='relative flex flex-col items-center flex-none'>
              {/* Vertical line connector */}
              {index !== visibleSteps.length - 1 && (
                <div className='absolute top-10 bottom-[-24px] w-0.5 bg-white/5 dark:bg-white/10' />
              )}

              {/* Status Icon Indicator */}
              <div className='relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#080a12] border-2 border-white/10 shadow-sm mt-1'>
                {isRunning ? (
                  <Loader2 className='h-4 w-4 animate-spin text-violet-400' />
                ) : isCompleted ? (
                  <CheckCircle2 className='h-4 w-4 text-emerald-400' />
                ) : isFailed ? (
                  <XCircle className='h-4 w-4 text-rose-500' />
                ) : (
                  <Circle className='h-3 w-3 text-slate-600 opacity-60' />
                )}
              </div>
            </div>

            <div
              className={cn(
                'flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-colors',
                isSkipped && 'opacity-50'
              )}
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <Icon
                    className={cn('h-4 w-4 shrink-0', isRunning ? 'text-violet-400 animate-pulse' : 'text-slate-400')}
                  />
                  <h5
                    className={cn(
                      'text-sm font-bold truncate leading-none pt-0.5',
                      isRunning ? 'text-violet-400' : isFailed ? 'text-rose-400' : 'text-slate-200'
                    )}
                  >
                    {label}
                  </h5>
                  {displayStatus && (
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-none leading-none border-none mt-0.5',
                        isRunning && 'bg-violet-500/10 text-violet-400',
                        isCompleted && 'bg-emerald-500/10 text-emerald-400',
                        isFailed && 'bg-rose-500/10 text-rose-400',
                        isSkipped && 'bg-slate-500/10 text-slate-500'
                      )}
                    >
                      {displayStatus}
                    </span>
                  )}
                </div>
                {timestamp && (
                  <span className='text-xs text-slate-500 font-medium whitespace-nowrap pt-0.5'>
                    {timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>

              {step.message && (
                <div className='mt-3 pl-7'>
                  <p className='text-xs font-mono leading-relaxed text-slate-400 break-words max-w-full'>
                    {displayMessage}
                    {hasLongMessage && (
                      <button
                        onClick={() => toggleStep(stepKey)}
                        className='ml-2 text-violet-400 hover:text-violet-300 font-bold hover:underline select-none leading-none'
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
