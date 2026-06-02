import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
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
  ArrowLeft,
  Zap,
  Check,
  FileText,
  ChevronRight,
  Globe,
  Star,
  Loader2,
  Flame,
  TrendingUp,
  XCircle,
  X,
  Activity,
  Calendar,
  AlertTriangle,
  Info,
  Send,
  Pencil,
  UserPlus,
  Cpu,
  BookOpen,
  Lightbulb,
  Database,
  Paperclip,
  Link as LinkIcon
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiScheduleClientApi } from '@/services/client/ai-schedule.client';
import { ChatSessionClientApi } from '@/services/client/chat-session.client';
import { fetchSocialMedias, fetchWorkspaceLinkedSocialMedias, fetchFacebookPages } from '@/services/client/social-media.client';
import { useUserStore } from '@/store/user.store';
import type { AiSchedule } from '@/models/ai-schedule.model';
import type { SocialMedia } from '@/models/social-media.model';
import { ScheduleProgressTimeline } from '@/components/ai-schedule/ScheduleProgressTimeline';
import {
  mergeFacebookPagesWithAccounts,
  getSocialMediaDisplayName,
  getSocialMediaAvatar
} from '@/utils/social-media-display';

type WorkflowState = 'idle' | 'ready';
// type PageView = 'dashboard' | 'create';
const MAX_INSTRUCTION_LENGTH = 1000;
const GLOBAL_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
const isGlobalWorkspaceId = (value?: string | null) =>
  !value || value.toLowerCase() === GLOBAL_WORKSPACE_ID;

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
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const firstName = useMemo(() => {
    return user?.fullName ? user.fullName.split(' ')[0] : user?.username || 'Creator';
  }, [user]);

  const [activePopover, setActivePopover] = useState<'name' | 'channels' | 'schedule' | 'limit' | null>(null);

  const togglePopover = (name: 'name' | 'channels' | 'schedule' | 'limit') => {
    setActivePopover((prev) => (prev === name ? null : name));
  };

  const localTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
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
  const [userScheduleView, setUserScheduleView] = useState<'create' | 'schedules'>('create');

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

  const availableTimes = useMemo(() => {
    const times: string[] = [];
    const now = new Date();
    const minTimeMs = now.getTime() - 60 * 1000;

    const isTodayOrPast = scheduledDate
      ? new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()).getTime() <=
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      : true;

    // Add exact current time if today
    if (isTodayOrPast) {
      const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      times.push(nowStr);
    }

    for (let h = 0; h < 24; h++) {
      for (const m of ['00', '15', '30', '45']) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m}`;
        if (isTodayOrPast) {
          const candidate = scheduledDate ? new Date(scheduledDate) : new Date(now);
          candidate.setHours(h, parseInt(m), 0, 0);
          if (candidate.getTime() >= minTimeMs) {
            if (!times.includes(timeStr)) {
              times.push(timeStr);
            }
          }
        } else {
          if (!times.includes(timeStr)) {
            times.push(timeStr);
          }
        }
      }
    }

    // Sort chronologically
    return times.sort((a, b) => {
      const [ha, ma] = a.split(':').map(Number);
      const [hb, mb] = b.split(':').map(Number);
      return ha * 60 + ma - (hb * 60 + mb);
    });
  }, [scheduledDate, workflowState]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(scheduledTime)) {
      setScheduledTime(availableTimes[0]);
    }
  }, [availableTimes, scheduledTime]);

  const reschedAvailableTimes = useMemo(() => {
    const times: string[] = [];
    const now = new Date();
    const minTimeMs = now.getTime() - 60 * 1000;

    const isTodayOrPast = reschedDate
      ? new Date(reschedDate.getFullYear(), reschedDate.getMonth(), reschedDate.getDate()).getTime() <=
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      : true;

    if (isTodayOrPast) {
      const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      times.push(nowStr);
    }

    for (let h = 0; h < 24; h++) {
      for (const m of ['00', '15', '30', '45']) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m}`;
        if (isTodayOrPast) {
          const candidate = reschedDate ? new Date(reschedDate) : new Date(now);
          candidate.setHours(h, parseInt(m), 0, 0);
          if (candidate.getTime() >= minTimeMs) {
            if (!times.includes(timeStr)) {
              times.push(timeStr);
            }
          }
        } else {
          if (!times.includes(timeStr)) {
            times.push(timeStr);
          }
        }
      }
    }

    return times.sort((a, b) => {
      const [ha, ma] = a.split(':').map(Number);
      const [hb, mb] = b.split(':').map(Number);
      return ha * 60 + ma - (hb * 60 + mb);
    });
  }, [reschedDate]);

  useEffect(() => {
    if (reschedAvailableTimes.length > 0 && !reschedAvailableTimes.includes(reschedTime)) {
      setReschedTime(reschedAvailableTimes[0]);
    }
  }, [reschedAvailableTimes, reschedTime]);

  const getCombinedExecutionDate = () => {
    if (!scheduledDate) return null;
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const execDate = new Date(scheduledDate);
    execDate.setHours(hours, minutes, 0, 0);
    return execDate;
  };

  const getBackendSafeExecutionDate = (date: Date | null) => {
    const now = new Date();
    // Calculate the absolute minimum safe execution date: now + 1 minute.
    // To ensure it is at least 1 minute in the future and rounded to 00 seconds:
    const minDate = new Date(now.getTime() + 60 * 1000);
    if (minDate.getSeconds() > 0 || minDate.getMilliseconds() > 0) {
      minDate.setMinutes(minDate.getMinutes() + 1);
    }
    minDate.setSeconds(0, 0);

    if (!date) return minDate;

    if (date.getTime() < minDate.getTime()) {
      return minDate;
    }
    return date;
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

      const minExecutionTime = new Date(Date.now() - 2 * 60 * 1000);
      if (execDate < minExecutionTime) {
        toast.error('Invalid Schedule Time', {
          description: 'Please schedule at the current time or in the future.'
        });
        return;
      }
    }

    setValidationError(null);
    setRevisedPrompt(null);
    setWorkflowState('ready');
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
      targetDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes in the future
    } else {
      if (!reschedDate) {
        toast.warning('Please select a valid reschedule date.');
        return;
      }
      const [hours, minutes] = reschedTime.split(':').map(Number);
      targetDate = new Date(reschedDate);
      targetDate.setHours(hours, minutes, 0, 0);

      if (targetDate < new Date(Date.now() - 2 * 60 * 1000)) {
        toast.error('Invalid Time', {
          description: 'Please schedule at the current time or in the future.'
        });
        return;
      }
      targetDate = getBackendSafeExecutionDate(targetDate);
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
    const execDate = getBackendSafeExecutionDate(executeImmediately ? new Date() : getCombinedExecutionDate());

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
            setWorkflowState('idle');
            throw new Error(`AI needs clarification: ${data.validationError || 'Intent is too vague'}`);
          }
          if (data.action === 'future_ai_schedule_created') {
            fetchInitialData();
            setWorkflowState('idle');
            setInstruction('');
            setAutomationName('');
            return 'Agentic automation created successfully!';
          }
        }
        throw new Error(res.error?.description || 'Failed to process automation');
      },
      error: (err) => err.message || 'Failed to process request'
    });
  };

  const getActionableStatus = () => {
    switch (workflowState) {
      case 'idle':
        return {
          label: 'Workflow Incomplete',
          desc: 'Instruction required',
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20'
        };
      case 'ready':
        return {
          label: 'System Ready',
          desc: 'Ready to create',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20'
        };
    }
  };

  const status = getActionableStatus();

  const stats = useMemo(
    () => ({
      total: schedules.length,
      active: schedules.filter((s) => normalizeStatus(s.status) === 'active').length,
      published: schedules.filter((s) => normalizeStatus(s.status) === 'published').length,
      cancelled: schedules.filter((s) => normalizeStatus(s.status) === 'cancelled').length
    }),
    [schedules]
  );

  const resetAutomationDraft = () => {
    setAutomationName('');
    setInstruction('');
    setValidationError(null);
    setRevisedPrompt(null);
    setWorkflowState('idle');
    setSessionId(null);
    const defaultAccountId = accounts[0]?.id ?? null;
    setSelectedAccounts(defaultAccountId ? [defaultAccountId] : []);
    setPrimaryAccountId(defaultAccountId);
    setMaxLength(280);
    setExecuteImmediately(false);
    const defaults = getInitialDefaultTime();
    setScheduledDate(defaults.date);
    setScheduledTime(defaults.timeString);
    setActivePopover(null);
  };

  const handleInlineCreateRequest = () => {
    resetAutomationDraft();
    setUserScheduleView('create');
  };

  const filteredSchedules = useMemo(
    () => schedules.filter((item) => filter === 'all' || normalizeStatus(item.status) === filter),
    [filter, schedules]
  );

  const selectedAccountObjects = useMemo(
    () => accounts.filter((account) => selectedAccounts.includes(account.id)),
    [accounts, selectedAccounts]
  );

  const selectedScheduleLabel = executeImmediately
    ? 'Immediately'
    : `${scheduledDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Today'} at ${scheduledTime}`;

  const pagePanelClass = 'rounded-[24px] bg-white/[0.035] p-4 sm:p-5';
  const innerPanelClass = 'rounded-[18px] bg-white/[0.025] p-3';

  const renderNoAccountsPanel = () => (
    <section className={`${pagePanelClass} flex min-h-[420px] flex-col items-center justify-center text-center`}>
      <div className='flex h-14 w-14 items-center justify-center rounded-[18px] bg-red-500/10 text-red-300'>
        <UserPlus className='h-7 w-7' />
      </div>
      <div className='mt-5 max-w-md space-y-2'>
        <h2 className='text-xl font-semibold text-white'>Connect social channels</h2>
        <p className='text-sm leading-relaxed text-slate-400'>
          Add at least one publishing destination before creating an AI schedule.
        </p>
      </div>
      <Button
        onClick={() => {
          toast.info(workspaceId ? 'Redirecting to Workspace Settings...' : 'Redirecting to Social Links...', {
            description: 'Please link a social account before creating a schedule.'
          });
          window.location.href = workspaceId ? `/workspace/${workspaceId}/settings` : '/user/social-links';
        }}
        className='mt-6 h-11 rounded-[14px] bg-white px-5 text-sm font-semibold text-black hover:bg-white/90'
      >
        {workspaceId ? 'Configure Accounts' : 'Connect Accounts'}
        <ArrowRight className='h-4 w-4' />
      </Button>
    </section>
  );

  const renderUserScheduleHeader = () => (
    <header className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-4'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
          <BotIcon className='h-5 w-5' />
        </div>
        <div className='space-y-0.5'>
          <h1 className='text-xl font-bold tracking-tight text-white'>AI Auto-Publishing</h1>
          <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
            Event-Driven Publishing AI
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Tabs
          value={userScheduleView}
          onValueChange={(val) => {
            if (val === 'create') {
              handleInlineCreateRequest();
            } else {
              setUserScheduleView('schedules');
            }
          }}
        >
          <TabsList className='bg-white/[0.05] border-none p-1 h-9 rounded-[16px] gap-1'>
            <TabsTrigger
              value='create'
              className='flex h-7 items-center gap-2 rounded-[12px] px-3 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-slate-400 hover:text-white transition-colors border-none'
            >
              <Sparkles className='h-4 w-4' />
              Create
            </TabsTrigger>
            <TabsTrigger
              value='schedules'
              className='flex h-7 items-center gap-2 rounded-[12px] px-3 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-slate-400 hover:text-white transition-colors border-none'
            >
              <ListTodo className='h-4 w-4' />
              Schedules
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant='outline'
          size='lg'
          className='h-10 rounded-[14px] border-none bg-white/[0.05] px-4 text-xs font-bold text-slate-200 hover:bg-white/[0.08] hover:text-white'
          onClick={() => fetchInitialData()}
          disabled={isLoading}
        >
          <RefreshCcw className={cn('size-4', isLoading && 'animate-spin')} />
          Sync Now
        </Button>
      </div>
    </header>
  );

  const renderUserCreateContent = () => {
    if (isLoading) {
      return (
        <section className={`${pagePanelClass} flex min-h-[420px] flex-col items-center justify-center gap-3 text-slate-400`}>
          <Loader2 className='h-7 w-7 animate-spin' />
          <span className='text-xs font-semibold uppercase tracking-widest'>Loading schedule setup</span>
        </section>
      );
    }

    if (accounts.length === 0) {
      return renderNoAccountsPanel();
    }

    if (workflowState === 'ready') {
      return (
        <section className='grid grid-cols-1 gap-3 lg:grid-cols-12'>
          <div className={`${pagePanelClass} lg:col-span-8`}>
            <div className='flex items-center gap-2 text-sm font-semibold text-white'>
              <CheckCircle2 className='h-4 w-4 text-emerald-300' />
              Review automation plan
            </div>
            <div className='mt-4 rounded-[20px] bg-white/[0.04] p-4'>
              <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>AI instruction</p>
              <p className='mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200'>{instruction}</p>
            </div>
            <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className={innerPanelClass}>
                <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>Name</p>
                <p className='mt-2 truncate text-sm font-semibold text-white'>
                  {automationName || 'Untitled AI Automation'}
                </p>
              </div>
              <div className={innerPanelClass}>
                <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>Schedule</p>
                <p className='mt-2 text-sm font-semibold text-white'>{selectedScheduleLabel}</p>
                {!executeImmediately && <p className='mt-1 text-xs text-slate-500'>{timezone}</p>}
              </div>
            </div>
          </div>

          <div className={`${pagePanelClass} lg:col-span-4`}>
            <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>Publishing channels</p>
            <div className='mt-4 space-y-2'>
              {selectedAccountObjects.map((acc) => (
                <div key={acc.id} className='flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-3'>
                  <Avatar className='h-8 w-8 rounded-[10px]'>
                    <AvatarImage src={getSocialMediaAvatar(acc)} />
                    <AvatarFallback className={cn('text-[10px] font-bold', getPlatformStyle(acc.type).bg, getPlatformStyle(acc.type).color)}>
                      {acc.type[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-white'>{getSocialMediaDisplayName(acc)}</p>
                    <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>{acc.type}</p>
                  </div>
                  {primaryAccountId === acc.id && <Star className='h-4 w-4 fill-current text-amber-300' />}
                </div>
              ))}
            </div>
            <div className='mt-4 rounded-[16px] bg-white/[0.04] p-3'>
              <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>Output limit</p>
              <p className='mt-2 text-sm font-semibold text-white'>{maxLength} characters</p>
            </div>
          </div>

          <div className='flex flex-col gap-3 rounded-[24px] bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-12'>
            <Button
              variant='ghost'
              onClick={() => setWorkflowState('idle')}
              className='h-11 rounded-[14px] bg-white/[0.05] px-5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white'
            >
              <ArrowLeft className='h-4 w-4' />
              Adjust
            </Button>
            <Button
              onClick={handleCreateAutomation}
              className='h-11 rounded-[14px] bg-white px-5 text-sm font-semibold text-black hover:bg-white/90'
            >
              Deploy AI Schedule
              <Zap className='h-4 w-4' />
            </Button>
          </div>
        </section>
      );
    }

    return (
      <section className='grid grid-cols-1 gap-3 lg:grid-cols-12'>
        <div className={`${pagePanelClass} flex min-h-[370px] flex-col lg:col-span-8`}>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>AI instruction</p>
            <span className={cn('text-xs font-semibold tabular-nums', instruction.length > MAX_INSTRUCTION_LENGTH * 0.8 ? 'text-amber-300' : 'text-slate-500')}>
              {instruction.length}/{MAX_INSTRUCTION_LENGTH}
            </span>
          </div>

          <Textarea
            placeholder='Describe the topic, trigger, tone, and publishing goal...'
            value={instruction}
            onChange={(e) => {
              setInstruction(e.target.value.slice(0, MAX_INSTRUCTION_LENGTH));
              if (validationError) {
                setValidationError(null);
                setRevisedPrompt(null);
              }
            }}
            className='mt-5 min-h-[250px] flex-1 resize-none border-none bg-transparent dark:bg-transparent p-0 text-base leading-relaxed text-slate-100 placeholder:text-slate-600 focus-visible:ring-0'
          />

          {validationError && (
            <div className='mt-4 rounded-[18px] bg-amber-500/10 p-3'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-300' />
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-semibold text-amber-200'>AI needs more detail</p>
                  <p className='mt-1 text-xs leading-relaxed text-slate-300'>{validationError}</p>
                  {revisedPrompt && (
                    <button
                      type='button'
                      onClick={() => {
                        setInstruction(revisedPrompt);
                        setValidationError(null);
                        setRevisedPrompt(null);
                      }}
                      className='mt-3 rounded-[12px] bg-white/[0.08] px-3 py-2 text-left text-xs font-semibold text-slate-100 hover:bg-white/[0.12]'
                    >
                      Use suggestion
                    </button>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setValidationError(null);
                    setRevisedPrompt(null);
                  }}
                  className='rounded-[10px] p-1 text-slate-500 hover:bg-white/[0.06] hover:text-white'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
          )}

          <div className='mt-4 flex justify-end'>
            <Button
              onClick={handleNextStep}
              disabled={!instruction.trim()}
              className='h-11 rounded-[14px] bg-white px-5 text-sm font-semibold text-black hover:bg-white/90 disabled:bg-white/[0.08] disabled:text-slate-500'
            >
              Continue
              <ArrowRight className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className={`${pagePanelClass} lg:col-span-4 lg:row-span-2`}>
          <div className='mb-6 border-b border-white/[0.05] pb-5'>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>Name</p>
            <input
              type='text'
              placeholder='Untitled AI Automation'
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              className='mt-3 h-10 w-full bg-transparent p-0 text-sm font-semibold text-white outline-none placeholder:text-slate-600 border-b border-white/10 focus:border-white/20 transition-colors'
            />
          </div>

          <div className='flex items-center justify-between gap-3'>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>Channels</p>
            <span className='text-xs font-semibold text-slate-500'>{selectedAccounts.length}/{accounts.length}</span>
          </div>
          <div className='mt-4 grid max-h-[460px] grid-cols-1 gap-2 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2 lg:grid-cols-1'>
            {accounts.map((acc) => {
              const isSelected = selectedAccounts.includes(acc.id);
              const isPrimary = primaryAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  type='button'
                  onClick={() => {
                    if (isSelected) {
                      const next = selectedAccounts.filter((id) => id !== acc.id);
                      setSelectedAccounts(next);
                      if (isPrimary) {
                        setPrimaryAccountId(next[0] ?? null);
                      }
                    } else {
                      const next = [...selectedAccounts, acc.id];
                      setSelectedAccounts(next);
                      if (next.length === 1) {
                        setPrimaryAccountId(acc.id);
                      }
                      setShowAccountError(false);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-[18px] p-3 text-left transition-colors',
                    isSelected ? 'bg-white/[0.08]' : 'bg-white/[0.025] hover:bg-white/[0.05]'
                  )}
                >
                  <Avatar className='h-9 w-9 rounded-[12px]'>
                    <AvatarImage src={getSocialMediaAvatar(acc)} />
                    <AvatarFallback className={cn('text-[10px] font-bold', getPlatformStyle(acc.type).bg, getPlatformStyle(acc.type).color)}>
                      {acc.type[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-white'>{getSocialMediaDisplayName(acc)}</p>
                    <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>{acc.type}</p>
                  </div>
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', isSelected ? 'bg-white text-black' : 'bg-white/[0.08] text-transparent')}>
                    <Check className='h-3 w-3' />
                  </span>
                </button>
              );
            })}
          </div>
          {selectedAccountObjects.length > 1 && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {selectedAccountObjects.map((acc) => (
                <button
                  key={acc.id}
                  type='button'
                  onClick={() => setPrimaryAccountId(primaryAccountId === acc.id ? null : acc.id)}
                className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    primaryAccountId === acc.id ? 'bg-amber-300 text-black' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  <Star className={cn('mr-1 inline h-3 w-3', primaryAccountId === acc.id && 'fill-current')} />
                  {getSocialMediaDisplayName(acc)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${pagePanelClass} lg:col-span-5`}>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>Schedule</p>
            <Clock className='h-4 w-4 text-slate-500' />
          </div>

          <div className='mt-4 grid grid-cols-2 gap-3'>
            <DatePickerInput
              selected={scheduledDate}
              onSelect={setScheduledDate}
              fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
              className='h-10 w-full rounded-[14px] border-transparent bg-white/[0.05] text-xs font-semibold text-slate-100'
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='flex h-10 w-full items-center justify-between rounded-[14px] bg-white/[0.05] px-3 text-xs font-semibold text-slate-100 outline-none hover:bg-white/[0.08]'>
                  <span>{scheduledTime}</span>
                  <Clock className='h-3.5 w-3.5 text-slate-500' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='max-h-[260px] w-[180px] overflow-y-auto rounded-[16px] border-none bg-[#0c0e1a] p-1 text-slate-100 shadow-none custom-scrollbar'>
                {availableTimes.map((time) => (
                  <DropdownMenuItem
                    key={time}
                    onClick={() => setScheduledTime(time)}
                    className={cn(
                      'cursor-pointer rounded-[10px] px-3 py-2 text-xs font-semibold',
                      scheduledTime === time ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    {time}
                    {scheduledTime === time && <Check className='ml-auto h-3.5 w-3.5' />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={`${pagePanelClass} lg:col-span-3`}>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-slate-500'>Length</p>
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
              className='w-20 bg-transparent text-right text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            />
          </div>
          <input
            type='range'
            min='50'
            max='2000'
            value={maxLength > 2000 ? 2000 : maxLength}
            onChange={(e) => setMaxLength(parseInt(e.target.value))}
            className='ai-schedule-slider mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-white'
          />
          <div className='mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-600'>
            <span>50</span>
            <span>2000+</span>
          </div>
        </div>

      </section>
    );
  };

  const renderUserSchedulesContent = () => (
    <div className='space-y-3'>
      <section className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
        {[
          { label: 'Total', value: stats.total, icon: ListTodo },
          { label: 'Active', value: stats.active, icon: Zap },
          { label: 'Published', value: stats.published, icon: CheckCircle2 },
          { label: 'Failed', value: schedules.filter((s) => normalizeStatus(s.status) === 'failed').length, icon: AlertCircle },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className='rounded-[22px] bg-white/[0.035] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>{item.label}</p>
                <Icon className='h-4 w-4 text-slate-500' />
              </div>
              <p className='mt-3 text-2xl font-semibold text-white'>{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className='overflow-hidden rounded-[24px] bg-white/[0.035]'>
        <div className='flex flex-col gap-3 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2 text-slate-200'>
            <ListTodo className='h-4 w-4 text-slate-500' />
            <span className='text-xs font-semibold uppercase tracking-widest'>Schedule Overview</span>
          </div>
          <div className='inline-flex flex-wrap gap-1 rounded-[16px] bg-white/[0.05] p-1'>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'published', label: 'Published' },
              { id: 'failed', label: 'Failed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setFilter(tab.id as any)}
                className={cn(
                  'h-8 rounded-[11px] px-3 text-[10px] font-semibold uppercase tracking-widest transition-colors',
                  filter === tab.id ? 'bg-white text-black' : 'text-slate-500 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className='flex flex-col items-center justify-center gap-3 py-20 text-slate-500'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span className='text-xs font-semibold uppercase tracking-widest'>Syncing schedules</span>
          </div>
        ) : filteredSchedules.length > 0 ? (
          <div className='divide-y divide-white/[0.04]'>
            {filteredSchedules.map((item) => (
              <div
                key={item.id}
                onClick={() => handleEditLog(item)}
                className='group flex cursor-pointer flex-col gap-4 p-4 transition-colors hover:bg-white/[0.035] md:flex-row md:items-center md:justify-between sm:px-5'
              >
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        normalizeStatus(item.status) === 'active'
                          ? 'bg-emerald-400'
                          : normalizeStatus(item.status) === 'published'
                            ? 'bg-blue-400'
                            : normalizeStatus(item.status) === 'failed'
                              ? 'bg-red-400'
                              : 'bg-slate-500'
                      )}
                    />
                    <Badge
                      className={cn(
                        'rounded-full border-none px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest shadow-none',
                        normalizeStatus(item.status) === 'active'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : normalizeStatus(item.status) === 'published'
                            ? 'bg-blue-500/10 text-blue-300'
                            : normalizeStatus(item.status) === 'failed'
                              ? 'bg-red-500/10 text-red-300'
                              : 'bg-white/[0.05] text-slate-400'
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </Badge>
                    <span className='text-[10px] font-semibold uppercase tracking-widest text-slate-500'>
                      {new Date(item.executeAtUtc).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h3 className='mt-2 truncate text-sm font-semibold text-white group-hover:text-slate-100'>
                    {item.name || 'Untitled Automation'}
                  </h3>
                  <p className='mt-1 line-clamp-1 max-w-3xl text-xs leading-relaxed text-slate-500'>
                    {item.agentPrompt}
                  </p>
                </div>
                <div className='flex items-center justify-between gap-4 md:justify-end'>
                  <PlatformStack
                    publications={item.targets.map((t) => ({ socialMediaType: t.platform || 'facebook' })) as any}
                    maxDisplay={3}
                  />
                  <ChevronRight className='h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300' />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center gap-3 px-6 py-20 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/[0.04]'>
              <BotIcon className='h-6 w-6 text-slate-500' />
            </div>
            <div>
              <p className='text-sm font-semibold text-slate-200'>No schedules yet</p>
              <p className='mt-1 text-xs text-slate-500'>Create your first AI auto-publishing schedule.</p>
            </div>
            <Button
              onClick={handleInlineCreateRequest}
              className='mt-2 h-10 rounded-[14px] bg-white px-4 text-sm font-semibold text-black hover:bg-white/90'
            >
              Create Schedule
            </Button>
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className='space-y-10 relative pb-6'>
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

      {renderUserScheduleHeader()}
      {userScheduleView === 'create' ? renderUserCreateContent() : renderUserSchedulesContent()}




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
                  Will execute in approximately 2 minutes
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
                        reschedAvailableTimes.map((time) => (
                          <DropdownMenuItem
                            key={time}
                            onClick={() => setReschedTime(time)}
                            className={cn(
                              'text-[12px] font-semibold py-1.5 px-3 rounded-[8px] cursor-pointer transition-colors',
                              reschedTime === time
                                ? 'bg-white/10 text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                            )}
                          >
                            {time}
                            {reschedTime === time && <Check className='ml-auto h-3 w-3' />}
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
