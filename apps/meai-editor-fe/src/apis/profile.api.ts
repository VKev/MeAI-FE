import { fetcher } from "@/apis/fetcher";
import type { TUserProfileResponse } from "@/models/user.model";

export const profileApi = {
  async getMe(): Promise<TUserProfileResponse> {
    try {
      const res = await fetcher.get('/api/User/auth/me');
      return res.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
}
