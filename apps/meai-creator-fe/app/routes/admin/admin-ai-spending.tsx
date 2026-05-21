import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type LoaderFunctionArgs } from 'react-router';
import {
  Coins,
  Zap,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Cpu,
  Loader2,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { requireUser, hasRole } from '@/services/server/session.server';
import {
  fetchAdminAiUsageHistory,
  fetchAdminAiUsageSummary,
  fetchAdminUsers
} from '@/services/client/admin.client';
import type { AiSpendRecord } from '@/models/ai-usage.model';
import { cn } from '@/lib/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) {
    throw new Response('Forbidden', { status: 403 });
  }
  return null;
}

const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: typeof Coins; color: string; bgColor: string }> = {
  image_generation: {
    label: 'Image',
    icon: ImageIcon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10'
  },
  video_generation: {
    label: 'Video',
    icon: Video,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10'
  },
  caption_generation: {
    label: 'Caption',
    icon: MessageSquare,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  }
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  debited: {
    label: 'Debited',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  },
  pending: {
    label: 'Processing',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 before:content-[""] before:w-1.5 before:h-1.5 before:rounded-full before:bg-cyan-400 before:animate-[pulse_2s_ease-in-out_infinite]'
  }
};

function formatCoins(value: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value);
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatFullDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatModelName(model: string): string {
  if (!model) return 'AI Model';
  let cleaned = model;
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1] || cleaned;
  }
  const lower = cleaned.toLowerCase();
  if (lower.includes('dall-e')) return cleaned.toUpperCase().replace(/-E-/i, '-E ');
  if (lower.startsWith('gpt-')) return 'GPT-' + cleaned.substring(4).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  if (lower.startsWith('claude-')) return 'Claude ' + cleaned.substring(7).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/(\d) (\d)/g, '$1.$2');
  if (lower.startsWith('gemini-')) return 'Gemini ' + cleaned.substring(7).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/(\d) (\d)/g, '$1.$2');
  if (lower.startsWith('llama-')) return 'Llama ' + cleaned.substring(6).replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  return cleaned.replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
}

function getProviderDetails(model: string, providerStr?: string | null): string {
  const normalizedProvider = (providerStr || '').toLowerCase();
  if (normalizedProvider === 'kie' && model && model.includes('/')) {
    const parts = model.split('/');
    return parts[0].replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
  }
  const combined = `${normalizedProvider} ${model || ''}`.toLowerCase();
  if (combined.includes('openai') || combined.includes('gpt')) return 'OpenAI';
  if (combined.includes('anthropic') || combined.includes('claude')) return 'Claude';
  if (combined.includes('google') || combined.includes('gemini')) return 'Gemini';
  if (combined.includes('meta') || combined.includes('llama')) return 'Meta Llama';
  if (combined.includes('stability') || combined.includes('sdxl')) return 'Stability AI';
  if ((providerStr || '').toLowerCase() === 'openrouter') return 'OpenRouter';
  return (providerStr || 'AI Provider').replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
}

function ProgressCircle({ percentage, colorClass = 'stroke-slate-300' }: { percentage: number; colorClass?: string }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, percentage)) / 100) * circumference;
  return (
    <svg className="size-5 -rotate-90" viewBox="0 0 24 24">
      <circle className="stroke-white/[0.04]" strokeWidth="2.5" fill="transparent" r={radius} cx="12" cy="12" />
      <circle
        className={cn("transition-all duration-500 ease-in-out", colorClass)}
        strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx="12"
        cy="12"
      />
    </svg>
  );
}

