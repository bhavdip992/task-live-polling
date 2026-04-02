// ============================================
// SHARE LINK COMPONENT
// Shows the shareable poll URL with copy functionality
// ============================================

import React, { useState } from 'react';

function ShareLink({ pollId }) {
  const [copied, setCopied] = useState(false);

  // Construct the full poll URL
  const pollUrl = `${window.location.origin}/poll/${pollId}`;

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pollUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card share-card">
      <h3 className="share-title">🔗 Share This Poll</h3>
      <p className="share-description">
        Share this link with others so they can vote:
      </p>
      <div className="share-link-container">
        <input 
          type="text" 
          className="share-link-input" 
          value={pollUrl} 
          readOnly 
          onClick={(e) => e.target.select()}
        />
        <button 
          className={`btn btn-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>
    </div>
  );
}

export default ShareLink;