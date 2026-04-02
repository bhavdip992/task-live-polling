// ============================================
// MAIN SERVER FILE
// This is the entry point of our backend
// It sets up Express, MongoDB, and Socket.IO
// ============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routes and socket handler
const pollRoutes = require('./routes/pollRoutes');
const setupSocketHandlers = require('./socket/socketHandler');

// ---- Initialize Express App ----
const app = express();

// ---- Create HTTP Server ----
// We need http.createServer because Socket.IO needs 
// to attach to the raw HTTP server, not just Express
const server = http.createServer(app);

// ---- Initialize Socket.IO ----
// Socket.IO enables real-time, bidirectional communication
// between the browser and server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// ---- Middleware ----
// cors() allows our React frontend (port 3000) to talk to backend (port 5000)
app.use(cors());
// express.json() parses incoming JSON request bodies
app.use(express.json());

// ---- Make io accessible in routes ----
// We attach io to every request so our REST routes 
// can also emit socket events if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ---- API Routes ----
app.use('/api/polls', pollRoutes);

// ---- Health Check Route ----
app.get('/', (req, res) => {
  res.json({ 
    message: '🗳️ Live Poll Arena API is running!',
    status: 'healthy' 
  });
});

// ---- Setup Socket.IO Event Handlers ----
setupSocketHandlers(io);

// ---- MongoDB Connection ----
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/live-poll-arena';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Fallback: Run without MongoDB (in-memory mode)
    console.log('⚠️  Starting in limited mode without database...');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (no database)`);
    });
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});