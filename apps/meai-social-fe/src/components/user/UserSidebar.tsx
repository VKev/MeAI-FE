import { NavLink } from 'react-router'
import { Menu, Plus, type LucideIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import UserMenuContent from '@/components/user/UserMenuContent'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  requiresAuth?: boolean
  hasIndicator?: boolean
}

type UserSidebarProps = {
  navItems: NavItem[]
  isAuthed: boolean
  onCompose: () => void
  onRequireAuth: () => void
  onLogoClick: () => void
  displayName: string
  displayEmail: string
  profilePath: string
  avatarUrl?: string
  avatarFallback: string
}

const itemClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition text-muted-foreground hover:bg-muted hover:text-foreground'

const renderIcon = (Icon: LucideIcon, hasIndicator?: boolean) => (
  <span className='relative'>
    <Icon className='h-4 w-4' />
    {hasIndicator ? (
      <span aria-hidden='true' className='absolute -right-0.5 top-0 h-2 w-2 rounded-full bg-red-500/90' />
    ) : null}
  </span>
)

function UserSidebar({
  navItems,
  isAuthed,
  onCompose,
  onRequireAuth,
  onLogoClick,
  displayName,
  displayEmail,
  profilePath,
  avatarUrl,
  avatarFallback
}: UserSidebarProps) {
  const primaryItem = navItems[0]
  const secondaryItems = navItems.slice(1)

  return (
    <aside className='hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:gap-6 md:self-start md:bg-card md:p-4'>
      <div className='flex items-center justify-between px-4 mb-3 cursor-pointer'>
        <span className='text-3xl font-heading text-foreground' onClick={onLogoClick}>
          @MeAI
        </span>
      </div>
      <nav className='flex flex-1 flex-col justify-between'>
        <div className='flex flex-col gap-2'>
          {primaryItem
            ? (() => {
                const Icon = primaryItem.icon
                return (
                  <NavLink
                    to={primaryItem.to}
                    end={primaryItem.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`
                    }
                  >
                    {renderIcon(Icon, primaryItem.hasIndicator)}
                    {primaryItem.label}
                  </NavLink>
                )
              })()
            : null}
          <button
            type='button'
            className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted'
            onClick={isAuthed ? onCompose : onRequireAuth}
          >
            <Plus className='h-4 w-4' />
            New post
          </button>
          {secondaryItems.map((item) => {
            const Icon = item.icon
            if (item.requiresAuth && !isAuthed) {
              return (
                <button
                  key={item.label}
                  type='button'
                  className={itemClass}
                  onClick={onRequireAuth}
                  aria-disabled='true'
                >
                  {renderIcon(Icon, item.hasIndicator)}
                  {item.label}
                </button>
              )
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                {renderIcon(Icon, item.hasIndicator)}
                {item.label}
              </NavLink>
            )
          })}
        </div>
        {isAuthed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted data-[state=open]:bg-accent'
              >
                <Menu className='h-4 w-4' />
                More
              </button>
            </DropdownMenuTrigger>
            <UserMenuContent
              side='right'
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
            className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted'
            onClick={onRequireAuth}
          >
            <Menu className='h-4 w-4' />
            More
          </button>
        )}
      </nav>
    </aside>
  )
}

export default UserSidebar
