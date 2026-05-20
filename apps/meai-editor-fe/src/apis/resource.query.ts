import { resourceApi } from './resource.api';
import type { Resource } from '@/models/resource.model';

export const RESOURCE_QUERY_KEY = ['user-resources'] as const;

export const fetchUserResourcesFromApi = async (): Promise<Resource[]> => {
  return resourceApi.getAllUserResource({ limit: 100 });
};
