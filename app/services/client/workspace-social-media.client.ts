import type {
  SocialMediaListResponse,
  SocialMediaResponse,
  DeleteSocialMediaResponse
} from '@/models/social-media.model';
import { clientFetch } from '@/services/client/api.client';

/**
 * Fetch all social media accounts assigned to a workspace
 */
export async function fetchWorkspaceSocialMedias(workspaceId: string) {
  return clientFetch<SocialMediaListResponse>(
    `/api/User/workspaces/${workspaceId}/social-medias`,
    { method: 'GET' },
    { auth: true }
  );
}

/**
 * Assign a user's social media account to a workspace
 */
export async function assignSocialMediaToWorkspace(
  workspaceId: string,
  socialMediaId: string
) {
  return clientFetch<SocialMediaResponse>(
    `/api/User/workspaces/${workspaceId}/social-medias`,
    {
      method: 'POST',
      data: { socialMediaId }
    },
    { auth: true }
  );
}

/**
 * Remove a social media account from a workspace
 */
export async function removeSocialMediaFromWorkspace(
  workspaceId: string,
  socialMediaId: string
) {
  return clientFetch<DeleteSocialMediaResponse>(
    `/api/User/workspaces/${workspaceId}/social-medias/${socialMediaId}`,
    { method: 'DELETE' },
    { auth: true }
  );
}
