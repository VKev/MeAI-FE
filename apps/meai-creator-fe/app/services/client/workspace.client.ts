import type {
  WorkspaceListResponse,
  WorkspaceResponse,
  DeleteWorkspaceResponse,
  CreateWorkspaceInput,
  UpdateWorkspaceInput
} from '@/models/workspace.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchWorkspaces() {
  return clientFetch<WorkspaceListResponse>(
    '/api/User/workspaces',
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchWorkspaceById(id: string) {
  return clientFetch<WorkspaceResponse>(
    `/api/User/workspaces/${id}`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function createWorkspace(data: CreateWorkspaceInput) {
  return clientFetch<WorkspaceResponse>(
    '/api/User/workspaces',
    {
      method: 'POST',
      data
    },
    { auth: true }
  );
}

export async function updateWorkspace(id: string, data: UpdateWorkspaceInput) {
  return clientFetch<WorkspaceResponse>(
    `/api/User/workspaces/${id}`,
    {
      method: 'PUT',
      data
    },
    { auth: true }
  );
}

export async function deleteWorkspace(id: string) {
  return clientFetch<DeleteWorkspaceResponse>(
    `/api/User/workspaces/${id}`,
    {
      method: 'DELETE'
    },
    { auth: true }
  );
}
