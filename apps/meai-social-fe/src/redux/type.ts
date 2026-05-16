import type { TProfile } from '@/models/profile.model'

export interface ICurrentUserState {
  currentUser: TProfile | null
}
