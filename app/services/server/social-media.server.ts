import axios from 'axios';

import envConfig from '@/config';
import type { SocialMediaListResponse } from '@/models/social-media.model';

const API_URL = envConfig.VITE_API_URL;

function getCookie(request: Request) {
  return request.headers.get('cookie') ?? '';
}

export async function fetchSocialMediasServer(request: Request): Promise<SocialMediaListResponse> {
  const response = await axios.get<SocialMediaListResponse>(`${API_URL}/api/User/social-medias`, {
    headers: { cookie: getCookie(request) },
    withCredentials: true,
    signal: request.signal
  });

  return response.data;
}
