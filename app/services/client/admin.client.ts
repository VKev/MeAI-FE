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
  SystemStorageSettingsResponse,
  UpdateFreeTierStorageSettingsRequest,
  UpdateStoragePlanRequest,
  UpdateSystemStorageSettingsRequest,
  UpdateApiCredentialRequest
} from '@/models/admin-client.model';
import { clientFetch } from '@/services/client/api.client';

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
