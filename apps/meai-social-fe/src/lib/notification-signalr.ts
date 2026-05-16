import * as signalR from '@microsoft/signalr'

const HUB_PATH = '/hubs/notifications'

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '')

export function createNotificationConnection(baseUrl: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${normalizeBaseUrl(baseUrl)}${HUB_PATH}`, {
      withCredentials: true,
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}