export default function AdminAiSpending() {
  const { data: usersRes } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchAdminUsers({ includeDeleted: true }),
    staleTime: 5 * 60_000,
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, any>();
    if (usersRes?.value) {
      for (const u of usersRes.value) {
        map.set(u.id, u);
      }
    }
    return map;
  }, [usersRes]);

  const { data: summaryRes, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['admin', 'ai-summary'],
    queryFn: () => fetchAdminAiUsageSummary(),
    staleTime: 5 * 60_000,
  });

  const summaryData = summaryRes?.isSuccess ? summaryRes.value : null;

  const { data: historyRes, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin', 'ai-history'],
    queryFn: () => fetchAdminAiUsageHistory({ limit: 20 }),
    staleTime: 5 * 60_000,
  });

  const historyItems = historyRes?.isSuccess ? historyRes.value.items : [];

  const netCoins = summaryData?.totals?.netCoins || 0;
  const refundedCoins = summaryData?.totals?.refundedCoins || 0;
  const totalCoins = netCoins + refundedCoins;
  const netPercentage = totalCoins > 0 ? (netCoins / totalCoins) * 100 : 0;
  const refundedPercentage = totalCoins > 0 ? (refundedCoins / totalCoins) * 100 : 0;

  if (isLoadingSummary || isLoadingHistory) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-violet-500" />
        <p className="text-sm text-slate-400">Loading AI spending data...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-white'>AI Spending</h1>
      </div>

      {summaryData && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <div className='relative overflow-hidden rounded-xl border border-amber-500/10 bg-[#13131e] p-5 flex items-center justify-between'>
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20'>
                  <Coins className='size-4 text-amber-400' />
                </div>
                <p className='text-[13px] font-medium text-slate-400'>Total Coins Spent</p>
              </div>
              <div className='flex items-end gap-2'>
                <p className='text-[26px] font-bold tracking-tight text-white font-mono'>{formatCoins(summaryData.totals.netCoins)}</p>
                <span className='text-[12px] text-slate-500 mb-1.5'>coins</span>
              </div>
            </div>
            {totalCoins > 0 && (
              <div className='flex items-center gap-1.5 self-start mt-2' title={`Spent: ${formatCoins(netCoins)} coins (${Math.round(netPercentage)}%)`}>
                <span className='text-[11px] font-mono text-slate-400'>{Math.round(netPercentage)}%</span>
                <ProgressCircle percentage={netPercentage} colorClass='stroke-amber-400' />
              </div>
            )}
          </div>
          <div className='relative overflow-hidden rounded-xl border border-violet-500/10 bg-[#13131e] p-5 flex items-center justify-between'>
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20'>
                  <Zap className='size-4 text-violet-400' />
                </div>
                <p className='text-[13px] font-medium text-slate-400'>Total Requests</p>
              </div>
              <p className='text-[26px] font-bold tracking-tight text-white font-mono'>{summaryData.totals.totalRequests}</p>
            </div>
          </div>
          <div className='relative overflow-hidden rounded-xl border border-orange-500/10 bg-[#13131e] p-5 flex items-center justify-between'>
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20'>
                  <RotateCw className='size-4 text-orange-400' />
                </div>
                <p className='text-[13px] font-medium text-slate-400'>Refunded</p>
              </div>
              <div className='flex items-end gap-2'>
                <p className='text-[26px] font-bold tracking-tight text-orange-500/80 font-mono'>{formatCoins(summaryData.totals.refundedCoins)}</p>
              </div>
            </div>
             {totalCoins > 0 && (
              <div className='flex items-center gap-1.5 self-start mt-2' title={`Refunded: ${formatCoins(refundedCoins)} coins (${Math.round(refundedPercentage)}%)`}>
                <span className='text-[11px] font-mono text-orange-500/60'>{Math.round(refundedPercentage)}%</span>
                <ProgressCircle percentage={refundedPercentage} colorClass='stroke-orange-500/60' />
              </div>
            )}
          </div>
        </div>
      )}

      <div className='overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e]'>
        <div className='flex items-center justify-between border-b border-white/[0.06] px-5 py-4'>
          <h2 className='text-[14px] font-semibold text-white'>AI Spending History (Recent)</h2>
        </div>
        
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/[0.04] bg-white/[0.01]'>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Record ID</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>User</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Action & Model</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Coins</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Status</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Processing</th>
                <th className='px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500'>Date</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.length > 0 ? (
                historyItems.map((record: AiSpendRecord) => {
                  const user = usersMap.get(record.userId);
                  const displayName = user?.fullName || user?.username || 'Unknown User';
                  
                  const actionConfig = ACTION_TYPE_CONFIG[record.actionType] ?? {
                    label: record.actionType.replace(/_/g, ' '),
                    icon: Cpu,
                    color: 'text-slate-400',
                    bgColor: 'bg-slate-500/10'
                  };
                  const ActionIcon = actionConfig.icon;
                  
                  const statusConfig = STATUS_CONFIG[record.status.toLowerCase()] ?? {
                    label: record.status,
                    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  };

                  return (
                    <tr key={record.spendRecordId} className='border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/[0.015]'>
                      <td className='px-5 py-3'>
                         <span className='text-[12px] font-medium text-violet-400 font-mono'>{record.spendRecordId.slice(0, 8)}...</span>
                      </td>
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-3'>
                          {user?.avatarPresignedUrl ? (
                            <img src={user.avatarPresignedUrl} alt={displayName} className='size-8 shrink-0 rounded-full object-cover' />
                          ) : (
                            <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300'>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <p className='text-[13px] font-medium text-white'>{displayName}</p>
                            <p className='text-[11px] text-slate-500'>{user?.email || record.userId.slice(0,10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3'>
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', actionConfig.bgColor)}>
                            <ActionIcon className={cn('size-3.5', actionConfig.color)} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-medium text-white/90 leading-tight">{getProviderDetails(record.model, record.provider)}</span>
                            <span className="text-[10px] text-slate-500 font-mono leading-tight mt-0.5">{formatModelName(record.model)}</span>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3'>
                        <span className='font-mono text-[13px] font-bold text-amber-400'>{formatCoins(record.totalCoins)}</span>
                      </td>
                      <td className='px-5 py-3'>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusConfig.className)}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                        <span className='text-[12px] text-slate-400 font-mono'>
                          {record.processingDurationSeconds != null ? `${record.processingDurationSeconds}s` : '—'}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                         <div className="flex flex-col">
                           <span className='text-[12px] text-slate-300'>{formatRelativeDate(record.createdAt)}</span>
                           <span className='text-[10px] text-slate-500'>{formatFullDate(record.createdAt)}</span>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className='py-12 text-center'>
                    <div className='flex flex-col items-center justify-center'>
                      <div className='flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-slate-600 mb-3'>
                        <Cpu size={22} />
                      </div>
                      <p className='text-[13px] font-semibold text-slate-400'>No AI spending records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
