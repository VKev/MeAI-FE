import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ApiKeyFilterStatus,
  type ApiKeyFilters,
  ApiKeyFilterBar,
  type ApiKeyFormMode,
  type ApiKeyFormValues,
  ApiKeyFormDialog,
  ApiKeySummaryCards,
  ApiKeyTable
} from '@/components/admin/api-key-management';
import { GenerationOptionsManager } from '@/components/admin/generation-options/GenerationOptionsManager';
import type {
  AdminApiServiceName,
  ApiCredentialItem,
  CreateApiCredentialRequest,
  GetApiCredentialFilters,
  UpdateApiCredentialRequest
} from '@/models/admin-client.model';
import { createAdminApiKey, fetchAdminApiKeys, updateAdminApiKey } from '@/services/client/admin.client';
import { requireUser, hasRole } from '@/services/server/session.server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) throw new Response('Forbidden', { status: 403 });
}

const DEFAULT_FILTERS: ApiKeyFilters = {
  provider: '',
  keyName: '',
  status: 'all'
};

const DEFAULT_FORM: ApiKeyFormValues = {
  provider: '',
  keyName: '',
  displayName: '',
  value: '',
  isActive: true
};

const SERVICE_LABELS: Record<AdminApiServiceName, string> = {
  User: 'User Service',
  Ai: 'AI Service'
};

const mapFiltersToQuery = (filters: ApiKeyFilters): GetApiCredentialFilters => {
  const query: GetApiCredentialFilters = {};

  if (filters.provider.trim()) {
    query.provider = filters.provider.trim();
  }

  if (filters.keyName.trim()) {
    query.keyName = filters.keyName.trim();
  }

  if (filters.status !== 'all') {
    query.isActive = filters.status === 'active';
  }

  return query;
};

const getProviderOptions = (items: ApiCredentialItem[]) => {
  const providerSet = new Set(items.map((item) => item.provider).filter(Boolean));
  return [...providerSet].sort((left, right) => left.localeCompare(right));
};

const getFormFromTarget = (target: ApiCredentialItem): ApiKeyFormValues => ({
  provider: target.provider,
  keyName: target.keyName,
  displayName: target.displayName ?? '',
  value: '',
  isActive: target.isActive
});

