import envConfig from '@/config'
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { PATH } from '@/routes/path'
import store from '@/redux/store'
import { removeCurrentUser } from '@/redux/slices/current-user.slice'
import { removeLocalStorage } from '@/utils'

export const fetcher = axios.create({
  baseURL: envConfig.BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

const refreshClient = axios.create({
  baseURL: envConfig.BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

type RetryConfig = AxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let refreshQueue: Array<{ resolve: () => void; reject: (error: unknown) => void }> = []

const processQueue = (error?: unknown) => {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve()
    }
  })
  refreshQueue = []
}

const clearAuthAndRedirect = () => {
  removeLocalStorage('currentUser')
  store.dispatch(removeCurrentUser())
  if (window.location.pathname !== PATH.LOGIN) {
    window.location.href = PATH.LOGIN
  }
}

fetcher.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined
    const status = error.response?.status
    const url = originalRequest?.url ?? ''
    const isRefreshEndpoint = url.includes('/api/User/auth/refresh')

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: () => resolve(fetcher(originalRequest)),
            reject
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await refreshClient.post('/api/User/auth/refresh')
        processQueue()
        return fetcher(originalRequest)
      } catch (refreshError) {
        clearAuthAndRedirect()
        processQueue(refreshError)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
