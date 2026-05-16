import { useState } from 'react'
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
import { SigninSchema, type TSigninValues } from '@/models/auth.model'
import { PATH } from '@/routes/path'
import type { AppDispatch } from '@/redux/store'
import { getErrorMessage, handleAuthSuccess } from '@/modules/auth/helpers/auth.helpers'

function SignIn() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TSigninValues>({
    mode: 'onChange',
    resolver: zodResolver(SigninSchema),
    defaultValues: {
      emailOrUsername: '',
      password: ''
    }
  })

  const signInMutation = useMutation({
    mutationFn: authApi.signin,
    onSuccess: async () => {
      await handleAuthSuccess(dispatch)
      toast.success('Signed in successfully')
      navigate(PATH.HOME)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Sign in failed'))
    }
  })

  const googleSignInMutation = useMutation({
    mutationFn: authApi.signinWithGoogle,
    onSuccess: async () => {
      await handleAuthSuccess(dispatch)
      toast.success('Signed in successfully')
      navigate(PATH.HOME)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Google sign in failed'))
    }
  })

  const isBusy = signInMutation.isPending || googleSignInMutation.isPending

  const onSubmit = async (values: TSigninValues) => {
    await signInMutation.mutateAsync(values)
  }

  const handleGoogleCredential = async (idToken: string) => {
    await googleSignInMutation.mutateAsync(idToken)
  }

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
        <CardTitle className='text-2xl font-semibold text-foreground'>Welcome back!</CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          Sign in to access your personalized feed and updates.
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-4 pt-6'>
        <form className='flex flex-col gap-4' onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='emailOrUsername'>
              Email or username
            </label>
            <Input
              id='emailOrUsername'
              type='text'
              autoComplete='username'
              placeholder='Enter your email or username'
              className='h-11'
              aria-invalid={Boolean(errors.emailOrUsername)}
              {...register('emailOrUsername')}
            />
            {errors.emailOrUsername?.message && (
              <p className='text-xs text-red-600'>{errors.emailOrUsername.message}</p>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='password'>
              Password
            </label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                placeholder='Enter your password'
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

          <div className='flex items-center justify-end mr-5'>
            <button
              type='button'
              className='text-xs font-medium text-muted-foreground transition hover:text-foreground'
              onClick={() => navigate(PATH.FORGOT_PASSWORD)}
            >
              Forgot password?
            </button>
          </div>

          <Button type='submit' className='h-11 w-full rounded-xl' disabled={isBusy}>
            {signInMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Sign in
          </Button>
        </form>

        <div className='w-full text-center text-xs text-muted-foreground'>
          <span>Do not have an account? </span>
          <Link to={PATH.SIGN_UP} className='font-medium text-muted-foreground transition hover:text-foreground'>
            Create one
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

export default SignIn
