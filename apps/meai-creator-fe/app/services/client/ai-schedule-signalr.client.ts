import * as signalR from "@microsoft/signalr";
import type { ScheduleNotificationPayload, SignalRNotification } from '@/models/ai-schedule.model';

class PublishingScheduleTracker {
  private connection: signalR.HubConnection | null = null;

  public async connect(accessToken: string, onProgressUpdate: (payload: ScheduleNotificationPayload) => void) {
    if (this.connection) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/Notification/hubs/notifications", {
        accessTokenFactory: () => accessToken,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.on("ReceiveNotification", (notification: SignalRNotification) => {
      if (
        notification.type === "ai.publishing_schedule.thinking" ||
        notification.type === "ai.publishing_schedule.completed" ||
        notification.type === "ai.publishing_schedule.failed"
      ) {
        try {
          const payload: ScheduleNotificationPayload = JSON.parse(notification.payloadJson);
          onProgressUpdate(payload);
        } catch (e) {
          console.error("Lỗi parse payloadJson từ thông báo SignalR:", e);
        }
      }
    });

    try {
      await this.connection.start();
      console.log("Đã kết nối thành công tới SignalR Notification Hub.");
    } catch (err) {
      console.error("Lỗi kết nối tới SignalR Hub:", err);
      setTimeout(() => this.connect(accessToken, onProgressUpdate), 5000);
    }
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log("Đã ngắt kết nối SignalR.");
    }
  }
}

export default PublishingScheduleTracker;
