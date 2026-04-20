import type { Route } from './+types/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { proxyApiRequest } from '@/services/server/api-proxy.server';
import { fetchResources } from '@/services/client/resource.client';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
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
import { useFetcher, type ActionFunctionArgs } from 'react-router';
import { toast } from 'react-toastify';

const LIBRARY_PAGE_SIZE = 20;

type LibraryActionData = {
  ok: boolean;
  intent: 'upload' | 'delete';
  message: string;
  resource?: Resource | null;
  resourceId?: string | null;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Library | MeAI' },
    { name: 'description', content: 'Upload, preview, download, and remove images and videos in one place.' },
    { name: 'robots', content: 'noindex, nofollow' }
  ];
}

function readUploadActionMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.detail === 'string' && candidate.detail.trim()) {
    return candidate.detail;
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }

  if (typeof candidate.title === 'string' && candidate.title.trim()) {
    return candidate.title;
  }

  const error = candidate.error;
  if (error && typeof error === 'object') {
    const description = (error as Record<string, unknown>).description;
    if (typeof description === 'string' && description.trim()) {
      return description;
    }
  }

  return fallback;
}

function normalizeUploadedResource(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const value = candidate.value;

  if (!value || typeof value !== 'object') {
    return null;
  }

  const resource = value as Record<string, unknown>;

  if (typeof resource.id !== 'string' || typeof resource.link !== 'string') {
    return null;
  }

  return {
    id: resource.id,
    link: resource.link,
    status: typeof resource.status === 'string' ? resource.status : null,
    resourceType: typeof resource.resourceType === 'string' ? resource.resourceType : null,
    contentType: typeof resource.contentType === 'string' ? resource.contentType : null,
    createdAt: typeof resource.createdAt === 'string' ? resource.createdAt : null,
    updatedAt: typeof resource.updatedAt === 'string' ? resource.updatedAt : null
  } satisfies Resource;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method.toUpperCase() !== 'POST') {
    return Response.json(
      {
        ok: false,
        intent: 'upload',
        message: 'Method not allowed.'
      } satisfies LibraryActionData,
      { status: 405 }
    );
  }

  const formData = await request.clone().formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
    const resourceId = formData.get('resourceId');

    if (typeof resourceId !== 'string' || !resourceId.trim()) {
      return Response.json(
        {
          ok: false,
          intent: 'delete',
          message: 'Resource ID is required.'
        } satisfies LibraryActionData,
        { status: 400 }
      );
    }

    const deleteRequest = new Request(request.url, {
      method: 'DELETE',
      headers: request.headers,
      signal: request.signal
    });

    const response = await proxyApiRequest(deleteRequest, `User/resources/${resourceId}`);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          intent: 'delete',
          message: readUploadActionMessage(payload, 'Failed to delete resource.')
        } satisfies LibraryActionData,
        { status: response.status }
      );
    }

    return Response.json({
      ok: true,
      intent: 'delete',
      message: 'Resource deleted successfully.',
      resourceId
    } satisfies LibraryActionData);
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      {
        ok: false,
        intent: 'upload',
        message: 'Please choose a file to upload.'
      } satisfies LibraryActionData,
      { status: 400 }
    );
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return Response.json(
      {
        ok: false,
        intent: 'upload',
        message: 'Only image and video files are allowed.'
      } satisfies LibraryActionData,
      { status: 400 }
    );
  }

  const response = await proxyApiRequest(request, 'User/resources');
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return Response.json(
      {
        ok: false,
        intent: 'upload',
        message: readUploadActionMessage(payload, 'Failed to upload resource.')
      } satisfies LibraryActionData,
      { status: response.status }
    );
  }

  const resource = normalizeUploadedResource(payload);
  if (!resource) {
    return Response.json(
      {
        ok: false,
        intent: 'upload',
        message: 'Backend returned an invalid upload response.'
      } satisfies LibraryActionData,
      { status: 502 }
    );
  }

  return Response.json({
    ok: true,
    intent: 'upload',
    message: 'Resource uploaded successfully.',
    resource
  } satisfies LibraryActionData);
}

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

