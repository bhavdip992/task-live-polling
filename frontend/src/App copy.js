// ============================================
// MAIN APP COMPONENT
// Sets up routing for the application
// ============================================

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CreatePoll from './components/CreatePoll';
import PollPage from './components/PollPage';
import NotFound from './components/NotFound';

function App() {
  return (
    // SocketProvider wraps the entire app to provide Socket.IO connection
    <SocketProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          {/* Routes define which component renders at which URL */}
          <Routes>
            {/* Home page */}
            <Route path="/" element={<Home />} />
            
            {/* Create a new poll */}
            <Route path="/create" element={<CreatePoll />} />
            
            {/* 
              DYNAMIC ROUTE - This is the KEY requirement!
              :id is a URL parameter that captures the poll ID
              Example: /poll/abc123 → id = "abc123"
            */}
            <Route path="/poll/:id" element={<PollPage />} />
            
            {/* 404 page for unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SocketProvider>
  );
}

export default App;