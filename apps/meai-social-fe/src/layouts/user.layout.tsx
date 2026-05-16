import { useMemo, useState } from 'react'
import { Heart, Home, User, Users } from 'lucide-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { PATH } from '@/routes/path'
import CreatePostDialog from '@/components/post/CreatePostDialog'
import SignInRequiredDialog from '@/components/user/SignInRequiredDialog'
import UserMobileHeader from '@/components/user/UserMobileHeader'
import UserMobileNav from '@/components/user/UserMobileNav'
import UserSidebar from '@/components/user/UserSidebar'
import { NotificationProvider, useNotifications } from '@/hooks/use-notifications'
import { Outlet, useNavigate } from 'react-router'

type UserLayoutContentProps = {
  children: React.ReactNode
  isAuthed: boolean
  profilePath: string
  displayName: string
  displayEmail: string
  avatarUrl?: string
  avatarFallback: string
}

function UserLayoutContent({
  children,
  isAuthed,
  profilePath,
  displayName,
  displayEmail,
  avatarUrl,
  avatarFallback
}: UserLayoutContentProps) {
  const navigate = useNavigate()
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const { hasUnread } = useNotifications()

  const navItems = useMemo(
    () => [
      { label: 'For you', to: PATH.HOME, icon: Home, end: true },
      { label: 'Followers', to: PATH.USER_FOLLOWERS, icon: Users, requiresAuth: true },
      { label: 'Activity', to: PATH.USER_ACTIVITY, icon: Heart, requiresAuth: true, hasIndicator: hasUnread },
      { label: 'Profile', to: profilePath, icon: User, requiresAuth: true, end: true }
    ],
    [profilePath, hasUnread]
  )

  const handleRequireAuth = () => {
    setIsSignInOpen(true)
  }

  const handleCompose = () => {
    if (!isAuthed) {
      setIsSignInOpen(true)
      return
    }
    setIsComposerOpen(true)
  }

  const handleLogoClick = () => {
    navigate(PATH.HOME)
  }

  return (
    <>
      <div className='relative min-h-screen bg-background text-foreground'>
        <UserMobileHeader
          displayName={displayName}
          displayEmail={displayEmail}
          profilePath={profilePath}
          avatarUrl={avatarUrl}
          avatarFallback={avatarFallback}
          isAuthed={isAuthed}
          onRequireAuth={handleRequireAuth}
          onLogoClick={handleLogoClick}
        />

        <div className='relative mx-auto flex min-h-screen w-full'>
          <UserSidebar
            navItems={navItems}
            isAuthed={isAuthed}
            onCompose={handleCompose}
            onRequireAuth={handleRequireAuth}
            displayName={displayName}
            displayEmail={displayEmail}
            profilePath={profilePath}
            avatarUrl={avatarUrl}
            avatarFallback={avatarFallback}
            onLogoClick={handleLogoClick}
          />

          <main className='flex flex-1 justify-center'>
            <div className='mb-18 w-full max-w-[100vw] md:mb-0 md:max-w-3xl'>{children}</div>
          </main>
        </div>

        <UserMobileNav
          navItems={navItems}
          isAuthed={isAuthed}
          onCompose={handleCompose}
          onRequireAuth={handleRequireAuth}
        />
      </div>

      <CreatePostDialog open={isComposerOpen} onOpenChange={setIsComposerOpen} />
      <SignInRequiredDialog open={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </>
  )
}

function UserLayout() {
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const isAuthed = Boolean(currentUser)

  const profilePath = PATH.USER_PROFILE.replace(':username', `@${currentUser?.username ?? 'me'}`)
  const displayName = currentUser?.username ?? 'meai-user'
  const displayEmail = currentUser?.email ?? 'user@meai.social'
  const avatarUrl = currentUser?.avatarPresignedUrl ?? undefined
  const avatarFallback = displayName.slice(0, 2).toUpperCase()

  return (
    <NotificationProvider enabled={isAuthed} source='Social'>
      <UserLayoutContent
        isAuthed={isAuthed}
        profilePath={profilePath}
        displayName={displayName}
        displayEmail={displayEmail}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
      >
        <Outlet />
      </UserLayoutContent>
    </NotificationProvider>
  )
}

export default UserLayout
