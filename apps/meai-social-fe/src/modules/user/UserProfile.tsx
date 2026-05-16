import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { RootState, AppDispatch } from '@/redux/store'
import type { TPostResponse, TPublicProfileResponse } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { feedKeys, useProfilePostsInfiniteQuery, useProfileQuery, useToggleLikeInQuery } from '@/hooks/use-feed'
import { PATH } from '@/routes/path'
import { profileApi } from '@/apis/profile.api'
import { handleAuthSuccess } from '@/modules/auth/helpers/auth.helpers'
import CreatePostDialog from '@/components/post/CreatePostDialog'
import DeletePostDialog from '@/components/post/DeletePostDialog'
import EditPostDialog from '@/components/post/EditPostDialog'
import PostMediaViewerDialog from '@/components/post/PostMediaViewerDialog'
import ReportPostDialog from '@/components/post/ReportPostDialog'
import SignInRequiredDialog from '@/components/user/SignInRequiredDialog'
import EditProfileDialog from '@/components/user/EditProfileDialog'
import ChangePasswordDialog from '@/components/user/ChangePasswordDialog'
import { ProfileErrorCard, ProfileHeader, ProfileInfoCard, ProfileSkeleton } from '@/components/user/ProfileSection'
import { ProfileComposerCard, ProfilePostsSection } from '@/components/user/ProfilePostsSection'
import type { PostMediaItem } from '@/components/post/PostMediaScroller'

const PROFILE_POST_LIMIT = 10

type MediaViewerState = {
  open: boolean
  items: PostMediaItem[]
  index: number
  fallbackType: string | null
}

