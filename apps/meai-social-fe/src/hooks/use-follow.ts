import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { feedApi } from '@/apis/feed.api'
import type { TFeedCursor, TFollowSuggestionResponse, TFollowUserResponse } from '@/models/feed.model'

type FollowSuggestionsOptions = {
  enabled?: boolean
  limit?: number
}

type FollowListOptions = {
  userId?: string | null
  enabled?: boolean
  limit?: number
}

export const followKeys = {
  all: ['follow'] as const,
  suggestions: (limit: number) => ['follow', 'suggestions', { limit }] as const,
  followers: (userId: string, limit: number) => ['follow', 'followers', userId, { limit }] as const,
  following: (userId: string, limit: number) => ['follow', 'following', userId, { limit }] as const
}

const getNextFollowCursor = (items: TFollowUserResponse[], limit: number): TFeedCursor | undefined => {
  const last = items[items.length - 1]
  if (!last?.followedAt || !last?.followId) return undefined

  return {
    cursorCreatedAt: last.followedAt,
    cursorId: last.followId,
    limit
  }
}

export const useFollowSuggestions = ({ enabled = true, limit = 10 }: FollowSuggestionsOptions = {}) =>
  useQuery<TFollowSuggestionResponse[], Error, TFollowSuggestionResponse[], ReturnType<typeof followKeys.suggestions>>({
    queryKey: followKeys.suggestions(limit),
    enabled,
    queryFn: () => feedApi.getFollowSuggestions(limit)
  })

export const useFollowersInfiniteQuery = ({
  userId,
  enabled = true,
  limit = 10
}: FollowListOptions) =>
  useInfiniteQuery<
    TFollowUserResponse[],
    Error,
    InfiniteData<TFollowUserResponse[]>,
    ReturnType<typeof followKeys.followers>,
    TFeedCursor
  >({
    queryKey: followKeys.followers(userId ?? 'unknown', limit),
    enabled: enabled && Boolean(userId),
    initialPageParam: { limit },
    queryFn: ({ pageParam }) => feedApi.getFollowers(userId ?? '', pageParam as TFeedCursor),
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return undefined
      return getNextFollowCursor(lastPage, limit)
    }
  })

export const useFollowingInfiniteQuery = ({
  userId,
  enabled = true,
  limit = 10
}: FollowListOptions) =>
  useInfiniteQuery<
    TFollowUserResponse[],
    Error,
    InfiniteData<TFollowUserResponse[]>,
    ReturnType<typeof followKeys.following>,
    TFeedCursor
  >({
    queryKey: followKeys.following(userId ?? 'unknown', limit),
    enabled: enabled && Boolean(userId),
    initialPageParam: { limit },
    queryFn: ({ pageParam }) => feedApi.getFollowing(userId ?? '', pageParam as TFeedCursor),
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return undefined
      return getNextFollowCursor(lastPage, limit)
    }
  })
