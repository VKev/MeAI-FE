import type {
  AdminApiServiceName,
  ApiCredentialListResponse,
  ApiCredentialResponse,
  CreateApiCredentialRequest,
  FreeTierStorageSettingsResponse,
  GetApiCredentialFilters,
  RunStorageCleanupRequest,
  RunStorageReconcileRequest,
  StorageCleanupResponse,
  StoragePlanPoliciesResponse,
  StoragePlanPolicyResponse,
  StorageReconcileResponse,
  StorageResourcesQuery,
  StorageResourcesResponse,
  StorageUsageQuery,
  StorageUsageResponse,
  StorageUsageByUserResponse,
  SystemStorageSettingsResponse,
  UpdateFreeTierStorageSettingsRequest,
  UpdateStoragePlanRequest,
  UpdateSystemStorageSettingsRequest,
  UpdateApiCredentialRequest
} from '@/models/admin-client.model';
import { clientFetch } from '@/services/client/api.client';
import type { AdminReportPreviewResponse } from '@/models/admin.model';
import type {
  AdminUserListResponse,
  AdminUserResponse,
  AdminUserDeleteResponse,
  AdminTransactionListResponse,
  AdminTransactionResponse,
  AdminTransactionDeleteResponse,
  AdminConfigResponse,
  AdminReportListResponse,
  AdminReportResponse,
  AdminUserSubscriptionListResponse,
  AdminUserSubscriptionResponse,
} from '@/models/admin.model';
import type { SubscriptionListResponse, SubscriptionResponse, SubscriptionDeleteResponse } from '@/models/subscription.model';
import type { AiUsageHistoryResponse, AiUsageSummaryResponse, AdminAiUsageSummaryResponse } from '@/models/ai-usage.model';

const API_KEY_BASE_PATH: Record<AdminApiServiceName, string> = {
  User: '/api/User/admin/api-keys',
  Ai: '/api/Ai/admin/api-keys'
};

const STORAGE_BASE_PATH = '/api/User/admin/storage';

