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
  status:
    | 'active'
    | 'cancelled'
    | 'published'
    | 'failed'
    | 'Pending'
    | 'Executing'
    | 'Publishing'
    | 'Completed'
    | 'Failed'
    | 'Cancelled'
    | null;
  executeAtUtc: string;
  timezone: string | null;
  isPrivate: boolean | null;
  createdBy: string | null;
  platformPreference: string | null;
  agentPrompt: string | null;
  maxContentLength: number | null;
  search: AiScheduleSearch | null;
  executionContextJson: string | null;
  runtimePostBuilderId?: string | null;
  runtimePostIds?: string[] | null;
  desiredPostType?: 'posts' | 'reels' | null;
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
  name?: string;
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

export interface ProgressLogStep {
  step?: string | null;
  stepId?: string | null;
  stepCode?: string | null;
  currentStep?: string | null;
  action?: string | null;
  name?: string | null;
  title?: string | null;
  status?: 'Running' | 'Completed' | 'Failed' | 'Skipped' | string | null;
  message?: string | null;
  timestampUtc?: string | null;
  timestamp?: string | null;
  createdAt?: string | null;
}

export interface ScheduleNotificationPayload {
  scheduleId: string;
  workspaceId: string;
  userId: string;
  status: string;
  currentStep: string;
  currentStepStatus: 'Running' | 'Completed' | 'Failed' | 'Skipped';
  currentStepMessage: string;
  steps: ProgressLogStep[];
  createdAt: string;
}

export interface SignalRNotification {
  notificationId: string;
  type: 'ai.publishing_schedule.thinking' | 'ai.publishing_schedule.completed' | 'ai.publishing_schedule.failed';
  title: string;
  message: string;
  payloadJson: string;
}
