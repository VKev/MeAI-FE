import type {
	AiPostImproveInput,
	AiPostImproveResponse,
	AiRecommendationDraftPostInput,
	AiRecommendationResponse
} from '@/models/ai-recommendation.model';
import type { SinglePostResponse } from '@/models/post.model';
import { clientFetch } from '@/services/client/api.client';

export async function createAiRecommendationDraftPost(socialMediaId: string, data: AiRecommendationDraftPostInput) {
	return clientFetch<AiRecommendationResponse>(
		`/api/Ai/recommendations/${socialMediaId}/draft-posts`,
		{
			method: 'POST',
			data
		},
		{ auth: true }
	);
}

export async function fetchAiRecommendationDraftPost(correlationId: string) {
	return clientFetch<AiRecommendationResponse>(
		`/api/Ai/recommendations/draft-posts/${correlationId}`,
		{
			method: 'GET'
		},
		{ auth: true }
	);
}

export async function startAiPostImprove(postId: string, data: AiPostImproveInput) {
	return clientFetch<AiPostImproveResponse>(
		`/api/Ai/recommendations/posts/${postId}/improve`,
		{
			method: 'POST',
			data
		},
		{ auth: true }
	);
}

export async function fetchAiPostImprove(postId: string) {
	return clientFetch<AiPostImproveResponse>(
		`/api/Ai/recommendations/posts/${postId}/improve`,
		{
			method: 'GET'
		},
		{ auth: true }
	);
}

export async function approveAiPostImprove(postId: string) {
	return clientFetch<SinglePostResponse>(
		`/api/Ai/recommendations/posts/${postId}/improve/approve`,
		{
			method: 'POST'
		},
		{ auth: true }
	);
}

export async function rejectAiPostImprove(postId: string) {
	return clientFetch<SinglePostResponse>(
		`/api/Ai/recommendations/posts/${postId}/improve/reject`,
		{
			method: 'POST'
		},
		{ auth: true }
	);
}
