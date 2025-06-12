import React from 'react';
import { Link } from 'react-router-dom';
import { useScoreboard } from '../../context/ScoreboardContext';
import styles from './Scoreboard.module.css';

function Scoreboard() {
  const { state } = useScoreboard();

  // Helper for conditional classes
  let foulClassA = '';
  let foulClassB = '';
  if (state.foulA >= 10) foulClassA = styles.foulDanger;
  else if (state.foulA >= 7) foulClassA = styles.foulWarning;
  if (state.foulB >= 10) foulClassB = styles.foulDanger;
  else if (state.foulB >= 7) foulClassB = styles.foulWarning;

  return (
    <div className={styles.scoreboardContainer}>
      {/* Tab switcher in top right */}
      <div className={styles.tabSwitcher}>
        <Link to="/controller-timer">Timer Controls</Link>
        <Link to="/controller-score">Score Controls</Link>
        <Link to="/log">Log</Link>
      </div>
      {/* Header with team names and timer */}
      <div className={styles.header}>
        <div className={styles.teamSection}>
          <div className={styles.teamName}>{state.teamAName}</div>
        </div>
        <div className={styles.timerSection}>
          <div className={styles.timer}>{state.formattedTimer}</div>
        </div>
        <div className={styles.teamSection}>
          <div className={styles.teamName}>{state.teamBName}</div>
        </div>
      </div>

      {/* Middle section with scores and shot clock */}
      <div className={styles.middleSection}>
        <div className={styles.scoreSection}>
          <div className={styles.score}>{state.scoreA}</div>
        </div>
        <div className={styles.shotclockSection}>
          <div className={
            `${styles.shotclock} ${parseFloat(state.formattedShotclock) === 0 ? styles.shotclockZero : ''}`
          }>
            {state.formattedShotclock}
          </div>
        </div>
        <div className={styles.scoreSection}>
          <div className={styles.score}>{state.scoreB}</div>
        </div>
      </div>

      {/* Footer section with fouls */}
      <div className={styles.footer}>
        <div className={styles.foulSection}>
          <div className={styles.foulLabel}>FOULS</div>
          <div className={`${styles.foulValue} ${foulClassA}`}>{state.foulA}</div>
        </div>
        <div className={styles.foulSection}>
          <div className={styles.foulLabel}>FOULS</div>
          <div className={`${styles.foulValue} ${foulClassB}`}>{state.foulB}</div>
        </div>
      </div>

      {/* Connection status indicator */}
      <div className={styles.connectionStatus}>
        <div className={state.connected ? styles.connected : styles.disconnected}>
          {state.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;