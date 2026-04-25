import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCcw, Save } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResourceFilters,
  type ResourceFilterValues,
  ResourceSummaryCards,
  ResourceTable,
  StorageMaintenancePanel,
  StoragePlanTable,
  StorageSettingsPanels
} from '@/components/admin/resource-management';
import type {
  StoragePlanPolicyItem,
  StorageResourcesQuery,
  StorageUsageQuery,
  UpdateStoragePlanRequest
} from '@/models/admin-client.model';
import {
  fetchAdminFreeTierStorageSettings,
  fetchAdminStoragePlans,
  fetchAdminStorageResources,
  fetchAdminStorageUsage,
  fetchAdminSystemStorageSettings,
  runAdminStorageCleanup,
  runAdminStorageReconcile,
  updateAdminFreeTierStorageSettings,
  updateAdminStoragePlan,
  updateAdminSystemStorageSettings
} from '@/services/client/admin.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) throw new Response('Forbidden', { status: 403 });
}

const DEFAULT_FILTERS: ResourceFilterValues = {
  userId: '',
  workspaceId: '',
  namespace: '',
  resourceType: 'all',
  includeDeleted: false
};

type PlanFormState = {
  storageQuotaBytes: string;
  maxUploadFileBytes: string;
  retentionDaysAfterDelete: string;
};

const EMPTY_PLAN_FORM: PlanFormState = {
  storageQuotaBytes: '',
  maxUploadFileBytes: '',
  retentionDaysAfterDelete: ''
};

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function mapResourceFilterToQuery(filters: ResourceFilterValues): StorageResourcesQuery {
  return {
    userId: filters.userId.trim() || undefined,
    workspaceId: filters.workspaceId.trim() || undefined,
    namespace: filters.namespace.trim() || undefined,
    resourceType: filters.resourceType === 'all' ? undefined : filters.resourceType,
    includeDeleted: filters.includeDeleted,
    limit: 100
  };
}

function mapUsageFilterToQuery(filters: ResourceFilterValues): StorageUsageQuery {
  return {
    userId: filters.userId.trim() || undefined,
    namespace: filters.namespace.trim() || undefined
  };
}

