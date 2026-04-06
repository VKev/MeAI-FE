import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { fetchResources } from '@/services/client/resource.client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CloudDownload,
  Eye,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  Image as ImageIcon,
  Library as LibraryIcon,
  Loader2,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { useMemo, useState } from 'react';

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const RESOURCE_TYPE_OPTIONS = ['ALL', 'IMAGE', 'VIDEO', 'OTHER'] as const;

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

function formatId(id: string) {
  if (id.length <= 16) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-6)}`;
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

export default function WorkspaceLibrary() {
  type PreviewResource = {
    id: string;
    link: string;
    fileName: string;
    kind: 'IMAGE' | 'VIDEO';
  };

  const { workspaceId } = useParams();
  const [pageSize, setPageSize] = useState<number>(20);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<(typeof RESOURCE_TYPE_OPTIONS)[number]>('ALL');
  const [previewErrorIds, setPreviewErrorIds] = useState<Set<string>>(() => new Set());
  const [previewResource, setPreviewResource] = useState<PreviewResource | null>(null);
  const [previewVideoSize, setPreviewVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState<string | null>(null);

  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['resources', workspaceId, pageSize],
      initialPageParam: null as ResourceCursor | null,
      queryFn: ({ pageParam, signal }) =>
        fetchResources({
          limit: pageSize,
          cursor: pageParam ?? undefined,
          signal
        }),
      getNextPageParam: (lastPage) => {
        if (lastPage.value.length < pageSize) {
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

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const typeMatches = resourceTypeFilter === 'ALL' || getResourceKind(resource) === resourceTypeFilter;
      return typeMatches;
    });
  }, [resources, resourceTypeFilter]);

  const initialError = Boolean(error) && resources.length === 0;
  const backgroundError = Boolean(error) && resources.length > 0;

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

  return (
    <div className='relative min-h-screen py-6 sm:py-8'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute inset-0 landing-grid opacity-20' />
        <div className='absolute inset-0 bg-[radial-gradient(60%_50%_at_16%_10%,rgba(107,83,242,0.18),transparent_74%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(62%_48%_at_82%_16%,rgba(222,127,252,0.14),transparent_72%)]' />
        <div className='absolute -left-24 top-[20%] h-64 w-64 rounded-full bg-violet-500/15 blur-[105px]' />
        <div className='absolute right-0 top-[40%] h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[110px]' />
      </div>

      <div className='relative z-10 space-y-5'>
        <section className='overflow-hidden rounded-[28px] border border-white/[0.12] bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-2xl space-y-3'>
              <span className='inline-flex w-fit items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-violet-100 uppercase'>
                <Sparkles className='h-3.5 w-3.5' />
                Workspace Library
              </span>
              <div>
                <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>
                  Manage Generated Assets
                </h1>
                <p className='mt-2 text-sm text-slate-300 sm:text-base'>
                  Browse image, video, and file resources from the latest generations. Links are pre-signed and can be
                  opened or downloaded directly.
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <label className='flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200'>
                <span className='text-xs font-medium tracking-wide text-slate-300 uppercase'>Page size</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPageSize(value);
                    setPreviewErrorIds(new Set());
                  }}
                  className='rounded-lg border border-white/10 bg-[#0c1121] px-2 py-1 text-sm text-white outline-none transition focus:border-violet-300/60'
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type='button'
                onClick={() => refetch()}
                disabled={isFetching}
                className='rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10'
              >
                {isFetching && !isFetchingNextPage ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCcw className='h-4 w-4' />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4 sm:p-5'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-300 uppercase'>
                <Filter className='h-3.5 w-3.5' />
                Resource Type
              </span>
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type='button'
                  onClick={() => setResourceTypeFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    resourceTypeFilter === option
                      ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>

        {backgroundError && (
          <section className='flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-amber-100'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            <p className='text-sm'>{error?.message || 'Some data could not be refreshed. Showing cached resources.'}</p>
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
            <h2 className='mt-4 text-lg font-semibold text-white'>Failed to load resources</h2>
            <p className='mt-2 text-sm text-rose-100/80'>{error?.message || 'Unexpected error while fetching data.'}</p>
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
            <h2 className='mt-4 text-xl font-semibold text-white'>Your library is empty</h2>
            <p className='mt-2 text-sm text-slate-300'>
              Generate content first, then resources will appear here with downloadable links.
            </p>
            <Button
              type='button'
              onClick={() => refetch()}
              className='mt-5 rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10'
            >
              <RefreshCcw className='h-4 w-4' />
              Check again
            </Button>
          </section>
        )}

        {!isLoading && !initialError && resources.length > 0 && filteredResources.length === 0 && (
          <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center'>
            <Filter className='mx-auto h-9 w-9 text-white/45' />
            <h2 className='mt-3 text-lg font-semibold text-white'>No resources match your filters</h2>
            <p className='mt-1 text-sm text-slate-300'>Try broadening your status/type filters to see more assets.</p>
            <Button
              type='button'
              onClick={() => {
                setResourceTypeFilter('ALL');
              }}
              className='mt-4 rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10'
            >
              Clear filters
            </Button>
          </section>
        )}

        {!isLoading && !initialError && filteredResources.length > 0 && (
          <section className='space-y-5'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {filteredResources.map((resource) => {
                const type = getResourceKind(resource);
                const fileName = formatFileName(resource.link);
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
                        <p className='truncate text-sm font-semibold text-white' title={fileName}>
                          {fileName}
                        </p>
                        <p className='mt-1 truncate text-xs text-slate-400' title={resource.contentType || ''}>
                          {resource.contentType || 'Unknown content type'}
                        </p>
                      </div>

                      <div className='grid grid-cols-2 gap-2 text-xs'>
                        <div className='rounded-lg border border-white/10 bg-white/[0.03] p-2'>
                          <p className='text-white/45'>Created</p>
                          <p className='mt-1 text-white/85'>{formatRelativeDate(resource.createdAt)}</p>
                        </div>
                        <div className='rounded-lg border border-white/10 bg-white/[0.03] p-2'>
                          <p className='text-white/45'>Updated</p>
                          <p className='mt-1 text-white/85'>{updatedAtLabel}</p>
                        </div>
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
                                fileName,
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
                      </div>

                      <p className='truncate text-[11px] text-white/35' title={resource.id}>
                        ID: {formatId(resource.id)}
                      </p>
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
                  {isFetchingNextPage ? 'Loading more...' : 'Load more resources'}
                </Button>
              ) : (
                <p className='text-xs text-slate-400'>No more resources to load.</p>
              )}
            </div>
          </section>
        )}

        {isFetching && !isLoading && !isFetchingNextPage && (
          <p className='text-center text-xs text-slate-400'>Refreshing resources...</p>
        )}
      </div>

      <Dialog open={Boolean(previewResource)} onOpenChange={(open) => !open && setPreviewResource(null)}>
        <DialogContent className='h-[96vh] w-[98vw] max-w-none overflow-hidden border border-white/15 bg-[#060912] p-0'>
          {previewResource && (
            <div className='flex h-full flex-col'>
              <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-white'>{previewResource.fileName}</p>
                  <p className='text-xs text-slate-400'>ID: {formatId(previewResource.id)}</p>
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
