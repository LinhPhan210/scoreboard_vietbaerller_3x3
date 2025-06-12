// REST API functions for scoreboard backend integration

const API_BASE_URL = '/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// State management
export const getState = () => apiCall('/state');

// Timer controls
export const startTimer = () => apiCall('/timer/start', 'POST');
export const stopTimer = () => apiCall('/timer/stop', 'POST');
export const resetTimer = () => apiCall('/timer/reset', 'POST');
export const setTimer = (time) => apiCall('/timer/set', 'POST', { time });

// Score controls
export const incrementScoreA = () => apiCall('/scoreA/increment', 'POST');
export const decrementScoreA = () => apiCall('/scoreA/decrement', 'POST');
export const incrementScoreB = () => apiCall('/scoreB/increment', 'POST');
export const decrementScoreB = () => apiCall('/scoreB/decrement', 'POST');

// Foul controls
export const incrementFoulA = () => apiCall('/foulA/increment', 'POST');
export const decrementFoulA = () => apiCall('/foulA/decrement', 'POST');
export const incrementFoulB = () => apiCall('/foulB/increment', 'POST');
export const decrementFoulB = () => apiCall('/foulB/decrement', 'POST');

// Shot clock controls
export const startShotClock = () => apiCall('/shotclock/start', 'POST');
export const stopShotClock = () => apiCall('/shotclock/stop', 'POST');
export const resetShotClock = () => apiCall('/shotclock/reset', 'POST');
export const setShotClock = (time) => apiCall('/shotclock/set', 'POST', { time });

// Game controls
export const resetGame = () => apiCall('/game/reset', 'POST');

// Log
export const getLog = () => apiCall('/log');