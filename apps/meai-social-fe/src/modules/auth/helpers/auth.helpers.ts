import type { AppDispatch } from '@/redux/store'
import { profileApi } from '@/apis/profile.api'
import { setLocalStorage } from '@/utils'
import { setCurrentUser } from '@/redux/slices/current-user.slice'

export const handleAuthSuccess = async (dispatch: AppDispatch) => {
  const profileResponse = await profileApi.getMe()
  if (profileResponse?.value) {
    setLocalStorage('currentUser', profileResponse.value)
    dispatch(setCurrentUser(profileResponse.value))
  }

  return profileResponse
}

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const err = error as { error?: { description?: string }; detail?: string }
    if (err.detail) return err.detail
    if (err.error?.description) return err.error.description
  }

  return fallback
}
