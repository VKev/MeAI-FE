type EmptyStateProps = {
  message: string;
  subtext: string;
};

export function EmptyState({ message, subtext }: EmptyStateProps) {
  return (
    <div className='flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015]'>
      <div className='text-center'>
        <p className='text-sm font-medium text-slate-300'>{message}</p>
        <p className='mt-1 text-xs text-slate-500'>{subtext}</p>
      </div>
    </div>
  );
}
