import { useState, useMemo } from 'react';
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
  Star
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

type WorkflowState = 'idle' | 'ready';

const MOCK_ACCOUNTS = [
  { id: '1', platform: 'facebook', name: 'MeAI Facebook Page', avatar: '' },
  { id: '2', platform: 'instagram', name: 'MeAI Official IG', avatar: '' },
  { id: '3', platform: 'tiktok', name: 'MeAI TikTok', avatar: '' },
];

const MOCK_SCHEDULES = [
  {
    id: 's1',
    prompt: 'Summarize today\'s AI news, professional tone',
    executeAtUtc: '2026-05-08T11:00:00Z',
    status: 'active',
    targets: [{ platform: 'facebook', isPrimary: true }, { platform: 'instagram', isPrimary: false }]
  },
  {
    id: 's2',
    prompt: 'Weekly social recap of tech trends',
    executeAtUtc: '2026-05-10T15:00:00Z',
    status: 'cancelled',
    targets: [{ platform: 'tiktok', isPrimary: true }]
  }
];

const PRESETS = [
  { id: 'p1', label: 'Track the outcome of Bayern vs PSG tonight. Create an analytical recap after the match.', icon: <Zap className='h-3 w-3' /> },
  { id: 'p2', label: 'Monitor Apple Event. Generate a summary of new product launches.', icon: <PlusIcon className='h-3 w-3' /> },
  { id: 'p3', label: 'Track weekly AI news and publish a recap.', icon: <LayoutTemplate className='h-3 w-3' /> }
];

