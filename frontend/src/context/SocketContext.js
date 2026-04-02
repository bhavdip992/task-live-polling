// ============================================
// SOCKET CONTEXT
// React Context that provides Socket.IO connection
// to all components in the app
//
// WHY CONTEXT?
// Instead of passing the socket connection through
// props to every component, we use React Context
// so any component can access it directly.
// ============================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create the context
const SocketContext = createContext(null);

// The API URL (backend server)
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Provider component that wraps the app
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // ---- Create Socket.IO connection ----
    const newSocket = io(SOCKET_URL, {
      // These options help with connection reliability
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ---- Connection Events ----
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('⚠️ Socket connection error:', error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // ---- Cleanup on unmount ----
    // When the app closes, disconnect the socket
    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty dependency array = runs once on mount

  // Provide socket and connection status to all children
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook for easy access to socket in any component
// Usage: const { socket, isConnected } = useSocket();
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}