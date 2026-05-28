import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  CreditCard,
  Pencil,
  Trash2,
  CheckCircle,
  Coins,
  Clock3,
  HardDrive,
  Share2,
  Plus,
  Loader2,
  XCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast, Toaster } from 'sonner';
import { type LoaderFunctionArgs } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireUser, hasRole } from '@/services/server/session.server';
import {
  fetchAdminSubscriptions,
  createAdminSubscription,
  updateAdminSubscription,
  activateAdminSubscription,
  deactivateAdminSubscription,
  deleteAdminSubscription,
  type CreateAdminSubscriptionPayload,
  type UpdateAdminSubscriptionPayload
} from '@/services/client/admin.client';
import type { Subscription } from '@/models/subscription.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) throw new Response('Forbidden', { status: 403 });

  return null;
}

type SubscriptionFormState = {
  name: string;
  cost: number | '';
  durationMonths: number | '';
  meAiCoin: number | '';
  stripeProductId: string;
  stripePriceId: string;
  limits: {
    number_of_social_accounts: number | '';
    rate_limit_for_content_creation: number | '';
    number_of_workspaces: number | null | '';
    max_pages_per_social_account: number | '';
    storage_quota_bytes: number | '';
    max_upload_file_bytes: number | '';
    retention_days_after_delete: number | '';
  };
};

type NumberField = 'cost' | 'durationMonths' | 'meAiCoin';
type LimitField = keyof SubscriptionFormState['limits'];

const DEFAULT_FORM: SubscriptionFormState = {
  name: '',
  cost: 0,
  durationMonths: 1,
  meAiCoin: 0,
  stripeProductId: '',
  stripePriceId: '',
  limits: {
    number_of_social_accounts: 1,
    rate_limit_for_content_creation: 0,
    number_of_workspaces: null,
    max_pages_per_social_account: 1,
    storage_quota_bytes: 0,
    max_upload_file_bytes: 0,
    retention_days_after_delete: 30
  }
};

const normalizeOptionalStripeId = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = BYTES_PER_MB * 1024;

const formatCompactNumber = (value: number | null | undefined) => new Intl.NumberFormat('en-US').format(value ?? 0);

