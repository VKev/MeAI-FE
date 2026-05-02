import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { fetchResources, uploadResource, deleteResource } from '@/services/client/resource.client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  RefreshCcw,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'react-toastify';
import type { TPostPreparePayload } from '@/models/post-prepare.model';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';

const LIBRARY_PAGE_SIZE = 20;



// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Preview Component ────────────────────────────────────────────────────────

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

// ── Main Component ───────────────────────────────────────────────────────────

export default function WorkspaceLibrary() {
  type PreviewResource = {
    id: string;
    link: string;
    fileName: string;
    kind: 'IMAGE' | 'VIDEO';
  };

  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const uploadMutation = useMutation({
    mutationFn: async ({ file, type, workspaceId }: { file: File; type?: string; workspaceId?: string }) => {
      return await uploadResource(file, type, workspaceId);
    },
    onSuccess: () => {
      toast.success('Resource uploaded successfully.');
      setPreviewErrorIds(new Set());
      setSelectedUploadFileName(null);
      setSelectedUploadFileSize(null);
      setUploadResourceType(null);
      uploadFormRef.current?.reset();
      queryClient.invalidateQueries({ queryKey: ['resources', workspaceId] });
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
      queryClient.invalidateQueries({ queryKey: ['resources', workspaceId] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete resource.');
    }
  });
  const uploadFormId = useId();
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const [previewErrorIds, setPreviewErrorIds] = useState<Set<string>>(() => new Set());
  const [previewResource, setPreviewResource] = useState<PreviewResource | null>(null);
  const [previewVideoSize, setPreviewVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState<string | null>(null);
  const [selectedUploadFileName, setSelectedUploadFileName] = useState<string | null>(null);
  const [selectedUploadFileSize, setSelectedUploadFileSize] = useState<number | null>(null);
  const [uploadResourceType, setUploadResourceType] = useState<'IMAGE' | 'VIDEO' | null>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(new Set());

  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['resources', workspaceId],
      initialPageParam: null as ResourceCursor | null,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      queryFn: ({ pageParam, signal }) =>
        fetchResources({
          limit: LIBRARY_PAGE_SIZE,
          cursor: pageParam ?? undefined,
          workspaceId,
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

  const resources = useMemo(() => data?.pages.flatMap((page) => page.value) ?? [], [data]);

  const initialError = Boolean(error) && resources.length === 0;
  const backgroundError = Boolean(error) && resources.length > 0;
  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const uploadSummaryFileName = selectedUploadFileName;
  const deletingResourceId = deleteMutation.variables;

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
    const fileName = formatResourceTitle(resource);

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

  const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const nextType = inferUploadResourceType(file);

    if (file && !nextType) {
      setSelectedUploadFileName(null);
      setSelectedUploadFileSize(null);
      setUploadResourceType(null);
      event.target.value = '';
      toast.error('Only image and video files are allowed.');
      return;
    }

    setSelectedUploadFileName(file?.name ?? null);
    setSelectedUploadFileSize(file?.size ?? null);
    setUploadResourceType(nextType);
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

  const { mutateAsync: preparePostMutation, isPending: isPreparingPost } = useMutation({
    mutationFn: async (payload: TPostPreparePayload) => {
      return await PostPrepareClientApi.createPostPrepare(payload);
    },
    onSuccess: (data) => {
      const postBuilderId = data.value.postBuilderId;
      toast.success('Post preparation successful! Redirecting to Post Builder...');
      setSelectedResourceIds(new Set());
      navigate(`/workspace/${workspaceId}/post-builder/${postBuilderId}`);
    },
    onError: (error) => {
      console.error('Post Prepare Failed:', error);
      toast.error('Failed to prepare post. Please try again.');
    }
  });

  const handleProcessPostBuilder = () => {
    if (selectedResourceIds.size === 0 || !workspaceId) return;

    const allResourceIds = Array.from(selectedResourceIds);
    const payload: TPostPreparePayload = {
      workspaceId,
      instruction: null,
      language: 'vi',
      postType: null,
      resourceIds: allResourceIds,
      socialMedia: [
        { socialMediaId: null, type: 'reel', platform: 'tiktok', resourceIds: allResourceIds },
        { socialMediaId: null, type: 'post', platform: 'facebook', resourceIds: allResourceIds },
        { socialMediaId: null, type: 'post', platform: 'instagram', resourceIds: allResourceIds },
        { socialMediaId: null, type: 'post', platform: 'threads', resourceIds: allResourceIds }
      ]
    };

    preparePostMutation(payload);
  };

  const handleDeleteResource = (resource: Resource, resourceLabel: string) => {
    if (isDeleting) {
      return;
    }

    toast(
      ({ closeToast }) => (
        <div className='min-w-[260px] space-y-3'>
          <div className='space-y-1'>
            <p className='text-sm font-semibold text-white'>Delete this resource?</p>
            <p className='text-xs leading-relaxed text-slate-300'>
              <span className='font-medium text-white'>{resourceLabel}</span> will be removed from your library.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              type='button'
              size='sm'
              variant='destructive'
              onClick={() => {
                deleteMutation.mutate(resource.id);
                closeToast?.();
              }}
              className='rounded-lg'
            >
              <Trash2 className='h-3.5 w-3.5' />
              Delete
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => closeToast?.()}
              className='rounded-lg border-white/15 bg-white/5 text-white hover:bg-white/10'
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false
      }
    );
  };

  return (
    <div className='relative min-h-screen py-6 sm:py-8'>
      <div className='relative z-10 space-y-5'>
        {/* ── Header ── */}
        <section className='overflow-hidden rounded-[28px] border border-white/[0.12] bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
          <div className='flex items-center'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Library</h1>
          </div>
        </section>

        {/* ── Upload Section ── */}
        <section className='rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,24,0.88)_0%,rgba(7,9,16,0.94)_100%)] p-5 shadow-[0_18px_45px_rgba(2,4,11,0.42)] sm:p-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-2xl border border-violet-300/20 bg-violet-500/12 p-3 text-violet-100'>
              <UploadCloud className='h-5 w-5' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold text-white'>Upload</h2>
              <p className='text-sm text-slate-300'>Images and videos only.</p>
            </div>
          </div>

          <form
            ref={uploadFormRef}
            onSubmit={(e) => {
              e.preventDefault();
              const fileInput = document.getElementById(uploadFormId) as HTMLInputElement;
              const file = fileInput?.files?.[0];
              if (!file || !uploadResourceType) return;
              uploadMutation.mutate({ file, type: uploadResourceType, workspaceId });
            }}
            className='mt-5 space-y-4'
          >
            <div className='rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 sm:p-5'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                <div className='space-y-1.5'>
                  <p className='text-sm font-medium text-white'>Select a file</p>
                  <div className='flex flex-wrap items-center gap-3 text-xs text-slate-400'>
                    <span>{uploadSummaryFileName || 'No file selected yet'}</span>
                    <span>{formatFileSize(selectedUploadFileSize) || 'Waiting for file'}</span>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                  <input
                    id={uploadFormId}
                    name='file'
                    type='file'
                    accept='image/*,video/*'
                    required
                    onChange={handleUploadFileChange}
                    className='sr-only'
                  />
                  <label
                    htmlFor={uploadFormId}
                    className='inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10'
                  >
                    <UploadCloud className='h-4 w-4' />
                    {uploadSummaryFileName ? 'Change file' : 'Select file'}
                  </label>
                  <Button
                    type='submit'
                    disabled={!selectedUploadFileName || !uploadResourceType || isUploading}
                    className='rounded-xl bg-violet-500 text-white hover:bg-violet-400 disabled:bg-violet-500/50'
                  >
                    {isUploading ? <Loader2 className='h-4 w-4 animate-spin' /> : <UploadCloud className='h-4 w-4' />}
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* ── Selection bar ── */}
        {!isLoading && !initialError && resources.length > 0 && (
          <section className='flex items-center justify-between rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4'>
            <div className='flex items-center gap-3'>
              <span className='text-sm text-slate-300'>
                {selectedResourceIds.size > 0
                  ? `${selectedResourceIds.size} selected`
                  : 'Click on resources to select them'}
              </span>
              {selectedResourceIds.size > 0 && (
                <button
                  type='button'
                  onClick={handleClearSelection}
                  className='text-xs text-slate-400 hover:text-white transition'
                >
                  Clear selection
                </button>
              )}
            </div>
            <Button
              type='button'
              onClick={handleProcessPostBuilder}
              disabled={selectedResourceIds.size === 0 || isPreparingPost}
              className='cursor-pointer rounded-xl bg-purple-600 text-white hover:bg-purple-700 px-4 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isPreparingPost ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Process to Post Builder ({selectedResourceIds.size})
              <ArrowRight className='h-4 w-4' />
            </Button>
          </section>
        )}

        {/* ── Background error ── */}
        {backgroundError && (
          <section className='flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-amber-100'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            <p className='text-sm'>{error?.message || 'Could not refresh. Showing current items.'}</p>
          </section>
        )}

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`library-skeleton-${index}`}
                className='overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]'
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

        {/* ── Initial error ── */}
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
              <RefreshCcw className='h-4 w-4' />
              Retry
            </Button>
          </section>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !initialError && resources.length === 0 && (
          <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center'>
            <LibraryIcon className='mx-auto h-10 w-10 text-white/40' />
            <h2 className='mt-4 text-xl font-semibold text-white'>No files yet</h2>
            <p className='mt-2 text-sm text-slate-300'>Upload an image or video to get started.</p>
          </section>
        )}

        {/* ── Resource grid ── */}
        {!isLoading && !initialError && resources.length > 0 && (
          <section className='space-y-5'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {resources.map((resource) => {
                const type = getResourceKind(resource);
                const resourceTitle = formatResourceTitle(resource);
                const canOpenInModal = (type === 'IMAGE' || type === 'VIDEO') && Boolean(resource.link);
                const updatedAtLabel = parseApiDate(resource.updatedAt)
                  ? formatRelativeDate(resource.updatedAt)
                  : 'None';
                const isSelected = selectedResourceIds.has(resource.id);

                return (
                  <article
                    key={resource.id}
                    onClick={() => handleToggleSelect(resource.id)}
                    className={`group overflow-hidden rounded-2xl border cursor-pointer transition-all shadow-[0_14px_36px_rgba(2,4,11,0.45)] bg-[linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.95)_100%)] ${
                      isSelected
                        ? 'border-violet-500 ring-1 ring-violet-500/40'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className='relative aspect-video overflow-hidden'>
                      <ResourcePreview
                        resource={resource}
                        hasPreviewError={previewErrorIds.has(resource.id)}
                        onPreviewError={handlePreviewError}
                      />
                      <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,14,0.06)_0%,rgba(6,8,14,0.64)_100%)]' />

                      <div className='absolute left-3 top-3 flex gap-2'>
                        <span className='rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/85'>
                          {type}
                        </span>
                      </div>

                      {/* Selection checkbox */}
                      <div className='absolute right-3 top-3 z-10'>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-md border transition-all ${
                            isSelected
                              ? 'border-violet-400 bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                              : 'border-white/20 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isSelected && <Check className='h-3.5 w-3.5 text-white' />}
                        </div>
                      </div>
                    </div>

                    <div className='space-y-4 p-4'>
                      <div>
                        <p className='truncate text-sm font-semibold text-white' title={resourceTitle}>
                          {resourceTitle}
                        </p>
                        <p className='mt-1 truncate text-xs text-slate-400'>
                          {parseApiDate(resource.updatedAt)
                            ? `Updated ${updatedAtLabel}`
                            : `Added ${formatRelativeDate(resource.createdAt)}`}
                        </p>
                      </div>

                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canOpenInModal) {
                              setPreviewVideoSize(null);
                              setPreviewResource({
                                id: resource.id,
                                link: resource.link,
                                fileName: resourceTitle,
                                kind: type
                              });
                              return;
                            }

                            window.open(resource.link, '_blank', 'noopener,noreferrer');
                          }}
                          className='inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.12]'
                        >
                          <Eye className='h-3.5 w-3.5' />
                          Preview
                        </button>
                        <button
                          type='button'
                          onClick={(e) => { e.stopPropagation(); handleDownload(resource); }}
                          disabled={downloadingResourceId === resource.id}
                          className='inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-300/35 bg-violet-500/15 px-3 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-500/25'
                        >
                          {downloadingResourceId === resource.id ? (
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                          ) : (
                            <CloudDownload className='h-3.5 w-3.5' />
                          )}
                          {downloadingResourceId === resource.id ? 'Downloading...' : 'Download'}
                        </button>
                        <Button
                          type='button'
                          variant='destructive'
                          onClick={(e) => { e.stopPropagation(); handleDeleteResource(resource, resourceTitle); }}
                          disabled={isDeleting}
                          className='rounded-lg border border-rose-300/30 bg-rose-500/12 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-rose-500/20'
                        >
                          {deletingResourceId === resource.id ? (
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                          ) : (
                            <Trash2 className='h-3.5 w-3.5' />
                          )}
                          {deletingResourceId === resource.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className='flex justify-center'>
              {hasNextPage ? (
                <Button
                  type='button'
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className='rounded-xl border border-white/15 bg-white/[0.06] px-6 text-white hover:bg-white/[0.12]'
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
          </section>
        )}
      </div>

      {/* ── Preview Dialog ── */}
      <Dialog open={Boolean(previewResource)} onOpenChange={(open) => !open && setPreviewResource(null)}>
        <DialogContent className='h-[96vh] w-[98vw] max-w-none overflow-hidden border border-white/15 bg-[#060912] p-0'>
          {previewResource && (
            <div className='flex h-full flex-col'>
              <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-white'>{previewResource.fileName}</p>
                </div>
                <a
                  href={previewResource.link}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white hover:bg-white/[0.12]'
                >
                  <ExternalLink className='h-3.5 w-3.5' />
                  New tab
                </a>
              </div>

              <div
                className={`relative flex min-h-0 flex-1 ${
                  previewResource.kind === 'VIDEO'
                    ? 'overflow-auto bg-black p-3'
                    : 'items-center justify-center bg-black/40 p-3 sm:p-5'
                }`}
              >
                {previewResource.kind === 'IMAGE' ? (
                  <img
                    src={previewResource.link}
                    alt={previewResource.fileName}
                    className='max-h-[76vh] w-auto max-w-full rounded-md object-contain'
                  />
                ) : (
                  <video
                    src={previewResource.link}
                    controls
                    playsInline
                    preload='metadata'
                    onLoadedMetadata={(event) => {
                      const { videoWidth, videoHeight } = event.currentTarget;

                      if (videoWidth > 0 && videoHeight > 0) {
                        setPreviewVideoSize({ width: videoWidth, height: videoHeight });
                      }
                    }}
                    className='block h-auto w-full shrink-0 rounded-md'
                    style={
                      previewVideoSize
                        ? {
                            maxWidth: `${previewVideoSize.width}px`,
                            maxHeight: `${previewVideoSize.height}px`
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
