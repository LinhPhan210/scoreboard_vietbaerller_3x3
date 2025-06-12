import React, { useEffect, useState } from 'react';
import styles from './Log.module.css';
import { Link } from 'react-router-dom';

function parseLogLine(line) {
  // Example: "10:00 | ScoreA changed to 1"
  const match = line.match(/^(\d{2}:\d{2}) \| (ScoreA|ScoreB|FoulA|FoulB) changed to (\d+)/);
  if (!match) return { time: '', type: '', value: '', raw: line };
  return { time: match[1], type: match[2], value: parseInt(match[3], 10), raw: line };
}

function getLogClass(type, value, prevValue) {
  if (type.startsWith('Foul')) {
    if (value >= 10) return styles.foulDanger;
    if (value >= 7) return styles.foulWarning;
  }
  if (type.startsWith('Score')) {
    if (prevValue !== undefined && value > prevValue) return styles.scoreUp;
    if (prevValue !== undefined && value < prevValue) return styles.scoreDown;
  }
  return '';
}

function Log() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    // Use relative path for API endpoint to work with reverse proxy
    fetch('/api/log')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch log');
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          // Support both {log: [...]} and plain array
          const lines = Array.isArray(json) ? json : json.log || [];
          setLogs(lines);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Track previous values for up/down highlight
  let prev = { ScoreA: undefined, ScoreB: undefined, FoulA: undefined, FoulB: undefined };

  return (
    <div className={styles.logContainer}>
      <div className={styles.tabSwitcher}>
        <Link to="/scoreboard">Scoreboard</Link>
        <Link to="/controller-timer">Timer Controls</Link>
        <Link to="/controller-score">Score Controls</Link>
      </div>
      <h1 className={styles.pageTitle}>Backend Log</h1>
      {loading && <div>Loading log...</div>}
      {error && <div className={styles.error}>Error: {error}</div>}
      <ul className={styles.logList}>
        {logs.map((line, idx) => {
          const { time, type, value, raw } = parseLogLine(line);
          let className = '';
          if (type && value !== '') {
            className = getLogClass(type, value, prev[type]);
            prev[type] = value;
          }
          return (
            <li key={idx} className={className}>
              {time && type ? (
                <>
                  <span className={styles.logTime}>{time}</span>
                  <span className={styles.logType}>{type}</span>
                  <span className={styles.logAction}>changed to</span>
                  <span className={styles.logValue}>{value}</span>
                </>
              ) : (
                <span>{raw}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Log;
