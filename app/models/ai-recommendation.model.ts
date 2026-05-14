export type AiRecommendationStyle = 'creative' | 'branded' | 'marketing';
export type AiRecommendationPlatform = 'facebook' | 'instagram' | 'tiktok' | 'threads';

export type AiRecommendationDraftPostInput = {
	maxRagPosts?: number | null;
	maxReferenceImages?: number | null;
	style?: AiRecommendationStyle | null;
	topK?: number | null;
	userPrompt?: string | null;
	workspaceId?: string | null;
};

export type AiPostImproveInput = {
	improveCaption?: boolean;
	improveImage?: boolean;
	style?: AiRecommendationStyle | null;
	platform?: AiRecommendationPlatform | null;
	userInstruction?: string | null;
};

export type AiRecommendationDraftPostValue = {
	correlationId: string;
	status: string;
	socialMediaId: string;
	userId: string;
	workspaceId: string | null;
	userPrompt: string | null;
	isAutoTopic: boolean;
	style: string | null;
	resultPostBuilderId: string | null;
	resultPostId: string | null;
	resultResourceId: string | null;
	resultPresignedUrl: string | null;
	resultCaption: string | null;
	errorCode: string | null;
	errorMessage: string | null;
	createdAt: string;
	completedAt: string | null;
};

export type AiRecommendationResponse = {
	value: AiRecommendationDraftPostValue | null;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
		metadata?: unknown;
	} | null;
};

export type AiPostImproveValue = {
	recommendId: string;
	correlationId: string;
	status: string;
	originalPostId: string;
	userId: string;
	workspaceId: string | null;
	improveCaption: boolean;
	improveImage: boolean;
	style: string;
	userInstruction: string | null;
	resultCaption: string | null;
	resultResourceId: string | null;
	resultPresignedUrl: string | null;
	errorCode: string | null;
	errorMessage: string | null;
	createdAt: string;
	completedAt: string | null;
};

export type AiPostImproveResponse = {
	value: AiPostImproveValue | null;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
		metadata?: unknown;
	} | null;
};
