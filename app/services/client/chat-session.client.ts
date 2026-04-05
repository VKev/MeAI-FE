import type { TGetAllChatSessionsResponse, TChatSessionsResponse, TCreateChatSessionPayload, TDeleteChatSessionResponse, TChatSession } from "@/models/chat-session.model";
import { clientFetch } from "@/services/client/api.client";

export const ChatSessionClientApi = {
  async getAllChatSessions() {
    const res = await clientFetch<TGetAllChatSessionsResponse>(`/api/Ai/ChatSession`, {
      method: 'GET'
    }, { auth: true });
    return res;
  },

  async getDetailChatSession(id: string) {
    const res = await clientFetch<TChatSessionsResponse>(`/api/Ai/chat-sessions/${id}`, {
      method: 'GET'
    }, { auth: true });
    return res;
  },

  async createChatSession(payload: TCreateChatSessionPayload) {
    const res = await clientFetch<TChatSessionsResponse>(`/api/Ai/chat-sessions`, {
      method: 'POST',
      data: payload
    }, { auth: true });
    return res;
  },

  async updateChatSession(payload: Pick<TChatSession, 'sessionName'>) {
    const res = await clientFetch<TChatSessionsResponse>(`/api/Ai/chat-sessions`, {
      method: 'PUT',
      data: payload
    }, { auth: true });
    return res;
  },

  async deleteChatSession(id: string) {
    const res = await clientFetch<TDeleteChatSessionResponse>(`/api/Ai/chat-sessions/${id}`, {
      method: 'DELETE'
    }, { auth: true });
    return res;
  }
};