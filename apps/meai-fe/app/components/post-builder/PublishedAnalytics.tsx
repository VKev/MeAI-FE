import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Eye, Heart, MessageCircle, Repeat2, Share2, Bookmark, RefreshCw } from 'lucide-react';
import { fetchPlatformPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostStats, PlatformCommentSample } from '@/models/post.model';
import { cn } from '@/lib/utils';

type Props = {
  socialMediaId: string;
  // Raw externalContentId as the FE holds it. Threads stores "{mediaId}|{permalink}" so
  // we split out the numeric id before calling the BE. Other platforms pass through.
  externalContentId: string;
  // Used to hide metrics that the platform doesn't support (e.g. Threads has no shares,
  // TikTok has no saves) so the card only renders cells that are actually meaningful.
  platformType: string;
};

function extractPlatformPostId(raw: string, platformType: string): string {
  if (platformType.toLowerCase() === 'threads') {
    const pipe = raw.indexOf('|');
    if (pipe > 0) return raw.slice(0, pipe);
  }
  return raw;
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value < 1000) return value.toString();
  if (value < 10_000) return `${(value / 1000).toFixed(1)}K`;
  if (value < 1_000_000) return `${Math.round(value / 1000)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

type MetricRow = { label: string; value: number | null | undefined; Icon: typeof Eye };

function buildMetricRows(stats: PlatformPostStats, platformType: string): MetricRow[] {
  const platform = platformType.toLowerCase();
  const rows: MetricRow[] = [];

  // Views/reach/impressions — platforms use different labels, pick the most relevant one.
  // Facebook feed posts have no native view metric and FB zeroes `post_impressions_unique`
  // (our "reach") on pages under ~100 followers for privacy. Showing "Reach: 0" is
  // misleading, so skip the fallback entirely for Facebook — FB videos/reels still
  // surface `views` through the first branch (mapped from `total_video_views`).
  if (stats.views != null) rows.push({ label: 'Views', value: stats.views, Icon: Eye });
  else if (platform !== 'facebook') {
    if (stats.reach != null) rows.push({ label: 'Reach', value: stats.reach, Icon: Eye });
    else if (stats.impressions != null) rows.push({ label: 'Impressions', value: stats.impressions, Icon: Eye });
  }

  rows.push({ label: 'Likes', value: stats.likes, Icon: Heart });
  rows.push({ label: 'Comments', value: stats.comments, Icon: MessageCircle });

  // Shares vs reposts vs quotes — Threads uses reposts+quotes, Meta/TikTok use shares.
  if (platform === 'threads' || platform === 'thread') {
    if (stats.reposts != null) rows.push({ label: 'Reposts', value: stats.reposts, Icon: Repeat2 });
    if (stats.quotes != null) rows.push({ label: 'Quotes', value: stats.quotes, Icon: Share2 });
  } else {
    if (stats.shares != null) rows.push({ label: 'Shares', value: stats.shares, Icon: Share2 });
  }

  // IG/Meta carousel posts expose saves; Threads/TikTok don't.
  if (stats.saves != null) rows.push({ label: 'Saves', value: stats.saves, Icon: Bookmark });

  return rows;
}

export default function PublishedAnalytics({ socialMediaId, externalContentId, platformType }: Props) {
  const platformPostId = useMemo(
    () => extractPlatformPostId(externalContentId, platformType),
    [externalContentId, platformType]
  );

  const queryKey = useMemo(
    () => ['platform-post-analytics', socialMediaId, platformPostId],
    [socialMediaId, platformPostId]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchPlatformPostAnalytics(socialMediaId, platformPostId, false, signal),
    enabled: Boolean(socialMediaId && platformPostId),
    staleTime: 60_000
  });

  if (!socialMediaId || !platformPostId) return null;

  const analytics = data?.value ?? null;
  const stats = analytics?.stats;
  const comments = analytics?.commentSamples ?? [];

  const metrics = stats ? buildMetricRows(stats, platformType) : [];

  return (
    <div className='rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold text-white'>Post analytics</h3>
        <div className='flex items-center gap-2'>
          {analytics?.retrievedAt && (
            <span className='text-[10px] text-zinc-500'>Synced {timeAgo(analytics.retrievedAt)}</span>
          )}
          <button
            type='button'
            disabled={isFetching}
            onClick={() => {
              // `refresh=true` forces the BE to bypass cache + re-hit the platform API.
              void fetchPlatformPostAnalytics(socialMediaId, platformPostId, true).then(() => refetch());
            }}
            className='inline-flex items-center gap-1 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60'
          >
            <RefreshCw className={cn('size-3', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className='mt-3 flex items-center justify-center py-6 text-xs text-white/50'>
          Loading analytics…
        </div>
      ) : isError ? (
        <div className='mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200'>
          Couldn't load analytics.{' '}
          {error instanceof Error && error.message ? <span className='text-rose-300/80'>{error.message}</span> : null}
        </div>
      ) : !stats ? (
        <div className='mt-3 text-xs text-white/50'>No metrics returned yet — the platform may still be aggregating.</div>
      ) : (
        <>
          <div className='mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4'>
            {metrics.map(({ label, value, Icon }) => (
              <div
                key={label}
                className='rounded-md border border-white/5 bg-zinc-900/50 px-2.5 py-2'
                title={typeof value === 'number' ? value.toLocaleString() : undefined}
              >
                <div className='flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500'>
                  <Icon className='size-3' />
                  {label}
                </div>
                <div className='mt-0.5 text-sm font-semibold text-white tabular-nums'>{formatCount(value)}</div>
              </div>
            ))}
          </div>

          {/* Reaction breakdown for FB-style platforms that return it. Hidden when empty. */}
          {stats.reactionBreakdown && Object.keys(stats.reactionBreakdown).length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {Object.entries(stats.reactionBreakdown).map(([reaction, count]) => (
                <span
                  key={reaction}
                  className='inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-900/50 px-2 py-0.5 text-[10px] text-zinc-300'
                >
                  <span className='capitalize text-zinc-400'>{reaction}</span>
                  <span className='font-semibold text-white tabular-nums'>{formatCount(count)}</span>
                </span>
              ))}
            </div>
          )}

          {comments.length > 0 && <CommentList comments={comments} />}
        </>
      )}
    </div>
  );
}

function CommentList({ comments }: { comments: PlatformCommentSample[] }) {
  return (
    <div className='mt-3 border-t border-white/5 pt-3'>
      <div className='mb-2 flex items-center justify-between'>
        <h4 className='text-xs font-semibold text-white'>Recent comments</h4>
        <span className='text-[10px] text-zinc-500'>{comments.length} sampled</span>
      </div>
      <ul className='max-h-72 space-y-2 overflow-y-auto pr-1'>
        {comments.map((c) => (
          <li
            key={c.id}
            className='rounded-md border border-white/5 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200'
          >
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-1.5'>
                <span className='font-semibold text-white'>
                  {c.authorName || c.authorUsername || 'Anonymous'}
                </span>
                {c.authorUsername && c.authorName && (
                  <span className='text-[10px] text-zinc-500'>@{c.authorUsername}</span>
                )}
              </div>
              <div className='flex items-center gap-2 text-[10px] text-zinc-500'>
                {typeof c.likeCount === 'number' && c.likeCount > 0 && (
                  <span className='inline-flex items-center gap-0.5'>
                    <Heart className='size-3' /> {c.likeCount}
                  </span>
                )}
                {typeof c.replyCount === 'number' && c.replyCount > 0 && (
                  <span className='inline-flex items-center gap-0.5'>
                    <MessageCircle className='size-3' /> {c.replyCount}
                  </span>
                )}
                {c.createdAt && <span>{timeAgo(c.createdAt)}</span>}
                {c.permalink && (
                  <a
                    href={c.permalink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-0.5 text-zinc-400 hover:text-white'
                  >
                    <ExternalLink className='size-3' />
                  </a>
                )}
              </div>
            </div>
            {c.text ? (
              <p className='mt-1 whitespace-pre-wrap break-words leading-relaxed'>{c.text}</p>
            ) : (
              <p className='mt-1 italic text-zinc-500'>(no text)</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
