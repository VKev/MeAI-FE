import type { InfiniteData, QueryKey } from '@tanstack/react-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '@/apis/feed.api'
import type { TFeedCursor, TPostLikeResponse, TPostResponse, TPublicProfileResponse } from '@/models/feed.model'

type FeedQueryOptions = {
  enabled?: boolean
  limit?: number
}

type ToggleLikePayload = {
  postId: string
  isLiked: boolean
}

export const feedKeys = {
  all: ['feed'] as const,
  list: (limit: number) => ['feed', 'list', { limit }] as const,
  detail: (postId: string) => ['feed', 'detail', postId] as const,
  postComments: (postId: string, limit: number) => ['feed', 'comments', postId, { limit }] as const,
  commentReplies: (commentId: string, limit: number) => ['feed', 'replies', commentId, { limit }] as const,
  profile: (username: string) => ['feed', 'profile', username] as const,
  profilePosts: (username: string, limit: number) => ['feed', 'profile-posts', username, { limit }] as const
}

const getNextCursor = (posts: TPostResponse[], limit: number): TFeedCursor | undefined => {
  const last = posts[posts.length - 1]
  if (!last?.createdAt || !last?.id) return undefined

  return {
    cursorCreatedAt: last.createdAt,
    cursorId: last.id,
    limit
  }
}

const updatePostInPages = (
  data: InfiniteData<TPostResponse[]> | undefined,
  postId: string,
  updater: (post: TPostResponse) => TPostResponse
) => {
  if (!data) return data

  return {
    ...data,
    pages: data.pages.map((page) => page.map((post) => (post.id === postId ? updater(post) : post)))
  }
}

export const useFeedInfiniteQuery = ({ enabled = true, limit = 10 }: FeedQueryOptions = {}) =>
  useInfiniteQuery<
    TPostResponse[],
    Error,
    InfiniteData<TPostResponse[]>,
    ReturnType<typeof feedKeys.list>,
    TFeedCursor
  >({
    queryKey: feedKeys.list(limit),
    enabled,
    initialPageParam: { limit },
    queryFn: ({ pageParam }) => feedApi.getFeed(pageParam as TFeedCursor),
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return undefined
      return getNextCursor(lastPage, limit)
    }
  })

export const useProfileQuery = (username: string, enabled = true) =>
  useQuery<TPublicProfileResponse, Error, TPublicProfileResponse, ReturnType<typeof feedKeys.profile>>({
    queryKey: feedKeys.profile(username),
    enabled: enabled && Boolean(username),
    queryFn: () => feedApi.getProfile(username)
  })

export const useProfilePostsInfiniteQuery = (username: string, { enabled = true, limit = 10 }: FeedQueryOptions = {}) =>
  useInfiniteQuery<
    TPostResponse[],
    Error,
    InfiniteData<TPostResponse[]>,
    ReturnType<typeof feedKeys.profilePosts>,
    TFeedCursor
  >({
    queryKey: feedKeys.profilePosts(username, limit),
    enabled: enabled && Boolean(username),
    initialPageParam: { limit },
    queryFn: ({ pageParam }) => feedApi.getProfilePosts(username, pageParam as TFeedCursor),
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return undefined
      return getNextCursor(lastPage, limit)
    }
  })

export const useToggleLike = (limit = 10) => {
  const queryClient = useQueryClient()
  const queryKey = feedKeys.list(limit)

  return useMutation({
    mutationFn: ({ postId, isLiked }: ToggleLikePayload) =>
      isLiked ? feedApi.unlikePost(postId) : feedApi.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<TPostResponse[]>>(queryKey)

      queryClient.setQueryData<InfiniteData<TPostResponse[]>>(queryKey, (current) =>
        updatePostInPages(current, postId, (post) => ({
          ...post,
          isLikedByCurrentUser: !isLiked,
          likesCount: Math.max(0, post.likesCount + (isLiked ? -1 : 1))
        }))
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (data: TPostLikeResponse, variables) => {
      queryClient.setQueryData<InfiniteData<TPostResponse[]>>(queryKey, (current) =>
        updatePostInPages(current, variables.postId, (post) => ({
          ...post,
          isLikedByCurrentUser: data.isLikedByCurrentUser,
          likesCount: data.likesCount
        }))
      )
    }
  })
}

export const useToggleLikeInQuery = (queryKey: QueryKey) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, isLiked }: ToggleLikePayload) =>
      isLiked ? feedApi.unlikePost(postId) : feedApi.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<TPostResponse[]>>(queryKey)

      queryClient.setQueryData<InfiniteData<TPostResponse[]>>(queryKey, (current) =>
        updatePostInPages(current, postId, (post) => ({
          ...post,
          isLikedByCurrentUser: !isLiked,
          likesCount: Math.max(0, post.likesCount + (isLiked ? -1 : 1))
        }))
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (data: TPostLikeResponse, variables) => {
      queryClient.setQueryData<InfiniteData<TPostResponse[]>>(queryKey, (current) =>
        updatePostInPages(current, variables.postId, (post) => ({
          ...post,
          isLikedByCurrentUser: data.isLikedByCurrentUser,
          likesCount: data.likesCount
        }))
      )
    }
  })
}