const formatBytes = (value: number | null | undefined) => {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const bytesToUnitValue = (value: number | '', unitBytes: number) => {
  if (value === '') return '';
  return Number((Number(value || 0) / unitBytes).toFixed(2));
};

const toPlanForm = (plan: Subscription): SubscriptionFormState => ({
  name: plan.name,
  cost: plan.cost ?? 0,
  durationMonths: plan.durationMonths ?? 1,
  meAiCoin: plan.meAiCoin ?? 0,
  stripeProductId: plan.stripeProductId || '',
  stripePriceId: plan.stripePriceId || '',
  limits: {
    number_of_social_accounts: plan.limits?.number_of_social_accounts ?? 1,
    rate_limit_for_content_creation: plan.limits?.rate_limit_for_content_creation ?? 0,
    number_of_workspaces: plan.limits?.number_of_workspaces ?? null,
    max_pages_per_social_account: plan.limits?.max_pages_per_social_account ?? 0,
    storage_quota_bytes: plan.limits?.storage_quota_bytes ?? 0,
    max_upload_file_bytes: plan.limits?.max_upload_file_bytes ?? 0,
    retention_days_after_delete: plan.limits?.retention_days_after_delete ?? 30
  }
});

const toSubscriptionPayload = (formState: SubscriptionFormState): CreateAdminSubscriptionPayload => ({
  ...formState,
  cost: Number(formState.cost || 0),
  durationMonths: Number(formState.durationMonths || 1),
  meAiCoin: Number(formState.meAiCoin || 0),
  stripeProductId: normalizeOptionalStripeId(formState.stripeProductId),
  stripePriceId: normalizeOptionalStripeId(formState.stripePriceId),
  limits: {
    number_of_social_accounts: Number(formState.limits.number_of_social_accounts || 1),
    rate_limit_for_content_creation: Number(formState.limits.rate_limit_for_content_creation || 0),
    number_of_workspaces: null,
    max_pages_per_social_account: Number(formState.limits.max_pages_per_social_account || 0),
    storage_quota_bytes: Number(formState.limits.storage_quota_bytes || 0),
    max_upload_file_bytes: Number(formState.limits.max_upload_file_bytes || 0),
    retention_days_after_delete: Number(formState.limits.retention_days_after_delete || 30)
  }
});

const FormFields = ({
  formState,
  setFormState
}: {
  formState: SubscriptionFormState;
  setFormState: Dispatch<SetStateAction<SubscriptionFormState>>;
}) => {
  const parseNumberInput = (value: string, min = 0) => {
    if (value === '') {
      return '';
    }

    const num = Number(value);
    if (Number.isNaN(num)) return null;

    return Math.max(min, num);
  };

  const handleNumberChange = (field: NumberField, value: string, min = 0) => {
    const parsed = parseNumberInput(value, min);
    if (parsed === null) return;

    setFormState((current) => ({ ...current, [field]: parsed }));
  };

  const handleLimitNumberChange = (field: LimitField, value: string, min = 0) => {
    const parsed = parseNumberInput(value, min);
    if (parsed === null) return;

    setFormState((current) => ({
      ...current,
      limits: { ...current.limits, [field]: parsed }
    }));
  };

  const handleStorageLimitChange = (
    field: 'storage_quota_bytes' | 'max_upload_file_bytes',
    value: string,
    unitBytes: number
  ) => {
    const parsed = parseNumberInput(value);
    if (parsed === null) return;

    setFormState((current) => ({
      ...current,
      limits: {
        ...current.limits,
        [field]: parsed === '' ? '' : Math.round(parsed * unitBytes)
      }
    }));
  };

  return (
    <Tabs defaultValue='general' className='w-full'>
      <TabsList className='grid w-full grid-cols-3 border border-violet-300/20 bg-linear-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 p-1'>
        <TabsTrigger
          value='general'
          className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
        >
          General
        </TabsTrigger>
        <TabsTrigger
          value='limits'
          className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
        >
          Usage
        </TabsTrigger>
        <TabsTrigger
          value='storage'
          className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
        >
          Storage
        </TabsTrigger>
      </TabsList>
      <TabsContent value='general' className='space-y-4 py-4'>
        <div>
          <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Plan Name</label>
          <Input
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            placeholder='e.g. Master Plan'
            className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
          />
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Cost (VND)</label>
            <Input
              type='number'
              min='0'
              value={formState.cost}
              onChange={(e) => handleNumberChange('cost', e.target.value)}
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Duration (Months)</label>
            <Input
              type='number'
              min='1'
              value={formState.durationMonths}
              onChange={(e) => handleNumberChange('durationMonths', e.target.value, 1)}
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
        </div>
        <div>
          <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>MeAI Coins</label>
          <Input
            type='number'
            min='0'
            value={formState.meAiCoin}
            onChange={(e) => handleNumberChange('meAiCoin', e.target.value)}
            className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
          />
        </div>
      </TabsContent>
      <TabsContent value='limits' className='space-y-4 py-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Social Accounts</label>
            <Input
              type='number'
              min='1'
              value={formState.limits.number_of_social_accounts}
              onChange={(e) => handleLimitNumberChange('number_of_social_accounts', e.target.value, 1)}
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Pages per Social</label>
            <Input
              type='number'
              min='0'
              value={formState.limits.max_pages_per_social_account}
              onChange={(e) => handleLimitNumberChange('max_pages_per_social_account', e.target.value)}
              placeholder='Unlimited (0/Empty)'
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value='storage' className='space-y-4 py-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Storage Quota (GB)</label>
            <Input
              type='number'
              min='0'
              step='0.1'
              value={bytesToUnitValue(formState.limits.storage_quota_bytes, BYTES_PER_GB)}
              onChange={(e) => handleStorageLimitChange('storage_quota_bytes', e.target.value, BYTES_PER_GB)}
              placeholder='0'
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Max Upload/File (MB)</label>
            <Input
              type='number'
              min='0'
              step='1'
              value={bytesToUnitValue(formState.limits.max_upload_file_bytes, BYTES_PER_MB)}
              onChange={(e) => handleStorageLimitChange('max_upload_file_bytes', e.target.value, BYTES_PER_MB)}
              placeholder='0'
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Retention After Delete (Days)</label>
            <Input
              type='number'
              min='0'
              value={formState.limits.retention_days_after_delete}
              onChange={(e) => handleLimitNumberChange('retention_days_after_delete', e.target.value)}
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

const StatTile = ({ icon, label, value }: { icon: ReactNode; label: string; value: number }) => (
  <div className='rounded-xl border border-violet-500/10 bg-[#13131e] p-5 shadow-sm'>
    <div className='mb-4 flex items-center justify-between gap-3'>
      <p className='text-[12px] font-medium uppercase tracking-[0.12em] text-slate-500'>{label}</p>
      <div className='flex size-9 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-400'>
        {icon}
      </div>
    </div>
    <p className='text-3xl font-semibold tracking-tight text-white'>{value}</p>
  </div>
);

const PlanFeature = ({ icon, label, detail }: { icon: ReactNode; label: string; detail: string }) => (
  <div className='flex min-w-0 items-start gap-3 rounded-lg border border-violet-500/10 bg-violet-500/[0.035] px-3 py-2.5'>
    <div className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-400'>
      {icon}
    </div>
    <div className='min-w-0'>
      <p className='truncate text-[13px] font-medium text-slate-200'>{label}</p>
      <p className='truncate text-[11px] text-slate-500'>{detail}</p>
    </div>
  </div>
);

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();

  const { data: subsData, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => fetchAdminSubscriptions()
  });

  const plans = subsData?.value ?? [];
  const loadError = subsData?.error?.description;

  const createMutation = useMutation({
    mutationFn: (data: CreateAdminSubscriptionPayload) => createAdminSubscription(data),
    onSuccess: (res: any) => {
      if (res.isSuccess) {
        setShowCreate(false);
        setCreateForm(DEFAULT_FORM);
        toast.success('Plan created successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to create plan');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create plan')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminSubscriptionPayload }) =>
      updateAdminSubscription(id, data),
    onSuccess: (res: any) => {
      if (res.isSuccess) {
        setEditTarget(null);
        toast.success('Plan updated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to update plan');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update plan')
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminSubscription(id),
    onSuccess: (res: any) => {
      if (res.isSuccess) {
        toast.success('Plan deactivated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to deactivate plan');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to deactivate plan')
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateAdminSubscription(id),
    onSuccess: (res: any) => {
      if (res.isSuccess) {
        toast.success('Plan activated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to activate plan');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to activate plan')
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminSubscription(id),
    onSuccess: (res: any) => {
      if (res.isSuccess) {
        setHardDeleteTarget(null);
        toast.success('Plan deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to delete plan');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete plan')
  });

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending ||
    activateMutation.isPending ||
    hardDeleteMutation.isPending;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_FORM);

  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);

  const [hardDeleteTarget, setHardDeleteTarget] = useState<Subscription | null>(null);

  const isPlanActive = (p: Subscription) => p.isActive !== false && !p.isDeleted && !p.deletedAt;

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => isPlanActive(p)).length;
  const inactivePlans = totalPlans - activePlans;

  const validateForm = (formState: SubscriptionFormState) => {
    if (!formState.name.trim()) {
      toast.error('Name is required');
      return false;
    }

    const storageQuotaBytes = Number(formState.limits.storage_quota_bytes || 0);
    const maxUploadFileBytes = Number(formState.limits.max_upload_file_bytes || 0);

    if (storageQuotaBytes > 0 && maxUploadFileBytes > storageQuotaBytes) {
      toast.error('Max upload/file cannot exceed storage quota');
      return false;
    }

    return true;
  };

  const submitCreate = () => {
    if (!validateForm(createForm)) return;
    createMutation.mutate(toSubscriptionPayload(createForm));
  };

  const submitEdit = () => {
    if (!editTarget || !validateForm(editForm)) return;
    updateMutation.mutate({ id: editTarget.id, data: toSubscriptionPayload(editForm) });
  };

  const togglePlanActive = (plan: Subscription) => {
    if (isSubmitting) return;
    if (isPlanActive(plan)) {
      deactivateMutation.mutate(plan.id);
      return;
    }

    activateMutation.mutate(plan.id);
  };

  return (
    <>
      <Toaster
        position='top-right'
        theme='dark'
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          classNames: {
            toast: 'border border-white/[0.08] backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]',
            title: 'text-[13px] font-medium',
            description: 'text-[12px]',
            success: 'bg-emerald-950/90 border-emerald-500/20 text-emerald-300',
            error: 'bg-red-950/90 border-red-500/20 text-red-300',
            info: 'bg-[rgba(19,19,30,0.95)] text-white'
          },
          style: { borderRadius: '0.75rem', padding: '12px 16px', gap: '10px' }
        }}
      />

      {isLoading ? (
        <div className='flex h-[50vh] flex-col items-center justify-center gap-3'>
          <Loader2 className='size-8 animate-spin text-violet-500' />
          <p className='text-sm text-slate-400'>Loading subscriptions...</p>
        </div>
      ) : (
        <>
          {loadError && (
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400'>
              {loadError}
            </div>
          )}

          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <h1 className='text-xl font-semibold tracking-tight text-white'>Manage Subscriptions</h1>
                <p className='mt-1 text-[13px] text-slate-500'>
                  Maintain plan pricing, allocation limits, and storage policy.
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowCreate(true);
                  setCreateForm(DEFAULT_FORM);
                }}
                className='h-9 w-fit bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
              >
                <Plus className='mr-2 size-4' /> Add New Plan
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
              <StatTile icon={<CreditCard className='size-4' />} label='Total Plans' value={totalPlans} />
              <StatTile icon={<CheckCircle className='size-4' />} label='Active Plans' value={activePlans} />
              <StatTile icon={<XCircleIcon className='size-4' />} label='Inactive Plans' value={inactivePlans} />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {plans.map((plan) => {
                const active = isPlanActive(plan);
                const pagesLimit = plan.limits?.max_pages_per_social_account
                  ? `${plan.limits.max_pages_per_social_account} pages/account`
                  : 'Unlimited pages';

                return (
                  <div
                    key={plan.id}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e] transition-all hover:border-violet-500/30 hover:shadow-[0_8px_30px_-12px_rgba(124,58,237,0.3)] ${!active ? 'opacity-70 saturate-75' : ''}`}
                  >
                    <div className='flex items-start justify-between gap-3 border-b border-white/[0.06] bg-[#1a1a24] p-5'>
                      <div className='min-w-0'>
                        <h3 className='truncate text-lg font-semibold text-white'>{plan.name}</h3>
                        <p className='mt-1 text-[12px] text-slate-500'>
                          {plan.durationMonths === 1 ? 'Monthly billing' : `${plan.durationMonths}-month cycle`}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlanActive(plan);
                        }}
                        role='switch'
                        aria-checked={active}
                        disabled={isSubmitting}
                        title={active ? 'Deactivate plan' : 'Activate plan'}
                        className={`inline-flex h-8 w-14 shrink-0 items-center rounded-full border px-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/35 disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? 'justify-end border-violet-400/25 bg-violet-500/20 text-violet-100 hover:bg-violet-500/25'
                            : 'justify-start border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.07]'
                        }`}
                      >
                        <span className='sr-only'>{active ? 'Deactivate plan' : 'Activate plan'}</span>
                        <span
                          aria-hidden='true'
                          className={`block h-6 w-6 rounded-full border shadow-sm transition-colors ${
                            active
                              ? 'border-violet-300/40 bg-violet-300'
                              : 'border-white/15 bg-slate-700'
                          }`}
                        />
                      </button>
                    </div>
                    <div className='p-5 pb-2'>
                      <div className='flex items-baseline gap-1'>
                        <span className='text-3xl font-semibold tracking-tight text-white'>
                          {formatCurrency(plan.cost)}
                        </span>
                        <span className='text-[13px] font-medium text-slate-500'>
                          / {plan.durationMonths === 1 ? 'month' : `${plan.durationMonths} months`}
                        </span>
                      </div>
                    </div>
                    <div className='flex-1 px-5 pb-5'>
                      <div className='grid grid-cols-1 gap-2'>
                        <PlanFeature
                          icon={<Coins className='size-3.5' />}
                          label={`${formatCompactNumber(plan.meAiCoin)} MeAI Coins`}
                          detail='Monthly allocation'
                        />
                        <PlanFeature
                          icon={<Share2 className='size-3.5' />}
                          label={`${plan.limits?.number_of_social_accounts ?? 1} Social Accounts`}
                          detail={pagesLimit}
                        />
                        <PlanFeature
                          icon={<HardDrive className='size-3.5' />}
                          label={`${formatBytes(plan.limits?.storage_quota_bytes)} Storage`}
                          detail={`${formatBytes(plan.limits?.max_upload_file_bytes)} max upload/file`}
                        />
                        <PlanFeature
                          icon={<Clock3 className='size-3.5' />}
                          label={`${plan.limits?.retention_days_after_delete ?? 30} days retention`}
                          detail='After resource deletion'
                        />
                      </div>
                    </div>
                    <div className='mt-auto flex items-center justify-between border-t border-white/[0.06] bg-[#1a1a24] p-4'>
                      <button
                        type='button'
                        title='Edit Plan'
                        onClick={() => {
                          setEditForm(toPlanForm(plan));
                          setEditTarget(plan);
                        }}
                        className='flex items-center justify-center gap-2 rounded-lg border border-violet-500/15 bg-violet-500/10 px-4 py-2 text-[13px] font-medium text-violet-300 transition-colors hover:bg-violet-500/15 hover:text-violet-200'
                      >
                        <Pencil className='size-3.5' /> Edit Plan
                      </button>
                      <button
                        type='button'
                        title='Delete Plan'
                        onClick={() => setHardDeleteTarget(plan)}
                        className='flex items-center justify-center gap-2 rounded-lg border border-red-500/10 bg-red-500/[0.04] px-4 py-2 text-[13px] font-medium text-red-300 transition-colors hover:bg-red-500/10'
                      >
                        <Trash2 className='size-3.5' /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto border-violet-500/15 bg-[#10101a]'>
              <DialogHeader>
                <DialogTitle className='text-white'>Create New Plan</DialogTitle>
                <DialogDescription className='text-slate-400'>
                  Define the pricing and allocation limits.
                </DialogDescription>
              </DialogHeader>
              <FormFields formState={createForm} setFormState={setCreateForm} />
              <DialogFooter className='mt-4'>
                <Button
                  variant='ghost'
                  onClick={() => setShowCreate(false)}
                  disabled={isSubmitting}
                  className='text-slate-400 hover:bg-white/[0.06] hover:text-white'
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitCreate}
                  disabled={isSubmitting}
                  className='bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-70'
                >
                  {createMutation.isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null} Create Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
            <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto border-violet-500/15 bg-[#10101a]'>
              <DialogHeader>
                <DialogTitle className='text-white'>Edit Plan</DialogTitle>
                <DialogDescription className='text-slate-400'>
                  Update plan details and allocation limits.
                </DialogDescription>
              </DialogHeader>
              <FormFields formState={editForm} setFormState={setEditForm} />
              <DialogFooter className='mt-4'>
                <Button
                  variant='ghost'
                  onClick={() => setEditTarget(null)}
                  disabled={isSubmitting}
                  className='text-slate-400 hover:bg-white/[0.06] hover:text-white'
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitEdit}
                  disabled={isSubmitting}
                  className='bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-70'
                >
                  {updateMutation.isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null} Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!hardDeleteTarget} onOpenChange={(open) => !open && setHardDeleteTarget(null)}>
            <DialogContent className='max-w-sm border-violet-500/15 bg-[#10101a]'>
              <DialogHeader>
                <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
                  <Trash2 className='size-6 text-red-400' />
                </div>
                <DialogTitle className='text-center text-white'>Delete Plan</DialogTitle>
                <DialogDescription className='text-center text-slate-400'>
                  This removes <span className='font-medium text-white'>{hardDeleteTarget?.name}</span> from the admin
                  catalog for new purchases.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='mt-2 gap-2 sm:justify-center'>
                <Button
                  variant='ghost'
                  onClick={() => setHardDeleteTarget(null)}
                  disabled={isSubmitting}
                  className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!hardDeleteTarget) return;
                    hardDeleteMutation.mutate(hardDeleteTarget.id);
                  }}
                  disabled={isSubmitting}
                  className='h-9 border border-red-500/10 bg-red-500/[0.08] text-[13px] text-red-200 hover:bg-red-500/15 disabled:opacity-70'
                >
                  {hardDeleteMutation.isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null} Delete Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
