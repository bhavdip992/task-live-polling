// ============================================
// CREATE POLL COMPONENT
// Form to create a new poll
// Uses React Hooks: useState for form state
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../services/api';

function CreatePoll() {
  // ---- State Management ----
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  const [expiresIn, setExpiresIn] = useState(0); // Minutes (0 = no expiry)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // useNavigate hook for programmatic navigation
  const navigate = useNavigate();

  // ---- Add a new option field ----
  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  // ---- Remove an option field ----
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  // ---- Update an option's text ----
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // ---- Handle form submission ----
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setError('');
    setLoading(true);

    try {
      // Validate
      const validOptions = options.filter(opt => opt.trim() !== '');
      if (!question.trim()) {
        throw new Error('Please enter a question');
      }
      if (validOptions.length < 2) {
        throw new Error('Please provide at least 2 options');
      }

      // Call API
      const response = await createPoll({
        question: question.trim(),
        options: validOptions,
        expiresIn: expiresIn > 0 ? expiresIn : null
      });

      // Navigate to the newly created poll
      // This is the KEY feature - redirect to /poll/:id
      if (response.success) {
        navigate(`/poll/${response.data.pollId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll">
      <div className="card">
        <h2 className="card-title">📝 Create a New Poll</h2>
        
        {error && (
          <div className="alert alert-error">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Question Input */}
          <div className="form-group">
            <label className="form-label">Your Question</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., What's your favorite programming language?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              required
            />
            <span className="char-count">{question.length}/500</span>
          </div>

          {/* Options */}
          <div className="form-group">
            <label className="form-label">
              Options ({options.length}/5)
            </label>
            {options.map((option, index) => (
              <div key={index} className="option-input-row">
                <span className="option-number">{index + 1}</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={200}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-remove"
                    onClick={() => removeOption(index)}
                    title="Remove option"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button
                type="button"
                className="btn btn-secondary btn-add-option"
                onClick={addOption}
              >
                + Add Option
              </button>
            )}
          </div>

          {/* Expiry (Bonus Feature) */}
          <div className="form-group">
            <label className="form-label">
              Auto-close after (optional)
            </label>
            <select
              className="form-select"
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
            >
              <option value={0}>Never (manual close)</option>
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-large btn-full"
            disabled={loading}
          >
            {loading ? '⏳ Creating...' : '🚀 Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePoll;