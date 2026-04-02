// ============================================
// POLL RESULTS COMPONENT
// Displays vote counts with animated bars
// Highlights the leading option
// ============================================

import React from 'react';

function PollResults({ poll, votedOption, isActive }) {
  // Calculate the maximum votes (for scaling the bars)
  const maxVotes = Math.max(...poll.options.map(opt => opt.votes), 1);
  
  // Find the leading option(s)
  const leadingVotes = Math.max(...poll.options.map(opt => opt.votes));

  // Color palette for option bars
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

  return (
    <div className="results-section">
      <h3 className="results-title">
        {isActive ? '📊 Live Results' : '📊 Final Results'}
      </h3>

      <div className="results-list">
        {poll.options.map((option, index) => {
          // Calculate percentage
          const percentage = poll.totalVotes > 0 
            ? Math.round((option.votes / poll.totalVotes) * 100) 
            : 0;
          
          // Is this the leading option?
          const isLeading = option.votes === leadingVotes && option.votes > 0;
          
          // Is this the option the current user voted for?
          const isMyVote = votedOption === index;

          return (
            <div 
              key={index} 
              className={`result-bar-container ${isLeading ? 'leading' : ''} ${isMyVote ? 'my-vote' : ''}`}
            >
              <div className="result-header">
                <span className="result-option-text">
                  {option.text}
                  {isLeading && option.votes > 0 && <span className="leading-badge">👑 Leading</span>}
                  {isMyVote && <span className="my-vote-badge">✓ Your vote</span>}
                </span>
                <span className="result-count">
                  {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage}%)
                </span>
              </div>
              <div className="result-bar-track">
                <div 
                  className="result-bar-fill"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: colors[index % colors.length],
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="results-footer">
        <span className="total-votes-summary">
          Total: {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

export default PollResults;