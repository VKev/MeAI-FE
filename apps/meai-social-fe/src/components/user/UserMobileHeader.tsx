import { Menu } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import UserMenuContent from '@/components/user/UserMenuContent'

type UserMobileHeaderProps = {
  displayName: string
  displayEmail: string
  profilePath: string
  avatarUrl?: string
  avatarFallback: string
  isAuthed: boolean
  onRequireAuth: () => void
  onLogoClick: () => void
}

function UserMobileHeader({
  displayName,
  displayEmail,
  profilePath,
  avatarUrl,
  avatarFallback,
  isAuthed,
  onRequireAuth,
  onLogoClick
}: UserMobileHeaderProps) {
  return (
    <header className='sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden'>
      <span className='text-2xl font-heading text-foreground' onClick={onLogoClick}>
        @MeAI
      </span>
      {isAuthed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted'
              aria-label='Open menu'
            >
              <Menu className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <UserMenuContent
            side='bottom'
            displayName={displayName}
            displayEmail={displayEmail}
            profilePath={profilePath}
            avatarUrl={avatarUrl}
            avatarFallback={avatarFallback}
          />
        </DropdownMenu>
      ) : (
        <button
          type='button'
          className='flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted'
          aria-label='Open menu'
          onClick={onRequireAuth}
        >
          <Menu className='h-4 w-4' />
        </button>
      )}
    </header>
  )
}

export default UserMobileHeader
