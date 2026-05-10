import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  BotIcon,
  PlusIcon,
  RefreshCcw,
  Send,
  Calendar as CalendarIcon,
  Clock,
  User,
  MoreVertical,
  Trash,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Settings2,
  ListTodo,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Check,
  FileText,
  ChevronRight,
  LayoutTemplate,
  Globe,
  Star,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AiScheduleClientApi } from '@/services/client/ai-schedule.client';
import { ChatSessionClientApi } from '@/services/client/chat-session.client';
import { fetchWorkspaceLinkedSocialMedias } from '@/services/client/social-media.client';
import type { AiSchedule } from '@/models/ai-schedule.model';
import type { SocialMedia } from '@/models/social-media.model';

type WorkflowState = 'idle' | 'ready';
type PageView = 'dashboard' | 'create';
const MAX_INSTRUCTION_LENGTH = 1000;

function AiContentAutomation() {
  const { workspaceId } = useParams();
  const localTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [pageView, setPageView] = useState<PageView>('dashboard');
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [instruction, setInstruction] = useState('');

  const [schedules, setSchedules] = useState<AiSchedule[]>([]);
  const [accounts, setAccounts] = useState<SocialMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const getPlatformStyle = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('facebook')) return { color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', solidBg: 'bg-[#1877F2]', border: 'border-[#1877F2]/20' };
    if (t.includes('instagram')) return { color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', solidBg: 'bg-[#E4405F]', border: 'border-[#E4405F]/20' };
    if (t.includes('tiktok')) return { color: 'text-white', bg: 'bg-white/10', solidBg: 'bg-white', border: 'border-white/20' };
    if (t.includes('linkedin')) return { color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', solidBg: 'bg-[#0A66C2]', border: 'border-[#0A66C2]/20' };
    if (t.includes('youtube')) return { color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', solidBg: 'bg-[#FF0000]', border: 'border-[#FF0000]/20' };
    if (t.includes('twitter') || t.includes('x')) return { color: 'text-white', bg: 'bg-white/10', solidBg: 'bg-white', border: 'border-white/20' };
    return { color: 'text-slate-300', bg: 'bg-white/5', solidBg: 'bg-slate-500', border: 'border-white/10' };
  };

  const getInitialDefaultTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    const remainder = d.getMinutes() % 15;
    if (remainder !== 0) d.setMinutes(d.getMinutes() + (15 - remainder));
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

  const fetchInitialData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const [schedulesRes, accountsRes] = await Promise.all([
        AiScheduleClientApi.fetchSchedules({ workspaceId }),
        fetchWorkspaceLinkedSocialMedias(workspaceId)
      ]);

      if (schedulesRes.isSuccess) {
        setSchedules(schedulesRes.value);
      }
      if (accountsRes.isSuccess) {
        setAccounts(accountsRes.value);
        if (accountsRes.value.length > 0) {
          setSelectedAccounts([accountsRes.value[0].id]);
          setPrimaryAccountId(accountsRes.value[0].id);
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


  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const availableTimes = useMemo(() => {
    const times: string[] = [];
    const now = new Date();
    const minTimeMs = now.getTime() + 5 * 60 * 1000;

    const isTodayOrPast = scheduledDate ? (
      new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()).getTime() <=
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    ) : true;

    for (let h = 0; h < 24; h++) {
      for (const m of ['00', '15', '30', '45']) {
        if (isTodayOrPast) {
          const candidate = scheduledDate ? new Date(scheduledDate) : new Date(now);
          candidate.setHours(h, parseInt(m), 0, 0);
          if (candidate.getTime() >= minTimeMs) {
            times.push(`${h.toString().padStart(2, '0')}:${m}`);
          }
        } else {
          times.push(`${h.toString().padStart(2, '0')}:${m}`);
        }
      }
    }
    return times;
  }, [scheduledDate, workflowState]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(scheduledTime)) {
      setScheduledTime(availableTimes[0]);
    }
  }, [availableTimes, scheduledTime]);

  const getCombinedExecutionDate = () => {
    if (!scheduledDate) return null;
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const execDate = new Date(scheduledDate);
    execDate.setHours(hours, minutes, 0, 0);
    return execDate;
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

    const execDate = getCombinedExecutionDate();
    if (!execDate) {
      toast.warning('Please select a valid execution date and time.');
      return;
    }

    const minExecutionTime = new Date(Date.now() + 5 * 60 * 1000);
    if (execDate < minExecutionTime) {
      toast.error('Invalid Schedule Time', {
        description: 'Please schedule at least 5 minutes from now to allow AI sufficient time to prepare and publish the content.'
      });
      return;
    }

    setWorkflowState('ready');
  };

  const handleEditLog = (item: any) => {
    setEditingScheduleId(item.id);
    setInstruction(item.agentPrompt || '');
    const execDate = new Date(item.executeAtUtc);
    setScheduledDate(execDate);
    setScheduledTime(`${execDate.getHours().toString().padStart(2, '0')}:${execDate.getMinutes().toString().padStart(2, '0')}`);
    setSelectedAccounts(item.targets.map((t: any) => t.socialMediaId || t.platform));
    setPrimaryAccountId(item.targets.find((t: any) => t.isPrimary)?.socialMediaId || null);
    setWorkflowState('idle');
    setPageView('create');
    toast.info('Editing automation workflow', {
      description: 'You can now modify the parameters and save the changes.'
    });
  };

  const handleCancelLog = async (id: string) => {
    toast('Cancel Automation?', {
      description: 'This will stop the AI from generating and publishing content for this task. Are you sure?',
      action: {
        label: 'Confirm Cancel',
        onClick: () => {
          toast.promise(AiScheduleClientApi.cancelSchedule(id), {
            loading: 'Cancelling automation...',
            success: (res) => {
              if (res.isSuccess) {
                setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
                return 'Automation cancelled successfully';
              }
              throw new Error(res.error?.description || 'Failed to cancel automation');
            },
            error: (err) => err.message || 'Failed to cancel automation'
          });
        }
      },
      cancel: {
        label: 'Keep Active',
        onClick: () => { }
      }
    });
  };

  const handleActivateLog = async (id: string) => {
    toast.promise(AiScheduleClientApi.activateSchedule(id), {
      loading: 'Activating automation...',
      success: (res) => {
        if (res.isSuccess) {
          setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
          return 'Automation activated successfully';
        }
        throw new Error(res.error?.description || 'Failed to activate automation');
      },
      error: (err) => err.message || 'Failed to activate automation'
    });
  };

  const handleCreateAutomation = async () => {
    if (!workspaceId) return;
    const execDate = getCombinedExecutionDate();

    if (!editingScheduleId) {
      // NEW AGENTIC FLOW
      const agentPayload = {
        message: instruction,
        scheduleOptions: {
          executeAtUtc: execDate ? execDate.toISOString() : new Date().toISOString(),
          timezone,
          maxContentLength: maxLength,
          targets: selectedAccounts.map(id => ({
            socialMediaId: id,
            isPrimary: id === primaryAccountId
          }))
        }
      };

      const executeAgentMessage = async () => {
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const sessionRes = await ChatSessionClientApi.createChatSession({
            workspaceId,
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
              throw new Error(`AI needs more details: ${data.validationError || 'Intent is too vague'}`);
            }
            if (data.action === 'future_ai_schedule_created') {
              fetchInitialData();
              setWorkflowState('idle');
              setInstruction('');
              setPageView('dashboard');
              return 'Agentic automation created successfully!';
            }
          }
          throw new Error(res.error?.description || 'Failed to process automation');
        },
        error: (err) => err.message || 'Failed to process request'
      });
    } else {
      const payload = {
        workspaceId,
        agentPrompt: instruction,
        executeAtUtc: execDate ? execDate.toISOString() : new Date().toISOString(),
        timezone,
        maxContentLength: maxLength,
        targets: selectedAccounts.map(id => ({
          socialMediaId: id,
          isPrimary: id === primaryAccountId
        }))
      };

      const promise = AiScheduleClientApi.updateSchedule(editingScheduleId, payload);

      toast.promise(promise, {
        loading: 'Updating automation...',
        success: (res) => {
          if (res.isSuccess) {
            fetchInitialData();
            setWorkflowState('idle');
            setInstruction('');
            setEditingScheduleId(null);
            setPageView('dashboard');
            return 'Automation updated successfully!';
          }
          throw new Error(res.error?.description || 'Failed to update automation');
        },
        error: (err) => err.message || 'Failed to update automation'
      });
    }
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

  const stats = useMemo(() => ({
    total: schedules.length,
    active: schedules.filter(s => s.status === 'active').length,
    published: schedules.filter(s => s.status === 'published').length,
    cancelled: schedules.filter(s => s.status === 'cancelled').length,
  }), [schedules]);

  const handleNewRequest = () => {
    setEditingScheduleId(null);
    setInstruction('');
    setWorkflowState('idle');
    setSessionId(null);
    setSelectedAccounts([]);
    setPrimaryAccountId(null);
    setMaxLength(280);
    const defaults = getInitialDefaultTime();
    setScheduledDate(defaults.date);
    setScheduledTime(defaults.timeString);
    setPageView('create');
  };

  const handleBackToDashboard = () => {
    setPageView('dashboard');
    setEditingScheduleId(null);
    setWorkflowState('idle');
  };

  return (
    <div className='flex flex-col gap-6 p-1 relative max-w-[1400px] mx-auto pb-12'>
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

      <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.03] text-white/80'>
            <BotIcon className='w-4 h-4 text-white' />
          </div>
          <div className='space-y-0.5'>
            <h1 className='text-xl font-bold tracking-tight text-white'>AI Auto-Publishing</h1>
            <p className='text-[11px] text-slate-500 font-medium uppercase tracking-widest'>Event-Driven Publishing AI</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size={'lg'}
            onClick={() => fetchInitialData()}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
          >
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Sync Now
          </Button>
          {pageView === 'dashboard' ? (
            <Button
              onClick={handleNewRequest}
              className='rounded-2xl bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-white/5'
              size={'lg'}
            >
              <PlusIcon className="h-4 w-4" />
              New Request
            </Button>
          ) : (
            <Button
              variant='outline'
              size={'lg'}
              onClick={handleBackToDashboard}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back
            </Button>
          )}
        </div>
      </section>

      {pageView === 'dashboard' && (
        <div className='space-y-6 animate-in fade-in duration-300'>
          {!isLoading && (
            <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {[
                { label: 'Total Schedules', value: stats.total, icon: ListTodo, color: 'violet', sub: 'All automation tasks' },
                { label: 'Active', value: stats.active, icon: Zap, color: 'emerald', sub: 'Currently running' },
                { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'blue', sub: 'Successfully completed' },
                { label: 'Cancelled', value: stats.cancelled, icon: AlertCircle, color: 'slate', sub: 'Stopped by user' },
              ].map((item) => {
                const Icon = item.icon;
                const accentClass =
                  item.color === 'emerald' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' :
                    item.color === 'blue' ? 'border-blue-400/20 bg-blue-500/10 text-blue-200' :
                      item.color === 'slate' ? 'border-slate-400/20 bg-slate-500/10 text-slate-300' :
                        'border-violet-400/20 bg-violet-500/10 text-violet-200';
                return (
                  <div key={item.label} className='group relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]'>
                    <div className='absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                      <div className='absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl' />
                    </div>
                    <div className='relative flex items-start justify-between'>
                      <div>
                        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500'>{item.label}</p>
                        <div className='mt-3 flex items-end gap-2'>
                          <span className='text-3xl font-bold leading-none text-white'>{item.value}</span>
                        </div>
                        <p className='mt-2 text-sm text-slate-400'>{item.sub}</p>
                      </div>
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-xl ${accentClass}`}>
                        <Icon className='h-6 w-6' />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <Card className='rounded-[24px] border-white/5 bg-[#080a12] shadow-none overflow-hidden'>
            <CardHeader className='py-5 px-6 border-b border-white/5 bg-white/[0.01]'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-slate-300'>
                  <ListTodo className='h-4 w-4' />
                  <span className='text-[10px] font-bold uppercase tracking-widest'>All Schedules</span>
                </div>
                <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>{schedules.length} total</span>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {isLoading ? (
                <div className='flex flex-col items-center justify-center py-20 gap-4 opacity-40'>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  <span className='text-[10px] font-bold uppercase tracking-widest'>Syncing with system...</span>
                </div>
              ) : schedules.length > 0 ? (
                <div className='divide-y divide-white/5'>
                  {schedules.map(item => (
                    <div key={item.id} className='p-6 hover:bg-white/[0.02] transition-all group relative'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-3'>
                          <div className={cn(
                            'h-2.5 w-2.5 rounded-full shrink-0',
                            item.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                              item.status === 'published' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                                'bg-slate-500'
                          )} />
                          <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className={cn(
                            'px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-[4px] border-none',
                            item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.status === 'published' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-slate-500/10 text-slate-500'
                          )}>
                            {item.status}
                          </Badge>
                          <span className='text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                            {new Date(item.executeAtUtc).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                          <button
                            onClick={() => handleEditLog(item)}
                            className='p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors'
                            title="Edit"
                          >
                            <Settings2 className='h-3.5 w-3.5' />
                          </button>
                          {item.status === 'active' ? (
                            <button
                              onClick={() => handleCancelLog(item.id)}
                              className='p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors'
                              title="Cancel"
                            >
                              <PlusIcon className='h-3.5 w-3.5 rotate-45' />
                            </button>
                          ) : item.status === 'cancelled' ? (
                            <button
                              onClick={() => handleActivateLog(item.id)}
                              className='p-1.5 rounded-md text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors'
                              title="Activate"
                            >
                              <RefreshCcw className='h-3.5 w-3.5' />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className='text-sm font-semibold text-slate-200 mb-3 line-clamp-2 leading-relaxed'>{item.agentPrompt}</p>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                          <Clock className='h-3 w-3' />
                          {timezone}
                        </div>
                        <PlatformStack publications={item.targets.map(t => ({ socialMediaType: t.platform || 'facebook' })) as any} maxDisplay={3} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-20 px-6 text-center gap-4'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]'>
                    <BotIcon className='h-7 w-7 text-slate-600' />
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
      )}

      {pageView === 'create' && (
        <div className='grid grid-cols-1 gap-5 lg:grid-cols-12 items-start'>

          <div className='lg:col-span-8 flex flex-col gap-5'>
            <Card className='flex flex-col rounded-[24px] border-white/5 bg-[#080a12] shadow-none overflow-hidden'>
              <CardHeader className='border-b border-white/5 py-2 px-6 flex flex-row items-center justify-between bg-white/[0.01]'>
                <div className='flex items-center gap-8'>
                  <div className='flex items-center gap-2'>
                    <BotIcon className='h-4 w-4 text-slate-500' />
                    <span className='text-xs font-bold text-white/90 uppercase tracking-widest'>Workflow Intent</span>
                  </div>

                  <div className='hidden sm:flex items-center gap-3'>
                    <div className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-opacity', workflowState === 'idle' ? 'text-white opacity-100' : 'text-slate-500 opacity-60')}>
                      Define <ChevronRight className='h-3 w-3 opacity-30' />
                    </div>
                    <div className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-opacity', workflowState === 'ready' ? 'text-white opacity-100' : 'text-slate-500 opacity-60')}>
                      Review
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='flex-1 p-0 flex flex-col min-h-[280px]'>

                <div className='p-6 px-6 flex-1 flex flex-col'>
                  {workflowState === 'idle' && (
                    <div className='flex flex-col h-full animate-in fade-in duration-300'>
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <div className='relative'>
                            <Textarea
                              placeholder='Describe the event to monitor and the publishing intent...'
                              value={instruction}
                              onChange={(e) => setInstruction(e.target.value.slice(0, MAX_INSTRUCTION_LENGTH))}
                              className='min-h-[140px] rounded-[18px] border-white/10 bg-black/20 focus-visible:ring-[1px] focus:ring-slate-500/50 focus:border-slate-500/50 resize-none p-5 pb-10 text-[15px] text-slate-200 placeholder:text-slate-700 leading-relaxed font-medium'
                            />
                            <div className='absolute bottom-3 right-4 flex items-center gap-3'>
                              <div className='flex items-center gap-1'>
                                <div className='w-20 h-1 bg-white/5 rounded-full overflow-hidden'>
                                  <div
                                    className={cn(
                                      'h-full transition-all duration-300',
                                      instruction.length > MAX_INSTRUCTION_LENGTH * 0.8 ? 'bg-amber-500' : 'bg-blue-500/50'
                                    )}
                                    style={{ width: `${(instruction.length / MAX_INSTRUCTION_LENGTH) * 100}%` }}
                                  />
                                </div>
                              </div>
                              <span className={cn(
                                'text-[10px] font-bold tabular-nums',
                                instruction.length > MAX_INSTRUCTION_LENGTH * 0.8 ? 'text-amber-500' : 'text-slate-500'
                              )}>
                                {instruction.length}/{MAX_INSTRUCTION_LENGTH}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className='mt-5 bg-white/[0.01] border border-white/5 rounded-[20px] p-5 space-y-4 flex-1 relative overflow-hidden'>
                        <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent'></div>
                        <div className='flex items-center justify-between'>
                          <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2'>
                            <Sparkles className='h-3 w-3' /> Autonomous Execution
                          </span>
                          {instruction.trim() ? (
                            <Badge className='bg-blue-500/10 text-blue-400 border-none text-[9px] uppercase tracking-tighter px-2 animate-pulse'>
                              Preparing monitoring strategy...
                            </Badge>
                          ) : (
                            <Badge className='bg-slate-500/10 text-slate-400 border-none text-[9px] uppercase tracking-tighter px-2'>
                              Awaiting Intent
                            </Badge>
                          )}
                        </div>

                        {instruction.trim() ? (
                          <div className='space-y-4 animate-in fade-in duration-500'>
                            <div className='bg-black/20 rounded-[16px] p-5 border border-white/5 space-y-3'>
                              <div className='flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300 font-bold'>
                                <div className='h-5 w-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20'>1</div>
                                Monitoring
                              </div>
                            </div>

                            <div className='bg-black/20 rounded-[16px] p-5 border border-white/5 space-y-3'>
                              <div className='flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300 font-bold'>
                                <div className='h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20'>2</div>
                                Content Generation
                              </div>
                            </div>

                            <div className='bg-black/20 rounded-[16px] p-5 border border-white/5 space-y-3'>
                              <div className='flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300 font-bold'>
                                <div className='h-5 w-5 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20'>3</div>
                                Publishing
                              </div>
                              <div className='ml-7 space-y-1'>
                                <p className='text-xs text-slate-300 font-medium'>Scheduled: <span className='text-white'>{scheduledDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {scheduledTime}</span></p>
                                <p className='text-xs text-slate-500 font-medium'>Timezone: {timezone}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className='flex flex-col items-center justify-center py-12 gap-3 opacity-30'>
                            <BotIcon className='h-8 w-8' />
                            <span className='text-[11px] font-bold uppercase tracking-widest'>Define your intent to see the execution plan</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {workflowState === 'ready' && (
                    <div className='flex flex-col h-full animate-in slide-in-from-right-4 duration-300'>
                      <div className='flex items-start gap-5 mb-6'>
                        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                          <CheckCircle2 className='h-6 w-6' />
                        </div>
                        <div className='space-y-1'>
                          <h3 className='text-lg font-bold text-white tracking-tight'>Ready to Schedule</h3>
                          <p className='text-sm text-slate-400 leading-relaxed'>Please review the details below before creating the schedule.</p>
                        </div>
                      </div>

                      <div className='bg-white/[0.02] border border-white/5 rounded-[24px] p-6 space-y-6 mb-auto'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-8'>
                          <div className='space-y-2'>
                            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2'>
                              <Clock className='h-3.5 w-3.5' /> Execution Time
                            </span>
                            <div className='flex items-center gap-2.5 text-[14px] text-slate-200 font-bold'>
                              {scheduledDate?.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} • {scheduledTime} ({timezone})
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2'>
                              <ArrowRight className='h-3.5 w-3.5' /> Publishing Targets
                            </span>
                            <PlatformStack publications={accounts.filter(a => selectedAccounts.includes(a.id)).map(a => ({ socialMediaType: a.type })) as any} maxDisplay={5} />
                          </div>
                        </div>
                        <div className='pt-6 border-t border-white/5 space-y-3'>
                          <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest block'>Prompt</span>
                          <div className='flex gap-4 text-sm text-slate-200 bg-black/30 p-5 rounded-[16px] border border-white/5'>
                            <FileText className='h-5 w-5 text-slate-500 shrink-0' />
                            <p className='leading-relaxed font-medium'>{instruction}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className='mt-auto p-5 px-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className={cn('h-1.5 w-1.5 rounded-full', workflowState === 'ready' ? 'bg-emerald-500' : 'bg-slate-700')}></div>
                    <span className='text-[11px] font-bold text-slate-500 uppercase tracking-widest'>
                      {workflowState === 'idle' ? 'Waiting for intent definition...' : 'Ready for deployment'}
                    </span>
                  </div>

                  <div className='flex items-center gap-3'>
                    {workflowState === 'ready' && (
                      <Button
                        variant="ghost"
                        onClick={() => setWorkflowState('idle')}
                        className='h-10 px-5 rounded-[12px] text-slate-500 hover:text-white hover:bg-white/5 font-bold text-[11px] uppercase tracking-wider'
                      >
                        Back to Edit
                      </Button>
                    )}

                    {workflowState === 'idle' && (
                      <Button
                        onClick={handleNextStep}
                        className='h-10 px-8 rounded-[12px] bg-white text-black hover:bg-white/90 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-white/5'
                      >
                        Continue <ArrowRight className='ml-2 h-3.5 w-3.5' />
                      </Button>
                    )}

                    {workflowState === 'ready' && (
                      <Button
                        onClick={handleCreateAutomation}
                        className='h-10 px-10 rounded-[12px] bg-white text-black hover:bg-white/90 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-white/10'
                      >
                        {editingScheduleId ? 'Update Automation' : 'Create Automation'}
                      </Button>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className='lg:col-span-4 flex flex-col gap-6'>

            <Card className='rounded-[24px] border-white/5 bg-[#080a12] shadow-none'>
              <CardHeader className='py-2 px-6 border-b border-white/5'>
                <div className='flex items-center gap-2 text-slate-300'>
                  <Settings2 className='h-4 w-4' />
                  <span className='text-[10px] font-bold uppercase tracking-widest'>Configuration Panel</span>
                </div>
              </CardHeader>
              <CardContent className='px-4 pb-4 pt-2 space-y-4'>
                <div className='space-y-3'>
                  <label className='text-[10px] font-bold text-slate-300 uppercase tracking-widest'>Target Accounts</label>
                  <div className='space-y-1.5'>
                    {isLoading ? (
                      <div className='py-8 flex flex-col items-center justify-center gap-3 opacity-50'>
                        <Loader2 className='h-5 w-5 animate-spin text-slate-500' />
                        <span className='text-[10px] font-bold uppercase tracking-widest text-slate-600'>Loading accounts...</span>
                      </div>
                    ) : accounts.length > 0 ? (
                      accounts.map(acc => {
                        const isSelected = selectedAccounts.includes(acc.id);
                        const isPrimary = primaryAccountId === acc.id;
                        const displayName = acc.profile?.displayName || acc.profile?.username || 'Unknown Account';
                        return (
                          <div
                            key={acc.id}
                            onClick={() => {
                              if (isSelected) {
                                const next = selectedAccounts.filter(id => id !== acc.id);
                                setSelectedAccounts(next);
                                // Improvement 2: Auto-assign new Primary if current is deselected
                                if (isPrimary) {
                                  setPrimaryAccountId(next.length > 0 ? next[0] : null);
                                }
                              } else {
                                const next = [...selectedAccounts, acc.id];
                                setSelectedAccounts(next);
                                // If this is the only account, make it primary
                                if (next.length === 1) {
                                  setPrimaryAccountId(acc.id);
                                }
                              }
                            }}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-[16px] transition-all cursor-pointer group border relative overflow-hidden',
                              isSelected
                                ? 'bg-white/[0.06] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
                                : 'bg-transparent border-white/[0.02] hover:bg-white/[0.02] hover:border-white/10'
                            )}
                          >
                            <div className='flex items-center gap-3'>
                              <div className='relative'>
                                <Avatar className={cn('h-9 w-9 rounded-[12px] border opacity-100 shadow-sm transition-all', isSelected ? 'border-white/20' : 'border-white/5')}>
                                  <AvatarImage src={acc.profile?.profilePictureUrl || ''} />
                                  <AvatarFallback className={cn('text-[11px] font-extrabold', getPlatformStyle(acc.type).bg, getPlatformStyle(acc.type).color)}>
                                    {acc.type[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {isSelected && (
                                  <div className={cn('absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#080a12] z-20', getPlatformStyle(acc.type).solidBg)} />
                                )}
                              </div>
                              <div className='flex flex-col'>
                                <div className='flex items-center gap-2'>
                                  <span className={cn('text-xs font-bold transition-colors', isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
                                    {displayName}
                                  </span>
                                  {isPrimary && (
                                    <Badge className='h-4 px-1.5 bg-amber-500/10 text-amber-500 text-[8px] font-black border-none rounded-sm uppercase tracking-tighter'>Primary</Badge>
                                  )}
                                </div>
                                <span className={cn('text-[9px] font-bold uppercase tracking-widest transition-colors', getPlatformStyle(acc.type).color)}>
                                  {acc.type}
                                </span>
                              </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              {isSelected && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPrimaryAccountId(isPrimary ? null : acc.id);
                                  }}
                                  className={cn('p-1.5 rounded-md transition-colors', isPrimary ? 'text-amber-500 bg-amber-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5')}
                                >
                                  <Star className={cn('h-3.5 w-3.5', isPrimary && 'fill-current')} />
                                </button>
                              )}
                              {isSelected && <CheckCircle2 className='h-4 w-4 text-slate-200' />}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className='py-8 px-4 text-center border border-dashed border-white/5 rounded-2xl opacity-40'>
                        <span className='text-[10px] font-bold uppercase tracking-widest text-slate-500'>No accounts linked</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='text-[10px] font-bold text-slate-300 uppercase tracking-widest'>Execution Schedule</label>
                    <div className='flex items-center gap-1 text-[10px] text-slate-500 font-bold'>
                      <Globe className='h-3 w-3' /> Local
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <DatePickerInput
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
                      className='rounded-[14px] border-white/10 bg-white/[0.02] text-sm h-11 text-slate-200 font-medium'
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className='w-full relative pl-10 pr-4 h-11 rounded-[14px] border border-white/10 bg-white/[0.02] text-sm text-slate-200 font-medium outline-none focus:ring-1 focus:ring-white/20 flex items-center justify-between hover:bg-white/[0.04] transition-colors'>
                          <Clock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500' />
                          <span>{scheduledTime}</span>
                          <PlusIcon className='h-3 w-3 rotate-45 opacity-30' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='w-[140px] max-h-[300px] overflow-y-auto bg-[#0c0e1a] border-white/10 rounded-[16px] p-1 custom-scrollbar'>
                        {availableTimes.length > 0 ? (
                          availableTimes.map((time) => (
                            <DropdownMenuItem
                              key={time}
                              onClick={() => setScheduledTime(time)}
                              className={cn(
                                'text-[13px] font-medium py-2 px-3 rounded-[10px] cursor-pointer transition-colors',
                                scheduledTime === time ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                              )}
                            >
                              {time}
                              {scheduledTime === time && <Check className='ml-auto h-3 w-3' />}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className='py-4 px-2 text-center'>
                            <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>No valid times left today</span>
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className='space-y-3'>
                  <label className='text-[10px] font-bold text-slate-300 uppercase tracking-widest'>Target Timezone</label>
                  <div className='relative'>
                    <Globe className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500' />
                    <input
                      type="text"
                      value={timezone}
                      readOnly
                      className='w-full pl-10 pr-4 h-11 rounded-[14px] border border-white/10 bg-white/[0.02] text-sm text-slate-400 font-medium outline-none cursor-default'
                    />
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400'>
                      Content Limit
                    </label>

                    <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 transition-all hover:border-white/15 focus-within:border-white/20 focus-within:bg-white/[0.06]'>
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
                        className='bg-transparent text-center text-[12px] font-extrabold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all'
                      />

                      <span className='text-[9px] font-black uppercase tracking-widest text-slate-500 select-none'>
                        chars
                      </span>
                    </div>
                  </div>

                  <div className='relative pt-1'>
                    <input
                      type='range'
                      min='50'
                      max='2000'
                      value={maxLength > 2000 ? 2000 : maxLength}
                      onChange={(e) => setMaxLength(parseInt(e.target.value))}
                      className='h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 transition-all hover:bg-white/15'
                    />

                  </div>

                  <div className='flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-600 font-bold'>
                    <span>50</span>
                    <span>2000+</span>
                  </div>
                </div>
              </CardContent>
            </Card>



          </div>

        </div>
      )}

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
    </div>
  );
}

export default AiContentAutomation;
