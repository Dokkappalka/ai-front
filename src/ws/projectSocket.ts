import config from '../config';

type MessageHandler = (data: any) => void;

class ProjectWebSocket {
  private socket: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private projectId: number | null = null;

  connect(token: string, projectId: number) {
    if (this.socket && this.projectId === projectId) return;
    this.disconnect();

    this.projectId = projectId;
    this.socket = new WebSocket(
      `${config.WS_URL}/projects/${projectId}/chat/?token=${token}`,
    );

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handlers.forEach((h) => h(message));
      } catch {
        // ignore malformed frames
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.projectId = null;
  }

  send(message: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'chat_message', message }));
    }
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const projectSocket = new ProjectWebSocket();
