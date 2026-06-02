import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Edit3, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  GenerationModeOption,
  GenerationModelOption,
  ProviderGenerationModelOption,
  GenerationSocialPreset,
  UpsertGenerationModelOptionPayload,
  UpsertGenerationSocialPresetPayload
} from '@/models/generation-options.model';
import {
  createGenerationModelOption,
  createGenerationSocialPreset,
  deleteGenerationModelOption,
  deleteGenerationSocialPreset,
  fetchAdminGenerationOptions,
  fetchProviderGenerationModels,
  updateGenerationModelOption,
  updateGenerationSocialPreset
} from '@/services/client/generation-options.client';

type ModelFormState = {
  mode: GenerationModeOption;
  modelId: string;
  name: string;
  description: string;
  supportedRatios: string;
  supportedQualities: string;
  supportsResolution: boolean;
  isActive: boolean;
  sortOrder: string;
};

type SocialPresetFormState = {
  mode: GenerationModeOption;
  platform: string;
  label: string;
  contentType: string;
  contentLabel: string;
  supportedRatios: string;
  defaultRatio: string;
  isActive: boolean;
  sortOrder: string;
};

const QUERY_KEY = ['admin-generation-options'] as const;

const EMPTY_MODEL_FORM: ModelFormState = {
  mode: 'image',
  modelId: '',
  name: '',
  description: '',
  supportedRatios: '1:1, 16:9',
  supportedQualities: '',
  supportsResolution: false,
  isActive: true,
  sortOrder: '0'
};

const EMPTY_SOCIAL_FORM: SocialPresetFormState = {
  mode: 'image',
  platform: 'facebook',
  label: 'Facebook',
  contentType: 'post',
  contentLabel: 'Post',
  supportedRatios: '1:1, 16:9',
  defaultRatio: '1:1',
  isActive: true,
  sortOrder: '0'
};

const fieldClass =
  'h-10 rounded-lg border border-white/10 bg-[#0b0b13] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60';
const textareaClass =
  'min-h-20 rounded-lg border border-white/10 bg-[#0b0b13] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500';

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function listText(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'None';
}

