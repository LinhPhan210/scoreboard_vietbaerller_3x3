import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScoreboard } from '../../context/ScoreboardContext';
import { 
  incrementScoreA, decrementScoreA,
  incrementScoreB, decrementScoreB,
  incrementFoulA, decrementFoulA,
  incrementFoulB, decrementFoulB,
  resetGame,
  getState
} from '../../api/rest';
import styles from './ControllerScore.module.css';

function ControllerScore() {
  const { state } = useScoreboard();
  // Define initial state for score and foul
  const initialScoreFoulState = {
    scoreA: 0,
    scoreB: 0,
    foulA: 0,
    foulB: 0
  };
  // Local UI state for instant feedback
  const [localState, setLocalState] = useState({
    ...initialScoreFoulState,
    teamAName: state.teamAName,
    teamBName: state.teamBName,
    connected: state.connected
  });
  const [isLoading, setIsLoading] = useState({
    scoreA: false,
    scoreB: false,
    foulA: false,
    foulB: false,
    resetGame: false
  });

  // On mount, fetch state from backend and set local state for score/foul
  useEffect(() => {
    getState().then(data => {
      setLocalState(prev => ({
        ...prev,
        scoreA: data.scoreA,
        scoreB: data.scoreB,
        foulA: data.foulA,
        foulB: data.foulB
      }));
    }).catch(err => {
      // Optionally handle error
      console.error('Failed to fetch initial state:', err);
    });
    // eslint-disable-next-line
  }, []);

  // Sync local state with context when context changes (e.g. after reset or reconnect)
  useEffect(() => {
    setLocalState(prev => ({
      ...prev,
      scoreA: state.scoreA,
      scoreB: state.scoreB,
      foulA: state.foulA,
      foulB: state.foulB,
      teamAName: state.teamAName,
      teamBName: state.teamBName,
      connected: state.connected
    }));
  }, [state.scoreA, state.scoreB, state.foulA, state.foulB, state.teamAName, state.teamBName, state.connected]);

  // Helper to update local state after REST call
  const updateLocalState = (data) => {
    setLocalState(prev => ({ ...prev, ...data }));
  };

  const handleApiCall = async (apiFunction, loadingKey) => {
    setIsLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const data = await apiFunction();
      // If resetGame, reset to initial state
      if (loadingKey === 'resetGame') {
        setLocalState(prev => ({
          ...prev,
          ...initialScoreFoulState
        }));
      } else if (data && typeof data === 'object') {
        updateLocalState(data);
      }
    } catch (error) {
      console.error(`Error in ${loadingKey}:`, error);
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Conditional classes
  let foulClassA = '';
  let foulClassB = '';
  if (localState.foulA >= 10) foulClassA = styles.foulDanger;
  else if (localState.foulA >= 7) foulClassA = styles.foulWarning;
  if (localState.foulB >= 10) foulClassB = styles.foulDanger;
  else if (localState.foulB >= 7) foulClassB = styles.foulWarning;

  return (
    <div className={styles.controllerContainer}>
      {/* Tab switcher in top right */}
      <div className={styles.tabSwitcher}>
        <Link to="/scoreboard">Scoreboard</Link>
        <Link to="/controller-timer">Timer Controls</Link>
        <Link to="/log">Log</Link>
      </div>
      <h1 className={styles.pageTitle}>Score & Foul Controls</h1>

      <div className={styles.teamsSection}>
        <div className={styles.teamCard}>
          <h2 className={styles.teamName}>{localState.teamAName}</h2>

          <div className={styles.scoreSection}>
            <h3 className={styles.sectionTitle}>Score</h3>
            <div className={styles.scoreDisplay}>{localState.scoreA}</div>
            <div className={styles.scoreControls}>
              <button 
                className={`${styles.controlButton} ${styles.decrementButton}`}
                onClick={() => handleApiCall(decrementScoreA, 'scoreA')}
                disabled={isLoading.scoreA || localState.scoreA <= 0}
              >
                -1
              </button>
              <button 
                className={`${styles.controlButton} ${styles.incrementButton}`}
                onClick={() => handleApiCall(incrementScoreA, 'scoreA')}
                disabled={isLoading.scoreA}
              >
                +1
              </button>
            </div>
          </div>

          <div className={styles.foulSection}>
            <h3 className={styles.sectionTitle}>Fouls</h3>
            <div className={`${styles.foulDisplay} ${foulClassA}`}>{localState.foulA}</div>
            <div className={styles.foulControls}>
              <button 
                className={`${styles.controlButton} ${styles.decrementButton}`}
                onClick={() => handleApiCall(decrementFoulA, 'foulA')}
                disabled={isLoading.foulA || localState.foulA <= 0}
              >
                -1
              </button>
              <button 
                className={`${styles.controlButton} ${styles.incrementButton}`}
                onClick={() => handleApiCall(incrementFoulA, 'foulA')}
                disabled={isLoading.foulA}
              >
                +1
              </button>
            </div>
          </div>
        </div>

        <div className={styles.teamCard}>
          <h2 className={styles.teamName}>{localState.teamBName}</h2>

          <div className={styles.scoreSection}>
            <h3 className={styles.sectionTitle}>Score</h3>
            <div className={styles.scoreDisplay}>{localState.scoreB}</div>
            <div className={styles.scoreControls}>
              <button 
                className={`${styles.controlButton} ${styles.decrementButton}`}
                onClick={() => handleApiCall(decrementScoreB, 'scoreB')}
                disabled={isLoading.scoreB || localState.scoreB <= 0}
              >
                -1
              </button>
              <button 
                className={`${styles.controlButton} ${styles.incrementButton}`}
                onClick={() => handleApiCall(incrementScoreB, 'scoreB')}
                disabled={isLoading.scoreB}
              >
                +1
              </button>
            </div>
          </div>

          <div className={styles.foulSection}>
            <h3 className={styles.sectionTitle}>Fouls</h3>
            <div className={`${styles.foulDisplay} ${foulClassB}`}>{localState.foulB}</div>
            <div className={styles.foulControls}>
              <button 
                className={`${styles.controlButton} ${styles.decrementButton}`}
                onClick={() => handleApiCall(decrementFoulB, 'foulB')}
                disabled={isLoading.foulB || localState.foulB <= 0}
              >
                -1
              </button>
              <button 
                className={`${styles.controlButton} ${styles.incrementButton}`}
                onClick={() => handleApiCall(incrementFoulB, 'foulB')}
                disabled={isLoading.foulB}
              >
                +1
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.gameControlSection}>
        <button 
          className={`${styles.controlButton} ${styles.resetButton}`}
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all scores and fouls?')) {
              handleApiCall(resetGame, 'resetGame');
            }
          }}
          disabled={isLoading.resetGame}
        >
          {isLoading.resetGame ? 'Resetting...' : 'Reset All'}
        </button>
      </div>

      <div className={styles.connectionStatus}>
        {localState.connected ? (
          <span className={styles.connected}>Connected to Server</span>
        ) : (
          <span className={styles.disconnected}>Disconnected</span>
        )}
      </div>
    </div>
  );
}

export default ControllerScore;