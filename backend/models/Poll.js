// ============================================
// POLL MODEL (MongoDB Schema)
// Defines the structure of a Poll document
// Think of it like a "template" for poll data
// ============================================

const mongoose = require('mongoose');

// Define the schema (structure) for each option in a poll
const optionSchema = new mongoose.Schema({
  // The text of the option (e.g., "JavaScript", "Python")
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true
  },
  // How many votes this option has received
  votes: {
    type: Number,
    default: 0
  }
});

// Define the main Poll schema
const pollSchema = new mongoose.Schema({
  // Unique short ID for the poll URL (e.g., "abc123")
  // This is NOT the MongoDB _id, it's our custom URL-friendly ID
  pollId: {
    type: String,
    required: true,
    unique: true,
    index: true  // Index for faster lookups
  },

  // The poll question (e.g., "What's your favorite language?")
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },

  // Array of options (2-5 options allowed)
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        return options.length >= 2 && options.length <= 5;
      },
      message: 'Poll must have between 2 and 5 options'
    }
  },

  // Array of voter identifiers (to prevent duplicate votes)
  // We'll store a simple identifier per voter
  voters: [{
    odentifier: String,  // Could be a session ID or generated token
    optionIndex: Number,  // Which option they voted for
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Total number of unique voters
  totalVotes: {
    type: Number,
    default: 0
  },

  // Is the poll still accepting votes?
  isActive: {
    type: Boolean,
    default: true
  },

  // Optional: Auto-close after this date (Bonus feature)
  expiresAt: {
    type: Date,
    default: null
  },

  // Who created the poll (simple identifier)
  createdBy: {
    type: String,
    default: 'anonymous'
  }
}, {
  // Automatically add createdAt and updatedAt fields
  timestamps: true
});

// ---- Pre-save middleware ----
// Before saving, recalculate totalVotes
pollSchema.pre('save', function(next) {
  this.totalVotes = this.voters.length;
  next();
});

// ---- Instance method to check if poll has expired ----
pollSchema.methods.hasExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// ---- Instance method to check if user already voted ----
pollSchema.methods.hasVoted = function(identifier) {
  return this.voters.some(v => v.odentifier === identifier);
};

// Create and export the model
// mongoose.model('Poll', pollSchema) creates a "polls" collection in MongoDB
const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;