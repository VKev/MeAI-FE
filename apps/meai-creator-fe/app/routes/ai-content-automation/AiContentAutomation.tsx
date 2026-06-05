import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  BotIcon,
  PlusIcon,
  RefreshCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Settings2,
  ListTodo,
  ArrowRight,
  Zap,
  Check,
  FileText,
  Globe,
  Star,
  Loader2,
  Flame,
  TrendingUp,
  XCircle,
  X,
  Calendar,
  AlertTriangle,
  Send,
  Pencil,
  UserPlus,
  Cpu,
  BookOpen,
  Lightbulb,
  Database,
  Paperclip
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlatformStack } from '@/components/ui/platform-stack';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AiScheduleClientApi } from '@/services/client/ai-schedule.client';
import { ChatSessionClientApi } from '@/services/client/chat-session.client';
import { fetchSocialMedias, fetchWorkspaceLinkedSocialMedias, fetchFacebookPages } from '@/services/client/social-media.client';
import type { AiSchedule } from '@/models/ai-schedule.model';
import type { SocialMedia } from '@/models/social-media.model';
import { ScheduleProgressTimeline } from '@/components/ai-schedule/ScheduleProgressTimeline';
import {
  mergeFacebookPagesWithAccounts,
  getSocialMediaDisplayName,
  getSocialMediaAvatar
} from '@/utils/social-media-display';

// type PageView = 'dashboard' | 'create';
const MAX_INSTRUCTION_LENGTH = 1000;
const GLOBAL_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
const isGlobalWorkspaceId = (value?: string | null) => !value || value.toLowerCase() === GLOBAL_WORKSPACE_ID;
const IMMEDIATE_SCHEDULE_DELAY_MINUTES = 1;
const QUICK_SCHEDULE_DELAY_MINUTES = 2;
const CURRENT_TIME_SELECTION_GRACE_MINUTES = 2;
const QUARTER_HOUR_MINUTES = ['00', '15', '30', '45'];

