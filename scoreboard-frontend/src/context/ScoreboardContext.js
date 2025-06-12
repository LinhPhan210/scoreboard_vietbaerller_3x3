import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { ScoreboardWebSocket } from '../api/ws';

// Initial state for the scoreboard
const initialState = {
  timerTenths: 6000, // 10:00 (in tenths of seconds)
  scoreA: 0,
  scoreB: 0,
  foulA: 0,
  foulB: 0,
  isTimerRunning: false,
  shotClockTenths: 120, // 12.0 seconds (in tenths of seconds)
  isShotClockRunning: false,
  formattedTimer: "10:00",
  formattedShotclock: "12.0",
  connected: false,
  teamAName: "TEAM A",
  teamBName: "TEAM B"
};

// Actions for the reducer
const ACTION_TYPES = {
  STATE_SYNC: 'STATE_SYNC',
  SCORE_UPDATE: 'SCORE_UPDATE',
  TIMER_UPDATE: 'TIMER_UPDATE',
  FOUL_UPDATE: 'FOUL_UPDATE',
  SHOTCLOCK_UPDATE: 'SHOTCLOCK_UPDATE',
  CONNECTION_UPDATE: 'CONNECTION_UPDATE'
};

// Helper to format timer and shotclock
function formatTimer(tenths) {
  const totalSeconds = Math.floor(tenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
function formatShotclock(tenths) {
  return (tenths / 10).toFixed(1);
}

// Reducer function to handle state updates
function scoreboardReducer(state, action) {
  let nextState;
  switch (action.type) {
    case ACTION_TYPES.STATE_SYNC:
      nextState = { ...state, ...action.payload };
      break;
    case ACTION_TYPES.SCORE_UPDATE:
      nextState = { ...state, ...action.payload };
      break;
    case ACTION_TYPES.TIMER_UPDATE:
      nextState = { ...state, ...action.payload };
      break;
    case ACTION_TYPES.FOUL_UPDATE:
      nextState = { ...state, ...action.payload };
      break;
    case ACTION_TYPES.SHOTCLOCK_UPDATE:
      nextState = { ...state, ...action.payload };
      break;
    case ACTION_TYPES.CONNECTION_UPDATE:
      nextState = { ...state, connected: action.payload };
      break;
    default:
      nextState = state;
  }
  // Always update formattedTimer and formattedShotclock
  return {
    ...nextState,
    formattedTimer: formatTimer(nextState.timerTenths),
    formattedShotclock: formatShotclock(nextState.shotClockTenths)
  };
}

// Create the context
const ScoreboardContext = createContext();

// Provider component
function ScoreboardProvider({ children }) {
  const [state, dispatch] = useReducer(scoreboardReducer, initialState);
  const wsRef = React.useRef(null);
  const timerIntervalRef = React.useRef(null);
  const shotClockIntervalRef = React.useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/scoreboard')) {
      function handleMessage(message) {
        if (!message || !message.type) return;
        switch (message.type) {
          case 'state_sync':
            dispatch({ type: ACTION_TYPES.STATE_SYNC, payload: message.data });
            break;
          case 'score_update':
            dispatch({ type: ACTION_TYPES.SCORE_UPDATE, payload: message.data });
            break;
          case 'timer_update':
            dispatch({ type: ACTION_TYPES.TIMER_UPDATE, payload: message.data });
            break;
          case 'foul_update':
            dispatch({ type: ACTION_TYPES.FOUL_UPDATE, payload: message.data });
            break;
          case 'shotclock_update': {
            // Always sync timer and shotclock with backend values
            if (message.data && typeof message.data === 'object') {
              const syncPayload = {};
              if ('timerTenths' in message.data) syncPayload.timerTenths = message.data.timerTenths;
              if ('shotClockTenths' in message.data) syncPayload.shotClockTenths = message.data.shotClockTenths;
              if ('isShotClockRunning' in message.data) syncPayload.isShotClockRunning = message.data.isShotClockRunning;
              dispatch({ type: ACTION_TYPES.SHOTCLOCK_UPDATE, payload: { ...message.data, ...syncPayload } });
            } else {
              dispatch({ type: ACTION_TYPES.SHOTCLOCK_UPDATE, payload: message.data });
            }
            // Control timer/shotclock intervals based on isShotClockRunning
            if (message.data && typeof message.data.isShotClockRunning !== 'undefined') {
              if (!message.data.isShotClockRunning) {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
                if (shotClockIntervalRef.current) {
                  clearInterval(shotClockIntervalRef.current);
                  shotClockIntervalRef.current = null;
                }
              }
            }
            break;
          }
          case 'game_reset':
            dispatch({ type: ACTION_TYPES.STATE_SYNC, payload: message.data });
            break;
          default:
            break;
        }
      }
      function handleOpen() {
        dispatch({ type: ACTION_TYPES.CONNECTION_UPDATE, payload: true });
      }
      function handleClose() {
        dispatch({ type: ACTION_TYPES.CONNECTION_UPDATE, payload: false });
      }
      function handleError() {
        dispatch({ type: ACTION_TYPES.CONNECTION_UPDATE, payload: false });
      }
      wsRef.current = new ScoreboardWebSocket(handleMessage, handleOpen, handleClose, handleError);
      wsRef.current.connect();
      return () => {
        if (wsRef.current) wsRef.current.disconnect();
      };
    }
  }, []);

  // Timer and shotclock decrement logic (frontend-driven)
  // (DISABLED: now backend sends timerTenths and shotClockTenths updates directly)
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && window.location.pathname.startsWith('/scoreboard')) {
  //     // If shot clock is running, decrement both timer and shotclock every 100ms
  //     if (state.isShotClockRunning) {
  //       if (!timerIntervalRef.current) {
  //         timerIntervalRef.current = setInterval(() => {
  //           dispatch({ type: ACTION_TYPES.TIMER_UPDATE, payload: { timerTenths: Math.max(0, state.timerTenths - 1) } });
  //         }, 100);
  //       }
  //       if (!shotClockIntervalRef.current) {
  //         shotClockIntervalRef.current = setInterval(() => {
  //           dispatch({ type: ACTION_TYPES.SHOTCLOCK_UPDATE, payload: { shotClockTenths: Math.max(0, state.shotClockTenths - 1) } });
  //         }, 100);
  //       }
  //     } else {
  //       // If not running, stop both intervals
  //       if (timerIntervalRef.current) {
  //         clearInterval(timerIntervalRef.current);
  //         timerIntervalRef.current = null;
  //       }
  //       if (shotClockIntervalRef.current) {
  //         clearInterval(shotClockIntervalRef.current);
  //         shotClockIntervalRef.current = null;
  //       }
  //     }
  //     // Cleanup on unmount or page change
  //     return () => {
  //       if (timerIntervalRef.current) {
  //         clearInterval(timerIntervalRef.current);
  //         timerIntervalRef.current = null;
  //       }
  //       if (shotClockIntervalRef.current) {
  //         clearInterval(shotClockIntervalRef.current);
  //         shotClockIntervalRef.current = null;
  //       }
  //     };
  //   }
  // }, [state.isShotClockRunning, state.timerTenths, state.shotClockTenths]);

  const contextValue = {
    state,
    dispatch,
    wsConnected: state.connected
  };

  return (
    <ScoreboardContext.Provider value={contextValue}>
      {children}
    </ScoreboardContext.Provider>
  );
}

// Custom hook to use the context
function useScoreboard() {
  const context = useContext(ScoreboardContext);
  if (!context) {
    throw new Error('useScoreboard must be used within a ScoreboardProvider');
  }
  return context;
}

export { ScoreboardProvider, useScoreboard, ScoreboardContext };