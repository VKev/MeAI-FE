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
import { AlertTriangle, CheckCircle2, Eye, Edit, FileImage, RefreshCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type PostListViewProps = {
  title: string;
  description: string;
  posts: Post[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
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
    return 'border-transparent bg-emerald-500/10 text-emerald-400';
  }

  const normalizedStatus = post.status?.toLowerCase();

  switch (normalizedStatus) {
    case 'draft':
      return 'border-transparent bg-amber-500/10 text-amber-400';
    default:
      return 'border-transparent bg-slate-500/10 text-slate-400';
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
    return null;
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
          className='max-h-[500px] w-full bg-[#13131e] object-cover'
        />
      );
    }
    return (
      <img
        src={primaryMedia.presignedUrl}
        alt={title}
        className='max-h-[500px] w-full bg-[#13131e] object-cover'
      />
    );
  }

  if (previewMedia.length === 2) {
    return (
      <div className='grid grid-cols-2 gap-0.5 bg-white/[0.06]'>
        {previewMedia.map((item, index) => (
          <div key={item.resourceId} className='relative aspect-[3/4] w-full bg-[#13131e]'>
            {getMediaType(item) === 'video' ? (
              <video src={item.presignedUrl} muted playsInline className='h-full w-full object-cover' />
            ) : (
              <img src={item.presignedUrl} alt={`${title} ${index + 1}`} className='h-full w-full object-cover' />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (previewMedia.length === 3) {
    return (
      <div className='grid grid-cols-2 grid-rows-2 gap-0.5 bg-white/[0.06]'>
        <div className='relative col-span-2 row-span-1 aspect-video bg-[#13131e]'>
          {getMediaType(previewMedia[0]) === 'video' ? (
            <video src={previewMedia[0].presignedUrl} muted playsInline className='h-full w-full object-cover' />
          ) : (
            <img src={previewMedia[0].presignedUrl} alt={`${title} 1`} className='h-full w-full object-cover' />
          )}
        </div>
        {previewMedia.slice(1).map((item, index) => (
          <div key={item.resourceId} className='relative aspect-square w-full bg-[#13131e]'>
            {getMediaType(item) === 'video' ? (
              <video src={item.presignedUrl} muted playsInline className='h-full w-full object-cover' />
            ) : (
              <img src={item.presignedUrl} alt={`${title} ${index + 2}`} className='h-full w-full object-cover' />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-0.5 bg-white/[0.06]'>
      {previewMedia.map((item, index) => {
        const showRemainingOverlay = index === 3 && remainingMediaCount > 0;
        return (
          <div key={item.resourceId} className='relative aspect-square w-full bg-[#13131e]'>
            {getMediaType(item) === 'video' ? (
              <video src={item.presignedUrl} muted playsInline className='h-full w-full object-cover' />
            ) : (
              <img src={item.presignedUrl} alt={`${title} ${index + 1}`} className='h-full w-full object-cover' />
            )}
            {showRemainingOverlay && (
              <div className='absolute inset-0 flex items-center justify-center bg-[#13131e]/80 backdrop-blur-sm'>
                <span className='text-2xl font-semibold text-white'>+{remainingMediaCount}</span>
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
    <Card className='group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] shadow-sm transition-all duration-300 hover:border-white/[0.15] break-inside-avoid mb-6'>
      <CardContent className='flex flex-col p-0'>
        {post.media && post.media.length > 0 ? (
          <div className='relative group/media'>
            <PostMediaPreview media={post.media} title={post.title?.trim() || 'Post media'} />
            
            <div className='absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 rounded-t-xl z-20'>
              <Button size='sm' variant='secondary' className='h-8 bg-white/20 hover:bg-white/30 text-white border-none rounded-full backdrop-blur-md'>
                <Eye className='size-3.5 mr-1.5' /> View
              </Button>
              <Button size='sm' variant='secondary' className='h-8 bg-white/20 hover:bg-white/30 text-white border-none rounded-full backdrop-blur-md'>
                <Edit className='size-3.5 mr-1.5' /> Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className='h-1.5 w-full bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40' />
        )}

        <div className='flex flex-col px-5 py-5 gap-3'>
          <div className='flex items-start justify-between gap-2'>
            <Badge variant='outline' className={cn('h-5 shrink-0 border-none px-2 py-0 text-[10px] font-bold uppercase tracking-wide', getStatusBadgeClassName(post))}>
              {post.isPublished ? 'Published' : formatStatus(post.status)}
            </Badge>
            <div className='flex items-center gap-2'>
              <span className='text-[11px] text-slate-500 font-medium'>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          <p className='text-[15px] font-semibold text-white leading-snug'>
            {post.title?.trim() || 'Untitled post'}
          </p>

          <p className='whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300'>
            {post.content?.content?.trim() || 'No content available.'}
          </p>

          {hashtags.length > 0 && (
            <div className='flex flex-wrap gap-x-2 gap-y-1 mt-1'>
              {hashtags.map((hashtag) => (
                <span key={`${post.id}-${hashtag}`} className='cursor-pointer text-[12px] font-medium leading-5 text-violet-400 hover:text-violet-300 hover:underline'>
                  {hashtag}
                </span>
              ))}
            </div>
          )}

          <div className='mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4'>
            <div className='flex items-center gap-2'>
              <Avatar className='size-6 shrink-0 border border-white/[0.06] bg-[#13131e] p-0'>
                <AvatarImage src='/black-meai-logo.webp' alt='MeAI' className='rounded-full' />
                <AvatarFallback className='bg-transparent text-[10px] text-white'>MA</AvatarFallback>
              </Avatar>
              <div className='flex items-center gap-1.5'>
                <span className='truncate text-[12px] font-medium text-white'>MeAI</span>
                {post.isPublished && <CheckCircle2 className='size-3.5 text-emerald-400' />}
              </div>
            </div>

            <div className='flex items-center'>
              {publications.length > 0 && (
                publications.map((publication, index) => {
                  const SocialIcon = getPublicationLogo(publication.socialMediaType);
                  if (!SocialIcon) return null;
                  return (
                    <div
                      key={publication.id}
                      title={publication.socialMediaType || 'published'}
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full border-[1.5px] border-[#13131e] bg-white/[0.08] text-white',
                        index > 0 && '-ml-2'
                      )}
                    >
                      <SocialIcon size={12} className='text-white' />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostListSkeleton() {
  return (
    <section className='columns-1 sm:columns-2 xl:columns-4 gap-6 pt-6'>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={`post-skeleton-${index}`} className='break-inside-avoid mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden'>
          <div className='aspect-video w-full animate-pulse bg-white/[0.05]' />
          <div className='p-5 flex flex-col gap-4'>
            <div className='h-4 w-1/3 animate-pulse rounded bg-white/[0.05]' />
            <div className='h-5 w-3/4 animate-pulse rounded bg-white/[0.05]' />
            <div className='h-10 w-full animate-pulse rounded bg-white/[0.05]' />
            <div className='mt-2 flex items-center gap-3'>
              <div className='size-6 animate-pulse rounded-full bg-white/[0.05]' />
              <div className='h-3 w-1/4 animate-pulse rounded bg-white/[0.05]' />
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
  onRetry
}: PostListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  return (
    <div className='min-h-screen px-4 pb-12 pt-8 sm:px-6 sm:pt-10 xl:px-8 max-w-[1600px] mx-auto'>
      <div className='flex flex-col gap-8'>
        
        <section className='flex flex-col items-center justify-center text-center px-4 py-10 sm:py-14 bg-white/[0.02] rounded-3xl border border-white/[0.04] relative overflow-hidden'>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white to-slate-400 text-transparent bg-clip-text mb-4 z-10'>
            {_title || 'All Product Posts'}
          </h1>
          <p className='text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed z-10'>
            {_description || 'Manage and preview all your social media posts across workspaces in one seamless, highly visual feed.'}
          </p>
          
          <div className='mt-8 w-full max-w-2xl relative z-10'>
            <InputGroup className='w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-lg focus-within:border-violet-500/40 focus-within:bg-white/[0.05] transition-all backdrop-blur-md p-1'>
              <InputGroupAddon align='inline-start' className='pl-1'>
                <ButtonGroup className='rounded-xl bg-transparent p-0.5'>
                  {STATUS_FILTERS.map((filter) => {
                    const isActive = statusFilter === filter;
                    return (
                      <InputGroupButton
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        size='sm'
                        variant='ghost'
                        className={cn(
                          'rounded-lg px-4 py-1.5 text-[13px] font-medium capitalize outline-none transition-colors h-8',
                          isActive
                            ? 'bg-white/[0.1] text-white shadow-sm hover:bg-white/[0.15]'
                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                        )}
                        aria-pressed={isActive}
                      >
                        {filter}
                      </InputGroupButton>
                    );
                  })}
                </ButtonGroup>
              </InputGroupAddon>
              <InputGroupAddon align='inline-start' className='text-slate-500 ml-2'>
                <Search size={18} />
              </InputGroupAddon>
              <InputGroupInput
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Search posts'
                className='h-10 border-none bg-transparent px-3 text-[14px] text-white placeholder:text-slate-500 focus-visible:ring-0 [&:not(:focus-visible)]:focus:ring-0 dark:bg-transparent'
              />
            </InputGroup>
          </div>
        </section>

        {isLoading && <PostListSkeleton />}

        {!isLoading && isError && (
          <Empty className='min-h-[calc(100vh-12rem)] rounded-3xl border border-white/[0.06] bg-white/[0.02] text-white'>
            <EmptyHeader>
              <EmptyMedia variant='icon' className='text-slate-400 bg-white/[0.04]'>
                <AlertTriangle />
              </EmptyMedia>
              <EmptyTitle>Failed to load posts</EmptyTitle>
              <EmptyDescription className='text-slate-500'>{errorMessage || 'Unexpected error while fetching posts.'}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type='button' onClick={onRetry} className='bg-violet-600 text-white hover:bg-violet-700'>
                <RefreshCcw className='mr-2 size-4' />
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && !isError && filteredPosts.length === 0 && (
          <Empty className='min-h-[calc(100vh-12rem)] rounded-3xl border border-white/[0.06] bg-white/[0.02] text-white'>
            <EmptyHeader>
              <EmptyMedia variant='icon' className='text-slate-400 bg-white/[0.04]'>
                <FileImage />
              </EmptyMedia>
              <EmptyTitle>No posts found</EmptyTitle>
              <EmptyDescription className='text-slate-500'>No posts match the current search or status filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!isLoading && !isError && filteredPosts.length > 0 && (
          <div className='flex flex-col gap-10'>
            {groupedPosts.map((group) => (
              <section key={group.label} className='flex flex-col gap-6'>
                <div className='flex items-center gap-4'>
                  <h2 className='shrink-0 text-sm font-semibold uppercase tracking-widest text-slate-400'>{group.label}</h2>
                  <div className='h-px flex-1 bg-white/[0.06]' />
                </div>

                <div className='columns-1 sm:columns-2 xl:columns-4 gap-6'>
                  {group.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
