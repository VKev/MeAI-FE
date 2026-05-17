import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type TModelOption = {
  id: string;
  name: string;
  description: string;
};

interface TModelSelectionProps<T extends TModelOption> {
  models: readonly T[];
  selectedModel: T;
  onSelectModel: (model: T) => void;
}

export default function ModelSelection<T extends TModelOption>({
  models,
  selectedModel,
  onSelectModel
}: TModelSelectionProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <div className='relative grid min-h-20 w-full place-items-center overflow-hidden px-4 py-3'>
      <div className='pointer-events-none absolute inset-0 rounded-t-lg bg-gradient-to-br from-purple-900/40 via-fuchsia-900/30 to-indigo-900/40' />

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className='bg-gray-900 relative flex h-16 w-full items-center justify-between gap-2 rounded-lg px-4'>
            <div className='flex flex-col items-start'>
              <span className='bg-slate-800 text-fuchsia-600 rounded px-2 text-xs font-medium'>Model</span>
              <span className='text-white text-sm'>{selectedModel.name}</span>
            </div>

            {open ? <ChevronUp className='h-4 w-4 text-white' /> : <ChevronDown className='h-4 w-4 text-white' />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side='right'
          align='start'
          className='w-80 rounded-2xl bg-gray-950 border border-gray-800 p-3'
          sideOffset={35}
          alignOffset={-14}
        >
          {models.map((model) => {
            const isSelected = selectedModel.id === model.id;

            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSelectModel(model)}
                className={`cursor-pointer p-0 mb-2 last:mb-0 rounded-xl overflow-hidden focus:bg-transparent hover:bg-transparent ${
                  isSelected ? 'ring-1 ring-purple-500' : 'ring-1 ring-gray-800'
                }`}
              >
                <div
                  className={`w-full flex flex-col gap-1 p-3 transition ${
                    isSelected ? 'bg-gray-900' : 'hover:bg-gray-900'
                  }`}
                >
                  <span className='text-sm font-medium text-white'>{model.name}</span>
                  <p className='text-xs text-gray-500 line-clamp-2'>{model.description}</p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
