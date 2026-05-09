import type {
	AiRecommendationDraftPostInput,
	AiRecommendationResponse
} from '@/models/ai-recommendation.model';
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