function buildApiKeyListUrl(service: AdminApiServiceName, filters?: GetApiCredentialFilters) {
  const basePath = API_KEY_BASE_PATH[service];
  if (!filters) {
    return basePath;
  }

  const params = new URLSearchParams();

  if (filters.provider?.trim()) {
    params.set('provider', filters.provider.trim());
  }

  if (filters.keyName?.trim()) {
    params.set('keyName', filters.keyName.trim());
  }

  if (typeof filters.isActive === 'boolean') {
    params.set('isActive', String(filters.isActive));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function fetchAdminApiKeys(service: AdminApiServiceName, filters?: GetApiCredentialFilters) {
  return clientFetch<ApiCredentialListResponse>(
    buildApiKeyListUrl(service, filters),
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function createAdminApiKey(service: AdminApiServiceName, payload: CreateApiCredentialRequest) {
  return clientFetch<ApiCredentialResponse>(
    API_KEY_BASE_PATH[service],
    {
      method: 'POST',
      data: payload
    },
    { auth: true }
  );
}

export async function updateAdminApiKey(
  service: AdminApiServiceName,
  id: string,
  payload: UpdateApiCredentialRequest
) {
  return clientFetch<ApiCredentialResponse>(
    `${API_KEY_BASE_PATH[service]}/${id}`,
    {
      method: 'PUT',
      data: payload
    },
    { auth: true }
  );
}

function appendQueryParam(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value === 'string') {
    if (!value.trim()) {
      return;
    }

    params.set(key, value.trim());
    return;
  }

  params.set(key, String(value));
}

function buildStorageUrl(path: string, query?: Record<string, unknown>) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => appendQueryParam(params, key, value));

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function fetchAdminStorageUsage(query?: StorageUsageQuery) {
  return clientFetch<StorageUsageResponse>(
    buildStorageUrl(`${STORAGE_BASE_PATH}/usage`, query),
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchAdminStorageUsageByUser(userId: string) {
  return clientFetch<StorageUsageByUserResponse>(
    `${STORAGE_BASE_PATH}/usage/users/${userId}`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchAdminStorageResources(query?: StorageResourcesQuery) {
  return clientFetch<StorageResourcesResponse>(
    buildStorageUrl(`${STORAGE_BASE_PATH}/resources`, query),
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchAdminFreeTierStorageSettings() {
  return clientFetch<FreeTierStorageSettingsResponse>(
    `${STORAGE_BASE_PATH}/settings/free-tier`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function updateAdminFreeTierStorageSettings(payload: UpdateFreeTierStorageSettingsRequest) {
  return clientFetch<FreeTierStorageSettingsResponse>(
    `${STORAGE_BASE_PATH}/settings/free-tier`,
    {
      method: 'PUT',
      data: payload
    },
    { auth: true }
  );
}

export async function fetchAdminSystemStorageSettings() {
  return clientFetch<SystemStorageSettingsResponse>(
    `${STORAGE_BASE_PATH}/settings/system`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function updateAdminSystemStorageSettings(payload: UpdateSystemStorageSettingsRequest) {
  return clientFetch<SystemStorageSettingsResponse>(
    `${STORAGE_BASE_PATH}/settings/system`,
    {
      method: 'PUT',
      data: payload
    },
    { auth: true }
  );
}

export async function fetchAdminStoragePlans() {
  return clientFetch<StoragePlanPoliciesResponse>(
    `${STORAGE_BASE_PATH}/plans`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function updateAdminStoragePlan(planId: string, payload: UpdateStoragePlanRequest) {
  return clientFetch<StoragePlanPolicyResponse>(
    `${STORAGE_BASE_PATH}/plans/${planId}`,
    {
      method: 'PATCH',
      data: payload
    },
    { auth: true }
  );
}

export async function runAdminStorageCleanup(payload: RunStorageCleanupRequest) {
  return clientFetch<StorageCleanupResponse>(
    `${STORAGE_BASE_PATH}/cleanup/run`,
    {
      method: 'POST',
      data: payload
    },
    { auth: true }
  );
}

export async function runAdminStorageReconcile(payload: RunStorageReconcileRequest) {
  return clientFetch<StorageReconcileResponse>(
    `${STORAGE_BASE_PATH}/reconcile`,
    {
      method: 'POST',
      data: payload
    },
    { auth: true }
  );
}

function getErrorMessage(response: { error: { description: string } | null }, fallback: string) {
  return response.error?.description || fallback;
}

export async function fetchAdminReportPreview(reportId: string, signal?: AbortSignal) {
  const response = await clientFetch<AdminReportPreviewResponse>(
    `/api/Feed/admin/reports/${reportId}/preview`,
    {
      method: 'GET',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load report preview.'));
  }

  return response;
}

// ---- Users ----

export async function fetchAdminUsers(query?: { includeDeleted?: boolean }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.set('includeDeleted', 'true');
  const qs = params.toString();
  const url = qs ? `/api/User/admin/users?${qs}` : '/api/User/admin/users';
  return clientFetch<AdminUserListResponse>(url, { method: 'GET' }, { auth: true });
}

export type CreateAdminUserPayload = {
  username: string;
  email: string;
  password?: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  birthday?: string | null;
  avatarResourceId?: string | null;
  meAiCoin?: number | null;
  emailVerified?: boolean | null;
  role?: string | null;
};

export async function createAdminUser(payload: CreateAdminUserPayload) {
  return clientFetch<AdminUserResponse>('/api/User/admin/users', { method: 'POST', data: payload }, { auth: true });
}

export type UpdateAdminUserPayload = {
  username?: string | null;
  email?: string | null;
  password?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  birthday?: string | null;
  avatarResourceId?: string | null;
  meAiCoin?: number | null;
  emailVerified?: boolean | null;
};

export async function updateAdminUser(userId: string, payload: UpdateAdminUserPayload) {
  return clientFetch<AdminUserResponse>(`/api/User/admin/users/${userId}`, { method: 'PUT', data: payload }, { auth: true });
}

export async function deleteAdminUser(userId: string) {
  return clientFetch<AdminUserDeleteResponse>(`/api/User/admin/users/${userId}`, { method: 'DELETE' }, { auth: true });
}

export async function activateAdminUser(userId: string) {
  return clientFetch<AdminUserDeleteResponse>(`/api/User/admin/users/${userId}/activate`, { method: 'PUT' }, { auth: true });
}

export async function adjustUserSubscription(userId: string, subscriptionId: string) {
  return clientFetch<AdminUserResponse>(`/api/User/admin/users/${userId}/subscription`, { method: 'POST', data: { subscriptionId } }, { auth: true });
}

// ---- Transactions ----

export async function fetchAdminTransactions() {
  return clientFetch<AdminTransactionListResponse>('/api/User/admin/transactions', { method: 'GET' }, { auth: true });
}

export type CreateAdminTransactionPayload = {
  userId: string;
  relationId?: string | null;
  relationType?: string | null;
  cost: number;
  transactionType: string;
  tokenUsed?: number | null;
  paymentMethod: string;
  status: string;
};

export async function createAdminTransaction(payload: CreateAdminTransactionPayload) {
  return clientFetch<AdminTransactionResponse>('/api/User/admin/transactions', { method: 'POST', data: payload }, { auth: true });
}

export type UpdateAdminTransactionPayload = {
  userId?: string;
  relationId?: string | null;
  relationType?: string | null;
  cost?: number;
  transactionType?: string;
  paymentMethod?: string;
  status?: string;
  providerReferenceId?: string | null;
  tokenUsed?: number | null;
};

export async function updateAdminTransaction(transactionId: string, payload: UpdateAdminTransactionPayload) {
  return clientFetch<AdminTransactionResponse>(`/api/User/admin/transactions/${transactionId}`, { method: 'PUT', data: payload }, { auth: true });
}

export async function patchAdminTransaction(transactionId: string, payload: UpdateAdminTransactionPayload) {
  return clientFetch<AdminTransactionResponse>(`/api/User/admin/transactions/${transactionId}`, { method: 'PATCH', data: payload }, { auth: true });
}

export async function deleteAdminTransaction(transactionId: string) {
  return clientFetch<AdminTransactionDeleteResponse>(`/api/User/admin/transactions/${transactionId}`, { method: 'DELETE' }, { auth: true });
}

// ---- Subscriptions ----

export async function fetchAdminSubscriptions() {
  return clientFetch<SubscriptionListResponse>('/api/User/admin/subscriptions', { method: 'GET' }, { auth: true });
}

export type CreateAdminSubscriptionPayload = {
  name: string;
  cost: number;
  durationMonths: number;
  meAiCoin: number;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  limits: {
    number_of_social_accounts: number;
    rate_limit_for_content_creation: number;
    number_of_workspaces: number;
    max_pages_per_social_account?: number | null;
  };
};

export async function createAdminSubscription(payload: CreateAdminSubscriptionPayload) {
  return clientFetch<SubscriptionResponse>('/api/User/admin/subscriptions', { method: 'POST', data: payload }, { auth: true });
}

export type UpdateAdminSubscriptionPayload = Partial<CreateAdminSubscriptionPayload> & { isDeleted?: boolean };

export async function updateAdminSubscription(id: string, payload: UpdateAdminSubscriptionPayload) {
  return clientFetch<SubscriptionResponse>(`/api/User/admin/subscriptions/${id}`, { method: 'PUT', data: payload }, { auth: true });
}

export async function patchAdminSubscription(id: string, payload: UpdateAdminSubscriptionPayload) {
  return clientFetch<SubscriptionResponse>(`/api/User/admin/subscriptions/${id}`, { method: 'PATCH', data: payload }, { auth: true });
}

export async function deleteAdminSubscription(id: string) {
  return clientFetch<SubscriptionDeleteResponse>(`/api/User/admin/subscriptions/${id}`, { method: 'DELETE' }, { auth: true });
}

export async function activateAdminSubscription(id: string) {
  return clientFetch<SubscriptionResponse>(`/api/User/admin/subscriptions/${id}/activate`, { method: 'PATCH' }, { auth: true });
}

export async function deactivateAdminSubscription(id: string) {
  return clientFetch<SubscriptionResponse>(`/api/User/admin/subscriptions/${id}/deactivate`, { method: 'PATCH' }, { auth: true });
}

// ---- User Subscriptions ----

export async function fetchAdminUserSubscriptions() {
  return clientFetch<AdminUserSubscriptionListResponse>('/api/User/admin/user-subscriptions', { method: 'GET' }, { auth: true });
}

export async function fetchAdminUserSubscriptionById(id: string) {
  return clientFetch<AdminUserSubscriptionResponse>(`/api/User/admin/user-subscriptions/${id}`, { method: 'GET' }, { auth: true });
}

export async function updateAdminUserSubscriptionStatus(userSubscriptionId: string, status: string, reason?: string) {
  return clientFetch<AdminUserSubscriptionResponse>(`/api/User/admin/user-subscriptions/${userSubscriptionId}/status`, { method: 'POST', data: { status, reason } }, { auth: true });
}

// ---- Reports ----

export async function fetchAdminReports() {
  return clientFetch<AdminReportListResponse>('/api/Feed/admin/reports', { method: 'GET' }, { auth: true });
}

export type UpdateAdminReportPayload = {
  status?: string;
  resolutionNote?: string;
  actionType?: string;
};

export async function updateAdminReport(reportId: string, payload: UpdateAdminReportPayload) {
  return clientFetch<AdminReportResponse>(`/api/Feed/admin/reports/${reportId}`, { method: 'PATCH', data: payload }, { auth: true });
}

// ---- Admin AI Spending ----

export type AdminAiUsageHistoryParams = {
  userId?: string;
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

export async function fetchAdminAiUsageHistory(params?: AdminAiUsageHistoryParams) {
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') {
        searchParams.set(key, String(value));
      }
    }
  }
  const qs = searchParams.toString();
  return clientFetch<AiUsageHistoryResponse>(
    `/api/Ai/admin/spending/ai/history${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
    { auth: true }
  );
}

export async function fetchAdminAiUsageSummary(params?: {
  fromUtc?: string;
  toUtc?: string;
  period?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') {
        searchParams.set(key, String(value));
      }
    }
  }
  const qs = searchParams.toString();
  return clientFetch<AdminAiUsageSummaryResponse>(
    `/api/Ai/admin/spending/ai${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
    { auth: true }
  );
}
