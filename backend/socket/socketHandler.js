// ============================================
// SOCKET.IO EVENT HANDLERS
// Manages real-time WebSocket connections
// 
// HOW SOCKET.IO WORKS:
// 1. Client connects to the Socket.IO server
// 2. Client "joins" a room (specific poll)
// 3. When someone votes, server broadcasts to all in that room
// 4. All clients in the room see the update instantly
// ============================================

const Poll = require('../models/Poll');

function setupSocketHandlers(io) {
  
  // ---- Connection Event ----
  // Fires every time a new client connects via WebSocket
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // ---- Join Poll Room ----
    // When a user opens a poll page, they "join" that poll's room
    // This way, updates are only sent to users viewing THAT specific poll
    socket.on('join_poll', (pollId) => {
      // Join the Socket.IO room for this poll
      socket.join(`poll_${pollId}`);
      console.log(`👤 Client ${socket.id} joined poll room: poll_${pollId}`);

      // Count how many users are viewing this poll
      const room = io.sockets.adapter.rooms.get(`poll_${pollId}`);
      const viewerCount = room ? room.size : 0;

      // Broadcast updated viewer count to everyone in the room
      io.to(`poll_${pollId}`).emit('viewer_count', { 
        pollId, 
        count: viewerCount 
      });
    });

    // ---- Leave Poll Room ----
    // When user navigates away from the poll
    socket.on('leave_poll', (pollId) => {
      socket.leave(`poll_${pollId}`);
      console.log(`👋 Client ${socket.id} left poll room: poll_${pollId}`);

      // Update viewer count
      const room = io.sockets.adapter.rooms.get(`poll_${pollId}`);
      const viewerCount = room ? room.size : 0;
      io.to(`poll_${pollId}`).emit('viewer_count', { 
        pollId, 
        count: viewerCount 
      });
    });

    // ---- Real-time Vote (Alternative to REST API) ----
    // This allows voting entirely through WebSocket
    // (We also support voting through REST API in routes)
    socket.on('submit_vote', async ({ pollId, optionIndex, visitorId }) => {
      try {
        const poll = await Poll.findOne({ pollId });

        if (!poll) {
          socket.emit('vote_error', { message: 'Poll not found' });
          return;
        }

        if (!poll.isActive) {
          socket.emit('vote_error', { message: 'Poll is closed' });
          return;
        }

        if (poll.hasExpired()) {
          poll.isActive = false;
          await poll.save();
          socket.emit('vote_error', { message: 'Poll has expired' });
          return;
        }

        if (poll.hasVoted(visitorId)) {
          socket.emit('vote_error', { 
            message: 'Already voted', 
            alreadyVoted: true 
          });
          return;
        }

        // Record the vote
        poll.options[optionIndex].votes += 1;
        poll.voters.push({
          odentifier: visitorId,
          optionIndex,
          votedAt: new Date()
        });
        poll.totalVotes = poll.voters.length;

        await poll.save();

        const updatedData = {
          pollId: poll.pollId,
          question: poll.question,
          options: poll.options,
          totalVotes: poll.totalVotes,
          isActive: poll.isActive
        };

        // Broadcast to ALL clients in this poll room (including sender)
        io.to(`poll_${pollId}`).emit('vote_updated', updatedData);

        // Send success confirmation to the voter
        socket.emit('vote_success', { 
          message: 'Vote recorded!',
          optionIndex 
        });

        console.log(`🗳️  Socket vote on ${pollId}: Option ${optionIndex}`);

      } catch (error) {
        console.error('Socket vote error:', error);
        socket.emit('vote_error', { message: 'Server error' });
      }
    });

    // ---- Request Poll Refresh ----
    // Client can request fresh poll data at any time
    socket.on('refresh_poll', async (pollId) => {
      try {
        const poll = await Poll.findOne({ pollId });
        if (poll) {
          socket.emit('poll_data', {
            pollId: poll.pollId,
            question: poll.question,
            options: poll.options,
            totalVotes: poll.totalVotes,
            isActive: poll.isActive,
            expiresAt: poll.expiresAt
          });
        }
      } catch (error) {
        console.error('Refresh poll error:', error);
      }
    });

    // ---- Disconnect Event ----
    // Fires when a client disconnects (closes browser, etc.)
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocketHandlers;