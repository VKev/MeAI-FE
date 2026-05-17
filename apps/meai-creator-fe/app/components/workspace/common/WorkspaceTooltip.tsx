import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TWorkspaceTooltipProps {
  triggerContent?: ReactNode;
  tooltipContent: ReactNode;
}

export default function WorkspaceTooltip({ triggerContent = '?', tooltipContent }: TWorkspaceTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className='flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-xs text-gray-400 hover:border-gray-500'>
          {triggerContent}
        </button>
      </TooltipTrigger>
      <TooltipContent side='right' className='max-w-xs bg-white text-black border-0 overflow-hidden p-0!'>
        <div className='p-3'>{tooltipContent}</div>
      </TooltipContent>
    </Tooltip>
  );
}