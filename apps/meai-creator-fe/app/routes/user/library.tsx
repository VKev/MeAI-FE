import type { Route } from './+types/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { fetchResources, uploadResource, deleteResource, fetchStorageUsage } from '@/services/client/resource.client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CloudDownload,
  Eye,
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Library as LibraryIcon,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  Wand2,
  Sparkles,
  RefreshCw,
  MonitorIcon
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import type { TPostPreparePayload } from '@/models/post-prepare.model';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';
import { fetchWorkspaces } from '@/services/client/workspace.client';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import { useCurrentUser } from '@/utils/user-state';
import { resolveMediaFormatLabel } from '@/utils/media-format';
import { fetchWorkspaceSocialMedias } from '@/services/client/workspace-social-media.client';

const LIBRARY_PAGE_SIZE = 20;
const FILE_INPUT_ACCEPT = 'image/*,video/*';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function parseApiDate(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().replace(/^"+|"+$/g, '');

  const isoMatch = normalizedValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/);
  const candidate = isoMatch?.[0] ?? normalizedValue;
  const parsedDate = new Date(candidate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function toUpperValue(value: string | null) {
  return value?.toUpperCase() ?? '';
}

function getResourceKind(resource: Resource) {
  const resourceType = toUpperValue(resource.resourceType);
  const contentType = resource.contentType?.toLowerCase() ?? '';

  if (resourceType === 'IMAGE' || contentType.startsWith('image/')) {
    return 'IMAGE';
  }

  if (resourceType === 'VIDEO' || contentType.startsWith('video/')) {
    return 'VIDEO';
  }

  return 'OTHER';
}

function formatRelativeDate(value: string | null) {
  const date = parseApiDate(value);
  if (!date) {
    return 'Unknown time';
  }

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const absSeconds = Math.abs(diffInSeconds);

  if (absSeconds < 60) {
    return formatter.format(diffInSeconds, 'second');
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, 'minute');
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, 'hour');
  }

  const diffInDays = Math.round(diffInHours / 24);
  return formatter.format(diffInDays, 'day');
}

function formatFileName(link: string) {
  try {
    const url = new URL(link);
    const fileName = url.pathname.split('/').filter(Boolean).at(-1);
    return fileName || 'resource-file';
  } catch {
    return 'resource-file';
  }
}

