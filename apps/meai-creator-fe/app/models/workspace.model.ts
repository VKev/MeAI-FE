export type Workspace = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateWorkspaceInput = {
  name: string;
  type?: string | null;
  description?: string | null;
};

export type UpdateWorkspaceInput = {
  name: string;
  type?: string | null;
  description?: string | null;
};

export type WorkspaceListResponse = {
  value: Workspace[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type WorkspaceResponse = {
  value: Workspace;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type DeleteWorkspaceResponse = {
  value: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
