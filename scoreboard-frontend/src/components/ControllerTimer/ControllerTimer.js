import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  resetTimer, setTimer,
  startShotClock, stopShotClock, resetShotClock, setShotClock
} from '../../api/rest';
import { useScoreboard } from '../../context/ScoreboardContext';
import styles from './ControllerTimer.module.css';

function ControllerTimer() {
  const [customTime, setCustomTime] = useState('');
  const [customShotClock, setCustomShotClock] = useState('');
  const [isLoading, setIsLoading] = useState({
    startTimer: false,
    stopTimer: false,
    resetTimer: false,
    setTimer: false,
    startShotClock: false,
    stopShotClock: false,
    resetShotClock: false,
    setShotClock: false
  });

  const handleApiCall = async (apiFunction, loadingKey) => {
    setIsLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      await apiFunction();
    } catch (error) {
      console.error(`Error in ${loadingKey}:`, error);
      alert(`Failed to ${loadingKey.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleSetTimer = async () => {
    if (!customTime.match(/^\d{1,2}:\d{2}$/)) {
      alert('Please enter a valid time in MM:SS format');
      return;
    }

    handleApiCall(() => setTimer(customTime), 'setTimer');
    setCustomTime('');
  };

  const handleSetShotClock = async () => {
    if (!customShotClock.match(/^\d{1,2}\.[0-9]$/)) {
      alert('Please enter a valid shot clock time in SS.X format (e.g. 12.0)');
      return;
    }
    setIsLoading(prev => ({ ...prev, setShotClock: true }));
    try {
      await setShotClock(customShotClock);
    } catch (error) {
      alert('Failed to set shot clock: ' + error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, setShotClock: false }));
      setCustomShotClock('');
    }
  };

  const handleTimeInputChange = (e) => {
    const value = e.target.value;
    // Only allow valid time input patterns
    if (value === '' || value.match(/^\d{0,2}(:\d{0,2})?$/)) {
      setCustomTime(value);
    }
  };

  return (
    <div className={styles.controllerContainer}>
      {/* Tab switcher moved to top right corner */}
      <div className={styles.tabSwitcher}>
        <Link to="/scoreboard">Scoreboard</Link>
        <Link to="/controller-score">Score Controls</Link>
        <Link to="/log">Log</Link>
      </div>
      <h1 className={styles.pageTitle}>Timer Controls</h1>

      {/* Removed timer and shotclock indicator display section */}

      <div className={styles.controlSection}>
        <div className={styles.timerControls}>
          <h2>Game Timer</h2>
          <div className={styles.buttonGrid}>
            {/* Removed Start Timer and Stop Timer buttons */}
            <button
              className={`${styles.controlButton} ${styles.resetButton}`}
              onClick={() => handleApiCall(resetTimer, 'resetTimer')}
              // Always enabled
            >
              Reset (10:00)
            </button>
          </div>

          <div className={styles.customTimeSection}>
            <input
              type="text"
              className={styles.timeInput}
              placeholder="MM:SS"
              value={customTime}
              onChange={handleTimeInputChange}
            />

            <button
              className={`${styles.controlButton} ${styles.setButton}`}
              onClick={handleSetTimer}
              // Always enabled
            >
              Set Custom Time
            </button>
          </div>
        </div>

        <div className={styles.shotClockControls}>
          <h2>Shot Clock</h2>
          <div className={styles.buttonGrid}>
            <button
              className={`${styles.controlButton} ${styles.startButton}`}
              onClick={() => handleApiCall(startShotClock, 'startShotClock')}
              disabled={isLoading.startShotClock}
            >
              {isLoading.startShotClock ? 'Starting...' : 'Start Shot Clock'}
            </button>

            <button
              className={`${styles.controlButton} ${styles.stopButton}`}
              onClick={() => handleApiCall(stopShotClock, 'stopShotClock')}
              disabled={isLoading.stopShotClock}
            >
              {isLoading.stopShotClock ? 'Stopping...' : 'Stop Shot Clock'}
            </button>

            <button
              className={`${styles.controlButton} ${styles.resetButton}`}
              onClick={() => handleApiCall(resetShotClock, 'resetShotClock')}
              // Always enabled
            >
              Reset (12.0)
            </button>
          </div>
          <div className={styles.customTimeSection}>
            <input
              type="text"
              className={styles.timeInput}
              placeholder="SS.X"
              value={customShotClock}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || value.match(/^\d{0,2}(\.[0-9]?)?$/)) {
                  setCustomShotClock(value);
                }
              }}
            />
            <button
              className={`${styles.controlButton} ${styles.setButton}`}
              onClick={handleSetShotClock}
              disabled={isLoading.setShotClock}
            >
              {isLoading.setShotClock ? 'Setting...' : 'Set Shot Clock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControllerTimer;