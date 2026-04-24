import type {
  AdminApiServiceName,
  ApiCredentialListResponse,
  ApiCredentialResponse,
  CreateApiCredentialRequest,
  GetApiCredentialFilters,
  UpdateApiCredentialRequest
} from '@/models/admin-client.model';
import { clientFetch } from '@/services/client/api.client';

const API_KEY_BASE_PATH: Record<AdminApiServiceName, string> = {
  User: '/api/User/admin/api-keys',
  Ai: '/api/Ai/admin/api-keys'
};

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
