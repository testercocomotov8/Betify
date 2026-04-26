import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: {
    token: null,
  },
});

export const connectSocket = (token) => {
  socket.auth.token = token;
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;