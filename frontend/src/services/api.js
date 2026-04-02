// ============================================
// API SERVICE
// Centralized HTTP requests to the backend
// Keeps API logic separate from UI components
// ============================================

const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api/polls`
  : 'http://localhost:5000/api/polls';

// ---- Helper: Get or create a unique visitor ID ----
// This is used to prevent duplicate votes from the same browser
export function getVisitorId() {
  let visitorId = localStorage.getItem('poll_visitor_id');
  if (!visitorId) {
    // Generate a simple unique ID
    visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('poll_visitor_id', visitorId);
  }
  return visitorId;
}

// ---- Create a new poll ----
export async function createPoll(pollData) {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...pollData,
      createdBy: getVisitorId()
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create poll');
  }
  
  return data;
}

// ---- Fetch a poll by its unique ID ----
export async function fetchPoll(pollId) {
  const response = await fetch(`${API_BASE}/${pollId}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch poll');
  }
  
  return data;
}

// ---- Submit a vote ----
export async function submitVote(pollId, optionIndex) {
  const response = await fetch(`${API_BASE}/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      optionIndex,
      visitorId: getVisitorId()
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit vote');
  }
  
  return data;
}

// ---- Check if current user has voted ----
export async function checkVoteStatus(pollId) {
  const visitorId = getVisitorId();
  const response = await fetch(`${API_BASE}/${pollId}/check-vote/${visitorId}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to check vote status');
  }
  
  return data;
}

// ---- Close a poll ----
export async function closePoll(pollId) {
  const response = await fetch(`${API_BASE}/${pollId}/close`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to close poll');
  }
  
  return data;
}