function AdminResourceComponent() {
  const [tab, setTab] = useState('overview');

  const [filters, setFilters] = useState<ResourceFilterValues>(DEFAULT_FILTERS);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  const [usage, setUsage] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const [plans, setPlans] = useState<StoragePlanPolicyItem[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [freeTierQuotaInput, setFreeTierQuotaInput] = useState('');
  const [systemQuotaInput, setSystemQuotaInput] = useState('');
  const [isSavingFreeTier, setIsSavingFreeTier] = useState(false);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [isRunningReconcile, setIsRunningReconcile] = useState(false);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planTarget, setPlanTarget] = useState<StoragePlanPolicyItem | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(EMPTY_PLAN_FORM);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const summary = useMemo(
    () => ({
      totalResources: usage?.totalResourceCount ?? resources.length,
      totalUsedBytes: usage?.totalUsedBytes ?? 0,
      totalReservedBytes: usage?.totalReservedBytes ?? 0,
      overQuotaUsers: usage?.overQuotaUsers ?? 0
    }),
    [resources.length, usage]
  );

  const loadResources = useCallback(async (nextFilters: ResourceFilterValues) => {
    setIsLoadingResources(true);

    try {
      const response = await fetchAdminStorageResources(mapResourceFilterToQuery(nextFilters));

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to load storage resources.');
      }

      const payload = response.value;
      const items = Array.isArray((payload as any)?.items) ? (payload as any).items : [];
      setResources(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load storage resources.';
      setResources([]);
      toast.error(message);
    } finally {
      setIsLoadingResources(false);
    }
  }, []);

  const loadUsage = useCallback(async (nextFilters: ResourceFilterValues) => {
    setIsLoadingUsage(true);

    try {
      const response = await fetchAdminStorageUsage(mapUsageFilterToQuery(nextFilters));

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to load storage usage.');
      }

      setUsage(response.value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load storage usage.';
      setUsage(null);
      toast.error(message);
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setIsLoadingPlans(true);

    try {
      const response = await fetchAdminStoragePlans();

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to load storage plans.');
      }

      setPlans(response.value ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load storage plans.';
      setPlans([]);
      toast.error(message);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const [freeTierRes, systemRes] = await Promise.all([
        fetchAdminFreeTierStorageSettings(),
        fetchAdminSystemStorageSettings()
      ]);

      if (freeTierRes.isSuccess) {
        setFreeTierQuotaInput(String(freeTierRes.value.freeStorageQuotaBytes ?? 0));
      }

      if (systemRes.isSuccess) {
        const value = systemRes.value.systemStorageQuotaBytes;
        setSystemQuotaInput(value === null ? '' : String(value));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load storage settings.';
      toast.error(message);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadUsage(filters), loadResources(filters), loadPlans(), loadSettings()]);
    setIsRefreshing(false);
  }, [filters, loadPlans, loadResources, loadSettings, loadUsage]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleFilterChange = useCallback(
    <K extends keyof ResourceFilterValues>(key: K, value: ResourceFilterValues[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleApplyFilters = useCallback(async () => {
    await Promise.all([loadResources(filters), loadUsage(filters)]);
  }, [filters, loadResources, loadUsage]);

  const handleResetFilters = useCallback(async () => {
    setFilters(DEFAULT_FILTERS);
    await Promise.all([loadResources(DEFAULT_FILTERS), loadUsage(DEFAULT_FILTERS)]);
  }, [loadResources, loadUsage]);

  const handleSaveFreeTier = useCallback(async () => {
    const parsed = Number(freeTierQuotaInput);

    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Free tier quota must be a non-negative number.');
      return;
    }

    setIsSavingFreeTier(true);
    try {
      const response = await updateAdminFreeTierStorageSettings({ freeStorageQuotaBytes: parsed });

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to update free tier storage quota.');
      }

      toast.success('Free tier storage quota updated.');
      await loadUsage(filters);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update free tier storage quota.';
      toast.error(message);
    } finally {
      setIsSavingFreeTier(false);
    }
  }, [filters, freeTierQuotaInput, loadUsage]);

  const handleSaveSystem = useCallback(async () => {
    const parsed = parseOptionalNumber(systemQuotaInput);

    if (systemQuotaInput.trim() && parsed === null) {
      toast.error('System quota must be empty or a non-negative number.');
      return;
    }

    setIsSavingSystem(true);
    try {
      const response = await updateAdminSystemStorageSettings({
        systemStorageQuotaBytes: systemQuotaInput.trim() ? parsed : null
      });

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to update system storage quota.');
      }

      toast.success('System-wide storage quota updated.');
      await loadUsage(filters);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update system storage quota.';
      toast.error(message);
    } finally {
      setIsSavingSystem(false);
    }
  }, [filters, loadUsage, systemQuotaInput]);

  const runCleanup = useCallback(
    async (dryRun: boolean) => {
      setIsRunningCleanup(true);
      try {
        const response = await runAdminStorageCleanup({
          dryRun,
          deleteExpiredResources: true,
          deleteOrphanObjects: !dryRun,
          namespace: filters.namespace.trim() || null
        });

        if (!response.isSuccess) {
          throw new Error(response.error?.description || 'Failed to run storage cleanup.');
        }

        toast.success(dryRun ? 'Cleanup dry run completed.' : 'Cleanup executed successfully.');
        await Promise.all([loadResources(filters), loadUsage(filters)]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to run storage cleanup.';
        toast.error(message);
      } finally {
        setIsRunningCleanup(false);
      }
    },
    [filters, loadResources, loadUsage]
  );

  const runReconcile = useCallback(
    async (dryRun: boolean) => {
      setIsRunningReconcile(true);
      try {
        const response = await runAdminStorageReconcile({
          dryRun,
          markMissingObjects: !dryRun,
          namespace: filters.namespace.trim() || null
        });

        if (!response.isSuccess) {
          throw new Error(response.error?.description || 'Failed to run storage reconcile.');
        }

        toast.success(dryRun ? 'Reconcile dry run completed.' : 'Reconcile executed successfully.');
        await Promise.all([loadResources(filters), loadUsage(filters)]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to run storage reconcile.';
        toast.error(message);
      } finally {
        setIsRunningReconcile(false);
      }
    },
    [filters, loadResources, loadUsage]
  );

  const handleOpenEditPlan = useCallback((plan: StoragePlanPolicyItem) => {
    setPlanTarget(plan);
    setPlanForm({
      storageQuotaBytes: plan.limits.storageQuotaBytes === null ? '' : String(plan.limits.storageQuotaBytes),
      maxUploadFileBytes: plan.limits.maxUploadFileBytes === null ? '' : String(plan.limits.maxUploadFileBytes),
      retentionDaysAfterDelete:
        plan.limits.retentionDaysAfterDelete === null ? '' : String(plan.limits.retentionDaysAfterDelete)
    });
    setPlanDialogOpen(true);
  }, []);

  const handleSavePlan = useCallback(async () => {
    if (!planTarget) {
      return;
    }

    const payload: UpdateStoragePlanRequest = {
      storageQuotaBytes: parseOptionalNumber(planForm.storageQuotaBytes),
      maxUploadFileBytes: parseOptionalNumber(planForm.maxUploadFileBytes),
      retentionDaysAfterDelete: parseOptionalNumber(planForm.retentionDaysAfterDelete)
    };

    setIsSavingPlan(true);
    try {
      const response = await updateAdminStoragePlan(planTarget.id, payload);

      if (!response.isSuccess) {
        throw new Error(response.error?.description || 'Failed to update storage plan policy.');
      }

      toast.success('Storage policy updated for plan.');
      setPlanDialogOpen(false);
      setPlanTarget(null);
      setPlanForm(EMPTY_PLAN_FORM);
      await loadPlans();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update storage plan policy.';
      toast.error(message);
    } finally {
      setIsSavingPlan(false);
    }
  }, [
    loadPlans,
    planForm.maxUploadFileBytes,
    planForm.retentionDaysAfterDelete,
    planForm.storageQuotaBytes,
    planTarget
  ]);

  return (
    <>
      <Toaster position='top-right' theme='dark' richColors closeButton duration={3000} />

      <div className='mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Resource Management</h1>
          <p className='mt-1 text-[13px] text-slate-400'>
            Manage storage usage, resource metadata, quota settings, plan policies, and cleanup tasks.
          </p>
        </div>

        <Button
          type='button'
          variant='outline'
          onClick={() => void loadAll()}
          disabled={isRefreshing}
          className='h-9 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
        >
          {isRefreshing ? <Loader2 className='size-4 animate-spin' /> : <RefreshCcw className='size-4' />}
          Refresh All
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className='w-full'>
        <TabsList className='w-full justify-start border border-cyan-300/20 bg-linear-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 p-1 md:w-fit'>
          <TabsTrigger
            value='overview'
            className='data-[state=active]:bg-linear-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white'
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value='resources'
            className='data-[state=active]:bg-linear-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white'
          >
            Resources
          </TabsTrigger>
          <TabsTrigger
            value='plans'
            className='data-[state=active]:bg-linear-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white'
          >
            Plan Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-4 space-y-4'>
          <ResourceSummaryCards
            totalResources={summary.totalResources}
            totalUsedBytes={summary.totalUsedBytes}
            totalReservedBytes={summary.totalReservedBytes}
            overQuotaUsers={summary.overQuotaUsers}
          />

          <StorageSettingsPanels
            freeTierQuotaInput={freeTierQuotaInput}
            systemQuotaInput={systemQuotaInput}
            isSavingFreeTier={isSavingFreeTier}
            isSavingSystem={isSavingSystem}
            onFreeTierQuotaChange={setFreeTierQuotaInput}
            onSystemQuotaChange={setSystemQuotaInput}
            onSaveFreeTier={() => void handleSaveFreeTier()}
            onSaveSystem={() => void handleSaveSystem()}
          />

          <StorageMaintenancePanel
            isRunningCleanup={isRunningCleanup}
            isRunningReconcile={isRunningReconcile}
            onRunCleanupDry={() => void runCleanup(true)}
            onRunCleanupExecute={() => void runCleanup(false)}
            onRunReconcileDry={() => void runReconcile(true)}
            onRunReconcileExecute={() => void runReconcile(false)}
          />
        </TabsContent>

        <TabsContent value='resources' className='mt-4 space-y-4'>
          <ResourceFilters
            filters={filters}
            isLoading={isLoadingResources || isLoadingUsage}
            onFilterChange={handleFilterChange}
            onApply={() => void handleApplyFilters()}
            onReset={() => void handleResetFilters()}
          />

          <ResourceTable items={resources} isLoading={isLoadingResources || isLoadingUsage} />
        </TabsContent>

        <TabsContent value='plans' className='mt-4 space-y-4'>
          {isLoadingPlans ? (
            <div className='rounded-xl border border-white/8 bg-[#13131e] px-4 py-10 text-center text-sm text-slate-400'>
              Loading plan policies...
            </div>
          ) : (
            <StoragePlanTable plans={plans} onEditPlan={handleOpenEditPlan} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className='max-w-lg border border-white/8 bg-[#10101a]'>
          <DialogHeader>
            <DialogTitle>Edit Storage Plan Policy</DialogTitle>
            <DialogDescription>
              Update quota, max upload size, and retention policy for{' '}
              <span className='font-medium text-white'>{planTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div>
              <label className='mb-1.5 block text-[12px] text-slate-400'>Storage Quota (bytes)</label>
              <Input
                type='number'
                min='0'
                value={planForm.storageQuotaBytes}
                onChange={(event) => setPlanForm((prev) => ({ ...prev, storageQuotaBytes: event.target.value }))}
                className='h-9 border-white/8 bg-white/4 text-white focus:border-cyan-500/40'
              />
            </div>

            <div>
              <label className='mb-1.5 block text-[12px] text-slate-400'>Max Upload/File (bytes)</label>
              <Input
                type='number'
                min='0'
                value={planForm.maxUploadFileBytes}
                onChange={(event) => setPlanForm((prev) => ({ ...prev, maxUploadFileBytes: event.target.value }))}
                className='h-9 border-white/8 bg-white/4 text-white focus:border-cyan-500/40'
              />
            </div>

            <div>
              <label className='mb-1.5 block text-[12px] text-slate-400'>Retention Days After Delete</label>
              <Input
                type='number'
                min='0'
                value={planForm.retentionDaysAfterDelete}
                onChange={(event) => setPlanForm((prev) => ({ ...prev, retentionDaysAfterDelete: event.target.value }))}
                className='h-9 border-white/8 bg-white/4 text-white focus:border-cyan-500/40'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setPlanDialogOpen(false)}
              disabled={isSavingPlan}
              className='border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={() => void handleSavePlan()}
              disabled={isSavingPlan}
              className='bg-cyan-600 text-white hover:bg-cyan-700'
            >
              {isSavingPlan ? <Loader2 className='size-4 animate-spin' /> : <Save className='size-4' />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(AdminResourceComponent);
