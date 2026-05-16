import React from 'react';
import { PLATFORM_CONFIG, type PlatformType } from '@/routes/user/product-config';
import { cn } from '@/lib/utils';
import type { PostPublication } from '@/models/post.model';

interface PlatformStackProps {
  publications: PostPublication[];
  maxDisplay?: number;
  className?: string;
}

export function PlatformStack({ publications, maxDisplay = 4, className }: PlatformStackProps) {
  if (!publications || publications.length === 0) return null;

  const displayPubs = publications.slice(0, maxDisplay);
  const remaining = publications.length - maxDisplay;

  return (
    <div className={cn('flex -space-x-1.5', className)}>
      {displayPubs.map((pub, index) => {
        const platform = PLATFORM_CONFIG[pub.socialMediaType as PlatformType];
        if (!platform) return null;

        const Icon = platform.icon;
        return (
          <div
            key={pub.id || index}
            className='group/icon relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-900 bg-neutral-800 p-1.5 transition-transform hover:z-20 hover:scale-110'
            title={pub.socialMediaType || ''}
            style={{ zIndex: displayPubs.length - index }}
          >
            <Icon className='h-full w-full' color={platform.color} />
          </div>
        );
      })}

      {remaining > 0 && (
        <div className='relative z-0 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-900 bg-neutral-800 text-[9px] font-medium text-slate-300'>
          +{remaining}
        </div>
      )}
    </div>
  );
}