export default function Library() {
  type PreviewResource = {
    id: string;
    link: string;
    fileName: string;
    kind: 'IMAGE' | 'VIDEO';
  };

  const queryClient = useQueryClient();
  const uploadFetcher = useFetcher<LibraryActionData>();
  const deleteFetcher = useFetcher<LibraryActionData>();
  const uploadFormId = useId();
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const [previewErrorIds, setPreviewErrorIds] = useState<Set<string>>(() => new Set());
  const [previewResource, setPreviewResource] = useState<PreviewResource | null>(null);
  const [previewVideoSize, setPreviewVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState<string | null>(null);
  const [selectedUploadFileName, setSelectedUploadFileName] = useState<string | null>(null);
  const [selectedUploadFileSize, setSelectedUploadFileSize] = useState<number | null>(null);
  const [uploadResourceType, setUploadResourceType] = useState<'IMAGE' | 'VIDEO' | null>(null);

  useEffect(() => {
    if (!uploadFetcher.data) {
      return;
    }

    if (uploadFetcher.data.ok) {
      toast.success(uploadFetcher.data.message);
      setPreviewErrorIds(new Set());
      setSelectedUploadFileName(null);
      setSelectedUploadFileSize(null);
      setUploadResourceType(null);
      uploadFormRef.current?.reset();
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      return;
    }

    toast.error(uploadFetcher.data.message);
  }, [queryClient, uploadFetcher.data]);

  useEffect(() => {
    const deleteResult = deleteFetcher.data;

    if (!deleteResult) {
      return;
    }

    if (deleteResult.ok) {
      toast.success(deleteResult.message);

      setPreviewResource((current) => {
        if (current && deleteResult.resourceId === current.id) {
          setPreviewVideoSize(null);
          return null;
        }

        return current;
      });

      queryClient.invalidateQueries({ queryKey: ['resources'] });
      return;
    }

    toast.error(deleteResult.message);
  }, [deleteFetcher.data, queryClient]);

  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['resources'],
      initialPageParam: null as ResourceCursor | null,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
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

  const resources = useMemo(() => data?.pages.flatMap((page) => page.value) ?? [], [data]);

  const initialError = Boolean(error) && resources.length === 0;
  const backgroundError = Boolean(error) && resources.length > 0;
  const isUploading = uploadFetcher.state !== 'idle';
  const isDeleting = deleteFetcher.state !== 'idle';
  const pendingUploadFile = uploadFetcher.formData?.get('file');
  const pendingUploadFileName = pendingUploadFile instanceof File ? pendingUploadFile.name : null;
  const uploadSummaryFileName = pendingUploadFileName ?? selectedUploadFileName;
  const deletingResourceId = (() => {
    const candidate = deleteFetcher.formData?.get('resourceId');
    return typeof candidate === 'string' && candidate ? candidate : null;
  })();

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
                const formData = new FormData();
                formData.set('intent', 'delete');
                formData.set('resourceId', resource.id);
                deleteFetcher.submit(formData, { method: 'post' });
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
        <section className='overflow-hidden rounded-[28px] border border-white/[0.12] bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
          <div className='flex items-center'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Library</h1>
          </div>
        </section>

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

          <uploadFetcher.Form
            ref={uploadFormRef}
            method='post'
            encType='multipart/form-data'
            className='mt-5 space-y-4'
          >
            <input type='hidden' name='intent' value='upload' />
            <input type='hidden' name='status' value='user_upload' />
            {uploadResourceType && <input type='hidden' name='resourceType' value={uploadResourceType} />}

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
          </uploadFetcher.Form>
        </section>

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

        {!isLoading && !initialError && resources.length === 0 && (
          <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center'>
            <LibraryIcon className='mx-auto h-10 w-10 text-white/40' />
            <h2 className='mt-4 text-xl font-semibold text-white'>No files yet</h2>
            <p className='mt-2 text-sm text-slate-300'>Upload an image or video to get started.</p>
          </section>
        )}

        {!isLoading && !initialError && resources.length > 0 && (
          <section className='space-y-5'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {resources.map((resource) => {
                const type = getResourceKind(resource);
                const fileName = formatFileName(resource.link);
                const resourceTitle = formatResourceTitle(resource);
                const canOpenInModal = (type === 'IMAGE' || type === 'VIDEO') && Boolean(resource.link);
                const updatedAtLabel = parseApiDate(resource.updatedAt)
                  ? formatRelativeDate(resource.updatedAt)
                  : 'None';

                return (
                  <article
                    key={resource.id}
                    className='group overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.95)_100%)] shadow-[0_14px_36px_rgba(2,4,11,0.45)]'
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
                          onClick={() => {
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
                          onClick={() => handleDownload(resource)}
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
                          onClick={() => handleDeleteResource(resource, resourceTitle)}
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