function UserProfile() {
  const navigate = useNavigate()
  const { username: usernameParam } = useParams()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()

  if (!usernameParam || !usernameParam.startsWith('@')) {
    return <Navigate to={PATH.HOME} replace />
  }

  const username = usernameParam.replace(/^@/, '')
  const isAuthed = Boolean(currentUser)
  const isOwner = Boolean(currentUser?.username && currentUser.username.toLowerCase() === username.toLowerCase())

  const profileQuery = useProfileQuery(username, true)
  const profilePostsQuery = useProfilePostsInfiniteQuery(username, {
    enabled: Boolean(username),
    limit: PROFILE_POST_LIMIT
  })
  const posts = useMemo(() => profilePostsQuery.data?.pages.flat() ?? [], [profilePostsQuery.data])

  const profileKey = useMemo(() => feedKeys.profile(username), [username])
  const postsKey = useMemo(() => feedKeys.profilePosts(username, PROFILE_POST_LIMIT), [username])
  const toggleLike = useToggleLikeInQuery(postsKey)

  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<TPostResponse | null>(null)
  const [reportingPost, setReportingPost] = useState<TPostResponse | null>(null)
  const [deletingPost, setDeletingPost] = useState<TPostResponse | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [mediaViewer, setMediaViewer] = useState<MediaViewerState>({
    open: false,
    items: [],
    index: 0,
    fallbackType: null
  })

  const profile = profileQuery.data
  const meQuery = useQuery({
    queryKey: ['profile', 'me'],
    enabled: isEditProfileOpen && !currentUser,
    queryFn: profileApi.getMe
  })

  const editableProfile = currentUser ?? meQuery.data?.value ?? null

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: async () => {
      await handleAuthSuccess(dispatch)
      queryClient.invalidateQueries({ queryKey: feedKeys.profile(username) })
      queryClient.invalidateQueries({ queryKey: feedKeys.profilePosts(username, PROFILE_POST_LIMIT) })
      toast.success('Profile updated')
      setIsEditProfileOpen(false)
    },
    onError: () => {
      toast.error('Could not update profile')
    }
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: async () => {
      await handleAuthSuccess(dispatch)
      queryClient.invalidateQueries({ queryKey: feedKeys.profile(username) })
      queryClient.invalidateQueries({ queryKey: feedKeys.profilePosts(username, PROFILE_POST_LIMIT) })
      toast.success('Avatar updated')
      setIsEditProfileOpen(false)
    },
    onError: () => {
      toast.error('Could not upload avatar')
    }
  })

  const displayName = useMemo(() => profile?.fullName ?? 'Unnamed', [profile?.fullName])
  const avatarFallback = useMemo(
    () => (profile?.username ? profile.username.slice(0, 2).toUpperCase() : 'ME'),
    [profile?.username]
  )
  const isFollowing = Boolean(profile?.isFollowedByCurrentUser)

  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowed }: { userId: string; isFollowed: boolean }) =>
      isFollowed ? feedApi.unfollowUser(userId) : feedApi.followUser(userId),
    onMutate: async ({ isFollowed }) => {
      await queryClient.cancelQueries({ queryKey: profileKey })
      const previous = queryClient.getQueryData<TPublicProfileResponse>(profileKey)

      queryClient.setQueryData<TPublicProfileResponse>(profileKey, (current) => {
        if (!current) return current
        const nextFollowed = !isFollowed
        const delta = nextFollowed ? 1 : -1
        return {
          ...current,
          isFollowedByCurrentUser: nextFollowed,
          followersCount: Math.max(0, current.followersCount + delta)
        }
      })

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(profileKey, context.previous)
      }
      toast.error('Could not update follow status')
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<TPublicProfileResponse>(profileKey, (current) => {
        if (!current) return current
        return {
          ...current,
          isFollowedByCurrentUser: !variables.isFollowed
        }
      })
    }
  })

  const handleCompose = useCallback(() => {
    if (!isAuthed) {
      setIsSignInOpen(true)
      return
    }
    setIsComposerOpen(true)
  }, [isAuthed])

  const handleOpenDetail = useCallback(
    (post: TPostResponse) => {
      navigate(PATH.POST_DETAIL.replace(':username', `@${post.username}`).replace(':postId', post.id))
    },
    [navigate]
  )

  const handleToggleLike = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      toggleLike.mutate({ postId: post.id, isLiked: Boolean(post.isLikedByCurrentUser) })
    },
    [isAuthed, toggleLike]
  )

  const handleOpenMedia = useCallback((items: PostMediaItem[], index: number, fallbackType: string | null) => {
    setMediaViewer({ open: true, items, index, fallbackType })
  }, [])

  const handleCloseMedia = useCallback(() => {
    setMediaViewer((current) => ({ ...current, open: false }))
  }, [])

  const handlePrevMedia = useCallback(() => {
    setMediaViewer((current) => ({ ...current, index: Math.max(0, current.index - 1) }))
  }, [])

  const handleNextMedia = useCallback(() => {
    setMediaViewer((current) => ({
      ...current,
      index: Math.min(current.items.length - 1, current.index + 1)
    }))
  }, [])

  const handleEditPost = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setEditingPost(post)
    },
    [isAuthed]
  )

  const handleReportPost = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setReportingPost(post)
    },
    [isAuthed]
  )

  const handleDeletePost = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setDeletingPost(post)
    },
    [isAuthed]
  )

  const handleUserClick = useCallback(
    (nextUsername: string) => {
      const userPath = PATH.USER_PROFILE.replace(':username', `@${nextUsername}`)
      navigate(userPath)
    },
    [navigate]
  )

  const handleToggleFollow = useCallback(() => {
    if (!profile) return
    if (!isAuthed) {
      setIsSignInOpen(true)
      return
    }
    followMutation.mutate({ userId: profile.userId, isFollowed: Boolean(profile.isFollowedByCurrentUser) })
  }, [followMutation, isAuthed, profile])

  useEffect(() => {
    if (!profilePostsQuery.hasNextPage) return
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (profilePostsQuery.isFetchingNextPage) return
        profilePostsQuery.fetchNextPage()
      },
      { rootMargin: '240px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [profilePostsQuery.fetchNextPage, profilePostsQuery.hasNextPage, profilePostsQuery.isFetchingNextPage])

  const handleBackHome = useCallback(() => navigate(PATH.HOME), [navigate])
  const handleRetryProfile = useCallback(() => profileQuery.refetch(), [profileQuery])
  const handleRetryPosts = useCallback(() => profilePostsQuery.refetch(), [profilePostsQuery])
  const handleOpenFollowers = useCallback(() => {
    if (isOwner) navigate(PATH.USER_FOLLOWERS)
  }, [isOwner, navigate])
  const handleOpenFollowing = useCallback(() => {
    if (isOwner) navigate(PATH.USER_FOLLOWERS)
  }, [isOwner, navigate])

  return (
    <>
      <div className='flex flex-col gap-4 px-4 py-6 md:px-6'>
        <ProfileHeader onBack={handleBackHome} />

        {profileQuery.isLoading ? (
          <ProfileSkeleton />
        ) : profileQuery.isError || !profile ? (
          <ProfileErrorCard onRetry={handleRetryProfile} onBack={handleBackHome} />
        ) : (
          <ProfileInfoCard
            profile={profile}
            username={username}
            displayName={displayName}
            avatarFallback={avatarFallback}
            isOwner={isOwner}
            isFollowing={isFollowing}
            isFollowPending={followMutation.isPending}
            onEditProfile={() => setIsEditProfileOpen(true)}
            onChangePassword={() => setIsChangePasswordOpen(true)}
            onToggleFollow={handleToggleFollow}
            onOpenFollowers={handleOpenFollowers}
            onOpenFollowing={handleOpenFollowing}
          />
        )}

        <div className='flex flex-col gap-4'>
          {isOwner ? (
            <ProfileComposerCard
              displayName={currentUser?.username ?? 'meai-user'}
              avatarUrl={currentUser?.avatarPresignedUrl}
              avatarFallback={currentUser?.username?.slice(0, 2).toUpperCase() ?? 'ME'}
              onCompose={handleCompose}
            />
          ) : null}

          <ProfilePostsSection
            isLoading={profilePostsQuery.isLoading}
            isError={profilePostsQuery.isError}
            posts={posts}
            isAuthed={isAuthed}
            onRetry={handleRetryPosts}
            onOpenDetail={handleOpenDetail}
            onToggleLike={handleToggleLike}
            onOpenMedia={handleOpenMedia}
            onEditPost={handleEditPost}
            onReportPost={handleReportPost}
            onDeletePost={handleDeletePost}
            onUserClick={handleUserClick}
            loadMoreRef={loadMoreRef}
            hasNextPage={profilePostsQuery.hasNextPage}
          />
        </div>
      </div>

      <CreatePostDialog open={isComposerOpen} onOpenChange={setIsComposerOpen} />
      <EditPostDialog
        open={Boolean(editingPost)}
        post={editingPost}
        onOpenChange={(open) => setEditingPost((current) => (open ? current : null))}
      />
      <ReportPostDialog
        open={Boolean(reportingPost)}
        post={reportingPost}
        onOpenChange={(open) => setReportingPost((current) => (open ? current : null))}
      />
      <DeletePostDialog
        open={Boolean(deletingPost)}
        post={deletingPost}
        onOpenChange={(open) => setDeletingPost((current) => (open ? current : null))}
      />
      <SignInRequiredDialog open={isSignInOpen} onOpenChange={setIsSignInOpen} />
      <PostMediaViewerDialog
        open={mediaViewer.open}
        items={mediaViewer.items}
        index={mediaViewer.index}
        fallbackType={mediaViewer.fallbackType}
        onOpenChange={handleCloseMedia}
        onPrev={handlePrevMedia}
        onNext={handleNextMedia}
      />
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        profile={editableProfile}
        isProfileLoading={isEditProfileOpen && !currentUser && meQuery.isLoading}
        isProfileError={isEditProfileOpen && !currentUser && meQuery.isError}
        onRetry={meQuery.refetch}
        onSubmit={(payload) => updateProfileMutation.mutate(payload)}
        onUploadAvatar={(file) => uploadAvatarMutation.mutate(file)}
        isSaving={updateProfileMutation.isPending}
        isUploading={uploadAvatarMutation.isPending}
      />
      <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </>
  )
}

export default UserProfile
