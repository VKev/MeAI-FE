import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import type { Post, PostMedia } from '@/models/post.model';
import { AlertTriangle, CheckCircle2, FileImage, Loader2, RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type PostListViewProps = {
  title: string;
  description: string;
  posts: Post[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  backgroundErrorMessage?: string;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onRetry: () => void;
};

const STATUS_FILTERS = ['all', 'published', 'draft', 'other'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatDate(value: string | null) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getMonthLabel(value: string | null) {
  if (!value) {
    return 'Unknown month';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown month';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatStatus(value: string | null) {
  if (!value) {
    return 'Unknown';
  }

  return value.replace(/[_-]+/g, ' ');
}

function getStatusBadgeClassName(post: Post) {
  if (post.isPublished) {
    return 'border-transparent bg-primary text-primary-foreground';
  }

  const normalizedStatus = post.status?.toLowerCase();

  switch (normalizedStatus) {
    case 'draft':
      return 'border-border bg-secondary text-secondary-foreground';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

function getMediaType(media: PostMedia) {
  const resourceType = media.resourceType?.toLowerCase();
  const contentType = media.contentType?.toLowerCase() ?? '';

  if (resourceType === 'video' || contentType.startsWith('video/')) {
    return 'video';
  }

  return 'image';
}

function getPublicationLogo(socialMediaType: string | null) {
  const normalizedType = socialMediaType?.toLowerCase();

  switch (normalizedType) {
    case 'facebook':
      return FacebookIcon;
    case 'instagram':
      return InstagramIcon;
    case 'threads':
      return ThreadsIcon;
    case 'tiktok':
      return TiktokIcon;
    default:
      return null;
  }
}

function getHashtags(value: string | null) {
  return (
    value
      ?.split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function matchesStatusFilter(post: Post, filter: StatusFilter) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'published') {
    return post.isPublished;
  }

  if (filter === 'draft') {
    return post.status?.toLowerCase() === 'draft';
  }

  return !post.isPublished && post.status?.toLowerCase() !== 'draft';
}

function matchesSearch(post: Post, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const haystack = [
    post.title,
    post.content?.content,
    post.content?.hashtag,
    post.status,
    ...post.publications.map((publication) => publication.socialMediaType)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

function PostMediaPreview({ media, title }: { media: PostMedia[]; title: string }) {
  const previewMedia = media.slice(0, 4);
  const remainingMediaCount = Math.max(0, media.length - 4);

  if (previewMedia.length === 0) {
    return (
      <div className='flex aspect-square items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground'>
        <div className='flex flex-col items-center gap-1'>
          <FileImage className='size-5' />
          <span className='text-[11px]'>No media preview</span>
        </div>
      </div>
    );
  }

  if (previewMedia.length === 1) {
    const primaryMedia = previewMedia[0];

    if (getMediaType(primaryMedia) === 'video') {
      return (
        <video
          src={primaryMedia.presignedUrl}
          controls
          muted
          playsInline
          className='aspect-square w-full rounded-2xl border border-border bg-muted object-cover'
        />
      );
    }

    return (
      <img
        src={primaryMedia.presignedUrl}
        alt={title}
        className='aspect-square w-full rounded-2xl border border-border bg-muted object-cover'
      />
    );
  }

  if (previewMedia.length === 2) {
    return (
      <div className='grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-2xl'>
        {previewMedia.map((item, index) => (
          <div key={item.resourceId} className='relative'>
            {getMediaType(item) === 'video' ? (
              <video
                src={item.presignedUrl}
                muted
                playsInline
                className='h-full w-full border border-border bg-muted object-cover'
              />
            ) : (
              <img
                src={item.presignedUrl}
                alt={`${title} ${index + 1}`}
                className='h-full w-full border border-border bg-muted object-cover'
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (previewMedia.length === 3) {
    return (
      <div className='grid aspect-square grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl'>
        <div className='relative col-span-2'>
          {getMediaType(previewMedia[0]) === 'video' ? (
            <video
              src={previewMedia[0].presignedUrl}
              muted
              playsInline
              className='h-full w-full border border-border bg-muted object-cover'
            />
          ) : (
            <img
              src={previewMedia[0].presignedUrl}
              alt={`${title} 1`}
              className='h-full w-full border border-border bg-muted object-cover'
            />
          )}
        </div>

        {previewMedia.slice(1).map((item, index) => (
          <div key={item.resourceId} className='relative'>
            {getMediaType(item) === 'video' ? (
              <video
                src={item.presignedUrl}
                muted
                playsInline
                className='h-full w-full border border-border bg-muted object-cover'
              />
            ) : (
              <img
                src={item.presignedUrl}
                alt={`${title} ${index + 2}`}
                className='h-full w-full border border-border bg-muted object-cover'
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-1 overflow-hidden rounded-2xl'>
      {previewMedia.map((item, index) => {
        const showRemainingOverlay = index === 3 && remainingMediaCount > 0;

        return (
          <div key={item.resourceId} className='relative'>
            {getMediaType(item) === 'video' ? (
              <video
                src={item.presignedUrl}
                muted
                playsInline
                className='aspect-square w-full border border-border bg-muted object-cover'
              />
            ) : (
              <img
                src={item.presignedUrl}
                alt={`${title} ${index + 1}`}
                className='aspect-square w-full border border-border bg-muted object-cover'
              />
            )}

            {showRemainingOverlay && (
              <div className='absolute inset-0 flex items-center justify-center bg-background/75'>
                <span className='text-lg font-semibold text-foreground'>+{remainingMediaCount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const publications = post.publications ?? [];
  const hashtags = getHashtags(post.content?.hashtag ?? null);

  return (
    <Card className='flex h-full flex-col gap-0 border-none bg-transparent py-0 shadow-none transition-colors hover:bg-accent/40'>
      <CardContent className='flex h-full flex-1 flex-col px-3 py-3 sm:px-4'>
        <div className='flex gap-3'>
          <Avatar className='size-10 shrink-0 border border-border'>
            <AvatarImage src='/black-meai-logo.webp' alt='MeAI' />
            <AvatarFallback>MA</AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5'>
                  <span className='truncate text-sm font-semibold text-card-foreground'>MeAI</span>
                  {post.isPublished && <CheckCircle2 className='size-3.5 text-primary' />}
                  <span className='truncate text-xs text-muted-foreground'>@meai</span>
                  <span className='text-xs text-muted-foreground'>·</span>
                  <span className='truncate text-xs text-muted-foreground'>{formatDate(post.createdAt)}</span>
                </div>
                <p className='mt-0.5 line-clamp-1 text-[13px] font-medium text-card-foreground'>
                  {post.title?.trim() || 'Untitled post'}
                </p>
              </div>

              <Badge
                variant='outline'
                className={cn('h-5 shrink-0 px-1.5 py-0 text-[10px] capitalize', getStatusBadgeClassName(post))}
              >
                {post.isPublished ? 'Published' : formatStatus(post.status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className='mt-2 flex flex-1 flex-col gap-2'>
          <p className='line-clamp-2 whitespace-pre-wrap text-[13px] leading-5 text-card-foreground'>
            {post.content?.content?.trim() || 'No content available.'}
          </p>

          {hashtags.length > 0 && (
            <div className='flex flex-wrap gap-x-2 gap-y-1'>
              {hashtags.map((hashtag) => (
                <span
                  key={`${post.id}-${hashtag}`}
                  className='cursor-pointer text-[12px] leading-5 font-medium text-blue-400 hover:underline'
                >
                  {hashtag}
                </span>
              ))}
            </div>
          )}

          <PostMediaPreview media={post.media} title={post.title?.trim() || 'Post media'} />

          <div className='mt-auto flex items-center justify-between gap-2 pt-1'>
            <div className='flex items-center gap-1.5'>
              {publications.map((publication) => {
                const SocialIcon = getPublicationLogo(publication.socialMediaType);

                if (!SocialIcon) {
                  return (
                    <Badge key={publication.id} variant='outline' className='h-5 px-1.5 py-0 text-[10px] capitalize'>
                      {publication.socialMediaType || 'unknown'}
                    </Badge>
                  );
                }

                return (
                  <div
                    key={publication.id}
                    title={publication.socialMediaType || 'published'}
                    className='flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground'
                  >
                    <SocialIcon size={16} className='text-foreground' />
                  </div>
                );
              })}
            </div>

            {publications.length > 0 && <span className='text-[11px] text-muted-foreground'>Published</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostListSkeleton() {
  return (
    <section className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`post-skeleton-${index}`} className='px-3 py-3 sm:px-4'>
          <div className='flex gap-3'>
            <div className='size-10 animate-pulse rounded-full bg-muted' />
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <div className='h-3 w-1/3 animate-pulse bg-muted' />
              <div className='h-4 w-2/3 animate-pulse bg-muted' />
              <div className='h-12 animate-pulse bg-muted' />
              <div className='aspect-[16/10] animate-pulse rounded-2xl bg-muted' />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function PostListView({
  title: _title,
  description: _description,
  posts,
  isLoading,
  isError,
  errorMessage,
  backgroundErrorMessage,
  isRefreshing = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  onRetry
}: PostListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => matchesStatusFilter(post, statusFilter) && matchesSearch(post, searchTerm));
  }, [posts, searchTerm, statusFilter]);

  const groupedPosts = useMemo(() => {
    const groups = new Map<string, Post[]>();

    filteredPosts.forEach((post) => {
      const monthLabel = getMonthLabel(post.createdAt);
      const current = groups.get(monthLabel);

      if (current) {
        current.push(post);
        return;
      }

      groups.set(monthLabel, [post]);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [filteredPosts]);

  useEffect(() => {
    if (!hasNextPage || !onLoadMore || isLoading || isFetchingNextPage) {
      return;
    }

    const target = loadMoreRef.current;

    if (!target || typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '240px 0px'
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, onLoadMore, filteredPosts.length]);

  return (
    <div className='min-h-screen px-4 py-4 sm:px-6 sm:py-5 xl:px-8'>
      <div className='flex flex-col gap-4'>
        <section className='sticky top-0 z-10 bg-transparent py-2'>
          <InputGroup className='[--radius:9999rem] w-full rounded-full bg-transparent dark:bg-transparent'>
            <InputGroupAddon align='inline-start' className='pl-0.5'>
              <ButtonGroup className='[--radius:9999rem] rounded-full bg-muted p-0.5'>
                {STATUS_FILTERS.map((filter) => {
                  const isActive = statusFilter === filter;

                  return (
                    <InputGroupButton
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      size='xs'
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'rounded-full px-2 capitalize',
                        !isActive && 'bg-transparent text-muted-foreground hover:bg-transparent'
                      )}
                      aria-pressed={isActive}
                    >
                      {filter}
                    </InputGroupButton>
                  );
                })}
              </ButtonGroup>
            </InputGroupAddon>
            <InputGroupAddon align='inline-start' className='text-muted-foreground'>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder='Search posts'
              className='bg-transparent dark:bg-transparent'
            />
          </InputGroup>
        </section>

        {backgroundErrorMessage && (
          <div className='flex items-start gap-3 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'>
            <AlertTriangle className='mt-0.5 size-4 shrink-0' />
            <div className='flex-1'>
              <p>{backgroundErrorMessage}</p>
              <button
                type='button'
                onClick={onRetry}
                className='mt-2 text-xs font-medium text-amber-50 underline underline-offset-2'
              >
                Retry refresh
              </button>
            </div>
          </div>
        )}

        {isLoading && <PostListSkeleton />}

        {!isLoading && isError && (
          <Empty className='min-h-[calc(100vh-12rem)] border border-border bg-transparent text-card-foreground'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <AlertTriangle />
              </EmptyMedia>
              <EmptyTitle>Failed to load posts</EmptyTitle>
              <EmptyDescription>{errorMessage || 'Unexpected error while fetching posts.'}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type='button' onClick={onRetry}>
                <RefreshCcw data-icon='inline-start' />
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && !isError && filteredPosts.length === 0 && (
          <Empty className='min-h-[calc(100vh-12rem)] border border-border bg-transparent text-card-foreground'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <FileImage />
              </EmptyMedia>
              <EmptyTitle>No posts found</EmptyTitle>
              <EmptyDescription>No posts match the current search or status filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!isLoading && !isError && filteredPosts.length > 0 && (
          <div className='flex flex-col gap-6'>
            {groupedPosts.map((group) => (
              <section key={group.label} className='flex flex-col gap-3'>
                <div className='flex items-center gap-3'>
                  <h2 className='shrink-0 text-sm font-semibold text-foreground'>{group.label}</h2>
                  <div className='h-px flex-1 bg-border' />
                </div>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                  {group.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ))}

            <section className='flex flex-col items-center gap-3 pb-4'>
              {hasNextPage && <div ref={loadMoreRef} className='h-px w-full' aria-hidden='true' />}

              {isFetchingNextPage ? (
                <div className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='size-4 animate-spin' />
                  <span>Loading more posts...</span>
                </div>
              ) : hasNextPage ? (
                <div className='flex flex-col items-center gap-2'>
                  <p className='text-xs text-muted-foreground'>Scroll down to load more posts.</p>
                  <Button type='button' variant='outline' onClick={onLoadMore}>
                    Load more
                  </Button>
                </div>
              ) : (
                <p className='text-xs text-muted-foreground'>No more posts to load.</p>
              )}
            </section>
          </div>
        )}

        {isRefreshing && <p className='text-center text-xs text-muted-foreground'>Refreshing posts...</p>}
      </div>
    </div>
  );
}
