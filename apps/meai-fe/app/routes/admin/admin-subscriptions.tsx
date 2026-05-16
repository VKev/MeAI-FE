import { useState } from 'react';
import {
  CreditCard,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Coins,
  Share2,
  Plus,
  Loader2,
  Check,
  X,
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
  deleteAdminSubscription
} from '@/services/client/admin.client';
import type { Subscription } from '@/models/subscription.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) throw new Response('Forbidden', { status: 403 });

  return null;
}

const DEFAULT_FORM = {
  name: '',
  cost: 0,
  durationMonths: 1,
  meAiCoin: 0,
  stripeProductId: '',
  stripePriceId: '',
  limits: {
    number_of_social_accounts: 1,
    max_pages_per_social_account: 1
  }
};

const FormFields = ({ formState, setFormState }: { formState: any; setFormState: Function }) => {
  const handleNumberChange = (field: string, value: string, subField?: string) => {
    if (value === '') {
      if (subField) {
        setFormState({ ...formState, [field]: { ...formState[field], [subField]: '' } });
      } else {
        setFormState({ ...formState, [field]: '' });
      }
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;

    const safeNum = Math.max(0, num);

    if (subField) {
      setFormState({
        ...formState,
        [field]: { ...formState[field], [subField]: safeNum }
      });
    } else {
      setFormState({ ...formState, [field]: safeNum });
    }
  };

  return (
    <Tabs defaultValue='general' className='w-full'>
      <TabsList className='grid w-full grid-cols-2 bg-white/[0.04]'>
        <TabsTrigger value='general' className='data-[state=active]:bg-violet-600 data-[state=active]:text-white'>
          General
        </TabsTrigger>
        <TabsTrigger value='limits' className='data-[state=active]:bg-violet-600 data-[state=active]:text-white'>
          Limitations
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
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Cost (VNĐ)</label>
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
              onChange={(e) => handleNumberChange('durationMonths', e.target.value)}
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
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Stripe Product ID</label>
            <Input
              value={formState.stripeProductId}
              onChange={(e) => setFormState({ ...formState, stripeProductId: e.target.value })}
              placeholder='prod_...'
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Stripe Price ID</label>
            <Input
              value={formState.stripePriceId}
              onChange={(e) => setFormState({ ...formState, stripePriceId: e.target.value })}
              placeholder='price_...'
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value='limits' className='space-y-4 py-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Social Accounts</label>
            <Input
              type='number'
              min='1'
              value={formState.limits.number_of_social_accounts}
              onChange={(e) => handleNumberChange('limits', e.target.value, 'number_of_social_accounts')}
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-slate-300'>Pages per Social</label>
            <Input
              type='number'
              min='0'
              value={formState.limits.max_pages_per_social_account}
              onChange={(e) => handleNumberChange('limits', e.target.value, 'max_pages_per_social_account')}
              placeholder='Unlimited (0/Empty)'
              className='h-10 border-white/[0.08] bg-white/[0.03] text-white focus:border-violet-500/40'
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();

  const { data: subsData, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => fetchAdminSubscriptions(),
  });

  const plans = subsData?.value ?? [];
  const loadError = subsData?.error?.description;

  const createMutation = useMutation({
    mutationFn: (data: any) => createAdminSubscription(data),
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
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminSubscription(id, data),
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
        setDeleteTarget(null);
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
        setActivateTarget(null);
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
        toast.success('Plan deleted permanently');
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      } else {
        toast.error(res.error?.description || 'Failed to delete plan');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete plan')
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending || activateMutation.isPending || hardDeleteMutation.isPending;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_FORM);

  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Subscription | null>(null);
  const [activateTarget, setActivateTarget] = useState<Subscription | null>(null);

  const isPlanActive = (p: Subscription) => p.isActive !== false && !p.isDeleted && !p.deletedAt;

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => isPlanActive(p)).length;
  const inactivePlans = totalPlans - activePlans;

  const submitCreate = () => {
    if (!createForm.name.trim()) return toast.error('Name is required');
    const payload = {
      ...createForm,
      stripeProductId: createForm.stripeProductId || null,
      stripePriceId: createForm.stripePriceId || null
    };
    createMutation.mutate(payload);
  };

  const submitEdit = () => {
    if (!editTarget || !editForm.name.trim()) return toast.error('Name is required');
    const payload = {
      ...editForm,
      stripeProductId: editForm.stripeProductId || null,
      stripePriceId: editForm.stripePriceId || null
    };
    updateMutation.mutate({ id: editTarget.id, data: payload });
  };

  const submitDelete = () => {
    if (!deleteTarget) return;
    deactivateMutation.mutate(deleteTarget.id);
  };

  const submitActivate = () => {
    if (!activateTarget) return;
    activateMutation.mutate(activateTarget.id);
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
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-violet-500" />
          <p className="text-sm text-slate-400">Loading subscriptions...</p>
        </div>
      ) : (
        <>
      {loadError && (
        <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400'>
          {loadError}
        </div>
      )}

      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-bold text-white'>Manage Subscriptions</h1>
          <Button
            onClick={() => {
              setShowCreate(true);
              setCreateForm(DEFAULT_FORM);
            }}
            className='h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
          >
            <Plus className='mr-2 size-4' /> Add New Plan
          </Button>
        </div>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
          <div className='relative overflow-hidden rounded-xl border border-emerald-500/10 bg-[#13131e] p-5'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400'>
                <CreditCard className='size-5' />
              </div>
              <p className='text-[13px] font-medium text-slate-400'>Total Plans</p>
            </div>
            <p className='text-[26px] font-bold tracking-tight text-white'>{totalPlans}</p>
          </div>

          <div className='relative overflow-hidden rounded-xl border border-violet-500/10 bg-[#13131e] p-5'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400'>
                <CheckCircle className='size-5' />
              </div>
              <p className='text-[13px] font-medium text-slate-400'>Active Plans</p>
            </div>
            <p className='text-[26px] font-bold tracking-tight text-white'>{activePlans}</p>
          </div>

          <div className='relative overflow-hidden rounded-xl border border-red-500/10 bg-[#13131e] p-5'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400'>
                <XCircleIcon className='size-5' />
              </div>
              <p className='text-[13px] font-medium text-slate-400'>Inactive Plans</p>
            </div>
            <p className='text-[26px] font-bold tracking-tight text-white'>{inactivePlans}</p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {plans.map((plan) => {
            const active = isPlanActive(plan);
            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e] transition-all hover:border-violet-500/30 hover:shadow-[0_8px_30px_-12px_rgba(124,58,237,0.3)] ${!active ? 'saturate-50' : ''}`}
              >
                <div className='flex items-center justify-between border-b border-white/[0.06] bg-[#1a1a24] p-5'>
                  <h3 className='text-lg font-bold text-white group-hover:text-violet-300 transition-colors'>
                    {plan.name}
                  </h3>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      active ? setDeleteTarget(plan) : setActivateTarget(plan);
                    }}
                    title={active ? 'Click to Deactivate' : 'Click to Activate'}
                    className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${active ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-400/30 hover:bg-red-400/50'}`}
                  >
                    <div
                      className={`flex size-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${active ? 'translate-x-[20px]' : 'translate-x-0'}`}
                    >
                      {active ? (
                        <Check className='size-3 text-emerald-500 stroke-[4px]' />
                      ) : (
                        <X className='size-3 text-red-500 stroke-[4px]' />
                      )}
                    </div>
                  </button>
                </div>
                <div className='p-5 pb-0'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-3xl font-bold text-white'>{formatCurrency(plan.cost)}</span>
                    <span className='text-[13px] font-medium text-slate-500'>
                      / {plan.durationMonths === 1 ? 'month' : `${plan.durationMonths} months`}
                    </span>
                  </div>
                </div>
                <div className='flex-1 p-5'>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 text-[13px] text-slate-300'>
                      <div className='flex size-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500'>
                        <Coins className='size-3.5' />
                      </div>
                      <span className='font-medium text-white'>{plan.meAiCoin}</span> MeAI Coins
                    </div>
                    <div className='flex items-center gap-3 text-[13px] text-slate-300'>
                      <div className='flex size-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400'>
                        <Share2 className='size-3.5' />
                      </div>
                      <div>
                        <span className='font-medium text-white'>{plan.limits?.number_of_social_accounts ?? 1}</span>{' '}
                        Social Accounts
                        <p className='text-[10px] text-slate-500'>
                          (
                          {plan.limits?.max_pages_per_social_account
                            ? `${plan.limits.max_pages_per_social_account} pages limit`
                            : 'unlimited pages'}
                          )
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='flex items-center justify-between border-t border-white/[0.06] bg-[#1a1a24] p-4 mt-auto'>
                  <button
                    type='button'
                    title='Edit Plan'
                    onClick={() => {
                      setEditForm({
                        name: plan.name,
                        cost: plan.cost,
                        durationMonths: plan.durationMonths,
                        meAiCoin: plan.meAiCoin,
                        stripeProductId: plan.stripeProductId || '',
                        stripePriceId: plan.stripePriceId || '',
                        limits: {
                          number_of_social_accounts: plan.limits?.number_of_social_accounts || 1,
                          max_pages_per_social_account: plan.limits?.max_pages_per_social_account || 0
                        }
                      });
                      setEditTarget(plan);
                    }}
                    className='flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white'
                  >
                    <Pencil className='size-3.5' /> Edit Plan
                  </button>
                  <button
                    type='button'
                    title='Hard Delete'
                    onClick={() => setHardDeleteTarget(plan)}
                    className='flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400'
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
        <DialogContent className='max-w-md border-white/[0.08] bg-[#13131e]'>
          <DialogHeader>
            <DialogTitle className='text-white'>Create New Plan</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Define the pricing, stripe identifiers, and allocation limits.
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
              {createMutation.isPending ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : null}{' '}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className='max-w-md border-white/[0.08] bg-[#13131e]'>
          <DialogHeader>
            <DialogTitle className='text-white'>Edit Plan</DialogTitle>
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
              {updateMutation.isPending ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : null}{' '}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className='max-w-sm border-white/[0.08] bg-[#13131e]'>
          <DialogHeader>
            <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
              <AlertTriangle className='size-6 text-red-400' />
            </div>
            <DialogTitle className='text-center text-white'>Deactivate Plan</DialogTitle>
            <DialogDescription className='text-center text-slate-400'>
              Are you sure you want to deactivate <span className='font-medium text-white'>{deleteTarget?.name}</span>?
              New users won't be able to subscribe to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-2 gap-2 sm:justify-center'>
            <Button
              variant='ghost'
              onClick={() => setDeleteTarget(null)}
              disabled={isSubmitting}
              className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white'
            >
              Cancel
            </Button>
            <Button
              onClick={submitDelete}
              disabled={isSubmitting}
              className='h-9 bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-70'
            >
              {deactivateMutation.isPending ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : null}{' '}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activateTarget} onOpenChange={(open) => !open && setActivateTarget(null)}>
        <DialogContent className='max-w-sm border-white/[0.08] bg-[#13131e]'>
          <DialogHeader>
            <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10'>
              <CheckCircle className='size-6 text-emerald-400' />
            </div>
            <DialogTitle className='text-center text-white'>Activate Plan</DialogTitle>
            <DialogDescription className='text-center text-slate-400'>
              Are you sure you want to reactivate <span className='font-medium text-white'>{activateTarget?.name}</span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-2 gap-2 sm:justify-center'>
            <Button
              variant='ghost'
              onClick={() => setActivateTarget(null)}
              disabled={isSubmitting}
              className='h-9 text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-white'
            >
              Cancel
            </Button>
            <Button
              onClick={submitActivate}
              disabled={isSubmitting}
              className='h-9 bg-emerald-600 text-[13px] text-white hover:bg-emerald-700 disabled:opacity-70'
            >
              {activateMutation.isPending ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : null}{' '}
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hardDeleteTarget} onOpenChange={(open) => !open && setHardDeleteTarget(null)}>
        <DialogContent className='max-w-sm border-white/[0.08] bg-[#13131e]'>
          <DialogHeader>
            <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-500/10'>
              <Trash2 className='size-6 text-red-400' />
            </div>
            <DialogTitle className='text-center text-white'>Hard Delete Plan</DialogTitle>
            <DialogDescription className='text-center text-slate-400'>
              This will <span className='font-bold text-red-500'>permanently delete</span>{' '}
              <span className='font-medium text-white'>{hardDeleteTarget?.name}</span>. This action cannot be undone.
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
              className='h-9 bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-70'
            >
              {hardDeleteMutation.isPending ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : null}{' '}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </>
  );
}
