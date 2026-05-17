import { cn } from '@/lib/utils';
import type { ContentAlertSeverity } from '@/routes/post-builder/hooks/usePostBuilder';
import React from 'react';

type InlineAlertProps = {
  severity: ContentAlertSeverity;
  message: string;
};

function InlineAlert({ severity, message }: InlineAlertProps) {
  return (
    <div
      className={cn(
        'mt-4 rounded-md border px-3 py-2 text-sm',
        severity === 'recommend' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
        severity === 'warn' && 'border-amber-500/40 bg-amber-500/10 text-amber-200',
        severity === 'block' && 'border-rose-500/40 bg-rose-500/10 text-rose-200'
      )}
      role='alert'
    >
      {message}
    </div>
  );
}

export default React.memo(InlineAlert);
