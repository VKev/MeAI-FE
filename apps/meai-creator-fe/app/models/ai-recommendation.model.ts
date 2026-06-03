export type AiRecommendationStyle = 'creative' | 'branded' | 'marketing';
export type AiRecommendationPlatform = 'facebook' | 'instagram' | 'tiktok' | 'threads';
export type AiRecommendationMediaType = 'image' | 'video';

export type AiRecommendationDraftPostInput = {
	imageCount?: number | null;
	mediaType?: AiRecommendationMediaType | null;
	maxRagPosts?: number | null;
	maxReferenceImages?: number | null;
	style?: AiRecommendationStyle | null;
	topK?: number | null;
	userPrompt?: string | null;
	workspaceId?: string | null;
};

export type AiContentSuggestionInput = {
	instruction?: string | null;
	style?: AiRecommendationStyle | null;
	mediaType?: AiRecommendationMediaType | null;
	workspaceId?: string | null;
	topK?: number | null;
	maxRagPosts?: number | null;
	refreshIndex?: boolean | null;
};

export type AiContentSuggestionTaskValue = {
	correlationId: string;
	status: string;
	socialMediaId: string;
	userId: string;
	workspaceId: string | null;
	style: AiRecommendationStyle | string;
	mediaType: AiRecommendationMediaType | string;
	instruction: string | null;
	createdAt: string;
	errorCode: string | null;
	errorMessage: string | null;
};

export type AiContentSuggestionTaskResponse = {
	value: AiContentSuggestionTaskValue | null;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
		metadata?: unknown;
	} | null;
};

export type AiPostImproveInput = {
	improveCaption?: boolean;
	improveImage?: boolean;
	style?: AiRecommendationStyle | null;
	platform?: AiRecommendationPlatform | null;
	socialMediaId?: string | null;
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
	mediaType: AiRecommendationMediaType;
	imageCount: number;
	resultPostBuilderId: string | null;
	resultPostId: string | null;
	resultResourceId: string | null;
	resultPresignedUrl: string | null;
	resultResourceIds?: string[] | null;
	resultPresignedUrls?: string[] | null;
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
	socialMediaId?: string | null;
	improveCaption: boolean;
	improveImage: boolean;
	style: string;
	userInstruction: string | null;
	resultCaption: string | null;
	resultResourceId: string | null;
	resultPresignedUrl: string | null;
	resultResourceIds?: string[] | null;
	resultPresignedUrls?: string[] | null;
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

export type AiAccountAnalysisSuggestionInput = {
	from?: string | null;
	to?: string | null;
	postLimit?: number | null;
	topK?: number | null;
	maxRagPosts?: number | null;
	refreshIndex?: boolean | null;
	instruction?: string | null;
};

export type AiAccountAnalysisSuggestionValue = {
	socialMediaId: string;
	platform: string;
	suggestion: string;
	documentIdPrefix: string;
	generatedAt: string;
	from: string | null;
	to: string | null;
	analyzedPostCount: number;
};

export type AiAccountAnalysisSuggestionStatusValue = {
	socialMediaId: string;
	platform: string;
	status: string;
	isSuggested: boolean;
	correlationId: string | null;
	suggestion: string | null;
	generatedAt: string | null;
	completedAt: string | null;
	errorCode: string | null;
	errorMessage: string | null;
};

export type AiAccountAnalysisSuggestionPayload = AiAccountAnalysisSuggestionStatusValue & {
	response?: AiAccountAnalysisSuggestionValue | null;
};

export type AiAccountAnalysisSuggestionResponse = {
	value: AiAccountAnalysisSuggestionValue | null;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
		metadata?: unknown;
	} | null;
};

export type AiAccountAnalysisSuggestionStatusResponse = {
	value: AiAccountAnalysisSuggestionStatusValue | null;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
		metadata?: unknown;
	} | null;
};
