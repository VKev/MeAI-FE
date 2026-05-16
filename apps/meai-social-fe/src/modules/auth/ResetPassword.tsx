import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { authApi } from '@/apis/auth.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ForgotPasswordSchema, type TForgotPasswordValues, type TResetPasswordBodyValues } from '@/models/auth.model'
import { PATH } from '@/routes/path'

const CODE_COOLDOWN_SECONDS = 180

function ResetPassword() {
  const navigate = useNavigate()
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [codeCooldown, setCodeCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    getValues,
    formState: { errors }
  } = useForm<TForgotPasswordValues>({
    mode: 'onChange',
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
      newPassword: '',
      confirmNewPassword: '',
      code: ''
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (response) => {
      if (!response?.isSuccess) {
        toast.error(response?.error?.description ?? 'Failed to reset password')
        return
      }
      const emailValue = getValues('email')?.trim()
      toast.success(`Password reset for ${emailValue} successful`)
      navigate(PATH.LOGIN)
    },
    onError: (error) => {
      console.error('🚀 ~ ResetPassword ~ error:', error)
      toast.error('Reset password failed')
    }
  })

  const sendCodeMutation = useMutation({
    mutationFn: authApi.requestResetPasswordVerificationCode,
    onSuccess: (response) => {
      if (!response?.isSuccess) {
        toast.error(response?.error?.description ?? 'Failed to send code')
        return
      }

      const emailValue = getValues('email')?.trim()
      toast.success(`Code is sent to ${emailValue}`)
      setCodeCooldown(CODE_COOLDOWN_SECONDS)
    },
    onError: (error) => {
      console.error('🚀 ~ SendCodeMutation ~ error:', error)
      toast.error('Failed to send code')
    }
  })

  const isBusy = resetPasswordMutation.isPending
  const isSendCodeDisabled = sendCodeMutation.isPending || codeCooldown > 0

  useEffect(() => {
    if (codeCooldown <= 0) return
    const timer = window.setInterval(() => {
      setCodeCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [codeCooldown])

  const onSubmit = async (values: TForgotPasswordValues) => {
    const payload: TResetPasswordBodyValues = {
      email: values.email,
      newPassword: values.newPassword,
      code: values.code
    }
    await resetPasswordMutation.mutateAsync(payload)
  }

  const handleSendCode = async () => {
    const email = getValues('email')?.trim()
    if (!email) {
      setError('email', { message: 'Email is required to send the code' })
      return
    }
    const isEmailValid = await trigger('email')
    if (!isEmailValid) {
      setError('email', { message: 'Please enter a valid email to receive the code' })
      return
    }
    await sendCodeMutation.mutateAsync(email)
  }

  const sendCodeLabel = useMemo(() => {
    if (sendCodeMutation.isPending) return 'Sending...'
    if (codeCooldown > 0) return `Resend in ${codeCooldown}s`
    return 'Send'
  }, [codeCooldown, sendCodeMutation.isPending])

  return (
    <Card className='h-full w-full self-stretch gap-0 border border-border/80 bg-card/90 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur md:h-auto md:max-w-115 md:self-auto'>
      <CardHeader className='items-center gap-2 pt-6 text-center'>
        <CardTitle className='text-2xl font-semibold text-foreground'>Reset Password</CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          Enter the details below to update your password.
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-4 pt-6 overflow-y-auto'>
        <form className='flex flex-col gap-2' onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='email'>
              Email
            </label>
            <Input
              id='email'
              type='email'
              autoComplete='email'
              placeholder='Enter your email'
              className='h-11'
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email?.message && <p className='text-xs text-red-600'>{errors.email.message}</p>}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='newPassword'>
              New password
            </label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='Create a new password'
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.newPassword)}
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
            {errors.newPassword?.message && <p className='text-xs text-red-600'>{errors.newPassword.message}</p>}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='confirmNewPassword'>
              Confirm new password
            </label>
            <div className='relative'>
              <Input
                id='confirmNewPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='Confirm your new password'
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.confirmNewPassword)}
                {...register('confirmNewPassword')}
              />
              <Button
                type='button'
                variant='link'
                size='icon-lg'
                className='absolute inset-y-0 right-3 top-0 h-11 text-muted-foreground hover:text-foreground'
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            {errors.confirmNewPassword?.message && (
              <p className='text-xs text-red-600'>{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='code'>
              Verification code
            </label>
            <div className='relative'>
              <Input
                id='code'
                type='text'
                inputMode='numeric'
                placeholder='Enter code'
                className='h-11 pr-28'
                aria-invalid={Boolean(errors.code)}
                {...register('code')}
              />
              <Button
                type='button'
                variant='link'
                size='sm'
                className='absolute right-3 top-0 h-11 text-xs'
                onClick={handleSendCode}
                disabled={isSendCodeDisabled}
              >
                {sendCodeMutation.isPending ? <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' /> : null}
                {sendCodeLabel}
              </Button>
            </div>
            {errors.code?.message && <p className='text-xs text-red-600'>{errors.code.message}</p>}
          </div>

          <Button type='submit' className='h-11 w-full rounded-xl' disabled={isBusy}>
            {resetPasswordMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Reset password
          </Button>
        </form>

        <div className='w-full text-center text-xs text-muted-foreground'>
          <span>Remembered your password? </span>
          <Link to={PATH.LOGIN} className='font-medium text-muted-foreground transition hover:text-foreground'>
            Back to Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default ResetPassword
