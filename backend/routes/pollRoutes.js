// ============================================
// POLL API ROUTES
// RESTful API endpoints for poll CRUD operations
// ============================================

const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Poll = require('../models/Poll');

// ================================================
// POST /api/polls/create
// Creates a new poll and returns the unique poll ID
// ================================================
router.post('/create', async (req, res) => {
  try {
    const { question, options, expiresIn, createdBy } = req.body;

    // ---- Validation ----
    if (!question || !question.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question is required' 
      });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least 2 options are required' 
      });
    }

    if (options.length > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 5 options allowed' 
      });
    }

    // Filter out empty options
    const validOptions = options
      .map(opt => (typeof opt === 'string' ? opt.trim() : opt?.text?.trim()))
      .filter(opt => opt && opt.length > 0);

    if (validOptions.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least 2 non-empty options are required' 
      });
    }

    // ---- Generate unique poll ID ----
    // nanoid generates a URL-friendly unique ID
    // Length 8 gives us ~2.8 trillion possible IDs
    const pollId = nanoid(8);

    // ---- Calculate expiration (Bonus feature) ----
    let expiresAt = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 1000); // expiresIn is in minutes
    }

    // ---- Create poll document ----
    const poll = new Poll({
      pollId,
      question: question.trim(),
      options: validOptions.map(text => ({ text, votes: 0 })),
      expiresAt,
      createdBy: createdBy || 'anonymous',
      voters: [],
      totalVotes: 0,
      isActive: true
    });

    // ---- Save to MongoDB ----
    await poll.save();

    console.log(`✅ Poll created: ${pollId} - "${question.trim()}"`);

    // ---- Return response ----
    res.status(201).json({
      success: true,
      message: 'Poll created successfully!',
      data: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        isActive: poll.isActive,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt,
        // The full URL the frontend should redirect to
        pollUrl: `/poll/${poll.pollId}`
      }
    });

  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating poll',
      error: error.message 
    });
  }
});

// ================================================
// GET /api/polls/:pollId
// Fetches a specific poll by its unique ID
// ================================================
router.get('/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;

    // Find poll by our custom pollId (not MongoDB _id)
    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found' 
      });
    }

    // Check if poll has expired (Bonus feature)
    if (poll.expiresAt && poll.hasExpired() && poll.isActive) {
      poll.isActive = false;
      await poll.save();
    }

    res.json({
      success: true,
      data: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        isActive: poll.isActive,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching poll' 
    });
  }
});

// ================================================
// POST /api/polls/:pollId/vote
// Submit a vote for a specific option
// ================================================
router.post('/:pollId/vote', async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex, visitorId } = req.body;

    // ---- Find the poll ----
    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found' 
      });
    }

    // ---- Check if poll is active ----
    if (!poll.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'This poll is no longer accepting votes' 
      });
    }

    // ---- Check expiration ----
    if (poll.hasExpired()) {
      poll.isActive = false;
      await poll.save();
      return res.status(400).json({ 
        success: false, 
        message: 'This poll has expired' 
      });
    }

    // ---- Validate option index ----
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid option selected' 
      });
    }

    // ---- Check for duplicate vote ----
    const identifier = visitorId || req.ip || 'unknown';
    
    if (poll.hasVoted(identifier)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already voted in this poll',
        alreadyVoted: true
      });
    }

    // ---- Record the vote ----
    poll.options[optionIndex].votes += 1;
    poll.voters.push({
      odentifier: identifier,
      optionIndex: optionIndex,
      votedAt: new Date()
    });
    poll.totalVotes = poll.voters.length;

    await poll.save();

    console.log(`🗳️  Vote recorded on poll ${pollId}: Option ${optionIndex} (${poll.options[optionIndex].text})`);

    // ---- Prepare updated data ----
    const updatedPollData = {
      pollId: poll.pollId,
      question: poll.question,
      options: poll.options,
      totalVotes: poll.totalVotes,
      isActive: poll.isActive
    };

    // ---- Emit real-time update via Socket.IO ----
    // This sends the updated poll data to ALL connected clients
    // watching this specific poll
    req.io.to(`poll_${pollId}`).emit('vote_updated', updatedPollData);

    res.json({
      success: true,
      message: 'Vote recorded successfully!',
      data: updatedPollData
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while recording vote' 
    });
  }
});

// ================================================
// GET /api/polls/:pollId/check-vote/:visitorId
// Check if a specific visitor has already voted
// ================================================
router.get('/:pollId/check-vote/:visitorId', async (req, res) => {
  try {
    const { pollId, visitorId } = req.params;

    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found' 
      });
    }

    const hasVoted = poll.hasVoted(visitorId);
    const votedOption = hasVoted 
      ? poll.voters.find(v => v.odentifier === visitorId)?.optionIndex 
      : null;

    res.json({
      success: true,
      data: { hasVoted, votedOption }
    });

  } catch (error) {
    console.error('Error checking vote:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ================================================
// PATCH /api/polls/:pollId/close
// Manually close a poll (stop accepting votes)
// ================================================
router.patch('/:pollId/close', async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findOneAndUpdate(
      { pollId },
      { isActive: false },
      { new: true }
    );

    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found' 
      });
    }

    // Notify all connected clients that poll is closed
    req.io.to(`poll_${pollId}`).emit('poll_closed', { pollId });

    res.json({
      success: true,
      message: 'Poll closed successfully',
      data: { pollId, isActive: false }
    });

  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;