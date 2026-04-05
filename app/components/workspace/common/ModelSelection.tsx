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
  image: string;
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
      <img
        alt={selectedModel.name}
        loading='lazy'
        width='200'
        height='200'
        decoding='async'
        className='pointer-events-none absolute top-0 h-full w-full rounded-t-lg object-cover'
        src={selectedModel.image}
        style={{ color: 'transparent' }}
      />

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
          className='w-96 rounded-2xl bg-gray-950 border border-gray-800 p-3'
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
                  className={`w-full flex items-start gap-3 p-3 transition ${
                    isSelected ? 'bg-gray-900' : 'hover:bg-gray-900'
                  }`}
                >
                  <img src={model.image} alt={model.name} className='h-16 w-16 rounded-lg object-cover shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-sm font-medium text-white'>{model.name}</span>
                    </div>
                    <p className='text-xs text-gray-500 mb-2 line-clamp-2'>{model.description}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
