/**
 * WebSocket Network Service Manager
 * Isolates real-time socket connections, reconnection loops,
 * message dispatch, and event listeners.
 */

class RoverSocketManager {
  constructor() {
    this.socket = null;
    this.url = null;
    this.listeners = {};
    this.reconnectInterval = 3000;
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  connect(url) {
  if (
    this.socket &&
    this.socket.readyState === WebSocket.OPEN
  ) {
    return;
  }

  this.url = url;

  console.log(
    `Connecting to Rover Mission Control WebSocket: ${url}`
  );

  this.socket = new WebSocket(url);

  this.socket.onopen =
    this.handleOpen.bind(this);

  this.socket.onmessage =
    this.handleMessage.bind(this);

  this.socket.onclose =
    this.handleClose.bind(this);

  this.socket.onerror =
    this.handleError.bind(this);
}

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn("Socket is disconnected. Queueing action:", event);
    }
  }

  handleOpen() {
  console.log("SOCKET OPENED SUCCESSFULLY");
  this.isConnected = true;
  this.trigger("connect");
}

handleMessage(e) {
  try {
    const payload = JSON.parse(e.data);

    console.log("TELEMETRY RECEIVED", payload);

    this.trigger("telemetry", payload);

  } catch (err) {
    console.error("Socket message error:", err);
  }
}

handleClose() {
  this.isConnected = false;
  this.trigger("disconnect");
  this.reconnectTimer = setTimeout(
    () => this.connect(this.url),
    this.reconnectInterval
  );
}

  handleError(e) {
    console.error("Socket error status:", e);
    this.trigger("error", e);
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socketManager = new RoverSocketManager();
