import config from "../config";

type MessageHandler = (data: any) => void;

class MusicWebSocket {
  private socket: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();

  connect(token: string) {
    if (this.socket) return;

    this.socket = new WebSocket(
      `${config.WS_URL}/music/updates/?token=${token}`
    );

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handlers.forEach(h => h(message));
    };

    this.socket.onclose = () => {
      this.socket = null;
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const musicSocket = new MusicWebSocket();