import type { TPostBuilderResponse } from "@/models/post-builder.model";
import { clientFetch } from "@/services/client/api.client";

export const PostBuilderClientApi = {
  async getPostBuilder(postBuilderId: string) {
    const res = await clientFetch<TPostBuilderResponse>(`/api/Ai/post-builders/${postBuilderId}`, {
      method: 'GET',
    }, { auth: true });
    return res;
  },
};