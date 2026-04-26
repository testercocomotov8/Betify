import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectSocket(token: string) {
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}