import { fetcher } from "@/apis/fetcher";
import type { TUserProfileResponse } from "@/models/user.model";

export const profileApi = {
  async getMe(): Promise<TUserProfileResponse["value"]> {
    try {
      const res = await fetcher.get<TUserProfileResponse>('/api/User/auth/me');
      return res.data.value;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
}
