// WebSocket client - Socket.io
// NO POLLING - all live data comes via WebSocket events

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket.id);
      this.connected = true;
      this.emit('connection', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      this.connected = false;
      this.emit('disconnection', { connected: false });
    });

    // Forward all events to registered listeners
    const events = [
      'score:update',
      'ball:event',
      'market:status',
      'odds:update',
      'balance:update',
      'bet:result',
      'authenticated',
      'auth_error',
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  authenticate(token) {
    this.socket?.emit('authenticate', token);
  }

  subscribeMatch(matchId) {
    this.socket?.emit('subscribe:match', matchId);
  }

  unsubscribeMatch(matchId) {
    this.socket?.emit('unsubscribe:match', matchId);
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

export const socketService = new SocketService();
export default socketService;