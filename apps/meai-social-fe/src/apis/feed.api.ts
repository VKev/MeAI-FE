import { fetcher } from '@/apis/fetcher'
import type {
  TCommentLikeResponse,
  TCommentResponse,
  TCreateCommentPayload,
  TCreateCommentResponse,
  TCreateReplyPayload,
  TCreateReplyResponse,
  TCreatePostPayload,
  TCreatePostResponse,
  TResult,
  TFeedCursor,
  TPostLikeResponse,
  TPostResponse,
  TPublicProfileResponse,
  TFollowSuggestionResponse,
  TFollowUserResponse,
  TReportPayload,
  TReportResponse,
  TUpdatePostPayload,
  TUpdatePostResponse,
  TPostCheckSensitiveResponse
} from '@/models/feed.model'

type TFeedListResponse = TResult<TPostResponse[]>
type TPostLikeEnvelope = TResult<TPostLikeResponse>
type TReportEnvelope = TResult<TReportResponse>
type TDeletePostEnvelope = TResult<null>
type TDeleteCommentEnvelope = TResult<null>
type TPostDetailEnvelope = TResult<TPostResponse>
type TCommentListEnvelope = TResult<TCommentResponse[]>
type TCreateCommentEnvelope = TCreateCommentResponse
type TCreateReplyEnvelope = TCreateReplyResponse
type TCommentLikeEnvelope = TResult<TCommentLikeResponse>
type TFollowSuggestionEnvelope = TResult<TFollowSuggestionResponse[]>
type TFollowListEnvelope = TResult<TFollowUserResponse[]>
type TProfileEnvelope = TResult<TPublicProfileResponse>
type TFollowEnvelope = TResult<TFollowUserResponse>
type TUnfollowEnvelope = TResult<null>
type TPostCheckSensitive = TResult<TPostCheckSensitiveResponse>

export const feedApi = {
  async getFeed(params: TFeedCursor) {
    const response = await fetcher.get<TFeedListResponse>('/api/Feed/posts/feed', { params })
    return response.data.value ?? []
  },

  async getProfile(username: string) {
    const response = await fetcher.get<TProfileEnvelope>(`/api/Feed/profiles/${username}`)
    return response.data.value
  },

  async getProfilePosts(username: string, params: TFeedCursor) {
    const response = await fetcher.get<TFeedListResponse>(`/api/Feed/profiles/${username}/posts`, { params })
    return response.data.value ?? []
  },

  async getPostDetail(postId: string) {
    const response = await fetcher.get<TPostDetailEnvelope>(`/api/Feed/posts/${postId}`)
    return response.data.value
  },

  async createPost(payload: TCreatePostPayload) {
    const response = await fetcher.post<TCreatePostResponse>('/api/Feed/posts', payload)
    return response.data.value
  },

  async likePost(postId: string) {
    const response = await fetcher.post<TPostLikeEnvelope>(`/api/Feed/posts/${postId}/like`)
    return response.data.value
  },

  async unlikePost(postId: string) {
    const response = await fetcher.delete<TPostLikeEnvelope>(`/api/Feed/posts/${postId}/like`)
    return response.data.value
  },

  async updatePost(postId: string, payload: TUpdatePostPayload) {
    const response = await fetcher.put<TUpdatePostResponse>(`/api/Feed/posts/${postId}`, payload)
    return response.data.value
  },

  async reportTarget(payload: TReportPayload) {
    const response = await fetcher.post<TReportEnvelope>('/api/Feed/reports', payload)
    return response.data.value
  },

  async getPostComments(postId: string, params: TFeedCursor) {
    const response = await fetcher.get<TCommentListEnvelope>(`/api/Feed/posts/${postId}/comments`, { params })
    return response.data.value ?? []
  },

  async getCommentReplies(commentId: string, params: TFeedCursor) {
    const response = await fetcher.get<TCommentListEnvelope>(`/api/Feed/comments/${commentId}/replies`, { params })
    return response.data.value ?? []
  },

  async likeComment(commentId: string) {
    const response = await fetcher.post<TCommentLikeEnvelope>(`/api/Feed/comments/${commentId}/like`)
    return response.data.value
  },

  async unlikeComment(commentId: string) {
    const response = await fetcher.delete<TCommentLikeEnvelope>(`/api/Feed/comments/${commentId}/like`)
    return response.data.value
  },

  async createComment(payload: TCreateCommentPayload) {
    const response = await fetcher.post<TCreateCommentEnvelope>('/api/Feed/comments', payload)
    return response.data.value
  },

  async createReply(commentId: string, payload: TCreateReplyPayload) {
    const response = await fetcher.post<TCreateReplyEnvelope>(`/api/Feed/comments/${commentId}/reply`, payload)
    return response.data.value
  },

  async deleteComment(commentId: string) {
    const response = await fetcher.delete<TDeleteCommentEnvelope>(`/api/Feed/comments/${commentId}`)
    return response.data.value
  },

  async deletePost(postId: string) {
    const response = await fetcher.delete<TDeletePostEnvelope>(`/api/Feed/posts/${postId}`)
    return response.data.value
  },

  async getFollowSuggestions(limit: number) {
    const response = await fetcher.get<TFollowSuggestionEnvelope>('/api/Feed/follow/suggestions', {
      params: { limit }
    })
    return response.data.value ?? []
  },

  async getFollowers(userId: string, params: TFeedCursor) {
    const response = await fetcher.get<TFollowListEnvelope>(`/api/Feed/followers/${userId}`, { params })
    return response.data.value ?? []
  },

  async getFollowing(userId: string, params: TFeedCursor) {
    const response = await fetcher.get<TFollowListEnvelope>(`/api/Feed/following/${userId}`, { params })
    return response.data.value ?? []
  },

  async followUser(userId: string) {
    const response = await fetcher.post<TFollowEnvelope>(`/api/Feed/follow/${userId}`)
    return response.data.value
  },

  async unfollowUser(userId: string) {
    const response = await fetcher.delete<TUnfollowEnvelope>(`/api/Feed/follow/${userId}`)
    return response.data.value
  },

  async checkSensitivePost(postId: string) {
    const response = await fetcher.post<TPostCheckSensitive>(`/api/Ai/posts/${postId}/check-sensitive`)
    return response.data.value
  },
}
