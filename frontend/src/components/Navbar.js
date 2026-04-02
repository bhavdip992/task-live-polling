// ============================================
// NAVBAR COMPONENT
// Simple navigation bar at the top
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function Navbar() {
  const { isConnected } = useSocket();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🗳️ Live Poll Arena
        </Link>
        <div className="navbar-links">
          <Link to="/create" className="nav-link">
            + Create Poll
          </Link>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;