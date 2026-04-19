import axios from 'axios';
import envConfig from '@/config';
import type {
  AdminUserListResponse,
  AdminUserResponse,
  AdminUserDeleteResponse,
  AdminTransactionListResponse,
  AdminTransactionResponse,
  AdminTransactionDeleteResponse,
  AdminConfigResponse,
} from '@/models/admin.model';
import type { SubscriptionListResponse, SubscriptionResponse, SubscriptionDeleteResponse } from '@/models/subscription.model';

const API_URL = envConfig.VITE_API_URL;

function getCookie(request: Request) {
  return request.headers.get('cookie') ?? '';
}

export async function fetchAdminUsers(request: Request): Promise<AdminUserListResponse> {
  const res = await axios.get<AdminUserListResponse>(
    `${API_URL}/api/User/admin/users?includeDeleted=true`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
      signal: request.signal,
    }
  );
  return res.data;
}

export async function deleteAdminUser(request: Request, userId: string): Promise<AdminUserDeleteResponse> {
  const res = await axios.delete<AdminUserDeleteResponse>(
    `${API_URL}/api/User/admin/users/${userId}`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function updateAdminUserRole(request: Request, userId: string, role: string) {
  const res = await axios.put(
    `${API_URL}/api/User/admin/users/${userId}/role`,
    { role },
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function activateAdminUser(request: Request, userId: string): Promise<AdminUserDeleteResponse> {
  const res = await axios.put<AdminUserDeleteResponse>(
    `${API_URL}/api/User/admin/users/${userId}/activate`,
    {},
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export type CreateAdminUserPayload = {
  username: string;
  email: string;
  password: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  birthday?: string | null;
  avatarResourceId?: string | null;
  meAiCoin?: number | null;
  emailVerified?: boolean | null;
  role?: string | null;
};

export async function createAdminUser(request: Request, payload: CreateAdminUserPayload): Promise<AdminUserResponse> {
  const res = await axios.post<AdminUserResponse>(
    `${API_URL}/api/User/admin/users`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
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

export async function updateAdminUser(request: Request, userId: string, payload: UpdateAdminUserPayload): Promise<AdminUserResponse> {
  const res = await axios.put<AdminUserResponse>(
    `${API_URL}/api/User/admin/users/${userId}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
}


export async function fetchAdminTransactions(request: Request): Promise<AdminTransactionListResponse> {
  const res = await axios.get<AdminTransactionListResponse>(
    `${API_URL}/api/User/admin/transactions`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
      signal: request.signal,
    }
  );
  return res.data;
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

export async function createAdminTransaction(request: Request, payload: CreateAdminTransactionPayload): Promise<AdminTransactionResponse> {
  const res = await axios.post<AdminTransactionResponse>(
    `${API_URL}/api/User/admin/transactions`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
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

export async function updateAdminTransaction(request: Request, transactionId: string, payload: UpdateAdminTransactionPayload): Promise<AdminTransactionResponse> {
  const res = await axios.put<AdminTransactionResponse>(
    `${API_URL}/api/User/admin/transactions/${transactionId}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function patchAdminTransaction(request: Request, transactionId: string, payload: UpdateAdminTransactionPayload): Promise<AdminTransactionResponse> {
  const res = await axios.patch<AdminTransactionResponse>(
    `${API_URL}/api/User/admin/transactions/${transactionId}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function deleteAdminTransaction(request: Request, transactionId: string): Promise<AdminTransactionDeleteResponse> {
  const res = await axios.delete<AdminTransactionDeleteResponse>(
    `${API_URL}/api/User/admin/transactions/${transactionId}`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}
export async function fetchAdminConfig(request: Request): Promise<AdminConfigResponse> {
  const res = await axios.get<AdminConfigResponse>(
    `${API_URL}/api/User/admin/config`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export type UpdateAdminConfigPayload = {
  chatModel?: string | null;
  mediaAspectRatio?: string | null;
  numberOfVariances?: number | null;
};

export async function updateAdminConfig(request: Request, payload: UpdateAdminConfigPayload): Promise<AdminConfigResponse> {
  const res = await axios.put<AdminConfigResponse>(
    `${API_URL}/api/User/admin/config`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        cookie: getCookie(request),
      },
      withCredentials: true,
    }
  );
  return res.data;
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

export async function fetchAdminSubscriptions(request: Request): Promise<SubscriptionListResponse> {
  const res = await axios.get<SubscriptionListResponse>(
    `${API_URL}/api/User/admin/subscriptions`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
      signal: request.signal,
    }
  );
  return res.data;
}

export async function createAdminSubscription(request: Request, payload: CreateAdminSubscriptionPayload): Promise<SubscriptionResponse> {
  const res = await axios.post<SubscriptionResponse>(
    `${API_URL}/api/User/admin/subscriptions`,
    payload,
    {
      headers: { 'Content-Type': 'application/json', cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export type UpdateAdminSubscriptionPayload = Partial<CreateAdminSubscriptionPayload> & { isDeleted?: boolean };

export async function updateAdminSubscription(request: Request, id: string, payload: UpdateAdminSubscriptionPayload): Promise<SubscriptionResponse> {
  const res = await axios.put<SubscriptionResponse>(
    `${API_URL}/api/User/admin/subscriptions/${id}`,
    payload,
    {
      headers: { 'Content-Type': 'application/json', cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function patchAdminSubscription(request: Request, id: string, payload: UpdateAdminSubscriptionPayload): Promise<SubscriptionResponse> {
  const res = await axios.patch<SubscriptionResponse>(
    `${API_URL}/api/User/admin/subscriptions/${id}`,
    payload,
    {
      headers: { 'Content-Type': 'application/json', cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function deleteAdminSubscription(request: Request, id: string): Promise<SubscriptionDeleteResponse> {
  const res = await axios.delete<SubscriptionDeleteResponse>(
    `${API_URL}/api/User/admin/subscriptions/${id}`,
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function activateAdminSubscription(request: Request, id: string): Promise<SubscriptionResponse> {
  const res = await axios.patch<SubscriptionResponse>(
    `${API_URL}/api/User/admin/subscriptions/${id}/activate`,
    {},
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

export async function deactivateAdminSubscription(request: Request, id: string): Promise<SubscriptionResponse> {
  const res = await axios.patch<SubscriptionResponse>(
    `${API_URL}/api/User/admin/subscriptions/${id}/deactivate`,
    {},
    {
      headers: { cookie: getCookie(request) },
      withCredentials: true,
    }
  );
  return res.data;
}

