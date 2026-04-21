import type {
  SocialMediaListResponse,
  SocialMediaResponse,
  DeleteSocialMediaResponse,
  CreateSocialMediaInput,
  UpdateSocialMediaInput
} from '@/models/social-media.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchSocialMedias() {
  return clientFetch<SocialMediaListResponse>(
    '/api/User/social-medias',
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchFacebookPages() {
  return clientFetch<SocialMediaListResponse>(
    '/api/User/social-medias/facebook-pages',
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchSocialMediaById(id: string) {
  return clientFetch<SocialMediaResponse>(
    `/api/User/social-medias/${id}`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function createSocialMedia(data: CreateSocialMediaInput) {
  return clientFetch<SocialMediaResponse>(
    '/api/User/social-medias',
    {
      method: 'POST',
      data
    },
    { auth: true }
  );
}

export async function updateSocialMedia(id: string, data: UpdateSocialMediaInput) {
  return clientFetch<SocialMediaResponse>(
    `/api/User/social-medias/${id}`,
    {
      method: 'PUT',
      data
    },
    { auth: true }
  );
}

export async function deleteSocialMedia(id: string) {
  return clientFetch<DeleteSocialMediaResponse>(
    `/api/User/social-medias/${id}`,
    {
      method: 'DELETE'
    },
    { auth: true }
  );
}

export async function fetchWorkspaceLinkedSocialMedias(workspaceId: string, limit: number = 100) {
  return clientFetch<SocialMediaListResponse>(
    `/api/User/workspaces/${workspaceId}/social-medias`,
    {
      method: 'GET',
      params: { limit }
    },
    { auth: true }
  );
}

export async function linkSocialMediaToWorkspace(workspaceId: string, socialMediaId: string) {
  return clientFetch<SocialMediaResponse>(
    `/api/User/workspaces/${workspaceId}/social-medias`,
    {
      method: 'POST',
      data: { socialMediaId }
    },
    { auth: true }
  );
}

export async function unlinkSocialMediaFromWorkspace(workspaceId: string, socialMediaId: string) {
  return clientFetch<DeleteSocialMediaResponse>(
    `/api/User/workspaces/${workspaceId}/social-medias/${socialMediaId}`,
    {
      method: 'DELETE'
    },
    { auth: true }
  );
}
