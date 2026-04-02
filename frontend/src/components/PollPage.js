// ============================================
// POLL PAGE COMPONENT (The Main Complex One!)
// 
// This component:
// 1. Reads the poll ID from the URL (:id parameter)
// 2. Fetches poll data from the API
// 3. Joins a Socket.IO room for real-time updates
// 4. Handles voting
// 5. Displays live results
//
// KEY HOOKS USED:
// - useParams() → reads :id from URL
// - useState() → manages component state
// - useEffect() → side effects (API calls, socket events)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { fetchPoll, submitVote, checkVoteStatus, getVisitorId } from '../services/api';
import PollResults from './PollResults';
import ShareLink from './ShareLink';

function PollPage() {
  // ---- Get poll ID from URL ----
  // If URL is /poll/abc123, then id = "abc123"
  const { id: pollId } = useParams();

  // ---- Socket.IO connection from context ----
  const { socket, isConnected } = useSocket();

  // ---- Component State ----
  const [poll, setPoll] = useState(null);         // Poll data
  const [loading, setLoading] = useState(true);    // Loading state
  const [error, setError] = useState('');          // Error message
  const [hasVoted, setHasVoted] = useState(false); // Has current user voted?
  const [votedOption, setVotedOption] = useState(null); // Which option they voted for
  const [selectedOption, setSelectedOption] = useState(null); // Currently selected (before voting)
  const [voting, setVoting] = useState(false);     // Is vote being submitted?
  const [viewerCount, setViewerCount] = useState(0); // Live viewer count
  const [voteMessage, setVoteMessage] = useState(''); // Success/error messages

  // ---- Load poll data from API ----
  const loadPoll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch poll data
      const pollResponse = await fetchPoll(pollId);
      
      if (pollResponse.success) {
        setPoll(pollResponse.data);
      } else {
        setError('Poll not found');
      }

      // Check if user already voted
      const voteResponse = await checkVoteStatus(pollId);
      if (voteResponse.success && voteResponse.data.hasVoted) {
        setHasVoted(true);
        setVotedOption(voteResponse.data.votedOption);
      }

    } catch (err) {
      setError(err.message || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // ---- Effect: Load poll on mount ----
  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  // ---- Effect: Socket.IO room management ----
  useEffect(() => {
    if (!socket || !pollId) return;

    // Join the poll room when component mounts
    socket.emit('join_poll', pollId);

    // ---- Listen for real-time vote updates ----
    // This fires whenever ANY user votes on this poll
    const handleVoteUpdate = (updatedPoll) => {
      console.log('📊 Real-time vote update received:', updatedPoll);
      setPoll(prev => ({
        ...prev,
        options: updatedPoll.options,
        totalVotes: updatedPoll.totalVotes,
        isActive: updatedPoll.isActive
      }));
    };

    // ---- Listen for viewer count updates ----
    const handleViewerCount = ({ count }) => {
      setViewerCount(count);
    };

    // ---- Listen for poll closed event ----
    const handlePollClosed = () => {
      setPoll(prev => prev ? { ...prev, isActive: false } : prev);
    };

    // ---- Listen for vote errors (from socket voting) ----
    const handleVoteError = ({ message, alreadyVoted }) => {
      setVoteMessage(`❌ ${message}`);
      if (alreadyVoted) {
        setHasVoted(true);
      }
      setVoting(false);
    };

    // ---- Listen for vote success (from socket voting) ----
    const handleVoteSuccess = ({ optionIndex }) => {
      setHasVoted(true);
      setVotedOption(optionIndex);
      setVoteMessage('✅ Vote recorded successfully!');
      setVoting(false);
      // Store in localStorage for persistence
      localStorage.setItem(`voted_${pollId}`, optionIndex.toString());
    };

    // Register all event listeners
    socket.on('vote_updated', handleVoteUpdate);
    socket.on('viewer_count', handleViewerCount);
    socket.on('poll_closed', handlePollClosed);
    socket.on('vote_error', handleVoteError);
    socket.on('vote_success', handleVoteSuccess);

    // ---- Cleanup: Leave room and remove listeners when component unmounts ----
    return () => {
      socket.emit('leave_poll', pollId);
      socket.off('vote_updated', handleVoteUpdate);
      socket.off('viewer_count', handleViewerCount);
      socket.off('poll_closed', handlePollClosed);
      socket.off('vote_error', handleVoteError);
      socket.off('vote_success', handleVoteSuccess);
    };
  }, [socket, pollId]);

  // ---- Check localStorage for previous vote ----
  useEffect(() => {
    const savedVote = localStorage.getItem(`voted_${pollId}`);
    if (savedVote !== null) {
      setHasVoted(true);
      setVotedOption(parseInt(savedVote));
    }
  }, [pollId]);

  // ---- Handle Vote Submission ----
  const handleVote = async () => {
    if (selectedOption === null || hasVoted || voting) return;

    setVoting(true);
    setVoteMessage('');

    try {
      // Method 1: Vote via REST API (also emits via socket on server)
      const response = await submitVote(pollId, selectedOption);
      
      if (response.success) {
        setHasVoted(true);
        setVotedOption(selectedOption);
        setVoteMessage('✅ Vote recorded successfully!');
        // Update local poll data immediately
        setPoll(prev => ({
          ...prev,
          options: response.data.options,
          totalVotes: response.data.totalVotes
        }));
        // Persist in localStorage
        localStorage.setItem(`voted_${pollId}`, selectedOption.toString());
      }
    } catch (err) {
      if (err.message.includes('already voted')) {
        setHasVoted(true);
        setVoteMessage('⚠️ You have already voted in this poll');
        const savedVote = localStorage.getItem(`voted_${pollId}`);
        if (savedVote !== null) {
          setVotedOption(parseInt(savedVote));
        }
      } else {
        setVoteMessage(`❌ ${err.message}`);
      }
    } finally {
      setVoting(false);
    }
  };

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="poll-page">
        <div className="card loading-card">
          <div className="loading-spinner"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }

  // ---- Error State ----
  if (error || !poll) {
    return (
      <div className="poll-page">
        <div className="card error-card">
          <h2>😕 Poll Not Found</h2>
          <p>{error || 'This poll does not exist or has been removed.'}</p>
          <a href="/create" className="btn btn-primary">Create a New Poll</a>
        </div>
      </div>
    );
  }

  // ---- Calculate if poll is expired ----
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const isActive = poll.isActive && !isExpired;

  return (
    <div className="poll-page">
      {/* Poll Header */}
      <div className="card poll-card">
        <div className="poll-header">
          <h2 className="poll-question">{poll.question}</h2>
          <div className="poll-meta">
            <span className={`poll-status ${isActive ? 'active' : 'closed'}`}>
              {isActive ? '🟢 Active' : '🔴 Closed'}
            </span>
            <span className="viewer-count">
              👁️ {viewerCount} viewing
            </span>
            <span className="total-votes">
              🗳️ {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
            </span>
            {isConnected && (
              <span className="live-badge">⚡ LIVE</span>
            )}
          </div>
          {poll.expiresAt && (
            <div className="expiry-info">
              ⏰ {isExpired 
                ? 'Expired' 
                : `Expires: ${new Date(poll.expiresAt).toLocaleString()}`
              }
            </div>
          )}
        </div>

        {/* Voting Section OR Results */}
        {!hasVoted && isActive ? (
          // ---- VOTING VIEW ----
          <div className="voting-section">
            <p className="voting-instruction">Select an option and click Vote:</p>
            <div className="options-list">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-card ${selectedOption === index ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(index)}
                >
                  <div className="option-radio">
                    <div className={`radio-circle ${selectedOption === index ? 'checked' : ''}`} />
                  </div>
                  <span className="option-text">{option.text}</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-large btn-full"
              onClick={handleVote}
              disabled={selectedOption === null || voting}
            >
              {voting ? '⏳ Submitting...' : '🗳️ Cast Your Vote'}
            </button>
          </div>
        ) : (
          // ---- RESULTS VIEW ----
          <PollResults 
            poll={poll} 
            votedOption={votedOption} 
            isActive={isActive}
          />
        )}

        {/* Vote Message */}
        {voteMessage && (
          <div className={`alert ${voteMessage.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {voteMessage}
          </div>
        )}
      </div>

      {/* Share Link Section */}
      <ShareLink pollId={pollId} />
    </div>
  );
}

export default PollPage;