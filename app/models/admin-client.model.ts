export type AdminApiServiceName = 'User' | 'Ai';

export type ApiCredentialSource = 'env_seeded' | 'admin_created' | 'admin_updated' | string;

export type ApiCredentialItem = {
  id: string;
  serviceName: string;
  provider: string;
  keyName: string;
  displayName: string;
  maskedValue: string;
  isActive: boolean;
  source: ApiCredentialSource;
  version: number;
  lastSyncedFromEnvAt: string | null;
  lastRotatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ApiResultError = {
  code: string;
  description: string;
} | null;

export type ApiResult<T> = {
  value: T;
  isSuccess: boolean;
  isFailure: boolean;
  error: ApiResultError;
};

export type ApiCredentialListResponse = ApiResult<ApiCredentialItem[]>;

export type ApiCredentialResponse = ApiResult<ApiCredentialItem>;

export type GetApiCredentialFilters = {
  provider?: string;
  keyName?: string;
  isActive?: boolean;
};

export type CreateApiCredentialRequest = {
  provider: string;
  keyName: string;
  value: string;
  displayName?: string;
  isActive?: boolean;
};

export type UpdateApiCredentialRequest = {
  displayName?: string | null;
  value?: string | null;
  isActive?: boolean | null;
};
