import type {
	AiPostImproveInput,
	AiPostImproveResponse,
	AiAccountAnalysisSuggestionInput,
	AiAccountAnalysisSuggestionStatusResponse,
	AiContentSuggestionInput,
	AiContentSuggestionTaskResponse,
	AiRecommendationDraftPostInput,
	AiRecommendationResponse
} from '@/models/ai-recommendation.model';
import type { SinglePostResponse } from '@/models/post.model';
import { clientFetch } from '@/services/client/api.client';

function getErrorMessage(response: { error: { description?: string } | null }, fallback: string) {
	return response.error?.description || fallback;
}

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

export async function startAiContentSuggestion(socialMediaId: string, data: AiContentSuggestionInput) {
	const response = await clientFetch<AiContentSuggestionTaskResponse>(
		`/api/Ai/recommendations/${socialMediaId}/content-suggest`,
		{
			method: 'POST',
			data
		},
		{ auth: true }
	);

	if (!response.isSuccess) {
		throw new Error(getErrorMessage(response, 'Unable to start content suggestion.'));
	}

	return response;
}

export async function fetchAiAccountAnalysisSuggestion(socialMediaId: string, signal?: AbortSignal) {
	const response = await clientFetch<AiAccountAnalysisSuggestionStatusResponse>(
		`/api/Ai/recommendations/${socialMediaId}/analysis-suggest`,
		{
			method: 'GET',
			signal
		},
		{ auth: true }
	);

	if (!response.isSuccess) {
		throw new Error(getErrorMessage(response, 'Unable to load account analysis suggestion.'));
	}

	return response;
}

export async function startAiAccountAnalysisSuggestion(
	socialMediaId: string,
	data: AiAccountAnalysisSuggestionInput = {},
	signal?: AbortSignal
) {
	const response = await clientFetch<AiAccountAnalysisSuggestionStatusResponse>(
		`/api/Ai/recommendations/${socialMediaId}/analysis-suggest`,
		{
			method: 'POST',
			data,
			signal
		},
		{ auth: true }
	);

	if (!response.isSuccess) {
		throw new Error(getErrorMessage(response, 'Unable to start account analysis suggestion.'));
	}

	return response;
}
