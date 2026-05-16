import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import envConfig from '@/config'
import { notificationApi } from '@/apis/notification.api'
import { createNotificationConnection } from '@/lib/notification-signalr'
import type { NotificationDeliveryModel } from '@/models/notification.model'

type UseNotificationsOptions = {
  enabled: boolean
  source?: string
  limit?: number
}

type NotificationsState = {
  items: NotificationDeliveryModel[]
  isConnected: boolean
  isLoading: boolean
  unreadCount: number
  hasUnread: boolean
  refetch: () => Promise<void>
  markAsRead: (userNotificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationsState | null>(null)

const upsertNotification = (items: NotificationDeliveryModel[], notification: NotificationDeliveryModel) => {
  const existingIndex = items.findIndex((item) => item.userNotificationId === notification.userNotificationId)
  if (existingIndex === -1) {
    return [notification, ...items]
  }

  const next = [...items]
  next[existingIndex] = notification
  return next
}

const updateNotificationAsRead = (items: NotificationDeliveryModel[], userNotificationId: string, readAt: string) =>
  items.map((item) => (item.userNotificationId === userNotificationId ? { ...item, isRead: true, readAt } : item))

const updateAllAsRead = (items: NotificationDeliveryModel[], readAt: string) =>
  items.map((item) => (item.isRead ? item : { ...item, isRead: true, readAt }))

const useNotificationsStore = ({ enabled, source = 'Social', limit = 50 }: UseNotificationsOptions) => {
  const [items, setItems] = useState<NotificationDeliveryModel[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  console.log('🚀 ~ useNotificationsStore ~ isConnected:', isConnected)

  const refetch = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    try {
      const data = await notificationApi.getNotifications({ source, limit })
      setItems(data)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, source, limit])

  const markAsRead = useCallback(async (userNotificationId: string) => {
    await notificationApi.markAsRead(userNotificationId)
    const now = new Date().toISOString()
    setItems((current) => updateNotificationAsRead(current, userNotificationId, now))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await notificationApi.markAllAsRead()
    const now = new Date().toISOString()
    setItems((current) => updateAllAsRead(current, now))
  }, [])

  useEffect(() => {
    if (!enabled) {
      setItems([])
      setIsConnected(false)
      return
    }

    let disposed = false
    const connection = createNotificationConnection(envConfig.BASE_URL)

    const handleNotification = (notification: NotificationDeliveryModel) => {
      if (source && notification.source !== source) return
      setItems((current) => upsertNotification(current, notification))
    }

    connection.on('NotificationReceived', handleNotification)
    connection.onreconnected(async () => {
      if (disposed) return
      setIsConnected(true)
      await refetch()
    })
    connection.onclose(() => {
      if (!disposed) setIsConnected(false)
    })

    void (async () => {
      await refetch()
      await connection.start()
      if (!disposed) setIsConnected(true)
    })().catch((error) => {
      if (!disposed) setIsConnected(false)
      console.error('Notification realtime connection failed', error)
    })

    return () => {
      disposed = true
      connection.off('NotificationReceived', handleNotification)
      void connection.stop()
    }
  }, [enabled, refetch, source])

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items])

  return {
    items,
    isConnected,
    isLoading,
    unreadCount,
    hasUnread: unreadCount > 0,
    refetch,
    markAsRead,
    markAllAsRead
  }
}

type NotificationProviderProps = UseNotificationsOptions & {
  children: React.ReactNode
}

export function NotificationProvider({ children, ...options }: NotificationProviderProps) {
  const value = useNotificationsStore(options)
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
