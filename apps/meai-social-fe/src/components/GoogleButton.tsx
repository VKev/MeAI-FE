import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const GoogleIcon = () => (
  <svg aria-hidden='true' viewBox='0 0 533.5 544.3' className='h-4 w-4'>
    <path
      fill='#4285f4'
      d='M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.4h146.9c-6.3 34.2-25.1 63.2-53.5 82.6v68h86.5c50.6-46.6 81.6-115.4 81.6-195.6z'
    />
    <path
      fill='#34a853'
      d='M272 544.3c72.6 0 133.6-24.1 178.1-65.5l-86.5-68c-24.1 16.2-55 25.8-91.6 25.8-70.5 0-130.2-47.6-151.6-111.6H30.6v69.9c44.3 88 135.6 149.4 241.4 149.4z'
    />
    <path fill='#fbbc05' d='M120.4 325c-10.5-31.2-10.5-65.1 0-96.3v-69.9H30.6c-43.9 87.9-43.9 191.1 0 279l89.8-69.8z' />
    <path
      fill='#ea4335'
      d='M272 107.7c39.5-.6 77.5 13.8 106.9 40.2l80-80C402.7 24.5 338.2-.2 272 0 166.2 0 74.9 61.4 30.6 149.4l89.8 69.9C141.8 155.3 201.5 107.7 272 107.7z'
    />
  </svg>
)

type GoogleButtonProps = {
  onCredential: (idToken: string) => void
  onError?: () => void
  onStart?: () => void
  isLoading?: boolean
  className?: string
}

function GoogleButton({ onCredential, onError, onStart, isLoading = false, className }: GoogleButtonProps) {
  const handlePress = (response: CredentialResponse) => {
    if (response.credential) {
      onCredential(response.credential)
      return
    }
    onError?.()
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className='relative h-11 w-full'>
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <span className='flex h-7 w-7 items-center justify-center bg-card'>
            <GoogleIcon />
          </span>
          <span>Continue with Google</span>
        </div>
        <div
          className={cn(
            'absolute inset-0 w-full rounded-xl overflow-hidden transition',
            isLoading && 'pointer-events-none opacity-0'
          )}
        >
          <GoogleLogin
            onSuccess={handlePress}
            onError={onError}
            click_listener={onStart}
            theme='outline'
            size='large'
            text='continue_with'
            shape='rectangular'
            width='100%'
            logo_alignment='left'
            containerProps={{
              className: 'h-11 w-full rounded-xl overflow-hidden opacity-0',
              style: { width: '100%', height: '100%', borderRadius: '0.75rem', overflow: 'hidden' }
            }}
          />
        </div>
      </div>
      {isLoading && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-card/70 text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
        </div>
      )}
    </div>
  )
}

export default GoogleButton
