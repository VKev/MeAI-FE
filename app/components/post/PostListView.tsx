import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import type { Post, PostMedia } from '@/models/post.model';
import { AlertTriangle, ChevronDown, Eye, FileImage, Heart, MoreVertical, Pencil, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';


type PostListViewProps = {
  title: string;
  description: string;
  posts: Post[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  onPostClick?: (postId: string) => void;
  onPostDelete?: (postId: string) => Promise<void>;
  isDeletingPost?: boolean;
};

const STATUS_FILTERS = ['all', 'published', 'draft'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];


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

function getMediaType(media: PostMedia) {
  const resourceType = media.resourceType?.toLowerCase();
  const contentType = media.contentType?.toLowerCase() ?? '';
  if (resourceType === 'video' || contentType.startsWith('video/')) return 'video';
  return 'image';
}

function getPublicationLogo(socialMediaType: string | null) {
  switch (socialMediaType?.toLowerCase()) {
    case 'facebook': return FacebookIcon;
    case 'instagram': return InstagramIcon;
    case 'threads': return ThreadsIcon;
    case 'tiktok': return TiktokIcon;
    default: return null;
  }
}

function matchesStatusFilter(post: Post, filter: StatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'published') return post.isPublished;
  if (filter === 'draft') return post.status?.toLowerCase() === 'draft';
  return true;
}

function matchesSearch(post: Post, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return true;
  const haystack = [
    post.title,
    post.content?.content,
    post.content?.hashtag,
    post.status,
    ...post.publications.map((p) => p.socialMediaType)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalizedSearch);
}

function formatMetric(value: number | undefined) {
  if (value === undefined || value === null) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}


function PostMediaPreview({ media, title }: { media: PostMedia[]; title: string }) {
  const previewMedia = media.slice(0, 4);
  const remainingCount = Math.max(0, media.length - 4);

  if (previewMedia.length === 0) return null;

  if (previewMedia.length === 1) {
    const m = previewMedia[0];
    return getMediaType(m) === 'video' ? (
      <video src={m.presignedUrl} muted playsInline className='h-full w-full object-cover' />
    ) : (
      <img src={m.presignedUrl} alt={title} className='h-full w-full object-cover' />
    );
  }

  return (
    <div className={cn('grid h-full w-full gap-0.5', previewMedia.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2')}>
      {previewMedia.length === 3 && (
        <div className='relative col-span-2 row-span-1 bg-[#13131e]'>
          {getMediaType(previewMedia[0]) === 'video' ? (
            <video src={previewMedia[0].presignedUrl} muted playsInline className='h-full w-full object-cover' />
          ) : (
            <img src={previewMedia[0].presignedUrl} alt={`${title} 1`} className='h-full w-full object-cover' />
          )}
        </div>
      )}
      {(previewMedia.length === 3 ? previewMedia.slice(1) : previewMedia).map((item, index) => {
        const isLast = previewMedia.length >= 4 && index === 3;
        return (
          <div key={item.resourceId} className='relative bg-[#13131e]'>
            {getMediaType(item) === 'video' ? (
              <video src={item.presignedUrl} muted playsInline className='h-full w-full object-cover' />
            ) : (
              <img src={item.presignedUrl} alt={`${title} ${index + 1}`} className='h-full w-full object-cover' />
            )}
            {isLast && remainingCount > 0 && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
                <span className='text-lg font-semibold text-white'>+{remainingCount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function PostCard({
  post,
  onPostClick,
  onPostDelete,
  isDeletingPost
}: {
  post: Post;
  onPostClick?: (postId: string) => void;
  onPostDelete?: (postId: string) => Promise<void>;
  isDeletingPost?: boolean;
}) {
  const publications = post.publications ?? [];
  const hasMedia = post.media && post.media.length > 0;
  const isDraft = !post.isPublished;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCardClick = useCallback(() => {
    onPostClick?.(post.id);
  }, [onPostClick, post.id]);

  const handleDelete = useCallback(async () => {
    await onPostDelete?.(post.id);
    setShowDeleteDialog(false);
  }, [onPostDelete, post.id]);

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
          'group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-white/[0.04] bg-[#151521] !py-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.1] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer'
        )}
      >
        <CardContent className='flex flex-col p-0'>

          {/* ── Media Area ── */}
          <div className='relative aspect-[4/3] w-full overflow-hidden bg-[#13131e]'>
            {hasMedia ? (
              <PostMediaPreview media={post.media} title={post.title?.trim() || 'Post media'} />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20'>
                <FileImage className='size-10 text-slate-600' />
              </div>
            )}

            {/* ── Gradient Fade Overlay ── */}
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#151521] to-transparent' />

            {/* ── Status Badge Overlay ── */}
            <div className='absolute left-3 top-3 z-10'>
              <div
                className='flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 box-border backdrop-blur-md shadow-lg shadow-black/20'
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)]',
                    isDraft ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
                  )}
                />
                <span className='text-[10px] font-bold uppercase tracking-wider text-white/90 leading-none pb-[1px] pt-[1px]'>
                  {isDraft ? 'Draft' : 'Published'}
                </span>
              </div>
            </div>

            {/* ── 3-Dot Context Menu ── */}
            <div className='absolute right-3 top-3 z-10'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className='flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 opacity-0 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white group-hover:opacity-100'
                  >
                    <MoreVertical size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='min-w-[160px] border-white/[0.08] bg-[#1a1a24] text-white shadow-2xl'
                >
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className='cursor-pointer gap-2.5 text-sm'
                  >
                    <Trash2 size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Card Body ── */}
          <div className='flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-5'>
            {/* Title */}
            <h3 className='line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-white/90'>
              {post.title?.trim() || 'Untitled post'}
            </h3>

            {/* ── Metadata Row (Date, Views, Likes) ── */}
            <div className='mt-1 flex items-center gap-3 text-slate-500'>
              <span className='text-[11px] font-medium'>{formatDate(post.createdAt)}</span>

              {!isDraft && (
                <>
                  <div className='flex items-center gap-1.5 text-slate-400'>
                    <div className='size-[3px] rounded-full bg-slate-600' />
                    <Eye className='size-3.5' />
                    <span className='text-[11px] font-medium'>{formatMetric(post.views)}</span>
                  </div>
                  <div className='flex items-center gap-1.5 text-slate-400'>
                    <div className='size-[3px] rounded-full bg-slate-600' />
                    <Heart className='size-3.5' />
                    <span className='text-[11px] font-medium'>{formatMetric(post.likes)}</span>
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className='mt-auto flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4'>
              {/* Author */}
              <div className='flex items-center gap-2.5'>
                <div className='relative flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 p-[1px]'>
                  <Avatar className='size-full border-none bg-[#13131e]'>
                    <AvatarImage src='/assets/logo-meai.webp' alt='MeAI' className='rounded-full object-cover' />
                    <AvatarFallback className='bg-transparent text-[9px] text-white'>MeAI</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Social platform icons */}
              <div className='flex items-center gap-1.5'>
                {publications.length > 0 &&
                  publications.map((pub) => {
                    const SocialIcon = getPublicationLogo(pub.socialMediaType);
                    if (!SocialIcon) return null;
                    return (
                      <div
                        key={pub.id}
                        title={pub.socialMediaType || ''}
                        className='flex size-[28px] items-center justify-center rounded-full bg-white/[0.06] text-slate-300 transition-colors hover:bg-white/[0.15] hover:text-white'
                      >
                        <SocialIcon size={14} className='opacity-90' />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className='text-white'>"{post.title?.trim() || 'Untitled post'}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button
              variant='ghost'
              onClick={() => setShowDeleteDialog(false)}
              className='text-slate-400 hover:text-white hover:bg-white/[0.06]'
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeletingPost}
              className='bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
            >
              {isDeletingPost ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


function PostListSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={`skel-${index}`} className='overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]'>
          <div className='h-1 w-full bg-white/[0.04]' />
          <div className='aspect-[4/3] w-full animate-pulse bg-white/[0.04]' />
          <div className='flex flex-col gap-3 px-4 pb-4 pt-3'>
            <div className='h-4 w-3/4 animate-pulse rounded bg-white/[0.05]' />
            <div className='h-3 w-1/3 animate-pulse rounded bg-white/[0.05]' />
            <div className='flex gap-4'>
              <div className='h-3 w-12 animate-pulse rounded bg-white/[0.05]' />
              <div className='h-3 w-12 animate-pulse rounded bg-white/[0.05]' />
            </div>
            <div className='mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3'>
              <div className='flex items-center gap-2'>
                <div className='size-5 animate-pulse rounded-full bg-white/[0.05]' />
                <div className='h-3 w-10 animate-pulse rounded bg-white/[0.05]' />
              </div>
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


export default function PostListView({
  title,
  description,
  posts,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onPostClick,
  onPostDelete,
  isDeletingPost
}: PostListViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  /* ── Infinite Scroll Observer ── */
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

  /* ── Filtering ── */
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    posts.forEach((p) => {
      const label = getMonthLabel(p.createdAt);
      if (label) months.add(label);
    });
    return Array.from(months);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus = matchesStatusFilter(post, statusFilter);
      const matchesSearchTerm = matchesSearch(post, searchTerm);
      const matchesMonth = monthFilter === 'all' || getMonthLabel(post.createdAt) === monthFilter;
      return matchesStatus && matchesSearchTerm && matchesMonth;
    });
  }, [posts, searchTerm, statusFilter, monthFilter]);

  const statusCounts = useMemo(() => {
    const published = posts.filter((p) => p.isPublished).length;
    const draft = posts.filter((p) => p.status?.toLowerCase() === 'draft').length;
    return { all: posts.length, published, draft };
  }, [posts]);

  /* ── Month grouping ── */
  const groupedPosts = useMemo(() => {
    const groups = new Map<string, Post[]>();
    filteredPosts.forEach((post) => {
      const label = getMonthLabel(post.createdAt);
      const current = groups.get(label);
      if (current) {
        current.push(post);
      } else {
        groups.set(label, [post]);
      }
    });
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [filteredPosts]);

  return (
    <div className='min-h-screen px-4 pb-12 pt-6 sm:px-6 xl:px-8'>
      <div className='mx-auto flex max-w-[1600px] flex-col gap-8'>

        {/* ── Compact Sticky Header ── */}
        <section className='sticky top-0 z-30 -mx-4 border-b border-white/[0.04] bg-[#0c0c14]/80 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 shadow-[0_4px_30px_rgb(0,0,0,0.1)]'>
          <div className='mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            {/* Title + Count */}
            <div className='flex items-center gap-3'>
              <h1 className='text-xl sm:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400'>
                {title}
              </h1>
              <Badge className='border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] font-bold text-slate-300 shadow-inner'>
                {statusCounts.all}
              </Badge>
            </div>

            {/* Filters + Search */}
            <div className='flex items-center gap-3'>
              <ButtonGroup className='rounded-lg bg-white/[0.04] p-0.5'>
                {STATUS_FILTERS.map((filter) => {
                  const isActive = statusFilter === filter;
                  const count = statusCounts[filter];
                  return (
                    <Button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      size='sm'
                      variant='ghost'
                      className={cn(
                        'rounded-md px-4 text-[13px] font-medium capitalize outline-none transition-colors h-9',
                        isActive
                          ? 'bg-white/[0.1] text-white shadow-sm hover:bg-white/[0.15] hover:text-white'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      )}
                    >
                      {filter}
                      <span className={cn('ml-1.5 text-[11px]', isActive ? 'text-slate-300' : 'text-slate-500')}>
                        {count}
                      </span>
                    </Button>
                  );
                })}
              </ButtonGroup>

              {/* Month Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-9 w-44 justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-200 hover:bg-white/[0.06] hover:text-white'
                  >
                    <span className='truncate'>{monthFilter === 'all' ? 'All Months' : monthFilter}</span>
                    <ChevronDown size={15} className='ml-2 text-slate-500' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='max-h-64 w-40 overflow-y-auto border-white/[0.08] bg-[#1a1a24] text-white shadow-2xl'
                >
                  <DropdownMenuItem
                    onClick={() => setMonthFilter('all')}
                    className={cn('cursor-pointer text-sm hover:bg-white/[0.06]', monthFilter === 'all' && 'bg-white/[0.06] font-semibold text-violet-400')}
                  >
                    All Months
                  </DropdownMenuItem>
                  {availableMonths.length > 0 && <DropdownMenuSeparator className='bg-white/[0.06]' />}
                  {availableMonths.map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onClick={() => setMonthFilter(month)}
                      className={cn('cursor-pointer text-sm hover:bg-white/[0.06]', monthFilter === month && 'bg-white/[0.06] font-semibold text-violet-400')}
                    >
                      {month}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <InputGroup className='w-64 rounded-lg border border-white/[0.08] bg-white/[0.03] focus-within:border-violet-500/30'>
                <InputGroupAddon align='inline-start' className='text-slate-500 pr-0'>
                  <Search size={15} className='ml-1' />
                </InputGroupAddon>
                <InputGroupInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder='Search…'
                  className='h-9 border-none bg-transparent px-2.5 text-[13px] text-white placeholder:text-slate-500 focus-visible:ring-0 dark:bg-transparent'
                />
              </InputGroup>
            </div>
          </div>
        </section>

        {/* ── Loading ── */}
        {isLoading && <PostListSkeleton />}

        {/* ── Error ── */}
        {!isLoading && isError && (
          <Empty className='min-h-[calc(100vh-12rem)] rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white'>
            <EmptyHeader>
              <EmptyMedia variant='icon' className='bg-white/[0.04] text-slate-400'>
                <AlertTriangle />
              </EmptyMedia>
              <EmptyTitle>Failed to load posts</EmptyTitle>
              <EmptyDescription className='text-slate-500'>
                {errorMessage || 'Unexpected error while fetching posts.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type='button' onClick={onRetry} className='bg-violet-600 text-white hover:bg-violet-700'>
                <RefreshCcw className='mr-2 size-4' />
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && filteredPosts.length === 0 && (
          <Empty className='min-h-[calc(100vh-12rem)] rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white'>
            <EmptyHeader>
              <EmptyMedia variant='icon' className='bg-white/[0.04] text-slate-400'>
                <FileImage />
              </EmptyMedia>
              <EmptyTitle>No posts found</EmptyTitle>
              <EmptyDescription className='text-slate-500'>
                No posts match the current search or filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {/* ── Post Grid ── */}
        {!isLoading && !isError && filteredPosts.length > 0 && (
          <div className='flex flex-col gap-8'>
            {groupedPosts.map((group) => (
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
                    {group.items.length} {group.items.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {group.items.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostClick={onPostClick}
                      onPostDelete={onPostDelete}
                      isDeletingPost={isDeletingPost}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* ── Infinite Scroll Trigger ── */}
            {hasNextPage && (
              <div ref={loadMoreRef} className='flex w-full items-center justify-center p-8'>
                {isFetchingNextPage ? (
                  <RefreshCcw className='size-6 animate-spin text-violet-500' />
                ) : (
                  <div className='h-6 w-6' />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
