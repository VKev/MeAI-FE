import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminApiServiceName, ApiCredentialItem } from '@/models/admin-client.model';

export type ApiKeyFormMode = 'create' | 'edit';

export type ApiKeyFormValues = {
  provider: string;
  keyName: string;
  displayName: string;
  value: string;
  isActive: boolean;
};

type ApiKeyFormDialogProps = {
  open: boolean;
  mode: ApiKeyFormMode;
  service: AdminApiServiceName;
  target: ApiCredentialItem | null;
  form: ApiKeyFormValues;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onFormChange: <K extends keyof ApiKeyFormValues>(field: K, value: ApiKeyFormValues[K]) => void;
  onSubmit: () => void;
};

function ApiKeyFormDialogComponent({
  open,
  mode,
  service,
  target,
  form,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onFormChange,
  onSubmit
}: ApiKeyFormDialogProps) {
  const isEdit = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-xl border border-white/8 bg-[#10101a]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit API Key' : 'Add API Key'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update metadata, rotate the secret value, or toggle the key status.'
              : `Create a new credential for the ${service} service.`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-1'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Provider</label>
              <Input
                value={isEdit ? (target?.provider ?? form.provider) : form.provider}
                onChange={(event) => onFormChange('provider', event.target.value)}
                disabled={isEdit}
                placeholder='Gemini, Stripe...'
                className='h-9 border-white/8 bg-white/4 text-[13px] text-white focus:border-violet-500/40 disabled:cursor-not-allowed disabled:opacity-70'
              />
            </div>

            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Key Name</label>
              <Input
                value={isEdit ? (target?.keyName ?? form.keyName) : form.keyName}
                onChange={(event) => onFormChange('keyName', event.target.value)}
                disabled={isEdit}
                placeholder='ApiKey, SecretKey...'
                className='h-9 border-white/8 bg-white/4 text-[13px] text-white focus:border-violet-500/40 disabled:cursor-not-allowed disabled:opacity-70'
              />
            </div>
          </div>

          <div>
            <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Display Name</label>
            <Input
              value={form.displayName}
              onChange={(event) => onFormChange('displayName', event.target.value)}
              placeholder='Gemini primary key'
              className='h-9 border-white/8 bg-white/4 text-[13px] text-white focus:border-violet-500/40'
            />
          </div>

          <div>
            <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>
              {isEdit ? 'New Secret Value (optional)' : 'Secret Value'}
            </label>
            <Input
              value={form.value}
              onChange={(event) => onFormChange('value', event.target.value)}
              placeholder={isEdit ? 'Enter a value only when rotating the secret' : 'Enter secret value'}
              className='h-9 border-white/8 bg-white/4 text-[13px] text-white focus:border-violet-500/40'
            />
            {isEdit && (
              <p className='mt-1.5 text-[12px] text-slate-500'>
                For security reasons, the previous raw secret is never returned. This field is intentionally blank when
                editing.
              </p>
            )}
          </div>

          <label className='flex cursor-pointer items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2'>
            <input
              type='checkbox'
              checked={form.isActive}
              onChange={(event) => onFormChange('isActive', event.target.checked)}
              className='size-4 accent-violet-500'
            />
            <span className='text-[13px] text-slate-200'>Key is active</span>
          </label>

          {errorMessage && (
            <div className='rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-300'>{errorMessage}</div>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className='border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={onSubmit}
            disabled={isSubmitting}
            className='bg-violet-600 text-white hover:bg-violet-700'
          >
            {isSubmitting ? <Loader2 className='size-4 animate-spin' /> : null}
            {isEdit ? 'Save changes' : 'Create key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ApiKeyFormDialog = memo(ApiKeyFormDialogComponent);
