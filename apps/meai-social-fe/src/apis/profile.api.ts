import { fetcher } from "@/apis/fetcher";
import type { TChangePasswordPayload, TChangePasswordResponse, TGetMeResponse, TUpdateProfilePayload } from "@/models/profile.model";

export const profileApi = {
  async getMe(): Promise<TGetMeResponse> {
    try {
      const res = await fetcher.get('/api/User/auth/me');
      return res.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  async updateProfile(data: TUpdateProfilePayload): Promise<TGetMeResponse> {
    try {
      const res = await fetcher.put('/api/User/auth/profile', data);
      return res.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  async uploadAvatar(file: File): Promise<TGetMeResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetcher.put('/api/User/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  },

  async changePassword(data: TChangePasswordPayload): Promise<TChangePasswordResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/change-password', data);
      return res.data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  }
}