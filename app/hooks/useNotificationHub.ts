import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import envConfig from '@/config';
import type { NotificationDelivery } from '@/models/notification.model';
import { NotificationTypes } from '@/models/notification.model';

const HUB_URL = `${envConfig.VITE_API_URL}/hubs/notifications`;
const NOTIFICATION_RECEIVED = 'NotificationReceived';
const RECONNECT_DELAYS = [0, 2000, 5000, 10000];

async function fetchAccessToken(): Promise<string> {
  const res = await fetch('/api/notification-token', { credentials: 'include' });
  const data = await res.json();
  return data.token ?? '';
}

export function useNotificationHub(enabled: boolean) {
  const connectionRef = useRef<HubConnection | null>(null);
  const tokenRef = useRef('');
  const queryClient = useQueryClient();

  const handleNotification = useCallback(
    (notification: NotificationDelivery) => {
      console.log('[NotificationHub] Received:', notification.type, notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (
        notification.type === NotificationTypes.AiImageGenerationCompleted ||
        notification.type === NotificationTypes.AiVideoGenerationCompleted
      ) {
        console.log('[NotificationHub] Refreshing workspace-chats');
        queryClient.invalidateQueries({ queryKey: ['workspace-chats'] });
      }

      if (
        notification.type === NotificationTypes.AiImageGenerationFailed ||
        notification.type === NotificationTypes.AiVideoGenerationFailed
      ) {
        toast.error(notification.title || 'Generation failed', {
          description: notification.message
        });
        queryClient.invalidateQueries({ queryKey: ['workspace-chats'] });
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let disposed = false;

    (async () => {
      const token = await fetchAccessToken();
      if (disposed || !token) {
        console.log('[NotificationHub] No token available');
        return;
      }

      tokenRef.current = token;

      const connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => tokenRef.current,
          withCredentials: true,
          transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling
        })
        .withAutomaticReconnect(RECONNECT_DELAYS)
        .configureLogging(LogLevel.Information)
        .build();

      connectionRef.current = connection;

      connection.on(NOTIFICATION_RECEIVED, handleNotification);

      connection.onreconnected(() => {
        console.log('[NotificationHub] Reconnected');
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });

      connection.onclose(() => {
        console.log('[NotificationHub] Disconnected');
      });

      console.log('[NotificationHub] Connecting to', HUB_URL);
      try {
        await connection.start();
        console.log('[NotificationHub] Connected successfully');
      } catch (err) {
        console.error('[NotificationHub] Connection failed:', err);
      }
    })();

    return () => {
      disposed = true;
      const conn = connectionRef.current;
      if (conn && conn.state !== HubConnectionState.Disconnected) {
        conn.stop();
      }
      connectionRef.current = null;
    };
  }, [enabled, handleNotification]);
}