function AdminConfigComponent() {
  const [section, setSection] = useState<'api-keys' | 'generation-options'>('api-keys');
  const [service, setService] = useState<AdminApiServiceName>('User');
  const [items, setItems] = useState<ApiCredentialItem[]>([]);
  const [filters, setFilters] = useState<ApiKeyFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ApiKeyFormMode>('create');
  const [dialogTarget, setDialogTarget] = useState<ApiCredentialItem | null>(null);
  const [dialogForm, setDialogForm] = useState<ApiKeyFormValues>(DEFAULT_FORM);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<ApiCredentialItem | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  const providerOptions = useMemo(() => getProviderOptions(items), [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.isActive).length;
    return {
      total,
      active,
      inactive: total - active
    };
  }, [items]);

  const loadApiKeys = useCallback(
    async (opts?: { query?: GetApiCredentialFilters; showLoading?: boolean }) => {
      const showLoading = opts?.showLoading ?? true;

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setLoadError(null);

      try {
        const query = opts?.query;
        const response = await fetchAdminApiKeys(service, query);

        if (!response.isSuccess) {
          throw new Error(response.error?.description || 'Failed to load API keys.');
        }

        setItems(response.value ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load API keys.';
        setLoadError(message);
        setItems([]);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [service]
  );

  useEffect(() => {
    setFilters(DEFAULT_FILTERS);
    void loadApiKeys({ showLoading: true });
  }, [loadApiKeys, service]);

  const handleServiceChange = useCallback((nextService: AdminApiServiceName) => {
    setService(nextService);
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleFilterProviderChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, provider: value }));
  }, []);

  const handleFilterKeyNameChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, keyName: value }));
  }, []);

  const handleFilterStatusChange = useCallback((value: ApiKeyFilterStatus) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    void loadApiKeys({ query: mapFiltersToQuery(filters), showLoading: true });
  }, [filters, loadApiKeys]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    void loadApiKeys({ showLoading: true });
  }, [loadApiKeys]);

  const handleRefresh = useCallback(() => {
    void loadApiKeys({ query: mapFiltersToQuery(filters), showLoading: false });
  }, [filters, loadApiKeys]);

  const closeDialog = useCallback((open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setDialogMode('create');
      setDialogTarget(null);
      setDialogForm(DEFAULT_FORM);
      setDialogError(null);
      setIsSubmitting(false);
    }
  }, []);

  const handleOpenCreate = useCallback(() => {
    setDialogMode('create');
    setDialogTarget(null);
    setDialogForm(DEFAULT_FORM);
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: ApiCredentialItem) => {
    setDialogMode('edit');
    setDialogTarget(item);
    setDialogForm(getFormFromTarget(item));
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  const handleDialogFormChange = useCallback(
    <K extends keyof ApiKeyFormValues>(field: K, value: ApiKeyFormValues[K]) => {
      setDialogForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const submitCreate = useCallback(async () => {
    const provider = dialogForm.provider.trim();
    const keyName = dialogForm.keyName.trim();
    const value = dialogForm.value.trim();

    if (!provider || !keyName || !value) {
      setDialogError('Provider, Key Name, and Secret Value are required.');
      return;
    }

    const payload: CreateApiCredentialRequest = {
      provider,
      keyName,
      value,
      displayName: dialogForm.displayName.trim() || undefined,
      isActive: dialogForm.isActive
    };

    setIsSubmitting(true);
    setDialogError(null);

    try {
      const response = await createAdminApiKey(service, payload);
      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to create API key.');
      }

      toast.success('API key created successfully.');
      closeDialog(false);
      await loadApiKeys({ query: mapFiltersToQuery(filters), showLoading: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create API key.';
      setDialogError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [closeDialog, dialogForm, filters, loadApiKeys, service]);

  const submitEdit = useCallback(async () => {
    if (!dialogTarget) {
      setDialogError('Unable to find the key to update.');
      return;
    }

    const payload: UpdateApiCredentialRequest = {
      displayName: dialogForm.displayName.trim() || null,
      isActive: dialogForm.isActive
    };

    const nextValue = dialogForm.value.trim();
    if (nextValue) {
      payload.value = nextValue;
    }

    setIsSubmitting(true);
    setDialogError(null);

    try {
      const response = await updateAdminApiKey(service, dialogTarget.id, payload);
      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to update API key.');
      }

      toast.success(nextValue ? 'API key rotated successfully.' : 'API key updated successfully.');
      closeDialog(false);
      await loadApiKeys({ query: mapFiltersToQuery(filters), showLoading: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update API key.';
      setDialogError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeDialog,
    dialogForm.displayName,
    dialogForm.isActive,
    dialogForm.value,
    dialogTarget,
    filters,
    loadApiKeys,
    service
  ]);

  const handleDialogSubmit = useCallback(() => {
    if (dialogMode === 'create') {
      void submitCreate();
      return;
    }

    void submitEdit();
  }, [dialogMode, submitCreate, submitEdit]);

  const handleDisableRequest = useCallback(async (item: ApiCredentialItem) => {
    if (!item.isActive) {
      toast.info('This key is already inactive.');
      return;
    }

    setDisableTarget(item);
    setDisableConfirmOpen(true);
  }, []);

  const closeDisableConfirm = useCallback(() => {
    if (isDisabling) return;

    setDisableConfirmOpen(false);
    setDisableTarget(null);
  }, [isDisabling]);

  const handleConfirmDisable = useCallback(async () => {
    if (!disableTarget) return;

    setIsDisabling(true);
    setTogglingId(disableTarget.id);

    try {
      const response = await updateAdminApiKey(service, disableTarget.id, { isActive: false });

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to disable API key.');
      }

      toast.success('API key disabled.');
      setDisableConfirmOpen(false);
      setDisableTarget(null);
      await loadApiKeys({ query: mapFiltersToQuery(filters), showLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable API key.';
      toast.error(message);
    } finally {
      setIsDisabling(false);
      setTogglingId(null);
    }
  }, [disableTarget, filters, loadApiKeys, service]);

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
            error: 'bg-red-950/90 border-red-500/20 text-red-300'
          },
          style: { borderRadius: '0.75rem', padding: '12px 16px', gap: '10px' }
        }}
      />

      <div className='mb-6'>
        <h1 className='text-xl font-bold text-white'>Configuration</h1>
        <p className='mt-1 text-[13px] text-slate-400'>
          Configure provider credentials and AI generation options.
        </p>
      </div>

      <div className='mb-5'>
        <Tabs value={section} onValueChange={(value) => setSection(value as 'api-keys' | 'generation-options')}>
          <TabsList className='border border-violet-300/20 bg-linear-to-r from-violet-500/10 via-violet-500/10 to-violet-500/10 p-1'>
            <TabsTrigger
              value='api-keys'
              className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
            >
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value='generation-options'
              className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
            >
              AI Generation
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {section === 'api-keys' ? (
        <>
      <div className='flex flex-col gap-5'>
        <div className='flex flex-col justify-between gap-3 rounded-xl border border-white/8 bg-[#13131e] p-4 lg:flex-row lg:items-center'>
          <div className='space-y-2'>
            <p className='text-[12px] uppercase tracking-[0.16em] text-slate-500'>Service Scope</p>
            <Tabs value={service} onValueChange={(value) => handleServiceChange(value as AdminApiServiceName)}>
              <TabsList className='border border-violet-300/20 bg-linear-to-r from-violet-500/10 via-violet-500/10 to-violet-500/10 p-1'>
                <TabsTrigger
                  value='User'
                  className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
                >
                  {SERVICE_LABELS.User}
                </TabsTrigger>
                <TabsTrigger
                  value='Ai'
                  className='data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300'
                >
                  {SERVICE_LABELS.Ai}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className='h-9 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            >
              <RefreshCw className={`size-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              type='button'
              onClick={handleOpenCreate}
              className='h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
            >
              <Plus className='size-4' /> Add key
            </Button>
          </div>
        </div>

        <ApiKeySummaryCards total={stats.total} active={stats.active} inactive={stats.inactive} />

        <ApiKeyFilterBar
          filters={filters}
          providerOptions={providerOptions}
          isLoading={isLoading}
          onProviderChange={handleFilterProviderChange}
          onKeyNameChange={handleFilterKeyNameChange}
          onStatusChange={handleFilterStatusChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {loadError && <div className='rounded-lg bg-red-500/10 px-4 py-3 text-[13px] text-red-300'>{loadError}</div>}

        <ApiKeyTable
          items={items}
          isLoading={isLoading}
          togglingId={togglingId}
          onEdit={handleOpenEdit}
          onDisable={handleDisableRequest}
        />
      </div>

      <ApiKeyFormDialog
        open={dialogOpen}
        mode={dialogMode}
        service={service}
        target={dialogTarget}
        form={dialogForm}
        isSubmitting={isSubmitting}
        errorMessage={dialogError}
        onOpenChange={closeDialog}
        onFormChange={handleDialogFormChange}
        onSubmit={handleDialogSubmit}
      />

      <Dialog open={disableConfirmOpen} onOpenChange={closeDisableConfirm}>
        <DialogContent className='max-w-md border border-white/8 bg-[#10101a]'>
          <DialogHeader>
            <div className='mb-2 flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-300'>
              <AlertTriangle className='size-5' />
            </div>
            <DialogTitle>Disable API Key?</DialogTitle>
            <DialogDescription>
              This will deactivate{' '}
              <span className='font-medium text-white'>
                {disableTarget?.displayName || disableTarget?.keyName || 'this key'}
              </span>
              . Requests that depend on it may stop working until you enable it again.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={closeDisableConfirm}
              disabled={isDisabling}
              className='border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            >
              Cancel
            </Button>
            <Button type='button' onClick={handleConfirmDisable} disabled={isDisabling} variant='destructive'>
              {isDisabling ? 'Disabling...' : 'Disable key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      ) : (
        <GenerationOptionsManager />
      )}
    </>
  );
}

export default memo(AdminConfigComponent);
