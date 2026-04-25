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

export type StorageResourceType = 'image' | 'video' | string;

export type StorageResourceItem = {
  id: string;
  userId: string;
  workspaceId: string | null;
  resourceType: StorageResourceType | null;
  contentType: string | null;
  sizeBytes: number;
  storageBucket: string | null;
  storageRegion: string | null;
  storageNamespace: string | null;
  storageKey: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  expiresAt: string | null;
  deletedFromStorageAt: string | null;
  presignedUrl?: string | null;
};

export type StorageResourcesCursor = {
  cursorCreatedAt: string;
  cursorId: string;
};

export type StorageResourcesQuery = {
  userId?: string;
  workspaceId?: string;
  resourceType?: StorageResourceType;
  includeDeleted?: boolean;
  namespace?: string;
  includePresignedUrl?: boolean;
  limit?: number;
  cursorCreatedAt?: string;
  cursorId?: string;
};

export type StorageResourcesPayload = {
  items: StorageResourceItem[];
  nextCursorCreatedAt: string | null;
  nextCursorId: string | null;
  totalCount: number | null;
};

export type StorageUsageByUserItem = {
  userId: string;
  username: string | null;
  email: string | null;
  subscriptionId: string | null;
  subscriptionName: string | null;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number | null;
  quotaBytes: number | null;
  overQuota: boolean;
  resourceCount: number;
};

export type StorageUsageOverview = {
  namespace: string | null;
  totalUsedBytes: number;
  totalReservedBytes: number;
  totalResourceCount: number;
  overQuotaUsers: number;
  users: StorageUsageByUserItem[];
};

export type StorageUsageQuery = {
  userId?: string;
  subscriptionId?: string;
  overQuotaOnly?: boolean;
  namespace?: string;
};

export type FreeTierStorageSettings = {
  freeStorageQuotaBytes: number;
  usedBytes: number;
  updatedAt: string | null;
};

export type UpdateFreeTierStorageSettingsRequest = {
  freeStorageQuotaBytes: number;
};

export type SystemStorageSettings = {
  systemStorageQuotaBytes: number | null;
  usedBytes: number;
  updatedAt: string | null;
};

export type UpdateSystemStorageSettingsRequest = {
  systemStorageQuotaBytes: number | null;
};

export type StoragePlanLimits = {
  storageQuotaBytes: number | null;
  maxUploadFileBytes: number | null;
  retentionDaysAfterDelete: number | null;
};

export type StoragePlanPolicyItem = {
  id: string;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  limits: StoragePlanLimits;
};

export type UpdateStoragePlanRequest = {
  storageQuotaBytes?: number | null;
  maxUploadFileBytes?: number | null;
  retentionDaysAfterDelete?: number | null;
};

export type RunStorageCleanupRequest = {
  dryRun?: boolean;
  deleteExpiredResources?: boolean;
  deleteOrphanObjects?: boolean;
  olderThanDays?: number | null;
  namespace?: string | null;
};

export type StorageCleanupResult = {
  namespace: string | null;
  scannedResources: number;
  scannedObjects: number;
  expiredCandidates: number;
  orphanCandidates: number;
  deletedResources: number;
  deletedObjects: number;
};

export type RunStorageReconcileRequest = {
  dryRun?: boolean;
  markMissingObjects?: boolean;
  namespace?: string | null;
};

export type StorageReconcileResult = {
  namespace: string | null;
  scannedResources: number;
  scannedObjects: number;
  missingObjects: number;
  orphanObjects: number;
  markedMissingObjects: number;
};

export type StorageResourcesResponse = ApiResult<StorageResourcesPayload>;

export type StorageUsageResponse = ApiResult<StorageUsageOverview>;

export type FreeTierStorageSettingsResponse = ApiResult<FreeTierStorageSettings>;

export type SystemStorageSettingsResponse = ApiResult<SystemStorageSettings>;

export type StoragePlanPoliciesResponse = ApiResult<StoragePlanPolicyItem[]>;

export type StoragePlanPolicyResponse = ApiResult<StoragePlanPolicyItem>;

export type StorageCleanupResponse = ApiResult<StorageCleanupResult>;

export type StorageReconcileResponse = ApiResult<StorageReconcileResult>;
