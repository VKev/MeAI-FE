import type { TCreatePostCaptionPayload, TPostPreparePayload, TPostPrepareResponse } from "@/models/post-prepare.model";
import { clientFetch } from "@/services/client/api.client";

export const PostPrepareClientApi = {
  async createPostPrepare(payload: TPostPreparePayload) {
    const res = await clientFetch<TPostPrepareResponse>(`/api/Gemini/post-prepare`, {
      method: 'POST',
      data: payload
    }, { auth: true });
    return res;
  },

  async createPostCaption(payload: TCreatePostCaptionPayload) {
    const res = await clientFetch<TPostPrepareResponse>(`/api/Gemini/captions`, {
      method: 'POST',
      data: payload
    }, { auth: true });
    return res;
  },
};