
export type TChatSession = {
  id: string;
  userId: string;
  workspaceId: string;
  sessionName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TGetAllChatSessionsResponse = {
  value: TChatSession[],
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export type TChatSessionsResponse = {
  value: TChatSession,
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export type TCreateChatSessionPayload = {
  workspaceId: string;
  sessionName: string | null;
}

export type TDeleteChatSessionResponse = {
  value: boolean,
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}