import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { profileApi } from '@/apis/profile.api'
import { ChangePasswordFormSchema, type ChangePasswordData } from '@/models/profile.model'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: (response) => {
      if (!response.isSuccess) {
        toast.error(response?.error.description || 'Could not update password')
        return
      }
      toast.success('Password updated')
      reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Could not update password')
    }
  })

  const isBusy = changePasswordMutation.isPending

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return
    onOpenChange(nextOpen)
  }

  const onSubmit = (values: ChangePasswordData) => {
    changePasswordMutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='w-[96vw] sm:max-w-lg'
        showCloseButton={!isBusy}
        onInteractOutside={(event) => {
          if (isBusy) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (isBusy) event.preventDefault()
        }}
      >
        <DialogHeader className='items-center'>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>

        <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='oldPassword'>
              Current password
            </label>
            <div className='relative'>
              <Input
                id='oldPassword'
                type={showOldPassword ? 'text' : 'password'}
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.oldPassword)}
                disabled={isBusy}
                {...register('oldPassword')}
              />
              <Button
                type='button'
                variant='link'
                size='icon-lg'
                className='absolute inset-y-0 right-3 top-0 h-11 text-muted-foreground hover:text-foreground'
                onClick={() => setShowOldPassword((prev) => !prev)}
                aria-label={showOldPassword ? 'Hide password' : 'Show password'}
              >
                {showOldPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            {errors.oldPassword?.message ? <p className='text-xs text-red-600'>{errors.oldPassword.message}</p> : null}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='newPassword'>
              New password
            </label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.newPassword)}
                disabled={isBusy}
                {...register('newPassword')}
              />
              <Button
                type='button'
                variant='link'
                size='icon-lg'
                className='absolute inset-y-0 right-3 top-0 h-11 text-muted-foreground hover:text-foreground'
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            {errors.newPassword?.message ? <p className='text-xs text-red-600'>{errors.newPassword.message}</p> : null}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='confirmNewPassword'>
              Confirm new password
            </label>
            <div className='relative'>
              <Input
                id='confirmNewPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.confirmNewPassword)}
                disabled={isBusy}
                {...register('confirmNewPassword')}
              />
              <Button
                type='button'
                variant='link'
                size='icon-lg'
                className='absolute inset-y-0 right-3 top-0 h-11 text-muted-foreground hover:text-foreground'
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            {errors.confirmNewPassword?.message ? (
              <p className='text-xs text-red-600'>{errors.confirmNewPassword.message}</p>
            ) : null}
          </div>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button type='submit' disabled={isBusy}>
              {changePasswordMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Update password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ChangePasswordDialog
