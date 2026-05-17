import type { TChatResponse, TCreateChatResponse, TCreateImageChat, TCreateVideoChat, TDeleteChatResponse, TGetAllChatResponse } from "@/models/chat.model";
import { clientFetch } from "@/services/client/api.client";

export const chatApi = {
  async getAllChatByChatSessionId(chatSessionId: string) {
    const res = await clientFetch<TGetAllChatResponse>(`/api/Ai/chats/session/${chatSessionId}`, { method: 'GET' }, { auth: true });
    return res;
  },

  async getChatById(chatId: string) {
    const res = await clientFetch<TChatResponse>(`/api/Ai/chats/${chatId}`, { method: 'GET' }, { auth: true });
    return res;
  },

  async deleteChatById(chatId: string) {
    const res = await clientFetch<TDeleteChatResponse>(`/api/Ai/chats/${chatId}`, { method: 'DELETE' }, { auth: true });
    return res;
  },

  // prompt image
  async createImageChat(payload: TCreateImageChat) {
    const res = await clientFetch<TCreateChatResponse>(`/api/Ai/chats/image`, { method: 'POST', data: payload }, { auth: true });
    return res;
  },

  // prompt video
  async createVideoChat(payload: TCreateVideoChat) {
    const res = await clientFetch<TCreateChatResponse>(`/api/Ai/chats/video`, { method: 'POST', data: payload }, { auth: true });
    return res;
  }
};
