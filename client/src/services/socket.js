// client/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('⚡ Connected to socket server');
});

socket.on('disconnect', () => {
  console.log('🔥 Disconnected from socket server');
});

export default socket;
