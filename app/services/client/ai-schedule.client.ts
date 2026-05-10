import { clientFetch } from './api.client';
import type { 
  AiScheduleListResponse, 
  SingleAiScheduleResponse, 
  CreateAiSchedulePayload 
} from '@/models/ai-schedule.model';

export const AiScheduleClientApi = {
  async fetchSchedules(params?: { workspaceId?: string; limit?: number }) {
    return clientFetch<AiScheduleListResponse>(
      '/api/Ai/schedules',
      {
        method: 'GET',
        params: { ...params, limit: params?.limit || 50 }
      },
      { auth: true }
    );
  },

  async createSchedule(data: CreateAiSchedulePayload) {
    return clientFetch<SingleAiScheduleResponse>(
      '/api/Ai/schedules',
      {
        method: 'POST',
        data
      },
      { auth: true }
    );
  },

  async fetchScheduleById(id: string) {
    return clientFetch<SingleAiScheduleResponse>(
      `/api/Ai/schedules/${id}`,
      {
        method: 'GET'
      },
      { auth: true }
    );
  },

  async updateSchedule(id: string, data: Partial<CreateAiSchedulePayload>) {
    return clientFetch<SingleAiScheduleResponse>(
      `/api/Ai/schedules/${id}`,
      {
        method: 'PUT',
        data
      },
      { auth: true }
    );
  },

  async cancelSchedule(id: string) {
    return clientFetch<SingleAiScheduleResponse>(
      `/api/Ai/schedules/${id}/cancel`,
      {
        method: 'POST'
      },
      { auth: true }
    );
  },

  async activateSchedule(id: string) {
    return clientFetch<SingleAiScheduleResponse>(
      `/api/Ai/schedules/${id}/activate`,
      {
        method: 'POST'
      },
      { auth: true }
    );
  },

  async sendAgentMessage(sessionId: string, payload: { 
    message: string; 
    scheduleOptions: {
      executeAtUtc: string;
      timezone: string;
      maxContentLength: number;
      targets: { socialMediaId: string; isPrimary: boolean }[];
    }
  }) {
    return clientFetch<any>(
      `/api/Ai/agent/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        data: payload
      },
      { auth: true }
    );
  }
};