type TimeOption = {
  value: string;
  label?: string;
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatTimeOption(date: Date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function isSameCalendarDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMinute(left: Date, right: Date) {
  return (
    isSameCalendarDate(left, right) && left.getHours() === right.getHours() && left.getMinutes() === right.getMinutes()
  );
}

function getImmediateExecutionDate() {
  return addMinutes(new Date(), IMMEDIATE_SCHEDULE_DELAY_MINUTES);
}

function setTimeOption(options: Map<string, TimeOption>, value: string, label?: string) {
  const existing = options.get(value);
  options.set(value, {
    value,
    label: label ?? existing?.label
  });
}

function buildTimeOptions(selectedDate?: Date): TimeOption[] {
  const options = new Map<string, TimeOption>();
  const now = new Date();
  const selectedDay = selectedDate ?? now;
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);
  const selectedDateStart = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isTodayOrPast = selectedDateStart.getTime() <= todayStart.getTime();

  if (isSameCalendarDate(selectedDay, now)) {
    const currentTime = formatTimeOption(now);
    setTimeOption(options, currentTime, `${currentTime} (+1m)`);
  }

  const plusTwoMinutes = addMinutes(now, QUICK_SCHEDULE_DELAY_MINUTES);
  if (isSameCalendarDate(selectedDay, plusTwoMinutes)) {
    const plusTwoTime = formatTimeOption(plusTwoMinutes);
    setTimeOption(options, plusTwoTime, `${plusTwoTime} (+2m)`);
  }

  for (let h = 0; h < 24; h++) {
    for (const m of QUARTER_HOUR_MINUTES) {
      const candidate = new Date(selectedDay);
      candidate.setHours(h, parseInt(m, 10), 0, 0);
      if (isTodayOrPast && candidate.getTime() < currentMinute.getTime()) continue;
      setTimeOption(options, formatTimeOption(candidate));
    }
  }

  return Array.from(options.values()).sort((a, b) => {
    const [ha, ma] = a.value.split(':').map(Number);
    const [hb, mb] = b.value.split(':').map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });
}

function getExecutionDateFromSelection(date: Date | undefined, time: string) {
  if (!date || !time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const execDate = new Date(date);
  execDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const currentSelectionGraceDate = addMinutes(now, -CURRENT_TIME_SELECTION_GRACE_MINUTES);
  const isCurrentSelection =
    isSameMinute(execDate, now) ||
    (isSameCalendarDate(execDate, now) &&
      execDate.getTime() <= now.getTime() &&
      execDate.getTime() >= currentSelectionGraceDate.getTime());

  return isCurrentSelection ? getImmediateExecutionDate() : execDate;
}

const QUICK_TEMPLATES = [
  {
    title: 'AI News Digest',
    icon: Flame,
    prompt: 'Hãy đăng bài tổng hợp tin nóng AI trong ngày, giữ giọng điệu ngắn gọn, khách quan và dễ đọc.',
    tag: 'Trending'
  },
  {
    title: 'Event Congratulator',
    icon: Star,
    prompt:
      'Hãy đăng bài chúc mừng và phân tích ngắn gọn kết quả của đội tuyển giành chiến thắng, giọng điệu hào hứng và đầy năng lượng.',
    tag: 'Sports'
  },
  {
    title: 'Market Summary',
    icon: TrendingUp,
    prompt:
      'Hãy tổng hợp xu hướng thị trường chứng khoán và tài chính trong ngày thành dạng gạch đầu dòng rõ ràng, súc tích.',
    tag: 'Finance'
  },
  {
    title: 'Creative Pulse',
    icon: Sparkles,
    prompt:
      'Tìm kiếm các xu hướng thiết kế sáng tạo mới nhất và đăng một bài viết truyền cảm hứng kèm phân tích nhanh cho designer.',
    tag: 'Design'
  }
];

const renderPromptWithPlaceholders = (prompt: string) => {
  const parts = prompt.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(.+)\}\}$/);
    if (match) {
      const label = match[1].trim();
      return (
        <span
          key={i}
          className='inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-violet-500/15 border border-violet-500/20 text-violet-300 font-bold text-[11px] align-baseline select-all'
          title={`Thay thế bằng nội dung cụ thể: ${label}`}
        >
          <Pencil className='h-2.5 w-2.5 shrink-0 opacity-60' />
          {label}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
} as const;
interface ProgressLogStep {
  step: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Skipped';
  message: string;
  timestampUtc: string;
}

interface ExecutionContext {
  currentStep?: string;
  currentStepStatus?: 'Running' | 'Completed' | 'Failed' | 'Skipped';
  currentStepMessage?: string;
  steps?: ProgressLogStep[];
  runtimePostBuilderId?: string;
  runtimePostIds?: string[];
}

const getStepDetails = (stepCode: string | undefined) => {
  const code = (stepCode || '').toLowerCase();

  if (code === 'web_search') {
    return {
      label: 'Real-time Web Search',
      icon: Globe,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      description: 'Analyzing configuration and launching Web Search to scan the latest news.'
    };
  }
  if (code === 'rag_ready') {
    return {
      label: 'Connect AI Knowledge Base',
      icon: Cpu,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      description: 'Verifying readiness of the RAG sidecar microservice.'
    };
  }
  if (code === 'indexing_grounding') {
    return {
      label: 'Analyze Brand Voice',
      icon: BookOpen,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      description: 'Scanning and indexing past social media posts into the AI vector memory.'
    };
  }
  if (code === 'recommendation_generation') {
    return {
      label: 'Ideation & Voice Alignment',
      icon: Lightbulb,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      description: 'Blending search context and brand voice to draft personalized ideas and tone.'
    };
  }
  if (code.startsWith('draft_generation_')) {
    const platform = (stepCode || '').replace('draft_generation_', '');
    return {
      label: `Compose Draft Content (${platform.toUpperCase()})`,
      icon: FileText,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      description: `Drafting content, hashtags, and formatting specifically for ${platform}.`
    };
  }
  if (code.startsWith('post_creation_')) {
    const platform = (stepCode || '').replace('post_creation_', '');
    return {
      label: `Save Post Entry (${platform.toUpperCase()})`,
      icon: Database,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      description: `Storing post draft records securely in the internal database.`
    };
  }
  if (code === 'asset_linking') {
    return {
      label: 'Synchronize Assets',
      icon: Paperclip,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      description: 'Linking downloaded or AI-generated media to the unified Post Builder.'
    };
  }
  if (code === 'publishing') {
    return {
      label: 'Direct Publishing',
      icon: Send,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      description: 'Pushing finalized content live to selected social channels!'
    };
  }

  // Fallbacks
  return {
    label: (stepCode || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: Sparkles,
    color: 'text-slate-400',
    bg: 'bg-white/5',
    description: 'Autonomous execution step.'
  };
};

const normalizeStatus = (status: string | null | undefined): 'active' | 'cancelled' | 'published' | 'failed' => {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (
    s === 'waiting_for_execution' ||
    s === 'scheduled' ||
    s === 'executing' ||
    s === 'publishing' ||
    s === 'pending' ||
    s === 'active' ||
    s === 'needs_user_action'
  ) {
    return 'active';
  }
  if (s === 'completed' || s === 'published') {
    return 'published';
  }
  if (s === 'failed') {
    return 'failed';
  }
  if (s === 'cancelled' || s === 'canceled') {
    return 'cancelled';
  }
  return 'active';
};

const isCancelable = (status: string | null | undefined): boolean => {
  if (!status) return true; // Newly created or default is cancelable
  const s = status.toLowerCase();
  return (
    s === 'waiting_for_execution' ||
    s === 'scheduled' ||
    s === 'pending' ||
    s === 'active'
  );
};

const isActivatable = (status: string | null | undefined): boolean => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'cancelled' || s === 'failed';
};

const getStatusLabel = (status: string | null | undefined) => {
  if (!status) return 'Scheduled';
  const s = status.toLowerCase();
  if (s === 'waiting_for_execution' || s === 'scheduled' || s === 'pending') return 'Scheduled';
  if (s === 'executing' || s === 'publishing') return 'Executing';
  if (s === 'completed' || s === 'published') return 'Published';
  if (s === 'failed') return 'Failed';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  if (s === 'needs_user_action') return 'Needs Action';
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

function AiContentAutomation() {
  const { workspaceId } = useParams();
  const scheduleWorkspaceId = workspaceId ?? null;

  const [activePopover, setActivePopover] = useState<'name' | 'channels' | 'schedule' | 'limit' | null>(null);
  const [timeOptionsRefreshKey, setTimeOptionsRefreshKey] = useState(0);

  const togglePopover = (name: 'name' | 'channels' | 'schedule' | 'limit') => {
    if (name === 'schedule') {
      setTimeOptionsRefreshKey((value) => value + 1);
    }
    setActivePopover((prev) => (prev === name ? null : name));
  };

  const localTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [automationName, setAutomationName] = useState('');

  const [schedules, setSchedules] = useState<AiSchedule[]>([]);
  const [accounts, setAccounts] = useState<SocialMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [executeImmediately, setExecuteImmediately] = useState(false);

  const getPlatformStyle = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('facebook'))
      return { color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', solidBg: 'bg-[#1877F2]', border: 'border-[#1877F2]/20' };
    if (t.includes('instagram'))
      return { color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', solidBg: 'bg-[#E4405F]', border: 'border-[#E4405F]/20' };
    if (t.includes('tiktok'))
      return { color: 'text-white', bg: 'bg-white/10', solidBg: 'bg-white', border: 'border-white/20' };
    if (t.includes('linkedin'))
      return { color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', solidBg: 'bg-[#0A66C2]', border: 'border-[#0A66C2]/20' };
    if (t.includes('youtube'))
      return { color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', solidBg: 'bg-[#FF0000]', border: 'border-[#FF0000]/20' };
    if (t.includes('twitter') || t.includes('x'))
      return { color: 'text-white', bg: 'bg-white/10', solidBg: 'bg-white', border: 'border-white/20' };
    return { color: 'text-slate-300', bg: 'bg-white/5', solidBg: 'bg-slate-500', border: 'border-white/10' };
  };

  const getInitialDefaultTime = () => {
    const d = new Date();
    return {
      date: d,
      timeString: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    };
  };

  const initialDefaults = useMemo(getInitialDefaultTime, []);

  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(initialDefaults.date);
  const [scheduledTime, setScheduledTime] = useState(initialDefaults.timeString);
  const [timezone, setTimezone] = useState(localTimezone);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [primaryAccountId, setPrimaryAccountId] = useState<string | null>(null);
  const [maxLength, setMaxLength] = useState(280);
  const [showAccountError, setShowAccountError] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'cancel' | 'activate' | null;
    id: string | null;
  }>({ open: false, type: null, id: null });

  const [filter, setFilter] = useState<'all' | 'active' | 'published' | 'cancelled' | 'failed'>('all');

  const [selectedSchedule, setSelectedSchedule] = useState<AiSchedule | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    id: string | null;
    executeAtUtc: string | null;
  }>({
    open: false,
    id: null,
    executeAtUtc: null
  });
  const [reschedDate, setReschedDate] = useState<Date | undefined>(new Date());
  const [reschedTime, setReschedTime] = useState<string>('09:00');
  const [reschedImmediately, setReschedImmediately] = useState<boolean>(true);

  const parsedContext = useMemo<ExecutionContext | null>(() => {
    if (!selectedSchedule?.executionContextJson) return null;
    try {
      return JSON.parse(selectedSchedule.executionContextJson) as ExecutionContext;
    } catch (e) {
      console.error('Failed to parse executionContextJson', e);
      return null;
    }
  }, [selectedSchedule?.executionContextJson]);

  const runtimePostBuilderId = useMemo(() => {
    return selectedSchedule?.runtimePostBuilderId || parsedContext?.runtimePostBuilderId || null;
  }, [selectedSchedule, parsedContext]);

  const runtimePostIds = useMemo(() => {
    return selectedSchedule?.runtimePostIds || parsedContext?.runtimePostIds || null;
  }, [selectedSchedule, parsedContext]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const schedulesParams = workspaceId ? { workspaceId } : { workspaceId: GLOBAL_WORKSPACE_ID };
      const accountsRequest = workspaceId ? fetchWorkspaceLinkedSocialMedias(workspaceId) : fetchSocialMedias();
      const [schedulesRes, accountsRes, facebookPagesRes] = await Promise.all([
        AiScheduleClientApi.fetchSchedules(workspaceId ? schedulesParams : undefined),
        accountsRequest,
        fetchFacebookPages().catch((err) => {
          console.error('Failed to fetch Facebook pages:', err);
          return { isSuccess: false, value: [] };
        })
      ]);

      if (schedulesRes.isSuccess) {
        setSchedules(workspaceId ? schedulesRes.value : schedulesRes.value.filter((schedule) => isGlobalWorkspaceId(schedule.workspaceId)));
      }
      if (accountsRes.isSuccess) {
        const merged = mergeFacebookPagesWithAccounts(
          accountsRes.value,
          facebookPagesRes && 'isSuccess' in facebookPagesRes && facebookPagesRes.isSuccess
            ? facebookPagesRes.value
            : null
        );
        setAccounts(merged);
        if (merged.length > 0) {
          setSelectedAccounts([merged[0].id]);
          setPrimaryAccountId(merged[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Connection Error', {
        description: 'Failed to synchronize with the autonomous system.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [workspaceId]);

  // Fetch latest schedule details including execution logs when Dialog details opens
  useEffect(() => {
    if (detailsOpen && selectedSchedule?.id) {
      let isMounted = true;
      const fetchFreshDetails = async () => {
        try {
          const res = await AiScheduleClientApi.fetchScheduleById(selectedSchedule.id);
          if (res.isSuccess && res.value && isMounted) {
            setSelectedSchedule(res.value);
            setSchedules((prev) => prev.map((s) => (s.id === res.value.id ? res.value : s)));
          }
        } catch (err) {
          console.error('Failed to fetch schedule details:', err);
        }
      };

      fetchFreshDetails();

      return () => {
        isMounted = false;
      };
    }
  }, [detailsOpen, selectedSchedule?.id]);

  // Listen to real-time SignalR notifications for publishing schedules
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScheduleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notification = customEvent.detail;
      if (!notification || !notification.payloadJson) return;

      try {
        const payload = JSON.parse(notification.payloadJson);
        const scheduleId = payload.scheduleId;
        if (!scheduleId) return;

        // Construct the updated executionContextJson from the notification payload
        const executionContext = {
          currentStep: payload.currentStep,
          currentStepStatus: payload.currentStepStatus,
          currentStepMessage: payload.currentStepMessage,
          steps: payload.steps || [],
          runtimePostBuilderId: payload.runtimePostBuilderId,
          runtimePostIds: payload.runtimePostIds
        };

        const updatedContextJson = JSON.stringify(executionContext);

        // Update the schedules list in state
        setSchedules((prev) =>
          prev.map((s) => {
            if (s.id === scheduleId) {
              const updatedStatus = payload.status || s.status;
              return {
                ...s,
                status: updatedStatus as any,
                executionContextJson: updatedContextJson,
                runtimePostBuilderId: payload.runtimePostBuilderId || s.runtimePostBuilderId,
                runtimePostIds: payload.runtimePostIds || s.runtimePostIds
              };
            }
            return s;
          })
        );

        // If this matches our currently selected schedule in details, update it as well
        setSelectedSchedule((prev) => {
          if (prev && prev.id === scheduleId) {
            const updatedStatus = payload.status || prev.status;
            const normPrevStatus = normalizeStatus(prev.status);

            // Proactively show congrats toast if it transitions to completed!
            if (notification.type === 'ai.publishing_schedule.completed' && normPrevStatus !== 'published') {
              toast.success('Autonomous publishing task completed successfully!', {
                description: 'The content has been generated and published.'
              });
            } else if (notification.type === 'ai.publishing_schedule.failed' && normPrevStatus !== 'failed') {
              toast.error('Autonomous publishing task failed', {
                description: payload.currentStepMessage || 'An error occurred during execution.'
              });
            }

            return {
              ...prev,
              status: updatedStatus as any,
              executionContextJson: updatedContextJson,
              runtimePostBuilderId: payload.runtimePostBuilderId || prev.runtimePostBuilderId,
              runtimePostIds: payload.runtimePostIds || prev.runtimePostIds
            };
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to process real-time schedule notification:', err);
      }
    };

    window.addEventListener('ai-publishing-schedule-update', handleScheduleUpdate);
    return () => {
      window.removeEventListener('ai-publishing-schedule-update', handleScheduleUpdate);
    };
  }, []);

  const availableTimes = useMemo(() => buildTimeOptions(scheduledDate), [scheduledDate, timeOptionsRefreshKey]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.some((option) => option.value === scheduledTime)) {
      setScheduledTime(availableTimes[0].value);
    }
  }, [availableTimes, scheduledTime]);

  const reschedAvailableTimes = useMemo(() => buildTimeOptions(reschedDate), [reschedDate, rescheduleDialog.open]);

  useEffect(() => {
    if (reschedAvailableTimes.length > 0 && !reschedAvailableTimes.some((option) => option.value === reschedTime)) {
      setReschedTime(reschedAvailableTimes[0].value);
    }
  }, [reschedAvailableTimes, reschedTime]);

  const getCombinedExecutionDate = () => {
    return getExecutionDateFromSelection(scheduledDate, scheduledTime);
  };

  const handleNextStep = () => {
    if (!instruction.trim()) {
      toast.warning('Please define the automation workflow.');
      return;
    }

    if (selectedAccounts.length === 0) {
      setShowAccountError(true);
      return;
    }

    if (!executeImmediately) {
      const execDate = getCombinedExecutionDate();
      if (!execDate) {
        toast.warning('Please select a valid execution date and time.');
        return;
      }

      const minExecutionTime = new Date();
      if (execDate < minExecutionTime) {
        toast.error('Invalid Schedule Time', {
          description: 'Please schedule at the current time or in the future.'
        });
        return;
      }
    }

    setValidationError(null);
    setRevisedPrompt(null);
    void handleCreateAutomation();
  };

  const handleEditLog = (item: any) => {
    setSelectedSchedule(item);
    setDetailsOpen(true);
  };

  const handleCancelLog = (id: string) => {
    setConfirmDialog({ open: true, type: 'cancel', id });
  };

  const handleActivateLog = (id: string) => {
    const sched = schedules.find((s) => s.id === id);
    if (sched && new Date(sched.executeAtUtc) <= new Date()) {
      const now = new Date();
      setReschedImmediately(true);
      setReschedDate(now);
      setReschedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setRescheduleDialog({ open: true, id, executeAtUtc: sched.executeAtUtc });
    } else {
      setConfirmDialog({ open: true, type: 'activate', id });
    }
  };

  const executeRescheduleAction = async () => {
    const { id } = rescheduleDialog;
    if (!id) return;

    let targetDate: Date;
    if (reschedImmediately) {
      targetDate = getImmediateExecutionDate();
    } else {
      if (!reschedDate) {
        toast.warning('Please select a valid reschedule date.');
        return;
      }
      const rescheduledDate = getExecutionDateFromSelection(reschedDate, reschedTime);
      if (!rescheduledDate) {
        toast.warning('Please select a valid reschedule time.');
        return;
      }
      targetDate = rescheduledDate;

      if (targetDate < new Date()) {
        toast.error('Invalid Time', {
          description: 'Please schedule at the current time or in the future.'
        });
        return;
      }
    }

    setRescheduleDialog((prev) => ({ ...prev, open: false }));

    toast.promise(
      (async () => {
        // Step 1: Update the schedule's executeAtUtc
        const updateRes = await AiScheduleClientApi.updateSchedule(id, {
          executeAtUtc: targetDate.toISOString()
        });
        if (!updateRes.isSuccess) {
          throw new Error(updateRes.error?.description || 'Failed to update schedule date');
        }

        // Step 2: Activate the schedule
        const activateRes = await AiScheduleClientApi.activateSchedule(id);
        if (!activateRes.isSuccess) {
          throw new Error(activateRes.error?.description || 'Failed to activate schedule');
        }

        // Update local state
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: 'active', executeAtUtc: targetDate.toISOString() }
              : s
          )
        );
        return 'Automation rescheduled and activated!';
      })(),
      {
        loading: 'Updating schedule and activating...',
        success: (msg) => msg,
        error: (err) => err.message || 'Failed to reschedule and activate'
      }
    );
  };

  const executeConfirmAction = async () => {
    const { type, id } = confirmDialog;
    if (!id || !type) return;

    setConfirmDialog((prev) => ({ ...prev, open: false }));

    if (type === 'cancel') {
      toast.promise(AiScheduleClientApi.cancelSchedule(id), {
        loading: 'Cancelling automation...',
        success: (res) => {
          if (res.isSuccess) {
            setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s)));
            return 'Automation cancelled successfully';
          }
          throw new Error(res.error?.description || 'Failed to cancel automation');
        },
        error: (err) => err.message || 'Failed to cancel automation'
      });
    } else {
      toast.promise(AiScheduleClientApi.activateSchedule(id), {
        loading: 'Activating automation...',
        success: (res) => {
          if (res.isSuccess) {
            setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s)));
            return 'Automation activated successfully';
          }
          throw new Error(res.error?.description || 'Failed to activate automation');
        },
        error: (err) => err.message || 'Failed to activate automation'
      });
    }
  };

  const handleCreateAutomation = async () => {
    const execDate = executeImmediately ? getImmediateExecutionDate() : getCombinedExecutionDate();

    // Smart fallback if automationName is not provided:
    // Take the first 35 chars of the instruction/prompt
    const fallbackName = instruction.trim().slice(0, 35) + (instruction.trim().length > 35 ? '...' : '');
    const finalAutomationName = automationName.trim() || fallbackName || 'Untitled AI Automation';

    const agentPayload = {
      message: instruction,
      scheduleOptions: {
        executeAtUtc: execDate ? execDate.toISOString() : new Date().toISOString(),
        timezone,
        maxContentLength: maxLength,
        targets: selectedAccounts.map((id) => ({
          socialMediaId: id,
          isPrimary: id === primaryAccountId
        }))
      },
      name: finalAutomationName
    };

    const executeAgentMessage = async () => {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionRes = await ChatSessionClientApi.createChatSession({
          workspaceId: scheduleWorkspaceId,
          sessionName: 'Auto-Publish Request'
        });
        if (!sessionRes.isSuccess || !sessionRes.value) {
          throw new Error(sessionRes.error?.description || 'Failed to initialize agent session');
        }
        currentSessionId = sessionRes.value.id;
        setSessionId(currentSessionId);
      }
      return AiScheduleClientApi.sendAgentMessage(currentSessionId, agentPayload);
    };

    toast.promise(executeAgentMessage(), {
      loading: 'AI is analyzing your intent and preparing automation...',
      success: (res: any) => {
        if (res.isSuccess) {
          const data = res.value;
          if (data.action === 'validation_failed') {
            setValidationError(data.validationError || 'Intent is too vague');
            setRevisedPrompt(data.revisedPrompt || null);
            throw new Error(`AI needs clarification: ${data.validationError || 'Intent is too vague'}`);
          }
          if (data.action === 'future_ai_schedule_created') {
            fetchInitialData();
            setInstruction('');
            setAutomationName('');
            setIsCreateModalOpen(false);
            return 'Agentic automation created successfully!';
          }
        }
        throw new Error(res.error?.description || 'Failed to process automation');
      },
      error: (err) => err.message || 'Failed to process request'
    });
  };

  const stats = useMemo(
    () => ({
      total: schedules.length,
      active: schedules.filter((s) => normalizeStatus(s.status) === 'active').length,
      published: schedules.filter((s) => normalizeStatus(s.status) === 'published').length,
      cancelled: schedules.filter((s) => normalizeStatus(s.status) === 'cancelled').length
    }),
    [schedules]
  );

  const handleNewRequest = () => {
    setAutomationName('');
    setInstruction('');
    setValidationError(null);
    setRevisedPrompt(null);
    setSessionId(null);
    setSelectedAccounts([]);
    setPrimaryAccountId(null);
    setMaxLength(280);
    setExecuteImmediately(false);
    const defaults = getInitialDefaultTime();
    setScheduledDate(defaults.date);
    setScheduledTime(defaults.timeString);
    setIsCreateModalOpen(true);
  };

  return (
    <div className='flex flex-col gap-4 p-1 relative max-w-[1400px] mx-auto pb-6'>
      {showAccountError && (
        <div className='fixed top-6 right-6 z-[100] w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-300'>
          <div className='relative flex items-start gap-4 rounded-[20px] border border-red-500/20 bg-[#1a0505] p-6 shadow-2xl backdrop-blur-xl'>
            <button
              onClick={() => setShowAccountError(false)}
              className='absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-950 border border-red-500/30 text-red-400 hover:text-white transition-colors shadow-lg'
            >
              <PlusIcon className='h-3 w-3 rotate-45' />
            </button>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20'>
              <AlertCircle className='h-5 w-5' />
            </div>
            <div className='space-y-1'>
              <h4 className='font-bold text-red-100'>Target Accounts Missing</h4>
              <p className='text-xs text-red-400/80 leading-relaxed'>
                Please select at least one publishing destination to continue configuring this workflow.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-5 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-6 sm:py-6 relative flex items-center justify-between'>
        <div className='flex items-center gap-4'>

          <div className='flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.03] text-white/80'>
            <BotIcon className='w-4 h-4 text-white' />
          </div>
          <div className='space-y-0.5'>
            <h1 className='text-xl font-bold tracking-tight text-white'>AI Auto-Publishing</h1>
            <p className='text-[11px] text-slate-500 font-medium uppercase tracking-widest'>
              Event-Driven Publishing AI
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size={'lg'}
            onClick={() => fetchInitialData()}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
          >
            <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Sync Now
          </Button>
          <Button
            onClick={handleNewRequest}
            className='rounded-2xl bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-white/5'
            size={'lg'}
          >
            <PlusIcon className='h-4 w-4' />
            New Request
          </Button>
        </div>
      </section>

      <div className='space-y-6 mt-4'>
        {!isLoading && (
          <motion.section
            className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {[
              {
                label: 'Total Schedules',
                value: stats.total,
                icon: ListTodo,
                color: 'violet',
                sub: 'All automation tasks'
              },
              { label: 'Active', value: stats.active, icon: Zap, color: 'emerald', sub: 'Currently running' },
              {
                label: 'Published',
                value: stats.published,
                icon: CheckCircle2,
                color: 'blue',
                sub: 'Successfully completed'
              },
              {
                label: 'Failed',
                value: schedules.filter((s) => normalizeStatus(s.status) === 'failed').length,
                icon: AlertCircle,
                color: 'rose',
                sub: 'Execution errors'
              },
              { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'slate', sub: 'Stopped by user' }
            ].map((item) => {
              const Icon = item.icon;
              const accentClass =
                item.color === 'emerald'
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                  : item.color === 'blue'
                    ? 'border-blue-400/20 bg-blue-500/10 text-blue-200'
                    : item.color === 'rose'
                      ? 'border-red-400/20 bg-red-500/10 text-red-200'
                      : item.color === 'slate'
                        ? 'border-slate-400/20 bg-slate-500/10 text-slate-300'
                        : 'border-violet-400/20 bg-violet-500/10 text-violet-200';
              return (
                <motion.div
                  key={item.label}
                  variants={cardVariants}
                  whileHover={{
                    y: -4,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.45)'
                  }}
                  className='group relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 transition-all duration-300'
                >
                  <div className='absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                    <div className='absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl' />
                  </div>
                  <div className='relative flex items-start justify-between'>
                    <div>
                      <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500'>
                        {item.label}
                      </p>
                      <div className='mt-3 flex items-end gap-2'>
                        <span className='text-3xl font-bold leading-none text-white'>{item.value}</span>
                      </div>
                      <p className='mt-2 text-xs text-slate-400 leading-normal'>{item.sub}</p>
                    </div>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-xl shrink-0 ${accentClass}`}
                    >
                      <Icon className='h-6 w-6' />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.section>
        )}

        <Card className='rounded-[24px] border-white/5 bg-[#080a12] shadow-none overflow-hidden py-0 gap-0'>
          <CardHeader className='border-b border-white/5 py-3 px-6 pb-3! bg-white/[0.01]'>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div className='flex items-center gap-2 text-slate-300'>
                <ListTodo className='h-4 w-4 text-violet-400' />
                <span className='text-[12px] font-bold uppercase tracking-widest'>Schedule Overview</span>
              </div>

              <div className='flex items-center gap-4'>
                <div className='inline-flex items-center gap-1 p-1 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md flex-wrap'>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: 'Active' },
                    { id: 'published', label: 'Published' },
                    { id: 'failed', label: 'Failed' },
                    { id: 'cancelled', label: 'Cancelled' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id as any)}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-300',
                        filter === tab.id
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center py-20 gap-4 opacity-40'>
                <Loader2 className='h-6 w-6 animate-spin text-violet-400' />
                <span className='text-[10px] font-bold uppercase tracking-widest'>Syncing with system...</span>
              </div>
            ) : schedules.length > 0 ? (
              <div className='divide-y divide-white/5'>
                {schedules
                  .filter((item) => filter === 'all' || normalizeStatus(item.status) === filter)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleEditLog(item)}
                      className='p-4 px-6 hover:bg-white/[0.03] transition-all group relative cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4'
                    >
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-3 flex-wrap'>
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              normalizeStatus(item.status) === 'active'
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                : normalizeStatus(item.status) === 'published'
                                  ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                  : normalizeStatus(item.status) === 'failed'
                                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                    : 'bg-slate-500'
                            )}
                          />
                          <Badge
                            variant={normalizeStatus(item.status) === 'active' ? 'default' : 'secondary'}
                            className={cn(
                              'px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-[4px] border-none',
                              normalizeStatus(item.status) === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : normalizeStatus(item.status) === 'published'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : normalizeStatus(item.status) === 'failed'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-slate-500/10 text-slate-500'
                            )}
                          >
                            {getStatusLabel(item.status)}
                          </Badge>
                          <span className='text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                            {new Date(item.executeAtUtc).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div>
                          <h4 className='text-sm font-bold text-slate-200 leading-tight mb-0.5 group-hover:text-violet-400 transition-colors'>
                            {item.name || 'Untitled Automation'}
                          </h4>
                          <p className='text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-1 max-w-[800px]'>
                            {item.agentPrompt}
                          </p>
                        </div>
                        <div className='flex items-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider flex-wrap'>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-3 w-3 text-slate-700' />
                            {item.timezone || timezone}
                          </div>
                          {item.maxContentLength && <div>Cap: {item.maxContentLength} chars</div>}
                        </div>
                      </div>

                      <div className='flex items-center justify-between md:justify-end gap-6 shrink-0'>
                        <PlatformStack
                          publications={
                            item.targets.map((t) => ({ socialMediaType: t.platform || 'facebook' })) as any
                          }
                          maxDisplay={3}
                        />

                        <div
                          className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          onClick={(e) => e.stopPropagation()} // Prevent opening details when clicking individual actions
                        >
                          <button
                            onClick={() => handleEditLog(item)}
                            className='p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors'
                            title='Details'
                          >
                            <Settings2 className='h-3.5 w-3.5' />
                          </button>
                          {isCancelable(item.status) ? (
                            <button
                              onClick={() => handleCancelLog(item.id)}
                              className='p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors'
                              title='Cancel'
                            >
                              <PlusIcon className='h-3.5 w-3.5 rotate-45' />
                            </button>
                          ) : isActivatable(item.status) ? (
                            <button
                              onClick={() => handleActivateLog(item.id)}
                              className='p-1.5 rounded-md text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors'
                              title='Activate'
                            >
                              <RefreshCcw className='h-3.5 w-3.5' />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-20 px-6 text-center gap-4'>
                <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]'>
                  <BotIcon className='h-7 w-7 text-slate-600 animate-pulse' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-semibold text-slate-300'>No automations yet</p>
                  <p className='text-xs text-slate-500'>Click "New Request" to create your first AI automation.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setActivePopover(null);
          setValidationError(null);
          setRevisedPrompt(null);
        }
      }}>
        <DialogContent
          className="h-auto max-h-[calc(100dvh-48px)] w-[96vw] max-w-[1040px] rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(11,13,24,0.95)_0%,rgba(7,9,16,0.98)_100%)] p-0 overflow-hidden shadow-2xl backdrop-blur-xl [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-[#0c0e1a] [&>button]:border [&>button]:border-white/10 [&>button]:rounded-full [&>button]:shadow-lg hover:[&>button]:bg-white/10"
        >
          <DialogTitle className="sr-only">
            Create Automation Request
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure and deploy a new AI automation schedule
          </DialogDescription>

          <div className="max-h-[calc(100dvh-48px)] overflow-y-auto custom-scrollbar px-8 pt-5 pb-6 mr-8">
            <div className="w-full max-w-[980px] mx-auto relative">
              {isLoading ? (
                <div className='flex-1 flex flex-col items-center justify-center gap-3 py-20 opacity-50'>
                  <Loader2 className='h-8 w-8 animate-spin text-slate-400' />
                  <span className='text-[10px] font-bold uppercase tracking-widest text-slate-500'>
                    Loading Workspace Details...
                  </span>
                </div>
              ) : accounts.length === 0 ? (
                /* No linked accounts screen - beautifully prompting user to link account in settings */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='flex-1 max-w-[550px] mx-auto flex flex-col items-center justify-center p-8 sm:p-10 rounded-[28px] border border-red-500/10 bg-gradient-to-b from-[#180808]/40 to-[#080808]/40 backdrop-blur-xl shadow-2xl text-center space-y-6 my-auto relative overflow-hidden'
                >
                  <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/10 to-transparent'></div>
                  <div className='flex h-16 w-16 items-center justify-center rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-400 shadow-lg shadow-red-500/5'>
                    <UserPlus className='h-8 w-8 animate-pulse' />
                  </div>
                  <div className='space-y-2.5'>
                    <h3 className='text-xl sm:text-2xl font-extrabold text-white tracking-tight'>
                      Connect Social Channels
                    </h3>
                    <p className='text-xs sm:text-sm text-slate-400 leading-relaxed font-medium'>
                      To schedule autonomous publishing tasks, MeAI requires at least one connected social account. The
                      AI agent uses your profile context for voice grounding, target formatting, and automatic execution.
                    </p>
                  </div>

                  <div className='pt-2 w-full'>
                    <Button
                      onClick={() => {
                        toast.info(workspaceId ? 'Redirecting to Workspace Settings...' : 'Redirecting to Social Links...', {
                          description: 'Please go to the Social Media Accounts section to link your profiles.'
                        });
                        window.location.href = workspaceId ? `/workspace/${workspaceId}/settings` : '/user/social-links';
                      }}
                      className='w-full h-12 rounded-[16px] bg-white text-black hover:bg-white/90 font-bold text-xs uppercase tracking-wider shadow-lg shadow-white/5 flex items-center justify-center gap-2 group transition-all duration-300'
                    >
                      {workspaceId ? 'Configure Accounts in Settings' : 'Connect Accounts'}{' '}
                      <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* Main Chat-style interface */
                <div className='flex w-full flex-col justify-start relative'>
                  <div className='flex w-full flex-col justify-center relative animate-in fade-in duration-300'>
                      {/* Chat Input Pill container */}
                      <div className='w-full max-w-[920px] mx-auto relative flex flex-col justify-center'>
                        <div className={cn(
                          'order-2 relative rounded-[32px] border bg-transparent p-3 px-4 flex items-center gap-3.5 group focus-within:border-white/20 transition-all',
                          validationError ? 'border-amber-500/30 focus-within:border-amber-500/50' : 'border-white/10'
                        )}>
                          {/* Plus button / quick helper */}
                          <div
                            onClick={() => togglePopover('channels')}
                            title='Configure Channels'
                            className='h-7 w-7 flex items-center justify-center rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white transition-all shrink-0 select-none'
                          >
                            <PlusIcon className='h-4 w-4' />
                          </div>

                          {/* Prompt Input textarea */}
                          <Textarea
                            placeholder='What would you like the AI to auto-publish? E.g., Daily news summary...'
                            value={instruction}
                            onChange={(e) => {
                              setInstruction(e.target.value.slice(0, MAX_INSTRUCTION_LENGTH));
                              if (validationError) {
                                setValidationError(null);
                                setRevisedPrompt(null);
                              }
                            }}
                            className='bg-transparent! border-none text-slate-200 outline-none placeholder:text-slate-600 font-medium text-[15px] resize-none flex-1 max-h-[140px] custom-scrollbar focus:ring-0 focus-visible:ring-0 p-0 py-1.5 focus:outline-none min-h-[28px]'
                          />

                          {/* Character count or extra details indicator */}
                          {instruction.length > 0 && (
                            <span
                              className={cn(
                                'text-[9px] font-black tabular-nums shrink-0',
                                instruction.length > MAX_INSTRUCTION_LENGTH * 0.8 ? 'text-amber-500' : 'text-slate-600'
                              )}
                            >
                              {instruction.length}/{MAX_INSTRUCTION_LENGTH}
                            </span>
                          )}

                          {/* Custom Submit pill circle */}
                          <button
                            type='button'
                            onClick={handleNextStep}
                            disabled={!instruction.trim()}
                            className={cn(
                              'h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-all select-none shadow-md',
                              instruction.trim()
                                ? 'bg-white text-black hover:bg-white/90 active:scale-95 cursor-pointer'
                                : 'bg-white/5 text-slate-600 cursor-not-allowed'
                            )}
                          >
                            <Send className='h-3.5 w-3.5 stroke-[2.5]' />
                          </button>
                        </div>

                        {/* AI Validation Error & Suggestion Alert */}
                        {validationError && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='order-3 mt-3.5 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-left space-y-3'
                          >
                            <div className='flex items-start gap-3.5'>
                              <div className='h-8 w-8 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400 shrink-0'>
                                <AlertTriangle className='h-4 w-4' />
                              </div>
                              <div className='space-y-0.5 flex-1 min-w-0'>
                                <span className='block text-[10px] font-bold text-amber-400 uppercase tracking-wider'>
                                  AI Clarification Needed
                                </span>
                                <p className='text-xs text-slate-300 font-medium leading-relaxed'>
                                  {validationError}
                                </p>
                              </div>
                              {/* Dismiss error button */}
                              <button
                                type='button'
                                onClick={() => {
                                  setValidationError(null);
                                  setRevisedPrompt(null);
                                }}
                                className='p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all'
                              >
                                <X className='h-4 w-4' />
                              </button>
                            </div>

                            {revisedPrompt && (
                              <div className='pl-11.5 pt-3 border-t border-white/5 space-y-2'>
                                <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5'>
                                  <Sparkles className='h-3.5 w-3.5 text-violet-400' /> AI Suggested Prompt:
                                </span>
                                <div
                                  onClick={() => {
                                    setInstruction(revisedPrompt);
                                    setValidationError(null);
                                    setRevisedPrompt(null);
                                    toast.success('AI prompt applied!');
                                  }}
                                  className='p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/10 hover:border-violet-500/25 transition-all text-xs font-semibold text-slate-200 cursor-pointer flex items-center justify-between gap-4 group'
                                >
                                  <span className='pr-4 text-slate-300 group-hover:text-white transition-colors leading-relaxed'>{renderPromptWithPlaceholders(revisedPrompt)}</span>
                                  <span className='text-[9px] bg-violet-500/10 text-violet-400 px-2 py-1 rounded-md uppercase tracking-wider font-extrabold opacity-80 group-hover:opacity-100 group-hover:bg-violet-500/25 transition-all shrink-0 flex items-center gap-1'>
                                    <Check className='h-2.5 w-2.5' /> Apply
                                  </span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Settings Option Pills rendered at the top of the composer */}
                        <motion.div layout className='order-1 relative w-full flex flex-col items-center gap-3 mt-0 mb-4'>
                          <div className='flex flex-wrap items-center justify-center gap-2'>
                            {/* Channels Pill */}
                            <button
                              type='button'
                              onClick={() => togglePopover('channels')}
                              className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-full border text-[11px] font-extrabold transition-all backdrop-blur-md select-none',
                                selectedAccounts.length > 0
                                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20'
                                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'
                              )}
                            >
                              <Globe className='h-3.5 w-3.5 text-violet-400' />
                              <span>
                                {selectedAccounts.length === 0
                                  ? 'Select Channels'
                                  : `${selectedAccounts.length} Channel${selectedAccounts.length > 1 ? 's' : ''}`}
                              </span>
                              {primaryAccountId && <Star className='h-3 w-3 fill-current text-amber-500 shrink-0' />}
                            </button>

                            {/* Date/Time Pill */}
                            <button
                              type='button'
                              onClick={() => togglePopover('schedule')}
                              className='flex items-center gap-1.5 px-4 py-2 rounded-full border bg-white/[0.02] border-white/5 text-slate-300 hover:border-white/10 text-[11px] font-extrabold transition-all backdrop-blur-md select-none'
                            >
                              <Calendar className='h-3.5 w-3.5 text-blue-400' />
                              <span>
                                {executeImmediately
                                  ? 'Immediately (+1m)'
                                  : `${scheduledDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${scheduledTime}`}
                              </span>
                            </button>

                            {/* Limit Pill */}
                            <button
                              type='button'
                              onClick={() => togglePopover('limit')}
                              className='flex items-center gap-1.5 px-4 py-2 rounded-full border bg-white/[0.02] border-white/5 text-slate-300 hover:border-white/10 text-[11px] font-extrabold transition-all backdrop-blur-md select-none'
                            >
                              <Zap className='h-3.5 w-3.5 text-amber-400' />
                              <span>Limit: {maxLength} Chars</span>
                            </button>

                            {/* Name Pill */}
                            <button
                              type='button'
                              onClick={() => togglePopover('name')}
                              className='flex items-center gap-1.5 px-4 py-2 rounded-full border bg-white/[0.02] border-white/5 text-slate-300 hover:border-white/10 text-[11px] font-extrabold transition-all backdrop-blur-md select-none'
                            >
                              <Pencil className='h-3 w-3.5 text-purple-400' />
                              <span className='max-w-[150px] truncate'>{automationName || 'Untitled'}</span>
                            </button>
                          </div>

                          {/* Interactive popovers rendered dynamically below settings pills */}
                          <AnimatePresence>
                            {activePopover && (
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className='mt-3 w-full max-w-[450px] origin-top bg-[#0c0e1a]/95 border border-white/10 rounded-[24px] p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-left'
                              >
                                {activePopover === 'name' && (
                                  <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1'>
                                        Automation Name
                                      </span>
                                      <button
                                        onClick={() => setActivePopover(null)}
                                        className='text-slate-500 hover:text-white'
                                      >
                                        <X className='h-3.5 w-3.5' />
                                      </button>
                                    </div>
                                    <input
                                      type='text'
                                      placeholder='Give this schedule a clear identifier...'
                                      value={automationName}
                                      onChange={(e) => setAutomationName(e.target.value)}
                                      className='w-full px-4 h-11 rounded-[14px] border border-white/10 bg-black/40 text-sm text-slate-200 font-semibold outline-none focus:ring-[1px] focus:ring-slate-500/50 hover:bg-black/50 transition-colors placeholder:text-slate-700'
                                    />
                                  </div>
                                )}

                                {activePopover === 'channels' && (
                                  <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1'>
                                        Target social channels
                                      </span>
                                      <button
                                        onClick={() => setActivePopover(null)}
                                        className='text-slate-500 hover:text-white'
                                      >
                                        <X className='h-3.5 w-3.5' />
                                      </button>
                                    </div>
                                    <div className='max-h-[220px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1'>
                                      {accounts.map((acc) => {
                                        const isSelected = selectedAccounts.includes(acc.id);
                                        const isPrimary = primaryAccountId === acc.id;
                                        const displayName = getSocialMediaDisplayName(acc);
                                        return (
                                          <div
                                            key={acc.id}
                                            onClick={() => {
                                              if (isSelected) {
                                                const next = selectedAccounts.filter((id) => id !== acc.id);
                                                setSelectedAccounts(next);
                                                if (isPrimary) {
                                                  setPrimaryAccountId(next.length > 0 ? next[0] : null);
                                                }
                                              } else {
                                                const next = [...selectedAccounts, acc.id];
                                                setSelectedAccounts(next);
                                                if (next.length === 1) {
                                                  setPrimaryAccountId(acc.id);
                                                }
                                              }
                                            }}
                                            className={cn(
                                              'flex items-center justify-between p-2.5 rounded-[14px] transition-all cursor-pointer border',
                                              isSelected
                                                ? 'bg-white/[0.04] border-white/10 shadow-sm'
                                                : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                            )}
                                          >
                                            <div className='flex items-center gap-3'>
                                              <div className='relative'>
                                                <Avatar className='h-8 w-8 rounded-lg border border-white/10'>
                                                  <AvatarImage src={getSocialMediaAvatar(acc)} />
                                                  <AvatarFallback
                                                    className={cn(
                                                      'text-[10px] font-extrabold',
                                                      getPlatformStyle(acc.type).bg,
                                                      getPlatformStyle(acc.type).color
                                                    )}
                                                  >
                                                    {acc.type[0].toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                                {isSelected && (
                                                  <div
                                                    className={cn(
                                                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#080a12] z-20',
                                                      getPlatformStyle(acc.type).solidBg
                                                    )}
                                                  />
                                                )}
                                              </div>
                                              <div className='flex flex-col'>
                                                <span className='text-xs font-bold text-slate-200 leading-none mb-1'>
                                                  {displayName}
                                                </span>
                                                <span
                                                  className={cn(
                                                    'text-[8px] font-extrabold uppercase tracking-widest',
                                                    getPlatformStyle(acc.type).color
                                                  )}
                                                >
                                                  {acc.type}
                                                </span>
                                              </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                              {isSelected && (
                                                <button
                                                  type='button'
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPrimaryAccountId(isPrimary ? null : acc.id);
                                                  }}
                                                  className={cn(
                                                    'p-1 rounded bg-white/5 text-slate-400 hover:text-amber-400 transition-colors',
                                                    isPrimary && 'text-amber-500 bg-amber-500/10'
                                                  )}
                                                >
                                                  <Star className={cn('h-3.5 w-3.5', isPrimary && 'fill-current')} />
                                                </button>
                                              )}
                                              <div
                                                className={cn(
                                                  'h-4 w-4 rounded-full border border-white/10 flex items-center justify-center transition-colors',
                                                  isSelected && 'bg-white border-white text-black'
                                                )}
                                              >
                                                {isSelected && <Check className='h-2.5 w-2.5 stroke-[2.5]' />}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {activePopover === 'schedule' && (
                                  <div className='space-y-3.5'>
                                    <div className='flex items-center justify-between'>
                                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1'>
                                        Execution schedule
                                      </span>
                                      <button
                                        onClick={() => setActivePopover(null)}
                                        className='text-slate-500 hover:text-white'
                                      >
                                        <X className='h-3.5 w-3.5' />
                                      </button>
                                    </div>

                                    {/* Execute Immediately Toggle */}
                                    <div className='flex items-center justify-between bg-black/40 border border-white/10 rounded-[14px] p-3 px-4'>
                                      <div className='flex flex-col text-left'>
                                        <span className='text-[9px] text-slate-500 font-medium'>
                                          Đăng ngay tại thời điểm hiện tại
                                        </span>
                                      </div>
                                      <button
                                        type='button'
                                        onClick={() => setExecuteImmediately(!executeImmediately)}
                                        className={cn(
                                          'w-9 h-5 rounded-full transition-all relative border border-white/10',
                                          executeImmediately ? 'bg-violet-600' : 'bg-slate-800'
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            'w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all',
                                            executeImmediately ? 'right-[2px]' : 'left-[2px]'
                                          )}
                                        />
                                      </button>
                                    </div>

                                    {!executeImmediately && (
                                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-200'>
                                        <div className='space-y-1.5'>
                                          <span className='text-[8px] font-bold uppercase tracking-widest text-slate-500 pl-1'>
                                            Date
                                          </span>
                                          <DatePickerInput
                                            selected={scheduledDate}
                                            onSelect={setScheduledDate}
                                            fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
                                            className='rounded-[12px] border-white/10 bg-black/40 text-xs h-10 text-slate-200 font-semibold'
                                          />
                                        </div>

                                        <div className='space-y-1.5'>
                                          <span className='text-[8px] font-bold uppercase tracking-widest text-slate-500 pl-1'>
                                            Time
                                          </span>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <button className='w-full relative pl-9 pr-4 h-10 rounded-[12px] border border-white/10 bg-black/40 text-xs text-slate-200 font-semibold outline-none flex items-center justify-between hover:bg-black/50 transition-colors'>
                                                <Clock className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500' />
                                                <span>{scheduledTime}</span>
                                                <PlusIcon className='h-3 w-3 rotate-45 opacity-30' />
                                              </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className='w-[140px] max-h-[220px] overflow-y-auto bg-[#0c0e1a] border-white/10 rounded-[16px] p-1 custom-scrollbar z-[60]'>
                                              {availableTimes.length > 0 ? (
                                                availableTimes.map((timeOption) => (
                                                  <DropdownMenuItem
                                                    key={timeOption.value}
                                                    onClick={() => setScheduledTime(timeOption.value)}
                                                    className={cn(
                                                      'text-[12px] font-semibold py-1.5 px-3 rounded-[8px] cursor-pointer transition-colors',
                                                      scheduledTime === timeOption.value
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                                    )}
                                                  >
                                                    {timeOption.label ?? timeOption.value}
                                                    {scheduledTime === timeOption.value && (
                                                      <Check className='ml-auto h-3 w-3' />
                                                    )}
                                                  </DropdownMenuItem>
                                                ))
                                              ) : (
                                                <div className='py-4 px-2 text-center'>
                                                  <span className='text-[9px] font-bold text-slate-500 uppercase tracking-widest'>
                                                    No times left today
                                                  </span>
                                                </div>
                                              )}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                    )}

                                    <div className='space-y-1.5 pt-1.5 border-t border-white/5'>
                                      <div className='flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-500 pl-1'>
                                        <span>Target Timezone</span>
                                        <span className='text-slate-400 flex items-center gap-1'>
                                          <Globe className='h-2.5 w-2.5' /> Local
                                        </span>
                                      </div>
                                      <input
                                        type='text'
                                        value={timezone}
                                        readOnly
                                        className='w-full px-4 h-9 rounded-[10px] border border-white/5 bg-white/[0.02] text-xs text-slate-400 font-semibold outline-none cursor-default'
                                      />
                                    </div>
                                  </div>
                                )}

                                {activePopover === 'limit' && (
                                  <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1'>
                                        Content limit
                                      </span>
                                      <button
                                        onClick={() => setActivePopover(null)}
                                        className='text-slate-500 hover:text-white'
                                      >
                                        <X className='h-3.5 w-3.5' />
                                      </button>
                                    </div>

                                    <div className='flex items-center justify-between bg-black/40 border border-white/10 rounded-[14px] p-3 px-4'>
                                      <span className='text-xs font-bold text-slate-300'>Max length capping</span>
                                      <div className='inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1'>
                                        <input
                                          type='number'
                                          min='50'
                                          max='10000'
                                          value={maxLength}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) setMaxLength(val);
                                            else if (e.target.value === '') setMaxLength(0);
                                          }}
                                          onBlur={() => {
                                            if (maxLength < 50) setMaxLength(50);
                                          }}
                                          style={{ width: `${Math.max(1, maxLength.toString().length)}ch` }}
                                          className='bg-transparent text-center text-xs font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                        />
                                        <span className='text-[8px] font-black uppercase text-slate-500 select-none'>
                                          chars
                                        </span>
                                      </div>
                                    </div>

                                    <div className='pt-2 space-y-1.5'>
                                      <input
                                        type='range'
                                        min='50'
                                        max='2000'
                                        value={maxLength > 2000 ? 2000 : maxLength}
                                        onChange={(e) => setMaxLength(parseInt(e.target.value))}
                                        className='h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 transition-all hover:bg-white/15'
                                      />
                                      <div className='flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-600 font-bold px-1'>
                                        <span>50</span>
                                        <span>2000+</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>

                      {/* Quick Prompt Templates rendered right below popovers */}
                      <div className='w-full max-w-[920px] mx-auto mt-5 select-none'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                          {QUICK_TEMPLATES.map((tmpl) => {
                            const TmplIcon = tmpl.icon;
                            return (
                              <motion.button
                                key={tmpl.title}
                                type='button'
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                  setInstruction(tmpl.prompt);
                                  if (!automationName) {
                                    setAutomationName(tmpl.title);
                                  }
                                  if (validationError) {
                                    setValidationError(null);
                                    setRevisedPrompt(null);
                                  }
                                  toast.success(`Applied template: ${tmpl.title}`);
                                }}
                                className='flex items-start gap-4 p-4 rounded-[20px] bg-white/[0.01] border border-white/5 hover:border-white/15 hover:shadow-lg transition-all text-left group'
                              >
                                <div className='h-9 w-9 rounded-xl flex items-center justify-center border border-violet-500/10 bg-violet-500/5 text-violet-400 group-hover:bg-violet-500/10 transition-colors shrink-0'>
                                  <TmplIcon className='h-4 w-4' />
                                </div>
                                <div className='space-y-1 overflow-hidden flex-1'>
                                  <div className='flex items-center gap-2'>
                                    <span className='text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors'>
                                      {tmpl.title}
                                    </span>
                                    <span className='text-[8px] bg-violet-500/10 text-violet-400 px-1 rounded-sm uppercase tracking-tighter shrink-0'>
                                      {tmpl.tag}
                                    </span>
                                  </div>
                                  <p className='text-[10px] text-slate-500 font-medium leading-relaxed truncate max-w-full'>
                                    {tmpl.prompt}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className='max-w-[400px] rounded-[24px] border-white/5 bg-[#0c0e1a] p-0 overflow-hidden shadow-2xl'>
          <div className='p-6 pt-8 text-center'>
            <div
              className={cn(
                'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-xl',
                confirmDialog.type === 'cancel'
                  ? 'border-red-500/20 bg-red-500/10 text-red-400'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              )}
            >
              {confirmDialog.type === 'cancel' ? (
                <AlertCircle className='h-7 w-7' />
              ) : (
                <RefreshCcw className='h-7 w-7' />
              )}
            </div>
            <DialogTitle className='text-xl font-bold text-white'>
              {confirmDialog.type === 'cancel' ? 'Cancel Automation?' : 'Activate Automation?'}
            </DialogTitle>
            <DialogDescription className='mt-2 text-sm text-slate-400 leading-relaxed px-2'>
              {confirmDialog.type === 'cancel'
                ? 'This will stop the AI from generating and publishing content for this task. You can re-activate it later.'
                : 'This will resume the AI agentic workflow for this task according to its schedule.'}
            </DialogDescription>
          </div>
          <DialogFooter className='flex flex-row gap-0 border-t border-white/5 p-0 sm:justify-start'>
            <Button
              variant='ghost'
              onClick={() => setConfirmDialog({ open: false, type: null, id: null })}
              className='flex-1 h-12 rounded-none border-r border-white/5 text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]'
            >
              Go Back
            </Button>
            <Button
              onClick={executeConfirmAction}
              className={cn(
                'flex-1 h-12 rounded-none font-bold uppercase tracking-widest text-[10px]',
                confirmDialog.type === 'cancel'
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              )}
            >
              {confirmDialog.type === 'cancel' ? 'Confirm Cancel' : 'Confirm Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule & Reactivate Dialog */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className='max-w-[450px] rounded-[28px] border-white/5 bg-[#0c0e1a] p-0 overflow-hidden shadow-2xl backdrop-blur-xl'>
          <div className='p-6 pt-8 text-center relative'>
            <button
              onClick={() => setRescheduleDialog({ open: false, id: null, executeAtUtc: null })}
              className='absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-colors'
            >
              <X className='h-4 w-4' />
            </button>

            <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 backdrop-blur-xl animate-pulse'>
              <RefreshCcw className='h-7 w-7' />
            </div>

            <DialogTitle className='text-xl font-bold text-white tracking-tight'>
              Reschedule & Reactivate
            </DialogTitle>
            <DialogDescription className='mt-2 text-sm text-slate-400 leading-relaxed px-4'>
              This automation is scheduled in the past. To reactivate it, please choose when the AI should run the task:
            </DialogDescription>
          </div>

          <div className='px-6 pb-6 space-y-5'>
            {/* Toggle Switch */}
            <div className='flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5'>
              <div className='space-y-0.5'>
                <span className='block text-xs font-bold text-slate-200'>Run Immediately</span>
                <span className='block text-[10px] text-slate-500 font-medium'>
                  Will execute in approximately 1 minute
                </span>
              </div>
              <button
                type='button'
                onClick={() => setReschedImmediately(!reschedImmediately)}
                className={cn(
                  'w-10 h-5.5 rounded-full p-0.5 transition-all relative border border-white/10 shrink-0',
                  reschedImmediately ? 'bg-violet-600' : 'bg-slate-800'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full bg-white absolute top-[2px] transition-all',
                    reschedImmediately ? 'right-[2px]' : 'left-[2px]'
                  )}
                />
              </button>
            </div>

            {/* Custom Date & Time Fields */}
            {!reschedImmediately && (
              <div className='grid grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-1 duration-200'>
                <div className='space-y-1.5'>
                  <span className='text-[8px] font-bold uppercase tracking-widest text-slate-500 pl-1'>
                    Reschedule Date
                  </span>
                  <DatePickerInput
                    selected={reschedDate}
                    onSelect={setReschedDate}
                    fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
                    className='rounded-[12px] border-white/10 bg-black/40 text-xs h-10 text-slate-200 font-semibold w-full'
                  />
                </div>

                <div className='space-y-1.5'>
                  <span className='text-[8px] font-bold uppercase tracking-widest text-slate-500 pl-1'>
                    Reschedule Time
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className='w-full relative pl-9 pr-4 h-10 rounded-[12px] border border-white/10 bg-black/40 text-xs text-slate-200 font-semibold outline-none flex items-center justify-between hover:bg-black/50 transition-colors'>
                        <Clock className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500' />
                        <span>{reschedTime}</span>
                        <PlusIcon className='h-3 w-3 rotate-45 opacity-30 shrink-0' />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-[140px] max-h-[200px] overflow-y-auto bg-[#0c0e1a] border-white/10 rounded-[16px] p-1 custom-scrollbar z-[60]'>
                      {reschedAvailableTimes.length > 0 ? (
                        reschedAvailableTimes.map((timeOption) => (
                          <DropdownMenuItem
                            key={timeOption.value}
                            onClick={() => setReschedTime(timeOption.value)}
                            className={cn(
                              'text-[12px] font-semibold py-1.5 px-3 rounded-[8px] cursor-pointer transition-colors',
                              reschedTime === timeOption.value
                                ? 'bg-white/10 text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                            )}
                          >
                            {timeOption.label ?? timeOption.value}
                            {reschedTime === timeOption.value && (
                              <Check className='ml-auto h-3 w-3' />
                            )}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className='py-4 px-2 text-center'>
                          <span className='text-[9px] font-bold text-slate-500 uppercase tracking-widest'>
                            No times left today
                          </span>
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='flex flex-row gap-0 border-t border-white/5 p-0 sm:justify-start'>
            <Button
              variant='ghost'
              onClick={() => setRescheduleDialog({ open: false, id: null, executeAtUtc: null })}
              className='flex-1 h-12 rounded-none border-r border-white/5 text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]'
            >
              Cancel
            </Button>
            <Button
              onClick={executeRescheduleAction}
              className='flex-1 h-12 rounded-none font-bold uppercase tracking-widest text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            >
              Confirm & Reactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Intent Clarification Dialog has been deprecated and replaced with inline error handling on validation_failed */}

      {/* Schedule Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[950px] w-[96vw] min-h-[750px] max-h-[90vh] h-auto rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(11,13,24,0.95)_0%,rgba(7,9,16,0.98)_100%)] p-0 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-[#0c0e1a] [&>button]:border [&>button]:border-white/10 [&>button]:rounded-full [&>button]:shadow-lg hover:[&>button]:bg-white/10">
          <DialogTitle className='sr-only'>Schedule Details</DialogTitle>
          <DialogDescription className='sr-only'>View and manage schedule details</DialogDescription>
          {selectedSchedule && (
            <div className='flex flex-col h-full min-h-0 flex-1'>
              {/* Header */}
              <div className='p-5 px-6 relative flex flex-row items-center justify-between gap-4 border-b border-white/5 flex-none'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Badge
                      variant={normalizeStatus(selectedSchedule.status) === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        'px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full border-none shadow-none',
                        normalizeStatus(selectedSchedule.status) === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : normalizeStatus(selectedSchedule.status) === 'published'
                            ? 'bg-blue-500/10 text-blue-400'
                            : normalizeStatus(selectedSchedule.status) === 'failed'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-slate-500/10 text-slate-400'
                      )}
                    >
                      {selectedSchedule.status || 'waiting_for_execution'}
                    </Badge>
                    <span className='text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                      ID: {selectedSchedule.id.slice(0, 8)}
                    </span>
                  </div>
                  <DialogTitle className='text-base font-bold text-white tracking-tight'>
                    {selectedSchedule.name || 'Untitled Automation'}
                  </DialogTitle>
                </div>
              </div>

              {/* Content (2-Column Grid Layout) */}
              <div className='grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 p-6 sm:p-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full'>

                {/* Left Column: Details */}
                <div className='flex flex-col gap-5 min-h-0 w-full'>
                  {/* Prompt Card */}
                  <div className='space-y-2.5 bg-zinc-950/40 border border-white/5 rounded-2xl p-5 shadow-sm'>
                    <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5'>
                      <FileText className='h-4 w-4 text-violet-400' /> AI Prompt
                    </span>
                    <p className='text-sm text-slate-300 leading-relaxed font-medium italic pl-0.5 line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-pointer' title="Click to expand/collapse prompt text">
                      "{selectedSchedule?.agentPrompt}"
                    </p>
                  </div>

                  {/* Targets */}
                  <div className='space-y-3 bg-zinc-950/40 border border-white/5 rounded-2xl p-5'>
                    <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5'>
                      <Star className='h-4 w-4 text-amber-400' /> Target Channels
                    </span>
                    <div className='flex flex-wrap gap-1.5 pl-0.5'>
                      {selectedSchedule?.targets.map((tgt) => {
                        const accountObj = accounts.find((a) => a.id === tgt.socialMediaId);
                        const displayName = accountObj
                          ? getSocialMediaDisplayName(accountObj)
                          : tgt.targetLabel || 'Grounded Account';
                        const platform = tgt.platform || accountObj?.type || 'facebook';
                        return (
                          <div
                            key={tgt.socialMediaId}
                            className='flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.01]'
                          >
                            <Avatar className='h-4 w-4 rounded-md'>
                              <AvatarImage src={accountObj ? getSocialMediaAvatar(accountObj) : ''} />
                              <AvatarFallback
                                className={cn(
                                  'text-[7px] font-black',
                                  getPlatformStyle(platform).bg,
                                  getPlatformStyle(platform).color
                                )}
                              >
                                {platform[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-xs font-bold text-slate-300'>{displayName}</span>
                            {tgt.isPrimary && <Star className='h-3 w-3 fill-current text-amber-500 shrink-0' />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Settings Configuration Card */}
                  <div className='bg-zinc-950/40 border border-white/5 rounded-2xl p-5 space-y-4'>
                    <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5'>
                      <Settings2 className='h-4 w-4 text-blue-400' /> Configuration
                    </span>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-5 pl-0.5'>
                      <div>
                        <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1'>
                          Scheduled Date & Time
                        </span>
                        <span className='text-slate-200 font-bold block text-sm leading-tight mb-0.5'>
                          {new Date(selectedSchedule?.executeAtUtc || '').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className='text-xs text-slate-400 font-medium leading-none'>
                          {new Date(selectedSchedule?.executeAtUtc || '').toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          ({selectedSchedule?.timezone || 'UTC'})
                        </span>
                      </div>
                      <div>
                        <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1'>
                          Output Limit
                        </span>
                        <span className='text-slate-200 font-bold block text-sm mb-0.5'>
                          {selectedSchedule?.maxContentLength || 280} Chars Max
                        </span>
                        <span className='text-xs text-slate-400 font-medium leading-none'>Hard Limit Enforced</span>
                      </div>
                    </div>

                    {/* Search Context Settings */}
                    {selectedSchedule?.search && (
                      <div className='pt-4 border-t border-white/5 space-y-3'>
                        <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5'>
                          <Globe className='h-3.5 w-3.5 text-blue-400' /> Search Settings
                        </span>
                        <div className='grid grid-cols-2 gap-x-4 gap-y-3 pl-0.5 text-xs'>
                          <div>
                            <span className='text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1'>
                              Query Template
                            </span>
                            <span className='text-slate-300 font-bold text-sm max-w-full truncate block' title={selectedSchedule?.search?.queryTemplate || undefined}>
                              {selectedSchedule?.search?.queryTemplate || 'Auto-derived'}
                            </span>
                          </div>
                          <div>
                            <span className='text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1'>
                              Freshness / Country
                            </span>
                            <span className='text-slate-300 font-bold text-sm block'>
                              {(() => {
                                const f = selectedSchedule?.search?.freshness;
                                if (f === 'pd') return 'Past Day';
                                if (f === 'pw') return 'Past Week';
                                if (f === 'pm') return 'Past Month';
                                if (f === 'py') return 'Past Year';
                                return f || 'Anytime';
                              })()} •{' '}
                              {selectedSchedule?.search?.country || 'Global'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Execution Steps — AIThinkingPanel Style */}
                <div className='flex flex-col min-w-0 w-full min-h-0'>
                  <section className='flex flex-col min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_18px_48px_rgba(0,0,0,0.28)]'>
                    {/* Panel Header */}
                    <div className='flex shrink-0 items-center justify-between border-b border-white/8 bg-[#0b0d14]/95 px-5 py-4 backdrop-blur-xl'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/8'>
                          <Cpu className='h-5 w-5 text-amber-200' />
                        </div>
                        <div>
                          <h2 className='text-sm font-semibold text-white'>AI Thinkings</h2>
                          <p className='text-xs text-slate-400'>Realtime automation pipeline</p>
                        </div>
                      </div>

                      {normalizeStatus(selectedSchedule?.status) === 'failed' ? (
                        <div className='flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-300'>
                          <AlertTriangle className='h-3 w-3' />
                          Failed
                        </div>
                      ) : normalizeStatus(selectedSchedule?.status) === 'active' ? (
                        <div className='flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200'>
                          <Loader2 className='h-2 w-2 animate-spin text-amber-200' />
                          Processing
                        </div>
                      ) : normalizeStatus(selectedSchedule?.status) === 'published' ? (
                        <div className='flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300'>
                          <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
                          Active
                        </div>
                      ) : (
                        <div className='flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400'>
                          <Clock className='h-3 w-3' />
                          Queued
                        </div>
                      )}
                    </div>

                    {/* Scrollable Content */}
                    <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-gutter:stable]'>
                      {/* Global Failure Error Block */}
                      {normalizeStatus(selectedSchedule?.status) === 'failed' && (
                        <div className='mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100/90'>
                          <div className='flex items-center gap-2 mb-2'>
                            <AlertCircle className='h-4 w-4 shrink-0 text-rose-300' />
                            <span className='font-medium text-rose-200'>
                              {selectedSchedule?.errorCode || 'RUNTIME_ERROR'}
                            </span>
                          </div>
                          <p>{selectedSchedule?.errorMessage || 'An unknown error occurred during autonomous publishing runtime execution.'}</p>
                        </div>
                      )}

                      {parsedContext?.steps && parsedContext.steps.length > 0 ? (
                        <ScheduleProgressTimeline steps={parsedContext.steps} currentStep={parsedContext.currentStep} />
                      ) : selectedSchedule?.items && selectedSchedule.items.length > 0 ? (
                        <div className='relative space-y-4 before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-white/8'>
                          {[...(selectedSchedule.items || [])]
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((item, idx) => {
                              const isCompleted = item.status?.toLowerCase() === 'completed' || item.status?.toLowerCase() === 'published';
                              const isFailed = item.status?.toLowerCase() === 'failed';
                              return (
                                <div key={item.id || idx} className='relative ml-8 rounded-2xl border border-white/8 bg-black/20 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]'>
                                  {/* Timeline dot */}
                                  <div className='absolute -left-6 top-5 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#080a10]'>
                                    {isCompleted ? (
                                      <CheckCircle2 className='h-4 w-4 text-emerald-400' />
                                    ) : isFailed ? (
                                      <AlertTriangle className='h-4 w-4 text-rose-300' />
                                    ) : (
                                      <Sparkles className='h-4 w-4 text-slate-500' />
                                    )}
                                  </div>

                                  <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0 space-y-1'>
                                      <h3 className='text-sm font-medium text-white'>
                                        {item.itemTitle || item.itemType || 'Execution Step'}
                                      </h3>
                                    </div>
                                    <div className={cn(
                                      'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide',
                                      isCompleted
                                        ? 'bg-emerald-500/10 text-emerald-300'
                                        : isFailed
                                          ? 'bg-rose-500/10 text-rose-300'
                                          : 'bg-white/5 text-slate-500'
                                    )}>
                                      {item.status || 'pending'}
                                    </div>
                                  </div>

                                  {item.lastExecutionAt && (
                                    <p className='mt-1 text-[10px] text-slate-500'>
                                      {new Date(item.lastExecutionAt).toLocaleString()}
                                    </p>
                                  )}

                                  {item.errorMessage && (
                                    <div className='mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100/90'>
                                      <p>{item.errorMessage}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className='mt-5 rounded-2xl border border-dashed border-white/10 bg-white/2 p-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5'>
                              <BotIcon className='h-4 w-4 text-white/80' />
                            </div>
                            <div className='space-y-1'>
                              <p className='text-sm font-medium text-white'>Awaiting execution...</p>
                              <div className='flex items-center gap-2 text-xs text-slate-400'>
                                <Clock className='h-3 w-3' />
                                AI agent will execute all steps at the scheduled time
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <div className='p-4 px-6 flex flex-row gap-3 items-center justify-between border-t border-white/5 flex-none'>
                <div className='text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                  Mode: <span className='text-violet-400'>{selectedSchedule?.mode || 'agentic'}</span>
                </div>
                <div className='flex items-center gap-3 justify-end'>
                  <Button
                    variant='ghost'
                    onClick={() => setDetailsOpen(false)}
                    className='h-9 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-wider'
                  >
                    Close
                  </Button>

                  {isCancelable(selectedSchedule?.status) ? (
                    <Button
                      onClick={() => {
                        setDetailsOpen(false);
                        handleCancelLog(selectedSchedule!.id);
                      }}
                      className='h-9 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all duration-300 shadow-md shadow-red-600/10 hover:scale-[1.02]'
                    >
                      Cancel Schedule
                    </Button>
                  ) : isActivatable(selectedSchedule?.status) ? (
                    <Button
                      onClick={() => {
                        setDetailsOpen(false);
                        handleActivateLog(selectedSchedule!.id);
                      }}
                      className='h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all duration-300 shadow-md shadow-emerald-600/10 hover:scale-[1.02]'
                    >
                      Resume Schedule
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AiContentAutomation;
