export type Resource = {
  id: string;
  link: string;
  status: string | null;
  resourceType: string | null;
  contentType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ResourceCursor = {
  cursorCreatedAt: string;
  cursorId: string;
};

export type ResourcesResponse = {
  value: Resource[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
