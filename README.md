# 🗳️ Live Poll Arena

## Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- npm or yarn

## Setup & Run

### 1. Clone & Install Backend
cd backend
npm install

### 2. Create backend .env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/live-poll-arena
CLIENT_URL=http://localhost:3000

### 3. Start Backend
npm run dev
# Runs on http://localhost:5000

### 4. Install Frontend (new terminal)
cd frontend
npm install

### 5. Create frontend .env
REACT_APP_API_URL=http://localhost:5000

### 6. Start Frontend
npm start
# Opens http://localhost:3000

## Test Real-time Feature
1. Create a poll at http://localhost:3000/create
2. Copy the generated URL (e.g., /poll/abc123)
3. Open same URL in two browser tabs
4. Vote in one tab → see live update in other tab ⚡
