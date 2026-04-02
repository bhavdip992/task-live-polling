// ============================================
// HOME PAGE COMPONENT
// Landing page with a hero section
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="hero">
        <h1 className="hero-title">
          ⚡ Live Poll & Decision Arena
        </h1>
        <p className="hero-subtitle">
          Create polls, share with anyone, and watch votes come in real-time!
        </p>
        <div className="hero-features">
          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>Create</h3>
            <p>Set up a poll with 2-5 options in seconds</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔗</span>
            <h3>Share</h3>
            <p>Get a unique link to share with anyone</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Vote Live</h3>
            <p>Watch results update in real-time</p>
          </div>
        </div>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => navigate('/create')}
        >
          🚀 Create Your Poll Now
        </button>
      </div>
    </div>
  );
}

export default Home;