function normalizeSortOrder(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function modelToForm(option: GenerationModelOption): ModelFormState {
  return {
    mode: option.mode,
    modelId: option.modelId,
    name: option.name,
    description: option.description ?? '',
    supportedRatios: option.supportedRatios.join(', '),
    supportedQualities: option.supportedQualities.join(', '),
    supportsResolution: option.supportsResolution,
    isActive: option.isActive,
    sortOrder: String(option.sortOrder)
  };
}

function socialPresetToForm(option: GenerationSocialPreset): SocialPresetFormState {
  return {
    mode: option.mode,
    platform: option.platform,
    label: option.label,
    contentType: option.contentType,
    contentLabel: option.contentLabel,
    supportedRatios: option.supportedRatios.join(', '),
    defaultRatio: option.defaultRatio,
    isActive: option.isActive,
    sortOrder: String(option.sortOrder)
  };
}

function providerModelToFormPatch(option: ProviderGenerationModelOption): Partial<ModelFormState> {
  return {
    mode: option.mode,
    modelId: option.modelId,
    name: option.name,
    description: option.description,
    supportedRatios: option.supportedRatios.join(', '),
    supportedQualities: option.supportedQualities.join(', '),
    supportsResolution: option.supportsResolution,
    sortOrder: String(option.sortOrder)
  };
}

function modelPayloadFromForm(form: ModelFormState): UpsertGenerationModelOptionPayload {
  return {
    mode: form.mode,
    modelId: form.modelId.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    supportedRatios: splitCsv(form.supportedRatios),
    supportedQualities: splitCsv(form.supportedQualities),
    supportsResolution: form.supportsResolution,
    isActive: form.isActive,
    sortOrder: normalizeSortOrder(form.sortOrder)
  };
}

function socialPayloadFromForm(form: SocialPresetFormState): UpsertGenerationSocialPresetPayload {
  return {
    mode: form.mode,
    platform: form.platform.trim().toLowerCase(),
    label: form.label.trim(),
    contentType: form.contentType.trim().toLowerCase(),
    contentLabel: form.contentLabel.trim(),
    supportedRatios: splitCsv(form.supportedRatios),
    defaultRatio: form.defaultRatio.trim(),
    isActive: form.isActive,
    sortOrder: normalizeSortOrder(form.sortOrder)
  };
}

function statusPill(isActive: boolean) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
        isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700/40 text-slate-400'
      }`}
    >
      {isActive ? 'Active' : 'Hidden'}
    </span>
  );
}

function ProviderModelPicker({
  value,
  options,
  isLoading,
  onChange
}: {
  value: string;
  options: ProviderGenerationModelOption[];
  isLoading: boolean;
  onChange: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedModel = options.find((option) => option.modelId === value);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) =>
      [option.name, option.modelId, option.description, option.mode, option.provider]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          disabled={isLoading}
          aria-expanded={open}
          className={`${fieldClass} flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className='min-w-0 flex-1 truncate'>
            {isLoading
              ? 'Loading Kie AI models...'
              : selectedModel
                ? `${selectedModel.name} - ${selectedModel.modelId}`
                : 'Select a Kie AI model'}
          </span>
          <ChevronDown className='size-4 shrink-0 text-slate-500' />
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] p-0'>
        <div className='flex items-center gap-2 border-b border-white/10 px-3 py-2'>
          <Search className='size-4 text-slate-500' />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Search Kie model...'
            className='h-8 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600'
          />
        </div>
        <div className='max-h-72 overflow-y-auto p-1'>
          {filteredOptions.length === 0 ? (
            <div className='px-3 py-6 text-center text-sm text-slate-500'>No matching Kie models.</div>
          ) : (
            filteredOptions.map((option) => {
              const selected = option.modelId === value;

              return (
                <button
                  key={`${option.mode}-${option.modelId}`}
                  type='button'
                  onClick={() => {
                    onChange(option.modelId);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                  className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                    selected ? 'bg-violet-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-medium'>{option.name}</span>
                      <span className='rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400'>
                        {option.mode}
                      </span>
                    </div>
                    <p className='mt-1 truncate font-mono text-[11px] text-slate-500'>{option.modelId}</p>
                    <p className='mt-1 line-clamp-2 text-xs text-slate-400'>{option.description}</p>
                  </div>
                  <Check
                    className={`mt-0.5 size-4 shrink-0 text-violet-300 ${selected ? 'opacity-100' : 'opacity-0'}`}
                  />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function GenerationOptionsManager() {
  const queryClient = useQueryClient();
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<ModelFormState>(EMPTY_MODEL_FORM);
  const [socialForm, setSocialForm] = useState<SocialPresetFormState>(EMPTY_SOCIAL_FORM);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => fetchAdminGenerationOptions(signal),
    staleTime: 60_000,
    retry: false
  });

  const { data: providerModelsData, isLoading: isLoadingProviderModels } = useQuery({
    queryKey: ['admin-kie-generation-models', modelForm.mode],
    queryFn: ({ signal }) => fetchProviderGenerationModels(modelForm.mode, signal),
    staleTime: 5 * 60_000,
    retry: false
  });

  const providerModels = useMemo(
    () =>
      [...(providerModelsData?.value ?? [])].sort(
        (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
      ),
    [providerModelsData]
  );

  const providerModelOptions = useMemo(() => {
    if (!modelForm.modelId || providerModels.some((item) => item.modelId === modelForm.modelId)) {
      return providerModels;
    }

    return [
      {
        provider: 'kie',
        mode: modelForm.mode,
        modelId: modelForm.modelId,
        name: `Current custom: ${modelForm.modelId}`,
        description: modelForm.description || 'Current saved provider model.',
        supportedRatios: splitCsv(modelForm.supportedRatios),
        supportedQualities: splitCsv(modelForm.supportedQualities),
        supportsResolution: modelForm.supportsResolution,
        sortOrder: normalizeSortOrder(modelForm.sortOrder)
      } satisfies ProviderGenerationModelOption,
      ...providerModels
    ];
  }, [modelForm, providerModels]);

  const models = useMemo(
    () =>
      [...(data?.value?.models ?? [])].sort(
        (left, right) => left.mode.localeCompare(right.mode) || left.sortOrder - right.sortOrder
      ),
    [data]
  );

  const socialPresets = useMemo(
    () =>
      [...(data?.value?.socialPresets ?? [])].sort(
        (left, right) =>
          left.mode.localeCompare(right.mode) ||
          left.platform.localeCompare(right.platform) ||
          left.sortOrder - right.sortOrder
      ),
    [data]
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['generation-options'] })
    ]);
  };

  const saveModelMutation = useMutation({
    mutationFn: async (payload: UpsertGenerationModelOptionPayload) => {
      if (editingModelId) {
        return updateGenerationModelOption(editingModelId, payload);
      }
      return createGenerationModelOption(payload);
    },
    onSuccess: async (response) => {
      if (!response.isSuccess) {
        toast.error(response.error?.description || 'Failed to save model option.');
        return;
      }
      toast.success(editingModelId ? 'Model option updated.' : 'Model option created.');
      setEditingModelId(null);
      setModelForm(EMPTY_MODEL_FORM);
      await invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to save model option.');
    }
  });

  const saveSocialMutation = useMutation({
    mutationFn: async (payload: UpsertGenerationSocialPresetPayload) => {
      if (editingPresetId) {
        return updateGenerationSocialPreset(editingPresetId, payload);
      }
      return createGenerationSocialPreset(payload);
    },
    onSuccess: async (response) => {
      if (!response.isSuccess) {
        toast.error(response.error?.description || 'Failed to save social preset.');
        return;
      }
      toast.success(editingPresetId ? 'Social preset updated.' : 'Social preset created.');
      setEditingPresetId(null);
      setSocialForm(EMPTY_SOCIAL_FORM);
      await invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to save social preset.');
    }
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteGenerationModelOption,
    onSuccess: async () => {
      toast.success('Model option hidden.');
      await invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete model option.');
    }
  });

  const deleteSocialMutation = useMutation({
    mutationFn: deleteGenerationSocialPreset,
    onSuccess: async () => {
      toast.success('Social preset hidden.');
      await invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete social preset.');
    }
  });

  const handleModelModeChange = (mode: GenerationModeOption) => {
    setModelForm((prev) => ({
      ...prev,
      mode,
      modelId: '',
      name: '',
      description: '',
      supportedRatios: mode === 'video' ? '16:9, 9:16, auto' : '1:1, 16:9',
      supportedQualities: '',
      supportsResolution: false
    }));
  };

  const handleProviderModelChange = (modelId: string) => {
    const selected = providerModels.find((item) => item.modelId === modelId);
    if (!selected) {
      setModelForm((prev) => ({ ...prev, modelId }));
      return;
    }

    setModelForm((prev) => ({
      ...prev,
      ...providerModelToFormPatch(selected),
      isActive: prev.isActive
    }));
  };

  const submitModel = () => {
    const payload = modelPayloadFromForm(modelForm);
    if (!payload.modelId || !payload.name || payload.supportedRatios.length === 0) {
      toast.error('Model id, name, and at least one ratio are required.');
      return;
    }

    if (!editingModelId && models.some((model) => model.modelId === payload.modelId)) {
      toast.error('This model already exists. Please choose a different one.');
      return;
    }

    saveModelMutation.mutate(payload);
  };

  const submitSocial = () => {
    const payload = socialPayloadFromForm(socialForm);
    if (
      !payload.platform ||
      !payload.label ||
      !payload.contentType ||
      !payload.contentLabel ||
      payload.supportedRatios.length === 0 ||
      !payload.defaultRatio
    ) {
      toast.error('Platform, labels, content type, ratios, and default ratio are required.');
      return;
    }
    saveSocialMutation.mutate(payload);
  };

  return (
    <section className='space-y-5'>
      <div className='flex flex-col justify-between gap-3 rounded-xl border border-white/8 bg-[#13131e] p-4 lg:flex-row lg:items-center'>
        <div>
          <p className='text-[12px] uppercase tracking-[0.16em] text-slate-500'>AI Generation Catalog</p>
          <p className='mt-1 text-sm text-slate-300'>
            Admin changes here control the model, ratio, quality, and social preset options shown to users.
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          onClick={() => void refetch()}
          disabled={isFetching}
          className='h-9 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
        >
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className='rounded-lg bg-red-500/10 px-4 py-3 text-[13px] text-red-300'>
          {error instanceof Error ? error.message : 'Failed to load generation options.'}
        </div>
      )}

      <div className='grid gap-5 xl:grid-cols-2'>
        <div className='rounded-xl border border-white/8 bg-[#10101a] p-4'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-base font-semibold text-white'>Models</h2>
              <p className='mt-1 text-[13px] text-slate-400'>Shown in the image and video model dropdowns.</p>
            </div>
            {editingModelId && (
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setEditingModelId(null);
                  setModelForm(EMPTY_MODEL_FORM);
                }}
                className='h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
              >
                <X className='size-4' />
                Cancel
              </Button>
            )}
          </div>

          <div className='grid gap-3 md:grid-cols-2'>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Mode</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='h-10 w-full justify-between rounded-lg border border-white/10 bg-[#0b0b13] px-3 text-sm font-normal text-white hover:bg-white/5 focus:border-violet-400/60'
                  >
                    <span className='capitalize'>{modelForm.mode}</span>
                    <ChevronDown className='ml-2 size-4 text-slate-400' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
                  className='border-white/10 bg-[#0b0b13] text-white'
                >
                  <DropdownMenuItem
                    className='cursor-pointer hover:bg-white/5 focus:bg-white/5'
                    onClick={() => handleModelModeChange('image')}
                  >
                    Image
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='cursor-pointer hover:bg-white/5 focus:bg-white/5'
                    onClick={() => handleModelModeChange('video')}
                  >
                    Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Sort</span>
              <input
                value={modelForm.sortOrder}
                onChange={(event) => setModelForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                className={fieldClass}
                inputMode='numeric'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Provider Model ID</span>
              <ProviderModelPicker
                value={modelForm.modelId}
                options={providerModelOptions}
                isLoading={isLoadingProviderModels}
                onChange={handleProviderModelChange}
              />
              <span className='text-[11px] text-slate-500'>
                Selecting a model fills the name, ratios, and quality fields.
              </span>
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Display Name</span>
              <input
                value={modelForm.name}
                onChange={(event) => setModelForm((prev) => ({ ...prev, name: event.target.value }))}
                className={fieldClass}
                placeholder='Nano Banana Pro'
              />
            </label>
            <label className='flex flex-col gap-1.5 md:col-span-2'>
              <span className={labelClass}>Description</span>
              <textarea
                value={modelForm.description}
                onChange={(event) => setModelForm((prev) => ({ ...prev, description: event.target.value }))}
                className={textareaClass}
                placeholder='Short dropdown description'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Ratios</span>
              <input
                value={modelForm.supportedRatios}
                onChange={(event) => setModelForm((prev) => ({ ...prev, supportedRatios: event.target.value }))}
                className={fieldClass}
                placeholder='1:1, 16:9, 9:16'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Qualities</span>
              <input
                value={modelForm.supportedQualities}
                onChange={(event) => setModelForm((prev) => ({ ...prev, supportedQualities: event.target.value }))}
                className={fieldClass}
                placeholder='1K, 2K, 4K'
              />
            </label>
            <label className='flex items-center gap-2 text-sm text-slate-300'>
              <input
                type='checkbox'
                checked={modelForm.supportsResolution}
                onChange={(event) => setModelForm((prev) => ({ ...prev, supportsResolution: event.target.checked }))}
                className='size-4 accent-violet-500'
              />
              Show quality picker
            </label>
            <label className='flex items-center gap-2 text-sm text-slate-300'>
              <input
                type='checkbox'
                checked={modelForm.isActive}
                onChange={(event) => setModelForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className='size-4 accent-violet-500'
              />
              Visible to users
            </label>
          </div>

          <Button
            type='button'
            onClick={submitModel}
            disabled={saveModelMutation.isPending}
            className='mt-4 h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
          >
            <Save className='size-4' />
            {saveModelMutation.isPending ? 'Saving...' : editingModelId ? 'Update model' : 'Add model'}
          </Button>

          <div className='mt-5 space-y-3'>
            {isLoading ? (
              <div className='rounded-lg border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400'>
                Loading models...
              </div>
            ) : (
              models.map((item) => (
                <div key={item.id} className='rounded-lg border border-white/8 bg-white/[0.03] p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-semibold text-white'>{item.name}</span>
                        <span className='rounded-full bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-300'>
                          {item.mode}
                        </span>
                        {statusPill(item.isActive)}
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>{item.modelId}</p>
                      <p className='mt-2 text-xs text-slate-400'>{item.description || 'No description'}</p>
                    </div>
                    <div className='flex shrink-0 gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          setEditingModelId(item.id);
                          setModelForm(modelToForm(item));
                        }}
                        className='h-8 border-white/10 bg-transparent px-2 text-slate-300 hover:bg-white/5 hover:text-white'
                      >
                        <Edit3 className='size-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          if (window.confirm(`Hide ${item.name} from users?`)) {
                            deleteModelMutation.mutate(item.id);
                          }
                        }}
                        className='h-8 border-red-400/20 bg-transparent px-2 text-red-300 hover:bg-red-500/10 hover:text-red-200'
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2'>
                    <span>Ratios: {listText(item.supportedRatios)}</span>
                    <span>Qualities: {listText(item.supportedQualities)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className='rounded-xl border border-white/8 bg-[#10101a] p-4'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-base font-semibold text-white'>Social Presets</h2>
              <p className='mt-1 text-[13px] text-slate-400'>Shown in Socials and video preset controls.</p>
            </div>
            {editingPresetId && (
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setEditingPresetId(null);
                  setSocialForm(EMPTY_SOCIAL_FORM);
                }}
                className='h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
              >
                <X className='size-4' />
                Cancel
              </Button>
            )}
          </div>

          <div className='grid gap-3 md:grid-cols-2'>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Mode</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='h-10 w-full justify-between rounded-lg border border-white/10 bg-[#0b0b13] px-3 text-sm font-normal text-white hover:bg-white/5 focus:border-violet-400/60'
                  >
                    <span className='capitalize'>{socialForm.mode}</span>
                    <ChevronDown className='ml-2 size-4 text-slate-400' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
                  className='border-white/10 bg-[#0b0b13] text-white'
                >
                  <DropdownMenuItem
                    className='cursor-pointer hover:bg-white/5 focus:bg-white/5'
                    onClick={() => setSocialForm((prev) => ({ ...prev, mode: 'image' }))}
                  >
                    Image
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='cursor-pointer hover:bg-white/5 focus:bg-white/5'
                    onClick={() => setSocialForm((prev) => ({ ...prev, mode: 'video' }))}
                  >
                    Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Sort</span>
              <input
                value={socialForm.sortOrder}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                className={fieldClass}
                inputMode='numeric'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Platform Key</span>
              <input
                value={socialForm.platform}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, platform: event.target.value }))}
                className={fieldClass}
                placeholder='facebook'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Platform Label</span>
              <input
                value={socialForm.label}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, label: event.target.value }))}
                className={fieldClass}
                placeholder='Facebook'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Content Type</span>
              <input
                value={socialForm.contentType}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, contentType: event.target.value }))}
                className={fieldClass}
                placeholder='post'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Content Label</span>
              <input
                value={socialForm.contentLabel}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, contentLabel: event.target.value }))}
                className={fieldClass}
                placeholder='Post'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Ratios</span>
              <input
                value={socialForm.supportedRatios}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, supportedRatios: event.target.value }))}
                className={fieldClass}
                placeholder='1:1, 16:9'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className={labelClass}>Default Ratio</span>
              <input
                value={socialForm.defaultRatio}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, defaultRatio: event.target.value }))}
                className={fieldClass}
                placeholder='1:1'
              />
            </label>
            <label className='flex items-center gap-2 text-sm text-slate-300 md:col-span-2'>
              <input
                type='checkbox'
                checked={socialForm.isActive}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className='size-4 accent-violet-500'
              />
              Visible to users
            </label>
          </div>

          <Button
            type='button'
            onClick={submitSocial}
            disabled={saveSocialMutation.isPending}
            className='mt-4 h-9 bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-700'
          >
            <Save className='size-4' />
            {saveSocialMutation.isPending ? 'Saving...' : editingPresetId ? 'Update preset' : 'Add preset'}
          </Button>

          <div className='mt-5 space-y-3'>
            {isLoading ? (
              <div className='rounded-lg border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400'>
                Loading presets...
              </div>
            ) : (
              socialPresets.map((item) => (
                <div key={item.id} className='rounded-lg border border-white/8 bg-white/[0.03] p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-semibold text-white'>
                          {item.label} / {item.contentLabel}
                        </span>
                        <span className='rounded-full bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-300'>
                          {item.mode}
                        </span>
                        {statusPill(item.isActive)}
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        {item.platform}.{item.contentType} - default {item.defaultRatio}
                      </p>
                    </div>
                    <div className='flex shrink-0 gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          setEditingPresetId(item.id);
                          setSocialForm(socialPresetToForm(item));
                        }}
                        className='h-8 border-white/10 bg-transparent px-2 text-slate-300 hover:bg-white/5 hover:text-white'
                      >
                        <Edit3 className='size-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          if (window.confirm(`Hide ${item.label} ${item.contentLabel} from users?`)) {
                            deleteSocialMutation.mutate(item.id);
                          }
                        }}
                        className='h-8 border-red-400/20 bg-transparent px-2 text-red-300 hover:bg-red-500/10 hover:text-red-200'
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </div>
                  <p className='mt-3 text-xs text-slate-400'>Ratios: {listText(item.supportedRatios)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
