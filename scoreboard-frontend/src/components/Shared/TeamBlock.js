import React from 'react';
import styles from './TeamBlock.module.css';

function TeamBlock({ name, score, foul, isController = false, onScoreIncrement, onScoreDecrement, onFoulIncrement, onFoulDecrement }) {
  return (
    <div className={styles.teamBlock}>
      <div className={styles.teamName}>{name}</div>

      {isController ? (
        <div className={styles.scoreControl}>
          <button onClick={onScoreDecrement} className={styles.controlButton}>-</button>
          <div className={styles.score}>{score}</div>
          <button onClick={onScoreIncrement} className={styles.controlButton}>+</button>
        </div>
      ) : (
        <div className={styles.score}>{score}</div>
      )}

      <div className={styles.foulContainer}>
        <div className={styles.foulLabel}>FOULS</div>
        {isController ? (
          <div className={styles.foulControl}>
            <button onClick={onFoulDecrement} className={styles.controlButton}>-</button>
            <div className={styles.foul}>{foul}</div>
            <button onClick={onFoulIncrement} className={styles.controlButton}>+</button>
          </div>
        ) : (
          <div className={styles.foul}>{foul}</div>
        )}
      </div>
    </div>
  );
}

export default TeamBlock;