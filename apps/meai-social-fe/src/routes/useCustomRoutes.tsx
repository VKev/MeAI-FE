import { useSelector } from 'react-redux'
import { Navigate, Outlet, useRoutes } from 'react-router'
import type { RootState } from '@/redux/store'
import { PATH } from '@/routes/path'
import AuthLayout from '@/layouts/auth.layout'
import ResetPassword from '@/modules/auth/ResetPassword'
import SignIn from '@/modules/auth/SignIn'
import SignUp from '@/modules/auth/SignUp'
import Forbidden from '@/modules/others/Forbidden'
import NotFound from '@/modules/others/NotFound'
import UserLayout from '@/layouts/user.layout'
import PostFeed from '@/modules/user/PostFeed'
import Follower from '@/modules/user/Follower'
import UserActivity from '@/modules/user/UserActivity'
import UserProfile from '@/modules/user/UserProfile'
import PostDetail from '@/modules/user/PostDetail'

const RejectedAuthRouter = () => {
  const storedUser = useSelector((state: RootState) => state.currentUser.currentUser)

  if (!storedUser) {
    return <Outlet />
  }

  return <Navigate to={PATH.HOME} replace />
}

type ProtectedRoutesProps = {
  roleAccess?: string
  children: React.ReactNode
}

const ProtectedRoutes = ({ roleAccess, children }: ProtectedRoutesProps) => {
  const storedUser = useSelector((state: RootState) => state.currentUser.currentUser)

  if (!storedUser) {
    return <Navigate to={PATH.AUTH} replace />
  }

  const userRoles = storedUser.roles.map((role) => role.toUpperCase())

  if (roleAccess && !userRoles.includes(roleAccess.toUpperCase())) {
    return <Navigate to={PATH.HOME} replace />
  }

  return <>{children}</>
}

const useCustomRoutes = () => {
  const followersPath = PATH.USER_FOLLOWERS.replace(/^\//, '')
  const activityPath = PATH.USER_ACTIVITY.replace(/^\//, '')
  const profilePath = PATH.USER_PROFILE.replace(/^\//, '')
  const postDetailPath = PATH.POST_DETAIL.replace(/^\//, '')

  const routes = useRoutes([
    // Auth routes
    {
      path: PATH.AUTH,
      element: <RejectedAuthRouter />,
      children: [
        {
          index: true,
          element: <Navigate to={PATH.LOGIN} replace />
        },
        {
          path: PATH.LOGIN,
          element: (
            <AuthLayout>
              <SignIn />
            </AuthLayout>
          )
        },
        {
          path: PATH.SIGN_UP,
          element: (
            <AuthLayout>
              <SignUp />
            </AuthLayout>
          )
        },
        {
          path: PATH.FORGOT_PASSWORD,
          element: (
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          )
        }
      ]
    },
    {
      path: PATH.HOME,
      element: <UserLayout />,
      children: [
        {
          index: true,
          element: <PostFeed />
        },
        {
          path: postDetailPath,
          element: <PostDetail />
        },
        {
          path: profilePath,
          element: <UserProfile />
        },
        {
          path: followersPath,
          element: (
            <ProtectedRoutes roleAccess='USER'>
              <Follower />
            </ProtectedRoutes>
          )
        },
        {
          path: activityPath,
          element: (
            <ProtectedRoutes roleAccess='USER'>
              <UserActivity />
            </ProtectedRoutes>
          )
        }
      ]
    },
    // Other routes
    {
      path: PATH.FORBIDDEN,
      element: <Forbidden />
    },
    {
      path: '*',
      element: <NotFound />
    }
  ])

  return routes
}

export default useCustomRoutes
