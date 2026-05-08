import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDate(date: Date | undefined) {
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isValidDate(date: Date | undefined) {
  if (!date) return false;
  return !isNaN(date.getTime());
}

type DatePickerInputProps = {
  id?: string;
  selected?: Date | undefined;
  onSelect?: (date?: Date) => void;
  className?: string;
};

export function DatePickerInput({ id = 'date-required', selected, onSelect, className }: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(selected);
  const [month, setMonth] = React.useState<Date | undefined>(selected);
  const [value, setValue] = React.useState(formatDate(selected));

  React.useEffect(() => {
    setDate(selected);
    setMonth(selected);
    setValue(formatDate(selected));
  }, [selected]);

  const parseInput = (input: string) => {
    // Accept dd/mm/yyyy only for typed input (also support yyyy-mm-dd fallback)
    const dmY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const yMd = /^(\d{4})-(\d{2})-(\d{2})$/;
    let parsed: Date | undefined = undefined;
    if (dmY.test(input)) {
      const [, dStr, mStr, yStr] = input.match(dmY) as RegExpMatchArray;
      const d = Number(dStr);
      const m = Number(mStr);
      const y = Number(yStr);
      if (m < 1 || m > 12) return undefined;
      const maxDay = new Date(y, m, 0).getDate();
      if (d < 1 || d > maxDay) return undefined;
      parsed = new Date(y, m - 1, d);
    } else if (yMd.test(input)) {
      parsed = new Date(input);
      if (isNaN(parsed.getTime())) return undefined;
    }
    return parsed;
  };

  return (
    <InputGroup className={cn('w-full', className)}>
      <InputGroupInput
        id={id}
        value={value}
        placeholder={formatDate(selected) || 'dd/mm/yyyy'}
        inputMode='numeric'
        pattern='\d{2}/\d{2}/\d{4}'
        maxLength={10}
        className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white w-full'
        onChange={(e) => {
          // sanitize to digits then re-insert slashes: dd/mm/yyyy
          const raw = e.target.value;
          const digits = raw.replace(/\D/g, '').slice(0, 8);
          let formatted = digits;
          if (digits.length > 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
          } else if (digits.length > 2) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
          }
          setValue(formatted);

          if (formatted.length === 10) {
            const parsed = parseInput(formatted);
            if (isValidDate(parsed)) {
              setDate(parsed);
              setMonth(parsed);
              if (onSelect) onSelect(parsed);
            }
          } else if (formatted === '') {
            setDate(undefined);
            if (onSelect) onSelect(undefined);
          }
        }}
        onKeyDown={(e) => {
          // allow digits, slash, navigation, and control keys
          const allowed = [
            'Backspace',
            'Tab',
            'Enter',
            'Escape',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End',
            'Delete'
          ];
          if (allowed.includes(e.key)) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
            return;
          }
          // allow digit and '/'
          if (!/^[0-9/]$/.test(e.key)) {
            e.preventDefault();
          }
        }}
      />
      <InputGroupAddon align='inline-end'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              id='date-picker'
              variant='ghost'
              size='icon-xs'
              aria-label='Select date'
              className='text-white'
            >
              <CalendarIcon />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='end' alignOffset={-8} sideOffset={10}>
            <Calendar
              mode='single'
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={(d) => {
                setDate(d);
                setValue(formatDate(d));
                setMonth(d);
                setOpen(false);
                if (onSelect) onSelect(d);
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
