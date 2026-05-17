import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { authApi } from '@/apis/auth.api'
import GoogleButton from '@/components/GoogleButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SignupSchema, type TSignupBodyValues, type TSignupValues } from '@/models/auth.model'
import { PATH } from '@/routes/path'
import type { AppDispatch } from '@/redux/store'
import { getErrorMessage, handleAuthSuccess } from '@/modules/auth/helpers/auth.helpers'

const CODE_COOLDOWN_SECONDS = 180

function SignUp() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [codeCooldown, setCodeCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    trigger,
    formState: { errors }
  } = useForm<TSignupValues>({
    mode: 'onChange',
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      code: ''
    }
  })

  const signUpMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: async (response) => {
      if (!response?.isSuccess) {
        toast.error(response?.error?.description ?? 'Sign up failed')
        return
      }

      await handleAuthSuccess(dispatch)
      toast.success('Account created successfully')
      navigate(PATH.HOME)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Sign up failed'))
    }
  })

  const googleSignUpMutation = useMutation({
    mutationFn: authApi.signinWithGoogle,
    onSuccess: async (response) => {
      if (!response?.isSuccess) {
        toast.error(response?.error?.description ?? 'Continue with Google failed')
        return
      }

      await handleAuthSuccess(dispatch)
      toast.success('Signed in successfully')
      navigate(PATH.HOME)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Continue with Google failed'))
    }
  })

  const sendCodeMutation = useMutation({
    mutationFn: authApi.requestSignUpVerificationCode,
    onSuccess: (response) => {
      if (!response?.isSuccess) {
        toast.error(response?.error?.description ?? 'Failed to send verification code')
        return
      }
      toast.success('Verification code sent')
      setCodeCooldown(CODE_COOLDOWN_SECONDS)
    },
    onError: (error) => {
      console.error('🚀 ~ SendCodeMutation ~ error:', error)
      toast.error('Failed to send code')
    }
  })

  const isBusy = signUpMutation.isPending || googleSignUpMutation.isPending
  const isSendCodeDisabled = sendCodeMutation.isPending || codeCooldown > 0

  useEffect(() => {
    if (codeCooldown <= 0) return
    const timer = window.setInterval(() => {
      setCodeCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [codeCooldown])

  const emailTouchedRef = useRef(false)

  const emailRegister = register('email', {
    onChange: (event) => {
      const value = (event.target.value as string).trim()
      emailTouchedRef.current = value.length > 0
    }
  })

  const usernameRegister = register('username', {
    onChange: (event) => {
      const value = event.target.value as string
      if (!value) return
      if (!emailTouchedRef.current) {
        setValue('email', `${value}@`, { shouldValidate: false })
      }
    }
  })

  const onSubmit = async (values: TSignupValues) => {
    const payload: TSignupBodyValues = {
      fullName: values.username,
      username: values.username,
      email: values.email,
      password: values.password,
      code: values.code,
      phoneNumber: ''
    }
    await signUpMutation.mutateAsync(payload)
  }

  const handleGoogleCredential = async (idToken: string) => {
    await googleSignUpMutation.mutateAsync(idToken)
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
      <CardHeader className='relative items-center gap-2 pt-6 pb-2 text-center'>
        <Link
          to={PATH.HOME}
          className='absolute left-4 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-border hover:text-foreground'
          aria-label='Back to home'
        >
          <ArrowLeft className='h-4 w-4' />
        </Link>
        <CardTitle className='text-2xl font-semibold text-foreground'>Hello there!</CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          Create an account to share and follow updates.
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-4 pt-6 overflow-y-auto'>
        <form className='flex flex-col gap-2' onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='username'>
              Username
            </label>
            <Input
              id='username'
              type='text'
              autoComplete='username'
              placeholder='Enter your username'
              className='h-11'
              aria-invalid={Boolean(errors.username)}
              {...usernameRegister}
            />
            {errors.username?.message && <p className='text-xs text-red-600'>{errors.username.message}</p>}
          </div>

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
              {...emailRegister}
            />
            {errors.email?.message && <p className='text-xs text-red-600'>{errors.email.message}</p>}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='password'>
              Password
            </label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='Create a password'
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              <Button
                type='button'
                variant='link'
                size='icon-lg'
                className='absolute inset-y-0 right-3 top-0 h-11 text-muted-foreground hover:text-foreground'
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            {errors.password?.message && <p className='text-xs text-red-600'>{errors.password.message}</p>}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='confirmPassword'>
              Confirm password
            </label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='Confirm your password'
                className='h-11 pr-10'
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword')}
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
            {errors.confirmPassword?.message && (
              <p className='text-xs text-red-600'>{errors.confirmPassword.message}</p>
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
            {signUpMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Sign up
          </Button>
        </form>

        <div className='w-full text-center text-xs text-muted-foreground'>
          <span>Already have an account? </span>
          <Link to={PATH.LOGIN} className='font-medium text-muted-foreground transition hover:text-foreground'>
            Sign in
          </Link>
        </div>

        <div className='flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground'>
          <span className='h-px flex-1 bg-border' />
          or
          <span className='h-px flex-1 bg-border' />
        </div>

        <GoogleButton
          onCredential={handleGoogleCredential}
          onError={() => {
            toast.error('Google sign in failed')
          }}
          isLoading={isBusy}
        />
      </CardContent>
    </Card>
  )
}

export default SignUp