function AiContentAutomation() {
  const localTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [instruction, setInstruction] = useState("Monitor tonight's Bayern vs PSG match. Generate a post-match summary and publish at 6:05 AM tomorrow.");

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
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(['1']);
  const [primaryAccountId, setPrimaryAccountId] = useState<string | null>('1');
  const [maxLength, setMaxLength] = useState(280);
  const [showAccountError, setShowAccountError] = useState(false);

  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const availableTimes = useMemo(() => {
    const times: string[] = [];
    const now = new Date();
    const minTimeMs = now.getTime() + 5 * 60 * 1000;

    const isTodayOrPast = scheduledDate ? (
      scheduledDate.getFullYear() <= now.getFullYear() &&
      scheduledDate.getMonth() <= now.getMonth() &&
      scheduledDate.getDate() <= now.getDate()
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
        description: 'Automation must be scheduled at least 5 minutes from now to ensure successful deployment.'
      });
      return;
    }

    setWorkflowState('ready');
  };

  const handleEditLog = (item: any) => {
    setEditingScheduleId(item.id);
    setInstruction(item.prompt);
    const execDate = new Date(item.executeAtUtc);
    setScheduledDate(execDate);
    setScheduledTime(`${execDate.getHours().toString().padStart(2, '0')}:${execDate.getMinutes().toString().padStart(2, '0')}`);
    setSelectedAccounts(item.targets.map((t: any) => t.socialMediaId || t.platform));
    setPrimaryAccountId(item.targets.find((t: any) => t.isPrimary)?.socialMediaId || null);
    setWorkflowState('idle');
    toast.info('Editing automation workflow', {
      description: 'You can now modify the parameters and save the changes.'
    });
  };

  const handleCancelLog = (id: string) => {
    toast.promise(Promise.resolve(), {
      loading: 'Cancelling automation...',
      success: 'Automation cancelled successfully',
      error: 'Failed to cancel automation'
    });
  };

  const handleActivateLog = (id: string) => {
    toast.promise(Promise.resolve(), {
      loading: 'Activating automation...',
      success: 'Automation activated successfully',
      error: 'Failed to activate automation'
    });
  };

  const handleCreateAutomation = () => {
    const execDate = getCombinedExecutionDate();

    const payload = {
      agentPrompt: instruction,
      executeAtUtc: execDate ? execDate.toISOString() : new Date().toISOString(),
      timezone,
      maxContentLength: maxLength,
      targets: selectedAccounts.map(id => ({
        socialMediaId: id,
        isPrimary: id === primaryAccountId
      }))
    };

    if (editingScheduleId) {
      console.log('Updating schedule:', editingScheduleId, payload);
      toast.success('Automation updated successfully!');
    } else {
      console.log('Creating schedule:', payload);
      toast.success('Automation created successfully!');
    }

    setWorkflowState('idle');
    setInstruction('');
    setEditingScheduleId(null);
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
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
          >
            <RefreshCcw className="h-4 w-4" />
            Sync Now
          </Button>
          <Button
            variant='outline'
            size={'lg'}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
          >
            <PlusIcon className="h-4 w-4" />
            New Request
          </Button>
        </div>
      </section>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>

        <div className='lg:col-span-8 flex flex-col gap-6'>
          <Card className='flex-1 flex flex-col rounded-[24px] border-white/5 bg-[#080a12] shadow-none overflow-hidden'>
            <CardHeader className='border-b border-white/5 py-5 px-8 flex flex-row items-center justify-between bg-white/[0.01]'>
              <div className='flex items-center gap-8'>
                <div className='flex items-center gap-2'>
                  <ShieldCheck className='h-4 w-4 text-slate-500' />
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

            <CardContent className='flex-1 p-0 flex flex-col min-h-[500px]'>

              <div className='p-6 px-8 bg-white/[0.01] border-b border-white/5 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex flex-col'>
                    <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>Autonomous Workflow</span>
                    <span className='text-sm text-slate-200 font-semibold'>{workflowState === 'idle' ? 'Define monitoring logic & trigger behavior...' : 'Autonomous task ready for deployment'}</span>
                  </div>
                </div>
                <Badge className={cn('rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter', status.bg, status.color, 'border-none shadow-none')}>
                  {workflowState}
                </Badge>
              </div>

              <div className='p-8 px-10 flex-1 flex flex-col'>
                {workflowState === 'idle' && (
                  <div className='flex flex-col h-full animate-in fade-in duration-300'>
                    <div className='space-y-6'>
                      <div className='space-y-2'>
                        <label className='text-[11px] uppercase tracking-widest text-slate-500 font-bold'>Workflow Intent</label>
                        <Textarea
                          placeholder='Describe the event to monitor and the publishing intent...'
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                          className='min-h-[140px] rounded-[18px] border-white/10 bg-black/20 focus:ring-1 focus:ring-slate-500/50 focus:border-slate-500/50 resize-none p-5 text-[15px] text-slate-200 placeholder:text-slate-700 leading-relaxed font-medium'
                        />
                      </div>

                      <div className='space-y-3'>
                        <span className='text-[10px] uppercase tracking-widest text-slate-600 font-bold flex items-center gap-2'>
                          <LayoutTemplate className='h-3 w-3' /> Workflow Presets
                        </span>
                        <div className='flex gap-2 flex-wrap'>
                          {PRESETS.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setInstruction(t.label)}
                              className='flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all font-medium'
                            >
                              {t.icon} {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Autonomous Execution Block */}
                    <div className='mt-8 bg-white/[0.01] border border-white/5 rounded-[20px] p-6 space-y-6 flex-1 relative overflow-hidden'>
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
                          {/* 1. Monitoring */}
                          <div className='bg-black/20 rounded-[16px] p-5 border border-white/5 space-y-3'>
                            <div className='flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300 font-bold'>
                              <div className='h-5 w-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20'>1</div>
                              Monitoring
                            </div>
                            <div className='ml-7'>
                              <p className='text-xs text-slate-300 font-medium mb-1.5'>AI will track:</p>
                              <ul className='text-xs text-slate-400 font-medium space-y-1.5 list-disc pl-4 marker:text-slate-600'>
                                <li>Match outcome</li>
                                <li>Public reactions</li>
                                <li>Trending discussions</li>
                              </ul>
                            </div>
                          </div>

                          {/* 2. Generation */}
                          <div className='bg-black/20 rounded-[16px] p-5 border border-white/5 space-y-3'>
                            <div className='flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300 font-bold'>
                              <div className='h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20'>2</div>
                              Content Generation
                            </div>
                            <div className='ml-7'>
                              <p className='text-xs text-slate-300 font-medium mb-1.5'>AI will generate:</p>
                              <ul className='text-xs text-slate-400 font-medium space-y-1.5 list-disc pl-4 marker:text-slate-600'>
                                <li>Match summary</li>
                                <li>Key highlights</li>
                                <li>Analytical recap</li>
                              </ul>
                            </div>
                          </div>

                          {/* 3. Publishing */}
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
                    <div className='flex items-start gap-5 mb-10'>
                      <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                        <CheckCircle2 className='h-6 w-6' />
                      </div>
                      <div className='space-y-1'>
                        <h3 className='text-lg font-bold text-white tracking-tight'>Ready to Schedule</h3>
                        <p className='text-sm text-slate-400 leading-relaxed'>Please review the details below before creating the schedule.</p>
                      </div>
                    </div>

                    <div className='bg-white/[0.02] border border-white/5 rounded-[24px] p-8 space-y-8 mb-auto'>
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
                          <PlatformStack publications={MOCK_ACCOUNTS.filter(a => selectedAccounts.includes(a.id)).map(a => ({ socialMediaType: a.platform })) as any} maxDisplay={5} />
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

              <div className='mt-auto p-6 px-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between'>
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
            <CardHeader className='py-5 px-6 border-b border-white/5'>
              <div className='flex items-center gap-2 text-slate-300'>
                <Settings2 className='h-4 w-4' />
                <span className='text-[10px] font-bold uppercase tracking-widest'>Configuration Panel</span>
              </div>
            </CardHeader>
            <CardContent className='p-6 space-y-8'>
              <div className='space-y-4'>
                <label className='text-[10px] font-bold text-slate-300 uppercase tracking-widest'>Target Accounts</label>
                <div className='space-y-1.5'>
                  {MOCK_ACCOUNTS.map(acc => {
                    const isSelected = selectedAccounts.includes(acc.id);
                    const isPrimary = primaryAccountId === acc.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAccounts(selectedAccounts.filter(id => id !== acc.id));
                            if (isPrimary) setPrimaryAccountId(null);
                          } else {
                            setSelectedAccounts([...selectedAccounts, acc.id]);
                            if (selectedAccounts.length === 0) setPrimaryAccountId(acc.id);
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-[16px] transition-all cursor-pointer group border relative overflow-hidden',
                          isSelected
                            ? 'bg-white/[0.06] border-white/20'
                            : 'bg-transparent border-white/[0.02] hover:bg-white/[0.02] hover:border-white/10'
                        )}
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-9 w-9 rounded-[12px] border border-white/5 opacity-100 shadow-sm'>
                            <AvatarFallback className='bg-white/[0.05] text-slate-300 text-[11px] font-bold'>{acc.platform[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className='flex flex-col'>
                            <div className='flex items-center gap-2'>
                              <span className={cn('text-xs font-bold transition-colors', isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
                                {acc.name}
                              </span>
                              {isPrimary && (
                                <Badge className='h-4 px-1.5 bg-amber-500/10 text-amber-500 text-[8px] font-black border-none rounded-sm uppercase tracking-tighter'>Primary</Badge>
                              )}
                            </div>
                            <span className='text-[9px] text-slate-500 font-bold uppercase tracking-widest'>{acc.platform}</span>
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
                  })}
                </div>
              </div>

              <div className='space-y-4 pt-2'>
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

              <div className='space-y-4 pt-2'>
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

              <div className='space-y-4 pt-2'>
                <div className='flex justify-between items-center'>
                  <label className='text-[10px] font-bold text-slate-300 uppercase tracking-widest'>Content Limit</label>
                  <span className='text-[11px] text-slate-100 font-bold'>{maxLength} chars</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value))}
                  className='w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white transition-all hover:bg-white/20'
                />
              </div>
            </CardContent>
          </Card>

          <Card className='rounded-[24px] border-white/5 bg-[#080a12] shadow-none flex-1 overflow-hidden flex flex-col'>
            <CardHeader className='py-5 px-6 border-b border-white/5 bg-white/[0.01]'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-slate-300'>
                  <ListTodo className='h-4 w-4' />
                  <span className='text-[10px] font-bold uppercase tracking-widest'>System Logs</span>
                </div>
                <ArrowRight className='h-3.5 w-3.5 text-slate-600' />
              </div>
            </CardHeader>
            <CardContent className='p-0 overflow-y-auto flex-1 custom-scrollbar max-h-[350px]'>
              {MOCK_SCHEDULES.length > 0 ? (
                <div className='divide-y divide-white/5'>
                  {MOCK_SCHEDULES.map(item => (
                    <div key={item.id} className={cn(
                      'p-6 hover:bg-white/[0.02] transition-all group relative',
                      editingScheduleId === item.id && 'bg-white/[0.04] border-l-2 border-white'
                    )}>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className={cn(
                            'px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-[4px] border-none',
                            item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                          )}>
                            {item.status}
                          </Badge>
                          {editingScheduleId === item.id && (
                            <Badge className='px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-[4px] bg-white text-black border-none'>
                              Editing
                            </Badge>
                          )}
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
                          ) : (
                            <button
                              onClick={() => handleActivateLog(item.id)}
                              className='p-1.5 rounded-md text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors'
                              title="Activate"
                            >
                              <RefreshCcw className='h-3.5 w-3.5' />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className='text-xs font-semibold text-slate-200 mb-4 line-clamp-2 leading-relaxed'>{item.prompt}</p>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                          <Clock className='h-3 w-3' />
                          {new Date(item.executeAtUtc).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <PlatformStack publications={item.targets.map(t => ({ socialMediaType: t.platform })) as any} maxDisplay={3} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-16 px-6 text-center opacity-30'>
                  <AlertCircle className='h-8 w-8 mb-3' />
                  <p className='text-xs font-medium uppercase tracking-widest'>No records found</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

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
