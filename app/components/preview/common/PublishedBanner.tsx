import type { PlatformPublishInfo } from '@/routes/post-builder/hooks/usePostBuilder';
import { CheckCircle2, ExternalLink } from 'lucide-react';

type PublishedBannerProps = {
  platformLabel: string;
  info: PlatformPublishInfo | undefined;
  className?: string;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function PublishedBanner({ platformLabel, info, className }: PublishedBannerProps) {
  if (!info?.isPublished) return null;

  const publishedAt = formatDate(info.publishedAt);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 ${className ?? ''}`}
    >
      <div className='flex items-center gap-2'>
        <CheckCircle2 className='size-4 text-emerald-400' />
        <span>
          Published on {platformLabel}
          {publishedAt ? ` · ${publishedAt}` : ''}
        </span>
      </div>
      {info.externalUrl ? (
        <a
          href={info.externalUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25'
        >
          <ExternalLink className='size-3.5' /> Open
        </a>
      ) : null}
    </div>
  );
}
