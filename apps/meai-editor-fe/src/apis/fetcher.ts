import envConfig from '@/config'
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

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
  localStorage.removeItem('user-storage')
  window.location.href = "/"
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
