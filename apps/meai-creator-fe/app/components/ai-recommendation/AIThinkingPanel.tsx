import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  Search,
  Sparkles
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { AiRecommendationThinkingItem } from '@/store/ai-recommendation-events.store';
import { cn } from '@/lib/utils';

type AIThinkingItem = AiRecommendationThinkingItem;
type AIThinkingPanelTone = 'violet' | 'amber';
type AIThinkingPanelLayout = 'default' | 'fill';

interface AIThinkingPanelProps {
  thinkings?: AIThinkingItem[];
  isActive?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  tone?: AIThinkingPanelTone;
  layout?: AIThinkingPanelLayout;
  className?: string;
  style?: CSSProperties;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function getValue(record: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    if (key in record) return record[key];
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (pascalKey in record) return record[pascalKey];
  }
  return undefined;
}

function getString(record: Record<string, unknown> | null | undefined, keys: string[]) {
  const value = getValue(record, keys);
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getNumber(record: Record<string, unknown> | null | undefined, keys: string[]) {
  const value = getValue(record, keys);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getRecords(record: Record<string, unknown> | null | undefined, keys: string[]) {
  const value = getValue(record, keys);
  if (!Array.isArray(value)) return [];
  return value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
}

function getProgressInfo(details: unknown) {
  const record = asRecord(details);
  if (!record) return null;

  const completed = getNumber(record, ['completedDocuments', 'completed', 'current']);
  const total = getNumber(record, ['totalDocuments', 'total']);
  if (completed == null || total == null || total <= 0) return null;

  const safeCompleted = Math.min(Math.max(completed, 0), total);
  return {
    completed: safeCompleted,
    total,
    label: getString(record, ['progressLabel']) ?? `${safeCompleted}/${total}`,
    percent: Math.round((safeCompleted / total) * 100)
  };
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function hostName(url: string | null) {
  if (!url) return null;
  try {
    return new URL(normalizeAssetUrl(url) ?? url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function normalizeAssetUrl(url: string | null) {
  return url;
}

function truncateMiddle(value: string, max = 72) {
  if (value.length <= max) return value;
  const head = Math.floor(max * 0.6);
  const tail = Math.max(12, max - head - 1);
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function ExpandableText({ text, limit = 180, className = '' }: { text: string; limit?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > limit;
  const visibleText = shouldTruncate && !expanded ? `${text.slice(0, limit).trim()}...` : text;

  return (
    <div className={className}>
      <p className='whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300'>{visibleText}</p>
      {shouldTruncate && (
        <button
          type='button'
          onClick={() => setExpanded((value) => !value)}
          className='mt-1 text-[11px] font-medium text-violet-300 hover:text-violet-200'
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='rounded-xl border border-white/8 bg-black/20 p-3'>
      <p className='mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500'>{label}</p>
      {children}
    </div>
  );
}

function TextResult({ label, text, limit = 260 }: { label: string; text: string | null; limit?: number }) {
  if (!text) return null;
  return (
    <DetailBlock label={label}>
      <ExpandableText text={text} limit={limit} />
    </DetailBlock>
  );
}

function InlineProgress({ progress }: { progress: NonNullable<ReturnType<typeof getProgressInfo>> }) {
  return (
    <div className='mt-3 max-w-sm'>
      <div className='mb-1 flex items-center justify-between text-[11px] text-slate-400'>
        <span>RAG indexing</span>
        <span className='font-medium text-violet-200'>{progress.label}</span>
      </div>
      <div className='h-1.5 overflow-hidden rounded-full bg-white/8'>
        <div className='h-full rounded-full bg-violet-400 transition-all' style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}

function WebResults({ results }: { results: Record<string, unknown>[] }) {
  if (results.length === 0) return null;

  return (
    <DetailBlock label='Result'>
      <div className='space-y-2'>
        {results.slice(0, 5).map((result, index) => {
          const url = getString(result, ['url']);
          const title = getString(result, ['title']) ?? hostName(url) ?? `Result ${index + 1}`;
          const snippet = getString(result, ['snippet', 'description']);
          const age = getString(result, ['age']);

          return (
            <div key={`${url ?? title}-${index}`} className='rounded-lg border border-white/8 bg-white/3 p-2.5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  {url ? (
                    <a
                      href={url}
                      target='_blank'
                      rel='noreferrer'
                      className='line-clamp-2 text-xs font-medium text-violet-200 hover:text-violet-100'
                    >
                      {title}
                    </a>
                  ) : (
                    <p className='line-clamp-2 text-xs font-medium text-slate-200'>{title}</p>
                  )}
                  {url && <p className='mt-0.5 truncate text-[10px] text-slate-500'>{hostName(url)}</p>}
                </div>
                {url && <ExternalLink className='mt-0.5 h-3 w-3 shrink-0 text-slate-500' />}
              </div>
              {snippet && <p className='mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-400'>{snippet}</p>}
              {age && <p className='mt-1 text-[10px] text-slate-500'>{age}</p>}
            </div>
          );
        })}
      </div>
    </DetailBlock>
  );
}

function ImageResults({ results }: { results: Record<string, unknown>[] }) {
  if (results.length === 0) return null;

  return (
    <DetailBlock label='Result'>
      <div className='space-y-2'>
        {results.slice(0, 6).map((result, index) => {
          const imageUrl = normalizeAssetUrl(
            getString(result, ['imageUrl', 'mirroredUrl', 'ImageUrl']) ??
              getString(result, ['thumbnailUrl', 'ThumbnailUrl'])
          );
          const originalUrl = normalizeAssetUrl(getString(result, ['originalUrl']));
          const sourcePageUrl = normalizeAssetUrl(getString(result, ['sourcePageUrl']));
          const title =
            getString(result, ['title']) ?? getString(result, ['descriptiveText']) ?? `Visual reference ${index + 1}`;
          const source = getString(result, ['source']);
          const linkUrl = sourcePageUrl ?? originalUrl ?? imageUrl;

          return (
            <div
              key={`${imageUrl ?? title}-${index}`}
              className='flex gap-3 rounded-lg border border-white/8 bg-white/3 p-2.5'
            >
              <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-black/30'>
                {imageUrl ? (
                  <img src={imageUrl} alt='' className='h-full w-full object-cover' loading='lazy' />
                ) : (
                  <ImageIcon className='h-4 w-4 text-slate-500' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='line-clamp-2 text-xs font-medium text-slate-200'>{title}</p>
                <div className='mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500'>
                  {source && <span className='rounded-full border border-white/8 px-2 py-0.5'>{source}</span>}
                  {linkUrl && (
                    <a
                      href={linkUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-violet-300 hover:text-violet-200'
                    >
                      {truncateMiddle(hostName(linkUrl) ?? linkUrl, 48)}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DetailBlock>
  );
}

function ContextItems({ details, label = 'Posts' }: { details: Record<string, unknown>; label?: string }) {
  const items =
    getRecords(details, ['knowledgeItems']).length > 0
      ? getRecords(details, ['knowledgeItems'])
      : getRecords(details, ['posts']);
  if (items.length === 0) return null;

  const platform = getString(details, ['platform']);

  return (
    <DetailBlock label={label}>
      <div className='space-y-2'>
        {items.map((post, index) => {
          const postPlatform = getString(post, ['platform']) ?? platform;
          const postId = getString(post, ['platformPostId', 'postId', 'id']);
          const title = getString(post, ['title']) ?? postId ?? 'Account context';
          const preview = getString(post, ['textPreview', 'caption', 'text']);
          const mediaType = getString(post, ['mediaType']);
          const permalink = getString(post, ['permalink', 'url', 'shareUrl']);
          const publishedAt = formatDate(getValue(post, ['publishedAt']));
          const documentKinds = getValue(post, ['documentKinds']);
          const kinds = Array.isArray(documentKinds)
            ? documentKinds.filter((value): value is string => typeof value === 'string')
            : [];

          return (
            <div key={`${postId ?? title}-${index}`} className='rounded-lg border border-white/8 bg-white/3 p-2.5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='line-clamp-2 text-xs font-medium text-slate-100'>{title}</p>
                  {preview && <p className='mt-1 line-clamp-3 text-xs leading-relaxed text-slate-400'>{preview}</p>}
                </div>
                {postPlatform && (
                  <span className='shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase text-slate-300'>
                    {postPlatform}
                  </span>
                )}
              </div>
              <div className='mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500'>
                {mediaType && <span className='rounded-full border border-white/8 px-2 py-0.5'>{mediaType}</span>}
                {kinds.map((kind) => (
                  <span key={kind} className='rounded-full border border-white/8 px-2 py-0.5'>
                    {kind}
                  </span>
                ))}
                {publishedAt && <span>{publishedAt}</span>}
                {permalink && (
                  <a
                    href={permalink}
                    target='_blank'
                    rel='noreferrer'
                    className='text-violet-300 hover:text-violet-200'
                  >
                    Open post
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DetailBlock>
  );
}

function KnowledgeReferences({ references }: { references: Record<string, unknown>[] }) {
  if (references.length === 0) return null;

  return (
    <DetailBlock label='References'>
      <div className='space-y-2'>
        {references.slice(0, 5).map((reference, index) => {
          const postId = getString(reference, ['postId']);
          const referenceText = getString(reference, [
            'caption',
            'content',
            'text',
            'sourceText',
            'snippet',
            'description',
            'videoTranscript'
          ]);
          const source = getString(reference, ['source']);
          const imageUrl = normalizeAssetUrl(getString(reference, ['mirroredImageUrl', 'imageUrl']));

          return (
            <div
              key={`${postId ?? source ?? index}-${index}`}
              className='rounded-lg border border-white/8 bg-white/3 p-2.5'
            >
              <div className='flex items-center justify-between gap-2'>
                <p className='truncate text-xs font-medium text-slate-200'>
                  {postId ? `Post ${postId}` : `Reference ${index + 1}`}
                </p>
                {source && (
                  <span className='rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-slate-400'>{source}</span>
                )}
              </div>
              {referenceText && <ExpandableText text={referenceText} limit={260} className='mt-1' />}
              {imageUrl && (
                <a
                  href={imageUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='mt-1 inline-block text-[10px] text-violet-300 hover:text-violet-200'
                >
                  Open reference image
                </a>
              )}
            </div>
          );
        })}
      </div>
    </DetailBlock>
  );
}

function FailedDocuments({ details }: { details: Record<string, unknown> }) {
  const nested = asRecord(getValue(details, ['details']));
  const failedDocuments =
    getRecords(details, ['failedDocuments', 'failedIngestDocuments']).length > 0
      ? getRecords(details, ['failedDocuments', 'failedIngestDocuments'])
      : getRecords(nested, ['failedDocuments', 'failedIngestDocuments']);

  if (failedDocuments.length === 0) return null;

  return (
    <DetailBlock label='Failed documents'>
      <div className='space-y-2'>
        {failedDocuments.slice(0, 4).map((doc, index) => (
          <div
            key={`${getString(doc, ['documentId']) ?? index}-${index}`}
            className='rounded-lg border border-amber-500/15 bg-amber-500/8 p-2.5 text-xs'
          >
            <p className='break-all font-medium text-amber-100'>
              {getString(doc, ['documentId']) ?? `Document ${index + 1}`}
            </p>
            <p className='mt-1 line-clamp-3 leading-relaxed text-amber-100/70'>
              {getString(doc, ['error', 'errorMessage', 'message', 'reason']) ?? 'No error details provided.'}
            </p>
          </div>
        ))}
        {failedDocuments.length > 4 && (
          <p className='text-xs text-slate-500'>+{failedDocuments.length - 4} more failed documents</p>
        )}
      </div>
    </DetailBlock>
  );
}

function renderWebSearchDetails(record: Record<string, unknown>) {
  const query = getString(record, ['query', 'primaryQuery', 'sourceQuery', 'recommendationQuery']);
  const results = getRecords(record, ['webSources', 'sources', 'results']);
  if (!query && results.length === 0) return null;

  return (
    <div className='mt-2 space-y-3'>
      <TextResult label='Query' text={query} limit={180} />
      <WebResults results={results} />
    </div>
  );
}

function renderVisualSearchDetails(record: Record<string, unknown>) {
  const query = getString(record, ['query', 'visualQuery']);
  const hits =
    getRecords(record, ['hits']).length > 0
      ? getRecords(record, ['hits'])
      : getRecords(record, ['candidates', 'mirroredImages']);
  if (!query && hits.length === 0) return null;

  return (
    <div className='mt-2 space-y-3'>
      <TextResult label='Query' text={query} limit={180} />
      <ImageResults results={hits} />
    </div>
  );
}

function renderKnowledgeDetails(record: Record<string, unknown>) {
  const query = getString(record, ['query', 'primaryQuery', 'sourceQuery', 'recommendationQuery']);
  const result = getString(record, ['answer', 'knowledge', 'ragAnswer', 'pageProfileText']);
  const references = getRecords(record, ['references']);
  const webSources = getRecords(record, ['webSources', 'sources']);
  if (!query && !result && references.length === 0 && webSources.length === 0) return null;

  return (
    <div className='mt-2 space-y-3'>
      <TextResult label='Query' text={query} limit={180} />
      <TextResult label='Result' text={result} limit={320} />
      <KnowledgeReferences references={references} />
      <WebResults results={webSources} />
    </div>
  );
}

function renderGenericDetails(record: Record<string, unknown>) {
  const nested = asRecord(getValue(record, ['details']));
  const errorMessage = getString(record, ['errorMessage']) ?? getString(nested, ['errorMessage']);
  const errorCode = getString(record, ['errorCode']) ?? getString(nested, ['errorCode']);
  const rows: Array<[string, ReactNode]> = [];

  const addStringRow = (keys: string[], label: string) => {
    const value = getString(record, keys) ?? getString(nested, keys);
    if (value) rows.push([label, <ExpandableText key={label} text={value} limit={160} />]);
  };
  const addNumberRow = (keys: string[], label: string) => {
    const value = getNumber(record, keys) ?? getNumber(nested, keys);
    if (value != null)
      rows.push([
        label,
        <span key={label} className='text-xs text-slate-300'>
          {value.toLocaleString()}
        </span>
      ]);
  };

  addStringRow(['platform'], 'Platform');
  addStringRow(['style'], 'Style');
  addStringRow(['userPrompt'], 'Prompt');
  addStringRow(['query'], 'Query');
  addNumberRow(['totalPostsScanned'], 'Posts scanned');
  addNumberRow(['newPosts'], 'New posts');
  addNumberRow(['updatedPosts'], 'Updated posts');
  addNumberRow(['queuedImageDocuments'], 'Image docs');
  addNumberRow(['queuedVideoDocuments'], 'Video docs');
  addNumberRow(['failedCount'], 'Failed docs');

  if (!errorMessage && !errorCode && rows.length === 0) return null;

  return (
    <div className='mt-2 space-y-3'>
      {(errorMessage || errorCode) && (
        <div className='rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100/90'>
          {errorCode && <p className='font-medium text-rose-200'>{errorCode}</p>}
          {errorMessage && <p>{errorMessage}</p>}
        </div>
      )}
      {rows.map(([label, value]) => (
        <DetailBlock key={label} label={label}>
          {value}
        </DetailBlock>
      ))}
      <FailedDocuments details={record} />
    </div>
  );
}

function renderDetails(thinking: AIThinkingItem): ReactNode {
  if (thinking.details == null) return null;

  if (typeof thinking.details === 'string') {
    return <TextResult label='Details' text={thinking.details} />;
  }

  const record = asRecord(thinking.details);
  if (!record) return null;

  const nested = asRecord(getValue(record, ['details']));
  if (getString(record, ['errorMessage']) || getString(nested, ['errorMessage'])) {
    return renderGenericDetails(record);
  }

  if (thinking.action === 'account_posts_reading_batch' || thinking.action === 'rag_account_context_indexing_batch') {
    return (
      <div className='mt-2 space-y-3'>
        <ContextItems details={record} label='RAG knowledge' />
      </div>
    );
  }

  if (thinking.action.includes('web_search')) {
    return renderWebSearchDetails(record);
  }

  if (thinking.action.includes('fresh_image_search') || thinking.action.includes('reference_rerank')) {
    return renderVisualSearchDetails(record);
  }

  if (thinking.action.includes('rag_query') || thinking.action.includes('style_knowledge')) {
    return renderKnowledgeDetails(record);
  }

  return renderGenericDetails(record);
}

function AIThinkingPanel({
  thinkings = [],
  isActive = false,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  tone = 'violet',
  layout = 'default',
  className,
  style
}: AIThinkingPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastItemIdRef = useRef<string | null>(null);
  const prependScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const hasFailedThinking = thinkings.some((thinking) => thinking.status === 'failed');
  const isPanelLoading = isLoading && !hasFailedThinking;
  const isPanelActive = isActive && !isPanelLoading && !hasFailedThinking;
  const accent = tone === 'amber'
    ? {
        iconShell: 'border-amber-300/15 bg-amber-300/8',
        icon: 'text-amber-200',
        loadingBadge: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
        loadingDot: 'text-amber-200',
      }
    : {
        iconShell: 'border-violet-300/15 bg-violet-300/8',
        icon: 'text-violet-300',
        loadingBadge: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
        loadingDot: 'text-violet-300',
      };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const nextLastId = thinkings.at(-1)?.id ?? null;
    const shouldScrollToBottom = lastItemIdRef.current !== nextLastId && !isLoadingMore;
    if (shouldScrollToBottom) {
      container.scrollTop = container.scrollHeight;
    }
    lastItemIdRef.current = nextLastId;
  }, [isLoadingMore, thinkings]);

  useEffect(() => {
    if (isLoadingMore || !prependScrollRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const previous = prependScrollRef.current;
      prependScrollRef.current = null;

      if (!container || !previous) return;

      const addedHeight = container.scrollHeight - previous.scrollHeight;
      container.scrollTop = Math.max(0, previous.scrollTop + addedHeight);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoadingMore, thinkings.length]);

  if (!isActive && thinkings.length === 0) {
    return null;
  }

  const requestLoadMore = () => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore || !onLoadMore) return;

    prependScrollRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop
    };
    onLoadMore();
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore || !onLoadMore) return;
    if (container.scrollTop <= 48) {
      requestLoadMore();
    }
  };

  return (
    <section
      className={cn(
        layout === 'fill'
          ? 'flex h-full min-h-0 min-w-0 flex-col'
          : 'flex h-120 max-h-[calc(100vh_-_180px)] min-h-0 flex-col',
        'w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_18px_48px_rgba(0,0,0,0.28)]',
        className
      )}
      style={style}
    >
      <div className='flex shrink-0 items-center justify-between border-b border-white/8 bg-[#0b0d14]/95 px-5 py-4 backdrop-blur-xl'>
        <div className='flex items-center gap-3'>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${accent.iconShell}`}>
            <Brain className={`h-5 w-5 ${accent.icon}`} />
          </div>

          <div>
            <h2 className='text-sm font-semibold text-white'>AI Thinkings</h2>
            <p className='text-xs text-slate-400'>Realtime recommendation pipeline</p>
          </div>
        </div>

        {hasFailedThinking && (
          <div className='flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-300'>
            <AlertTriangle className='h-3 w-3' />
            Failed
          </div>
        )}
        {isPanelLoading && (
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${accent.loadingBadge}`}>
            <Loader2 className={`h-2 w-2 animate-spin ${accent.loadingDot}`} />
            Processing
          </div>
        )}
        {isPanelActive && (
          <div className='flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300'>
            <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
            Active
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className='ai-thinking-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-gutter:stable]'
      >
        <div className='relative space-y-4 before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-white/8'>
          {(hasMore || isLoadingMore) && (
            <div className='relative ml-8'>
              <button
                type='button'
                onClick={requestLoadMore}
                disabled={isLoadingMore || !hasMore}
                className='w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:text-slate-500'
              >
                {isLoadingMore ? 'Loading earlier thinking...' : 'Load earlier thinking'}
              </button>
            </div>
          )}

          {thinkings.map((thinking) => {
            const isDone = thinking.status === 'done';
            const isProcessing = thinking.status === 'processing';
            const isFailed = thinking.status === 'failed';
            const isWarning = thinking.status === 'warning';
            const isInfo = thinking.status === 'info';
            const details = renderDetails(thinking);
            const isExpanded = expandedIds.has(thinking.id);
            const progress = getProgressInfo(thinking.details);

            return (
              <div key={thinking.id} className='relative ml-8 rounded-2xl border border-white/8 bg-black/20 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]'>
                <div className='absolute -left-6 top-5 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#080a10]'>
                  {isDone ? (
                    <CheckCircle2 className='h-4 w-4 text-emerald-400' />
                  ) : isFailed ? (
                    <AlertTriangle className='h-4 w-4 text-rose-300' />
                  ) : isProcessing ? (
                    <Loader2 className='h-4 w-4 animate-spin text-violet-300' />
                  ) : isWarning ? (
                    <AlertTriangle className='h-4 w-4 text-amber-300' />
                  ) : isInfo ? (
                    <Info className='h-4 w-4 text-sky-300' />
                  ) : (
                    <Sparkles className='h-4 w-4 text-slate-500' />
                  )}
                </div>

                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 space-y-1'>
                    <h3 className='text-sm font-medium text-white'>{thinking.title}</h3>
                    <p className='text-xs leading-relaxed text-slate-400'>{thinking.description}</p>
                  </div>

                  <div
                    className={`
                      shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide
                      ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : isFailed
                            ? 'bg-rose-500/10 text-rose-300'
                            : isProcessing
                              ? 'bg-violet-500/10 text-violet-300'
                              : isWarning
                                ? 'bg-amber-500/10 text-amber-300'
                                : isInfo
                                  ? 'bg-sky-500/10 text-sky-300'
                                  : 'bg-white/5 text-slate-500'
                      }
                    `}
                  >
                    {thinking.status}
                  </div>
                </div>

                {progress && <InlineProgress progress={progress} />}

                {details && (
                  <div className='mt-3'>
                    <button
                      type='button'
                      onClick={() =>
                        setExpandedIds((current) => {
                          const next = new Set(current);
                          if (next.has(thinking.id)) {
                            next.delete(thinking.id);
                          } else {
                            next.add(thinking.id);
                          }
                          return next;
                        })
                      }
                      className='inline-flex items-center gap-1 text-xs font-medium text-violet-300 transition hover:text-violet-200'
                    >
                      {thinking.action.includes('web_search') && <Search className='h-3 w-3' />}
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>

                    {isExpanded && <div>{details}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isPanelActive && thinkings.length === 0 && (
          <div className='mt-5 rounded-2xl border border-dashed border-white/10 bg-white/2 p-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5'>
                <Bot className='h-4 w-4 text-white/80' />
              </div>

              <div className='space-y-1'>
                <p className='text-sm font-medium text-white'>Currently generating recommendation...</p>

                <div className='flex items-center gap-2 text-xs text-slate-400'>
                  <Loader2 className='h-3 w-3 animate-spin' />
                  AI is refining post structure and engagement hooks
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AIThinkingPanel;
