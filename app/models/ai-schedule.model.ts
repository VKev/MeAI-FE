export interface AiScheduleTarget {
  id?: string;
  socialMediaId: string;
  platform?: string | null;
  targetLabel?: string | null;
  isPrimary: boolean;
}

export interface AiScheduleSearch {
  queryTemplate?: string | null;
  count?: number | null;
  country?: string | null;
  searchLanguage?: string | null;
  freshness?: string | null;
}

export interface AiScheduleItem {
  id: string;
  itemType?: string | null;
  itemId?: string | null;
  sortOrder: number;
  executionBehavior?: string | null;
  status?: string | null;
  errorMessage?: string | null;
  lastExecutionAt?: string | null;
  itemTitle?: string | null;
  itemCurrentStatus?: string | null;
}

export interface AiSchedule {
  id: string;
  userId: string;
  workspaceId: string;
  name: string | null;
  mode: 'agentic' | 'fixed_content' | null;
  status: 'active' | 'cancelled' | 'published' | 'failed' | null;
  executeAtUtc: string;
  timezone: string | null;
  isPrivate: boolean | null;
  createdBy: string | null;
  platformPreference: string | null;
  agentPrompt: string | null;
  maxContentLength: number | null;
  search: AiScheduleSearch | null;
  executionContextJson: string | null;
  items: AiScheduleItem[];
  targets: AiScheduleTarget[];
  lastExecutionAt: string | null;
  nextRetryAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateAiSchedulePayload {
  workspaceId: string;
  agentPrompt: string;
  executeAtUtc: string;
  timezone: string;
  maxContentLength: number;
  targets: {
    socialMediaId: string;
    isPrimary: boolean;
  }[];
}

export interface AiScheduleListResponse {
  value: AiSchedule[];
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code: string;
    description: string;
  } | null;
}

export interface SingleAiScheduleResponse {
  value: AiSchedule;
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code: string;
    description: string;
  } | null;
}
