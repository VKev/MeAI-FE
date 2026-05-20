export type AiActionType = 'image_generation' | 'video_generation' | 'caption_generation';

export type AiSpendStatus = 'debited' | 'refunded';

export type AiReferenceType = 'chat_image' | 'chat_video' | 'chat_caption';

export type AiSpendRecord = {
  spendRecordId: string;
  userId: string;
  workspaceId: string | null;
  provider: string;
  actionType: string;
  model: string;
  variant: string | null;
  unit: string;
  quantity: number;
  unitCostCoins: number;
  totalCoins: number;
  status: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  processingDurationSeconds: number | null;
};

export type AiUsageHistoryResponse = {
  isSuccess: boolean;
  value: {
    items: AiSpendRecord[];
    nextCursorCreatedAt: string | null;
    nextCursorId: string | null;
  };
  isFailure?: boolean;
  error?: {
    code: string;
    description: string;
  };
};

export type AiUsageHistoryParams = {
  fromUtc?: string;
  toUtc?: string;
  actionType?: string;
  status?: string;
  workspaceId?: string;
  provider?: string;
  model?: string;
  referenceType?: string;
  cursorCreatedAt?: string;
  cursorId?: string;
  limit?: number;
};

export type AiUsageSummaryResponse = {
  isSuccess: boolean;
  value: {
    dailySpending?: Array<{
      date: string;
      imageCoins: number;
      videoCoins: number;
      captionCoins: number;
      totalCoins: number;
    }>;
    totalCoinsSpent?: number;
    totalRequests?: number;
    avgProcessingDurationSeconds?: number;
  };
  isFailure?: boolean;
  error?: {
    code: string;
    description: string;
  };
};
