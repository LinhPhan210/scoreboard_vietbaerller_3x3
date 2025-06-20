import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScoreboard } from '../../context/ScoreboardContext';
import styles from './Scoreboard.module.css';

function Scoreboard() {
  const { state } = useScoreboard();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if fullscreen is supported
  const isFullscreenSupported = document.fullscreenEnabled || 
    document.webkitFullscreenEnabled || 
    document.mozFullScreenEnabled || 
    document.msFullscreenEnabled;

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen function
  const toggleFullscreen = async () => {
    if (!isFullscreenSupported) {
      alert('Fullscreen not supported on this browser');
      return;
    }

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  // Helper for conditional classes
  let foulClassA = '';
  let foulClassB = '';
  if (state.foulA >= 10) foulClassA = styles.foulDanger;
  else if (state.foulA >= 7) foulClassA = styles.foulWarning;
  if (state.foulB >= 10) foulClassB = styles.foulDanger;
  else if (state.foulB >= 7) foulClassB = styles.foulWarning;

  return (
    <div className={styles.scoreboardContainer}>
      {/* Fullscreen Button */}
      {isFullscreenSupported && (
        <button 
          className={styles.fullscreenButton}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            // Exit fullscreen icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          ) : (
            // Enter fullscreen icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          )}
        </button>
      )}

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