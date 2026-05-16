import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import { authApi } from '@/apis/auth.api'
import type { AppDispatch } from '@/redux/store'
import { removeCurrentUser } from '@/redux/slices/current-user.slice'
import { removeLocalStorage } from '@/utils'
import { useCallback } from 'react'

type UserMenuContentProps = {
  side: 'right' | 'bottom'
  displayName: string
  displayEmail: string
  profilePath: string
  avatarUrl?: string
  avatarFallback: string
}

function UserMenuContent({
  side,
  displayName,
  displayEmail,
  profilePath,
  avatarUrl,
  avatarFallback
}: UserMenuContentProps) {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { theme, setTheme } = useTheme()

  const isBottom = side === 'bottom'
  const handleProfileClick = () => {
    navigate(profilePath)
  }

  const handleLogout = async () => {
    try {
      await authApi.signout()
    } finally {
      removeLocalStorage('currentUser')
      dispatch(removeCurrentUser())
      window.location.reload()
    }
  }

  const menuChooseAppearance = useCallback(
    () => (
      <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
        <DropdownMenuRadioItem value='light' className='gap-2 cursor-pointer'>
          <Sun className='h-4 w-4' />
          Light
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='dark' className='gap-2 cursor-pointer'>
          <Moon className='h-4 w-4' />
          Dark
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='system' className='gap-2 cursor-pointer'>
          <Monitor className='h-4 w-4' />
          System
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ),
    [theme, setTheme]
  )

  return (
    <DropdownMenuContent side={side} align='end' className='w-64 p-2'>
      <button
        type='button'
        className='flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted cursor-pointer'
        onClick={handleProfileClick}
      >
        <Avatar>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col text-sm'>
          <span className='font-semibold text-foreground'>{displayName}</span>
          <span className='text-xs text-muted-foreground'>{displayEmail}</span>
        </div>
      </button>
      <DropdownMenuSeparator className='my-2' />

      {isBottom ? (
        <>
          <DropdownMenuLabel className='px-2'>Appearance</DropdownMenuLabel>
          {menuChooseAppearance()}
        </>
      ) : (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='gap-2 p-2 cursor-pointer'>
            <Sun className='h-4 w-4' />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={10} alignOffset={-12} className='w-36'>
            {menuChooseAppearance()}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      <DropdownMenuItem variant='destructive' className='gap-2 p-2 cursor-pointer' onClick={handleLogout}>
        <LogOut className='h-4 w-4' />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export default UserMenuContent
