import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import type { TPostBuilderSummary } from '@/models/post-builder.model';
import { AlertTriangle, FileImage, Layers, RefreshCcw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PostBuilderListViewProps = {
  title: string;
  description: string;
  items: TPostBuilderSummary[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  onItemClick?: (item: TPostBuilderSummary) => void;
};

function formatDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function getMonthLabel(value: string | null) {
  if (!value) return 'Unknown month';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown month';
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case 'facebook':
    case 'fb':
      return FacebookIcon;
    case 'instagram':
    case 'ig':
      return InstagramIcon;
    case 'threads':
      return ThreadsIcon;
    case 'tiktok':
      return TiktokIcon;
    default:
      return null;
  }
}

function matchesSearch(item: TPostBuilderSummary, term: string) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [item.type, item.firstPostSnippet, ...(item.platforms ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function PostBuilderCard({
  item,
  onClick
}: {
  item: TPostBuilderSummary;
  onClick?: (item: TPostBuilderSummary) => void;
}) {
  const hasMedia = Boolean(item.thumbnailUrl);
  const allPublished = item.postCount > 0 && item.publishedCount === item.postCount;
  const someDraft = item.postCount > 0 && item.publishedCount < item.postCount;

  return (
    <Card
      onClick={() => onClick?.(item)}
      className='group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-white/[0.04] bg-[#151521] !py-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.1] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer'
    >
      <CardContent className='flex flex-col p-0'>
        <div className='relative aspect-[4/3] w-full overflow-hidden bg-[#13131e]'>
          {hasMedia ? (
            <img src={item.thumbnailUrl!} alt='Post builder preview' className='h-full w-full object-cover' />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20'>
              <Layers className='size-10 text-slate-600' />
            </div>
          )}

          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#151521] to-transparent' />

          <div className='absolute left-3 top-3 z-10 flex items-center gap-2'>
            <div className='flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 box-border backdrop-blur-md shadow-lg shadow-black/20'>
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)]',
                  allPublished
                    ? 'bg-emerald-400 shadow-emerald-400/50'
                    : someDraft
                    ? 'bg-amber-400 shadow-amber-400/50'
                    : 'bg-slate-400 shadow-slate-400/50'
                )}
              />
              <span className='text-[10px] font-bold uppercase tracking-wider text-white/90 leading-none pb-[1px] pt-[1px]'>
                {allPublished ? 'All published' : someDraft ? `${item.publishedCount}/${item.postCount} published` : 'Draft'}
              </span>
            </div>
          </div>

          <div className='absolute right-3 top-3 z-10'>
            <div className='flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 backdrop-blur-md shadow-lg shadow-black/20'>
              <Layers className='size-3 text-white/80' />
              <span className='text-[10px] font-bold text-white/90'>{item.postCount}</span>
            </div>
          </div>
        </div>

        <div className='flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-5'>
          <h3 className='line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-white'>
            {item.firstPostSnippet?.trim() || 'Untitled content set'}
          </h3>

          <div className='mt-1 flex items-center gap-3 text-slate-500'>
            <span className='text-[11px] font-medium'>{formatDate(item.createdAt)}</span>
            {item.type ? (
              <>
                <div className='size-[3px] rounded-full bg-slate-600' />
                <span className='text-[11px] font-medium capitalize text-slate-400'>{item.type}</span>
              </>
            ) : null}
          </div>

          <div className='mt-auto flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4'>
            <span className='text-[11px] text-slate-400'>
              {item.postCount} {item.postCount === 1 ? 'post' : 'posts'}
            </span>
            <div className='flex items-center gap-1.5'>
              {(item.platforms ?? []).map((platform) => {
                const Icon = getPlatformIcon(platform);
                if (!Icon) return null;
                return (
                  <div
                    key={platform}
                    title={platform}
                    className='flex size-[28px] items-center justify-center rounded-full bg-white/[0.06] text-slate-300 transition-colors hover:bg-white/[0.15] hover:text-white'
                  >
                    <Icon size={14} className='opacity-90' />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostBuilderListSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={`skel-${index}`} className='overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]'>
          <div className='h-1 w-full bg-white/[0.04]' />
          <div className='aspect-[4/3] w-full animate-pulse bg-white/[0.04]' />
          <div className='flex flex-col gap-3 px-4 pb-4 pt-3'>
            <div className='h-4 w-3/4 animate-pulse rounded bg-white/[0.05]' />
            <div className='h-3 w-1/3 animate-pulse rounded bg-white/[0.05]' />
            <div className='mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3'>
              <div className='h-3 w-10 animate-pulse rounded bg-white/[0.05]' />
              <div className='flex -space-x-1'>
                <div className='size-5 animate-pulse rounded-full bg-white/[0.05]' />
                <div className='size-5 animate-pulse rounded-full bg-white/[0.05]' />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PostBuilderListView({
  title,
  description,
  items,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onItemClick
}: PostBuilderListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage?.();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesSearch(item, searchTerm)),
    [items, searchTerm]
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, TPostBuilderSummary[]>();
    filteredItems.forEach((item) => {
      const label = getMonthLabel(item.createdAt);
      const current = groups.get(label);
      if (current) {
        current.push(item);
      } else {
        groups.set(label, [item]);
      }
    });
    return Array.from(groups.entries()).map(([label, group]) => ({ label, items: group }));
  }, [filteredItems]);

  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  return (
    <div className='min-h-screen px-4 pb-12 pt-6 sm:px-6 xl:px-8'>
      <div className='mx-auto flex max-w-[1600px] flex-col gap-8'>
        <section className='sticky top-0 z-30 -mx-4 border-b border-white/[0.04] bg-[#0c0c14]/80 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 shadow-[0_4px_30px_rgb(0,0,0,0.1)]'>
          <div className='mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-3'>
                <h1 className='text-xl sm:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400'>
                  {title}
                </h1>
                <Badge className='border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] font-bold text-slate-300 shadow-inner'>
                  {items.length}
                </Badge>
              </div>
              <p className='text-xs text-slate-400'>{description}</p>
            </div>

            <InputGroup className='w-64 rounded-lg border border-white/[0.08] bg-white/[0.03] focus-within:border-violet-500/30'>
              <InputGroupAddon align='inline-start' className='text-slate-500 pr-0'>
                <Search size={15} className='ml-1' />
              </InputGroupAddon>
              <InputGroupInput
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Search content sets…'
                className='h-9 border-none bg-transparent px-2.5 text-[13px] text-white placeholder:text-slate-500 focus-visible:ring-0 dark:bg-transparent'
              />
            </InputGroup>
          </div>
        </section>

        {isLoading && <PostBuilderListSkeleton />}

        {!isLoading && isError && (
          <section className='mx-auto max-w-xl rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-center mt-12'>
            <AlertTriangle className='mx-auto h-9 w-9 text-rose-200' />
            <h2 className='mt-4 text-lg font-semibold text-white'>Failed to load content sets</h2>
            <p className='mt-2 text-sm text-rose-100/80'>
              {errorMessage || 'Unexpected error while fetching post builders.'}
            </p>
            <Button type='button' onClick={onRetry} className='mt-5 rounded-xl bg-rose-500/80 text-white hover:bg-rose-500'>
              <RefreshCcw className='h-4 w-4 mr-2' />
              Retry
            </Button>
          </section>
        )}

        {!isLoading && !isError && filteredItems.length === 0 && (
          <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center mt-8'>
            <FileImage className='mx-auto h-10 w-10 text-white/40' />
            <h2 className='mt-4 text-xl font-semibold text-white'>
              {items.length === 0 ? 'No content sets yet' : 'No content sets match your search'}
            </h2>
            <p className='mt-2 text-sm text-slate-300'>
              {items.length === 0
                ? 'Generate media and prepare your first post set to see it here.'
                : 'Try a different search term to see more content sets.'}
            </p>
            <div className='flex items-center justify-center gap-3 mt-5'>
              <Button
                type='button'
                onClick={items.length === 0 ? onRetry : handleClearSearch}
                className='rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10'
              >
                {items.length === 0 ? <RefreshCcw className='h-4 w-4 mr-2' /> : null}
                {items.length === 0 ? 'Check again' : 'Clear search'}
              </Button>
            </div>
          </section>
        )}

        {!isLoading && !isError && filteredItems.length > 0 && (
          <div className='flex flex-col gap-8'>
            {groupedItems.map((group) => (
              <section key={group.label} className='flex flex-col gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <div className='size-1.5 rounded-full bg-violet-500/60' />
                    <h2 className='shrink-0 text-[13px] font-semibold uppercase tracking-widest text-slate-400'>
                      {group.label}
                    </h2>
                  </div>
                  <div className='h-px flex-1 bg-white/[0.06]' />
                  <span className='text-[11px] text-slate-500'>
                    {group.items.length} {group.items.length === 1 ? 'set' : 'sets'}
                  </span>
                </div>

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {group.items.map((item) => (
                    <PostBuilderCard key={item.id} item={item} onClick={onItemClick} />
                  ))}
                </div>
              </section>
            ))}

            {hasNextPage && (
              <div ref={loadMoreRef} className='flex w-full items-center justify-center p-8'>
                {isFetchingNextPage ? <RefreshCcw className='size-6 animate-spin text-violet-500' /> : <div className='h-6 w-6' />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
