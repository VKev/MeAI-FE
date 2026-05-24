import type {
  GenerationModelOptionResponse,
  GenerationOptionsResponse,
  GenerationSocialPresetResponse,
  UpsertGenerationModelOptionPayload,
  UpsertGenerationSocialPresetPayload
} from '@/models/generation-options.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchGenerationOptions(signal?: AbortSignal) {
  return clientFetch<GenerationOptionsResponse>(
    '/api/Ai/generation-options',
    { method: 'GET', signal },
    { auth: true }
  );
}

export async function fetchAdminGenerationOptions(signal?: AbortSignal) {
  return clientFetch<GenerationOptionsResponse>(
    '/api/Ai/admin/generation-options',
    { method: 'GET', signal },
    { auth: true }
  );
}

export async function createGenerationModelOption(payload: UpsertGenerationModelOptionPayload) {
  return clientFetch<GenerationModelOptionResponse>(
    '/api/Ai/admin/generation-options/models',
    { method: 'POST', data: payload },
    { auth: true }
  );
}

export async function updateGenerationModelOption(id: string, payload: UpsertGenerationModelOptionPayload) {
  return clientFetch<GenerationModelOptionResponse>(
    `/api/Ai/admin/generation-options/models/${id}`,
    { method: 'PUT', data: payload },
    { auth: true }
  );
}

export async function deleteGenerationModelOption(id: string) {
  await clientFetch<void>(
    `/api/Ai/admin/generation-options/models/${id}`,
    { method: 'DELETE' },
    { auth: true }
  );
}

export async function createGenerationSocialPreset(payload: UpsertGenerationSocialPresetPayload) {
  return clientFetch<GenerationSocialPresetResponse>(
    '/api/Ai/admin/generation-options/social-presets',
    { method: 'POST', data: payload },
    { auth: true }
  );
}

export async function updateGenerationSocialPreset(id: string, payload: UpsertGenerationSocialPresetPayload) {
  return clientFetch<GenerationSocialPresetResponse>(
    `/api/Ai/admin/generation-options/social-presets/${id}`,
    { method: 'PUT', data: payload },
    { auth: true }
  );
}

export async function deleteGenerationSocialPreset(id: string) {
  await clientFetch<void>(
    `/api/Ai/admin/generation-options/social-presets/${id}`,
    { method: 'DELETE' },
    { auth: true }
  );
}