function formatResourceTitle(resource: Resource) {
  const subtype = resource.contentType?.split('/').at(1)?.split(';').at(0)?.trim() ?? '';
  const normalizedSubtype = subtype.replace(/[._-]+/g, ' ').trim();
  const subtypeLabel = normalizedSubtype
    ? normalizedSubtype.length <= 4
      ? normalizedSubtype.toUpperCase()
      : normalizedSubtype.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null;

  switch (getResourceKind(resource)) {
    case 'IMAGE':
      return subtypeLabel ? `${subtypeLabel} image` : 'Image';
    case 'VIDEO':
      return subtypeLabel ? `${subtypeLabel} video` : 'Video';
    default:
      return subtypeLabel ? subtypeLabel : 'File';
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return null;
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function inferUploadResourceType(file: File | null) {
  if (!file) {
    return null;
  }

  if (file.type.startsWith('image/')) {
    return 'IMAGE' as const;
  }

  if (file.type.startsWith('video/')) {
    return 'VIDEO' as const;
  }

  return null;
}

type ResourcePreviewProps = {
  resource: Resource;
  hasPreviewError: boolean;
  onPreviewError: (resourceId: string) => void;
};

function ResourcePreview({ resource, hasPreviewError, onPreviewError }: ResourcePreviewProps) {
  const resourceKind = getResourceKind(resource);
  const hasLink = Boolean(resource.link);
  const isPreviewableMedia = resourceKind === 'IMAGE' || resourceKind === 'VIDEO';

  if (!hasLink) {
    return (
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#080a12] text-white/65'>
        <FolderOpen className='h-8 w-8 text-white/45' />
        <p className='text-xs tracking-wide uppercase'>Preview unavailable</p>
      </div>
    );
  }

  if (!isPreviewableMedia) {
    return (
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#080a12] text-white/70'>
        <FileText className='h-8 w-8 text-white/45' />
        <p className='text-xs tracking-wide uppercase'>Document resource</p>
      </div>
    );
  }

  if (hasPreviewError) {
    return (
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#080a12] text-white/70'>
        <FolderOpen className='h-8 w-8 text-white/45' />
        <p className='text-xs tracking-wide uppercase'>Preview unavailable</p>
      </div>
    );
  }

  if (resourceKind === 'IMAGE') {
    return (
      <img
        src={resource.link}
        alt='Resource preview'
        loading='lazy'
        className='absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105'
        onError={() => onPreviewError(resource.id)}
      />
    );
  }

  if (resourceKind === 'VIDEO') {
    return (
      <video
        src={resource.link}
        muted
        playsInline
        preload='metadata'
        className='absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105'
        onError={() => onPreviewError(resource.id)}
      />
    );
  }

  return (
    <video
      src={resource.link}
      muted
      playsInline
      preload='metadata'
      className='absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105'
      onError={() => onPreviewError(resource.id)}
    />
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatBytesInUnit(bytes: number, unitIndex: number, decimals = 1) {
  if (bytes === 0) return '0';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const normalizedValue = bytes / Math.pow(k, unitIndex);

  return parseFloat(normalizedValue.toFixed(dm)).toString();
}

function formatExactStorageAmount(bytes: number | null | undefined) {
  const normalizedBytes = Math.max(0, bytes ?? 0);
  return `${formatBytes(normalizedBytes)} (${normalizedBytes.toLocaleString()} bytes)`;
}

function StorageProgress() {
  const { data: storage } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: () => fetchStorageUsage()
  });

  if (!storage) return null;

  const used = Math.max(0, storage.usedBytes ?? 0);
  const total = Math.max(0, storage.quotaBytes ?? 0);
  const available = Math.max(0, storage.availableBytes ?? Math.max(0, total - used));
  const usagePercent = Number(storage.usagePercent ?? 0);
  const percent = Number.isFinite(usagePercent) ? Math.max(0, Math.min(100, usagePercent)) : 0;
  const roundedPercent = Math.floor(percent);
  const totalUnitIndex = total > 0 ? Math.max(0, Math.floor(Math.log(total) / Math.log(1024))) : 0;
  const totalUnitLabel = ['B', 'KB', 'MB', 'GB', 'TB'][totalUnitIndex] ?? 'B';
  const tooltipUsagePercent = Number.isFinite(usagePercent) ? `${usagePercent.toFixed(2)}%` : 'Unavailable';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className='group relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]'>
          <div className='absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
            <div className='absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl' />
          </div>

          <div className='relative flex h-full flex-col justify-between gap-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Storage Capacity</p>

                <div className='mt-3 flex items-end gap-2'>
                  <span className='text-3xl font-bold leading-none text-white'>
                    {formatBytesInUnit(used, totalUnitIndex)}
                  </span>
                  <span className='mb-0.5 text-sm text-slate-400'>
                    /{formatBytesInUnit(total, totalUnitIndex)}
                    {totalUnitLabel}
                  </span>
                </div>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-md font-bold tracking-wide ${
                  roundedPercent > 90
                    ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                    : roundedPercent > 70
                      ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                      : 'border-violet-400/20 bg-violet-500/10 text-violet-200'
                }`}
              >
                {roundedPercent}%
              </div>
            </div>

            <div>
              <div className='relative h-2 overflow-hidden rounded-full bg-white/5'>
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
                    roundedPercent > 90 ? 'bg-rose-500' : roundedPercent > 70 ? 'bg-amber-400' : 'bg-violet-500'
                  }`}
                  style={{ width: `${roundedPercent}%` }}
                />

                <div className='absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.15),transparent)]' />
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side='top'
        sideOffset={8}
        className='max-w-xs border border-white/10 bg-[#0b1020] p-3 text-slate-200 shadow-2xl'
      >
        <div className='space-y-1.5 text-xs'>
          <div className='flex justify-between gap-6'>
            <span className='text-slate-400'>Used</span>
            <span className='font-medium text-white'>{formatExactStorageAmount(used)}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-slate-400'>Quota</span>
            <span className='font-medium text-white'>{formatExactStorageAmount(total)}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-slate-400'>Available</span>
            <span className='font-medium text-white'>{formatExactStorageAmount(available)}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-slate-400'>Usage</span>
            <span className='font-medium text-white'>{tooltipUsagePercent}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

type ResourceItemProps = {
  resource: Resource;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (resource: Resource) => void;
  onPreview: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
  previewError: boolean;
  onPreviewError: (id: string) => void;
  onRemix: (resource: Resource) => void;
};

function ResourceItem({
  resource,
  isSelected,
  isDeleting,
  onToggleSelect,
  onDelete,
  onPreview,
  onDownload,
  previewError,
  onPreviewError,
  onRemix
}: ResourceItemProps) {
  const type = getResourceKind(resource);

  return (
    <article
      onClick={() => onToggleSelect(resource.id)}
      className={`group relative aspect-video overflow-hidden rounded-2xl border cursor-pointer transition-all shadow-xl bg-neutral-900 ${
        isSelected ? 'border-violet-500 ring-1 ring-violet-500/40' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <ResourcePreview resource={resource} hasPreviewError={previewError} onPreviewError={onPreviewError} />

      {/* Hover Overlay */}
      <div className='absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[2px]' />

      {/* Action Icons (Top-Right) */}
      <div className='absolute right-2 top-2 flex translate-y-1 gap-1.5 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100'>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(resource);
          }}
          className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-violet-500 transition-colors'
          title='Preview'
        >
          <Eye className='h-4 w-4' />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(resource);
          }}
          className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-violet-500 transition-colors'
          title='Download'
        >
          <CloudDownload className='h-4 w-4' />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(resource);
          }}
          className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors'
          title='Delete'
        >
          {isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
        </button>
      </div>

      {/* Remix Button (Bottom-Right - if AI generated) */}
      {(resource.originKind === 'ai_generated' || resource.originKind === 'ai_imported_url') &&
        resource.originChatSessionId != null && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemix(resource);
            }}
            className='absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-violet-400'
            title='Remix'
          >
            <Sparkles className='h-4 w-4' />
          </button>
        )}

      {/* Resource Type Badge (Bottom-Left) */}
      <div className='absolute bottom-2 left-2'>
        <span className='rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-md'>
          {resolveMediaFormatLabel({ contentType: resource.contentType, url: resource.link, fallback: type })}
        </span>
      </div>

      {/* Selection Check (Top-Left) */}
      <div
        className={`absolute left-2 top-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-md border transition-all ${
            isSelected ? 'border-violet-400 bg-violet-500' : 'border-white/20 bg-black/40'
          }`}
        >
          {isSelected && <Check className='h-3.5 w-3.5 text-white' />}
        </div>
      </div>
    </article>
  );
}

export default function Library() {
  type PreviewResource = {
    id: string;
    link: string;
    fileName: string;
    kind: 'IMAGE' | 'VIDEO';
  };

  type WorkspaceOption = {
    id: string;
    name: string;
    type: string | null;
  };

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type?: string }) => {
      return await uploadResource(file, type, undefined, 'user_upload');
    },
    onSuccess: () => {
      toast.success('Resource uploaded successfully.');
      setPreviewErrorIds(new Set());
      setSelectedUploadFileName(null);
      setSelectedUploadFileSize(null);
      setUploadResourceType(null);
      uploadFormRef.current?.reset();
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload resource.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      return await deleteResource(resourceId);
    },
    onSuccess: (_, resourceId) => {
      toast.success('Resource deleted successfully.');
      setPreviewResource((current) => {
        if (current && resourceId === current.id) {
          setPreviewVideoSize(null);
          return null;
        }
        return current;
      });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete resource.');
    }
  });
  const uploadFormId = useId();
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const [previewErrorIds, setPreviewErrorIds] = useState<Set<string>>(() => new Set());
  const [previewResource, setPreviewResource] = useState<PreviewResource | null>(null);
  const [previewVideoSize, setPreviewVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState<string | null>(null);
  const [selectedUploadFileName, setSelectedUploadFileName] = useState<string | null>(null);
  const [selectedUploadFileSize, setSelectedUploadFileSize] = useState<number | null>(null);
  const [uploadResourceType, setUploadResourceType] = useState<'IMAGE' | 'VIDEO' | null>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(new Set());
  const [userFilter, setUserFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [aiFilter, setAiFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>([]);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [isFetchingWorkspacesForPost, setIsFetchingWorkspacesForPost] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDeleteForDialog, setResourceToDeleteForDialog] = useState<{
    resource: Resource;
    label: string;
  } | null>(null);

  const { data: workspaceSocialMedias } = useQuery({
    queryKey: ['workspace-social-medias', selectedWorkspaceId],
    queryFn: () => fetchWorkspaceSocialMedias(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId
  });

  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['resources'],
      initialPageParam: null as ResourceCursor | null,
      refetchOnWindowFocus: false,
      queryFn: ({ pageParam, signal }) =>
        fetchResources({
          limit: LIBRARY_PAGE_SIZE,
          cursor: pageParam ?? undefined,
          signal
        }),
      getNextPageParam: (lastPage) => {
        if (lastPage.value.length < LIBRARY_PAGE_SIZE) {
          return undefined;
        }

        const lastItem = lastPage.value[lastPage.value.length - 1];

        if (!lastItem?.createdAt || !lastItem?.id) {
          return undefined;
        }

        return {
          cursorCreatedAt: lastItem.createdAt,
          cursorId: lastItem.id
        };
      }
    });

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '320px 0px' }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const { data: socialMediasData, isLoading: isLoadingSocialMedias } = useQuery({
    queryKey: ['social-medias'],
    queryFn: () => fetchSocialMedias()
  });

  const resources = useMemo(() => data?.pages.flatMap((page) => page.value) ?? [], [data]);

  const userUploads = useMemo(() => {
    return resources.filter((r) => {
      const isUser =
        r.originKind !== 'ai_generated' && r.originKind !== 'ai_imported_url' && !r.originKind?.includes('ai');
      if (!isUser) return false;
      if (userFilter === 'ALL') return true;
      return getResourceKind(r) === userFilter;
    });
  }, [resources, userFilter]);

  const aiGenerations = useMemo(() => {
    return resources.filter((r) => {
      const isAi =
        r.originKind === 'ai_generated' || r.originKind === 'ai_imported_url' || r.originKind?.includes('ai');
      if (!isAi) return false;
      if (aiFilter === 'ALL') return true;
      return getResourceKind(r) === aiFilter;
    });
  }, [resources, aiFilter]);

  const connectedSocialLinks = useMemo(() => socialMediasData?.value ?? [], [socialMediasData?.value]);

  const initialError = Boolean(error) && resources.length === 0;
  const backgroundError = Boolean(error) && resources.length > 0;
  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isLoadingSocialLinks = isLoadingSocialMedias;
  const deletingResourceId = deleteMutation.variables;

  const handleRemix = (resource: Resource) => {
    const directPath = `/ai-generation/${resource.originChatSessionId}`;
    navigate(directPath);
  };

  const handlePreviewError = (resourceId: string) => {
    setPreviewErrorIds((previous) => {
      if (previous.has(resourceId)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(resourceId);
      return next;
    });
  };

  const handleDownload = async (resource: Resource) => {
    if (!resource.link) {
      return;
    }

    setDownloadingResourceId(resource.id);
    const fileName = formatFileName(resource.link);

    try {
      const response = await fetch(resource.link);
      if (!response.ok) {
        throw new Error('Failed to download resource.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success('Download completed successfully.');
    } catch (downloadError) {
      toast.error('Failed to download resource. Please try again.');
    } finally {
      setDownloadingResourceId((current) => (current === resource.id ? null : current));
    }
  };

  const handleToggleSelect = (resourceId: string) => {
    setSelectedResourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedResourceIds(new Set());
  };

  const handleOpenWorkspaceDialog = async () => {
    if (selectedResourceIds.size === 0 || isFetchingWorkspacesForPost || isLoadingSocialLinks) {
      return;
    }

    if (connectedSocialLinks.length === 0) {
      toast.error(
        'No social media accounts connected. Please connect at least one social media account to use this feature.'
      );
      return;
    }

    setIsFetchingWorkspacesForPost(true);

    try {
      const wsResponse = await fetchWorkspaces();
      const workspaces = (wsResponse.value ?? []).map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        type: workspace.type
      }));

      if (workspaces.length === 0) {
        toast.error('No workspace found. Please create a workspace first.');
        return;
      }

      setWorkspaceOptions(workspaces);
      setSelectedWorkspaceId((current) => current || workspaces[0].id);
      setWorkspaceDialogOpen(true);
    } catch {
      toast.error('Failed to fetch workspaces. Please try again.');
    } finally {
      setIsFetchingWorkspacesForPost(false);
    }
  };

  const handleConfirmWorkspace = () => {
    if (selectedResourceIds.size === 0 || !selectedWorkspaceId) {
      return;
    }

    // validate selectedWorkspaceId phải có social links đã kết nối
    if (!workspaceSocialMedias || !Array.isArray(workspaceSocialMedias) || workspaceSocialMedias.length === 0) {
      toast.error('Please connect at least one social media account to the selected workspace to use this feature.');
      return;
    }

    const allResourceIds = resources
      .filter((resource) => selectedResourceIds.has(resource.id))
      .map((resource) => resource.id);

    const payload: TPostPreparePayload = {
      workspaceId: selectedWorkspaceId,
      instruction: null,
      language: 'vi',
      postType: null,
      resourceIds: allResourceIds,
      socialMedia: [
        { socialMediaId: null, type: 'reel', platform: 'tiktok' },
        { socialMediaId: null, type: 'post', platform: 'facebook' },
        { socialMediaId: null, type: 'post', platform: 'instagram' },
        { socialMediaId: null, type: 'post', platform: 'threads' }
      ]
    };

    setWorkspaceDialogOpen(false);
    preparePostMutation(payload);
  };

  const { mutateAsync: preparePostMutation, isPending: isPreparingPost } = useMutation({
    mutationFn: async (payload: TPostPreparePayload) => {
      return await PostPrepareClientApi.createPostPrepare(payload);
    },
    onSuccess: (data) => {
      const postBuilderId = data.value.postBuilderId;
      const wsId = data.value.workspaceId;
      toast.success('Post preparation successful! Redirecting to Post Builder...');
      setSelectedResourceIds(new Set());
      navigate(`/workspace/${wsId}/post-builder/${postBuilderId}`);
    },
    onError: (error) => {
      console.error('Post Prepare Failed:', error);
      toast.error('Failed to prepare post. Please try again.');
    }
  });

  const handleProcessPostBuilder = async () => {
    await handleOpenWorkspaceDialog();
  };

  const handleDeleteResource = (resource: Resource, resourceLabel: string) => {
    if (isDeleting) return;
    setResourceToDeleteForDialog({ resource, label: resourceLabel });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteResource = () => {
    if (!resourceToDeleteForDialog) return;
    deleteMutation.mutate(resourceToDeleteForDialog.resource.id);
    setDeleteDialogOpen(false);
    setResourceToDeleteForDialog(null);
  };

  return (
    <div className='relative'>
      <div className='relative z-10 space-y-6'>
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <LibraryIcon className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Library</h1>
              <p className='text-sm leading-relaxed text-slate-400'>
                Manage your uploads, AI generations, and storage usage from one place.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {Number(user?.meAiCoin || 0) > 0 && (
              <Button
                variant='outline'
                size='lg'
                className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30'
                onClick={() => window.location.assign('/editor')}
              >
                <MonitorIcon className='h-4 w-4' />
                Go to Editor
              </Button>
            )}
            <Button
              variant='outline'
              size={'lg'}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
              onClick={() => void refetch()}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </section>

        {!isLoading && !initialError && (
          <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {[
              {
                label: 'Total Resources',
                value: resources.length,
                icon: LibraryIcon,
                color: 'violet',
                sub: 'All available assets'
              },
              {
                label: 'User Uploads',
                value: userUploads.length,
                icon: UploadCloud,
                color: 'sky',
                sub: 'Uploaded by users'
              },
              {
                label: 'AI Generations',
                value: aiGenerations.length,
                icon: Wand2,
                color: 'amber',
                sub: 'Generated with AI'
              }
            ].map((item) => {
              const Icon = item.icon;
              const accentClass =
                item.color === 'amber'
                  ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                  : item.color === 'sky'
                    ? 'border-sky-400/20 bg-sky-500/10 text-sky-200'
                    : 'border-violet-400/20 bg-violet-500/10 text-violet-200';

              return (
                <div
                  key={item.label}
                  className='group relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]'
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

                      <p className='mt-2 text-sm text-slate-400'>{item.sub}</p>
                    </div>

                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-xl ${accentClass}`}
                    >
                      <Icon className='h-6 w-6' />
                    </div>
                  </div>
                </div>
              );
            })}

            <StorageProgress />
          </section>
        )}

        {/* Hidden File Input */}
        <input
          id={uploadFormId}
          type='file'
          accept={FILE_INPUT_ACCEPT}
          size={MAX_FILE_SIZE}
          onChange={(e) => {
            const file = e.target.files?.[0];
            const type = inferUploadResourceType(file ?? null);
            if (file && type) {
              uploadMutation.mutate({ file, type });
            } else if (file) {
              toast.error('Only image and video files are allowed.');
            }
          }}
          className='sr-only'
        />

        {backgroundError && (
          <section className='flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-amber-100'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            <p className='text-sm'>{error?.message || 'Could not refresh. Showing current items.'}</p>
          </section>
        )}

        {isLoading && (
          <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`library-skeleton-${index}`}
                className='overflow-hidden rounded-2xl border border-white/10 bg-white/4'
              >
                <div className='aspect-video animate-pulse bg-white/10' />
                <div className='space-y-3 p-4'>
                  <div className='h-4 w-2/3 animate-pulse rounded bg-white/10' />
                  <div className='h-3 w-1/2 animate-pulse rounded bg-white/10' />
                  <div className='h-9 w-full animate-pulse rounded-lg bg-white/10' />
                </div>
              </div>
            ))}
          </section>
        )}

        {initialError && !isLoading && (
          <section className='mx-auto max-w-xl rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-center'>
            <AlertTriangle className='mx-auto h-9 w-9 text-rose-200' />
            <h2 className='mt-4 text-lg font-semibold text-white'>Could not load library</h2>
            <p className='mt-2 text-sm text-rose-100/80'>{error?.message || 'Try again.'}</p>
            <Button
              type='button'
              onClick={() => refetch()}
              className='mt-4 rounded-xl bg-rose-500/80 text-white hover:bg-rose-500'
            >
              <RefreshCw className='h-4 w-4' />
              Retry
            </Button>
          </section>
        )}

        {!isLoading && !initialError && (
          <div className='space-y-12'>
            {/* User Uploads Section */}
            <section className='space-y-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/3 text-white/70'>
                    <UploadCloud className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-white'>Uploads & Social Media</h2>
                    <p className='text-xs text-slate-400'>Uploaded and synced media from connected accounts</p>
                  </div>
                </div>

                <div className='flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 self-start sm:self-auto'>
                  {(['ALL', 'IMAGE', 'VIDEO'] as const).map((f) => (
                    <button
                      key={`user-filter-${f}`}
                      onClick={() => setUserFilter(f)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg ${
                        userFilter === f
                          ? 'bg-violet-500 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {/* Upload Card */}
                <button
                  type='button'
                  onClick={() => document.getElementById(uploadFormId)?.click()}
                  disabled={isUploading}
                  className='group relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/5 transition-all hover:border-violet-500/50 hover:bg-white/[0.07] active:scale-[0.98]'
                >
                  {isUploading ? (
                    <Loader2 className='h-8 w-8 animate-spin text-white/70' />
                  ) : (
                    <div className='flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/3 text-white/70 shadow-lg transition-transform group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white'>
                      <Plus className='h-6 w-6' />
                    </div>
                  )}
                  <div className='text-center'>
                    <span className='block text-sm font-semibold text-slate-300 group-hover:text-white'>
                      {isUploading ? 'Uploading...' : 'Upload New'}
                    </span>
                    <span className='text-[10px] text-slate-500'>Images or Videos</span>
                  </div>
                </button>

                {userUploads.map((resource) => (
                  <ResourceItem
                    key={resource.id}
                    resource={resource}
                    isSelected={selectedResourceIds.has(resource.id)}
                    isDeleting={deletingResourceId === resource.id}
                    onToggleSelect={handleToggleSelect}
                    onDelete={(r) => handleDeleteResource(r, formatResourceTitle(r))}
                    onPreview={(r) => {
                      const type = getResourceKind(r);
                      setPreviewVideoSize(null);
                      setPreviewResource({
                        id: r.id,
                        link: r.link,
                        fileName: formatResourceTitle(r),
                        kind: type === 'IMAGE' ? 'IMAGE' : 'VIDEO'
                      });
                    }}
                    onDownload={handleDownload}
                    previewError={previewErrorIds.has(resource.id)}
                    onPreviewError={handlePreviewError}
                    onRemix={handleRemix}
                  />
                ))}
              </div>
            </section>

            {/* AI Generations Section */}
            <section className='space-y-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/3 text-white/70'>
                    <Wand2 className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-white'>AI Generations</h2>
                    <p className='text-xs text-slate-400'>Masterpieces crafted by MeAI</p>
                  </div>
                </div>

                <div className='flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 self-start sm:self-auto'>
                  {(['ALL', 'IMAGE', 'VIDEO'] as const).map((f) => (
                    <button
                      key={`ai-filter-${f}`}
                      onClick={() => setAiFilter(f)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg ${
                        aiFilter === f
                          ? 'bg-violet-500 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {aiGenerations.length === 0 ? (
                <div className='flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/2 py-20 text-center'>
                  <div className='mb-4 rounded-full bg-white/5 p-4'>
                    <ImageIcon className='h-8 w-8 text-white/20' />
                  </div>
                  <p className='text-sm font-medium text-slate-400'>No AI generated resources found.</p>
                  <p className='mt-1 text-xs text-slate-600'>Start a chat to generate amazing assets!</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {aiGenerations.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      isSelected={selectedResourceIds.has(resource.id)}
                      isDeleting={deletingResourceId === resource.id}
                      onToggleSelect={handleToggleSelect}
                      onDelete={(r) => handleDeleteResource(r, formatResourceTitle(r))}
                      onPreview={(r) => {
                        const type = getResourceKind(r);
                        setPreviewVideoSize(null);
                        setPreviewResource({
                          id: r.id,
                          link: r.link,
                          fileName: formatResourceTitle(r),
                          kind: type === 'IMAGE' ? 'IMAGE' : 'VIDEO'
                        });
                      }}
                      onDownload={handleDownload}
                      previewError={previewErrorIds.has(resource.id)}
                      onPreviewError={handlePreviewError}
                      onRemix={handleRemix}
                    />
                  ))}
                </div>
              )}
            </section>

            <div ref={loadMoreTriggerRef} className='flex justify-center'>
              {hasNextPage ? (
                <Button
                  type='button'
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className='rounded-xl border border-white/15 bg-white/6 px-6 text-white hover:bg-white/12'
                >
                  {isFetchingNextPage ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <ImageIcon className='h-4 w-4' />
                  )}
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </Button>
              ) : (
                <p className='text-xs text-slate-400'>All items loaded.</p>
              )}
            </div>
          </div>
        )}

        {/* Post Builder Selection Bar */}
        {selectedResourceIds.size > 0 && (
          <div className='fixed bottom-8 left-1/2 z-50 -translate-x-1/2'>
            <div className='flex items-center gap-6 rounded-2xl border border-white/20 bg-neutral-900/90 px-6 py-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-300'>
              <div className='flex flex-col'>
                <span className='text-sm font-bold text-white'>{selectedResourceIds.size} Selected</span>
                <button
                  type='button'
                  onClick={handleClearSelection}
                  className='text-left text-[10px] font-medium text-slate-400 hover:text-white transition'
                >
                  Clear all
                </button>
              </div>

              <div className='h-8 w-px bg-white/10' />

              <Button
                type='button'
                onClick={handleProcessPostBuilder}
                disabled={isPreparingPost || isFetchingWorkspacesForPost || isLoadingSocialLinks}
                className='h-12 rounded-xl bg-violet-600 px-6 font-bold text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20 active:scale-[0.98]'
              >
                {isLoadingSocialLinks
                  ? 'Loading social links...'
                  : isFetchingWorkspacesForPost
                    ? 'Loading workspaces...'
                    : 'Process to Post Builder'}
                {isPreparingPost || isFetchingWorkspacesForPost || isLoadingSocialLinks ? (
                  <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                ) : (
                  <ArrowRight className='ml-2 h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={Boolean(previewResource)} onOpenChange={(open) => !open && setPreviewResource(null)}>
        <DialogContent className='flex flex-col h-[96vh] w-[98vw] max-w-none overflow-hidden border border-white/15 bg-[#060912]'>
          {previewResource && (
            <>
              <div className='flex items-center justify-start gap-3 border-b border-white/10 px-4 py-3 sm:px-5'>
                <p className='text-sm font-medium text-white'>Media Preview</p>
                <a
                  href={previewResource.link}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center justify-center text-white'
                >
                  <ExternalLink className='size-5' />
                </a>
              </div>

              <div className='relative flex min-h-0 flex-1 items-center justify-center bg-black/40 p-3 sm:p-5 overflow-hidden'>
                {previewResource.kind === 'IMAGE' ? (
                  <img
                    src={previewResource.link}
                    alt='Preview'
                    className='max-h-full max-w-full rounded-md object-contain'
                  />
                ) : previewResource.kind === 'VIDEO' ? (
                  <video
                    src={previewResource.link}
                    controls
                    playsInline
                    preload='metadata'
                    className='max-h-full max-w-full rounded-md object-contain'
                  />
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setResourceToDeleteForDialog(null);
          }
        }}
      >
        <DialogContent className='max-w-md border border-white/15 bg-[#060912] text-white'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm font-semibold text-white'>Delete this resource?</p>
              <p className='text-xs leading-relaxed text-slate-300'>
                <span className='font-medium text-white'>{resourceToDeleteForDialog?.label}</span> will be removed from
                your library.
              </p>
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setResourceToDeleteForDialog(null);
                }}
                className='rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10'
              >
                Cancel
              </Button>
              <Button type='button' variant='destructive' onClick={confirmDeleteResource} className='rounded-xl'>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workspace Dialog */}
      <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
        <DialogContent className='max-w-lg border border-white/15 bg-[#060912] text-white'>
          <div className='space-y-4'>
            <div>
              <h2 className='text-lg font-semibold text-white'>Choose a workspace</h2>
              <p className='mt-1 text-sm text-slate-400'>Select the workspace where this post will be prepared.</p>
            </div>

            <div className='space-y-2'>
              {workspaceOptions.map((workspace) => (
                <label
                  key={workspace.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    selectedWorkspaceId === workspace.id
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/7'
                  }`}
                >
                  <input
                    type='radio'
                    name='workspace-selection'
                    value={workspace.id}
                    checked={selectedWorkspaceId === workspace.id}
                    onChange={() => setSelectedWorkspaceId(workspace.id)}
                    className='mt-1 h-4 w-4 accent-violet-500'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-white'>{workspace.name}</p>
                    <p className='mt-1 text-xs uppercase tracking-[0.16em] text-slate-500'>
                      {workspace.type || 'Workspace'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setWorkspaceDialogOpen(false)}
                className='rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10'
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={handleConfirmWorkspace}
                disabled={!selectedWorkspaceId || isPreparingPost}
                className='rounded-xl bg-violet-600 text-white hover:bg-violet-500'
              >
                Continue
                {isPreparingPost ? (
                  <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                ) : (
                  <ArrowRight className='ml-2 h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
