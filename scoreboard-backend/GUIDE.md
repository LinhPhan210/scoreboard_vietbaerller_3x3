# Scoreboard Backend Integration Guide for Frontend Engineers

This guide explains how to integrate your frontend application with the scoreboard backend for real-time game control and display.

---

## 1. API Overview

- **REST API**: For all control actions (start/stop/reset timer, update scores/fouls, etc.)
- **WebSocket API**: For real-time state updates (timer, scores, fouls, shot clock)

---

## 2. REST API Usage

### Base URL
```
http://localhost:8080/api
```

### Key Endpoints

| Endpoint                  | Method | Description                                 | Body Example                |
|---------------------------|--------|---------------------------------------------|-----------------------------|
| /state                    | GET    | Get current scoreboard state                |                             |
| /timer/reset              | POST   | Reset timer to 10:00 (timer only runs when shot clock is running) |                             |
| /timer/set                | POST   | Set timer to mm:ss (timer only runs when shot clock is running)   | `{ "time": "09:30" }`      |
| /scoreA/increment         | POST   | Increment Team A score                      |                             |
| /scoreA/decrement         | POST   | Decrement Team A score                      |                             |
| /scoreB/increment         | POST   | Increment Team B score                      |                             |
| /scoreB/decrement         | POST   | Decrement Team B score                      |                             |
| /foulA/increment          | POST   | Increment Team A fouls                      |                             |
| /foulA/decrement          | POST   | Decrement Team A fouls                      |                             |
| /foulB/increment          | POST   | Increment Team B fouls                      |                             |
| /foulB/decrement          | POST   | Decrement Team B fouls                      |                             |
| /shotclock/start          | POST   | Start the 12s shot clock                    |                             |
| /shotclock/stop           | POST   | Stop the shot clock                         |                             |
| /shotclock/reset          | POST   | Reset the shot clock to 12.0                |                             |
| /shotclock/set           | POST   | Set the shot clock to ss.x (e.g. 12.3)      | `{ "time": "12.3" }`      |
| /game/reset               | POST   | Reset all state to default                  |                             |
| /log                      | GET    | Get log of score/foul changes (with timer)  |                             |

#### Example: Set Timer
```js
await fetch('/api/timer/set', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ time: '09:30' })
});
```

#### Example: Increment Team A Score
```js
await fetch('/api/scoreA/increment', { method: 'POST' });
```

#### Example: Get Log
```js
const log = await fetch('/api/log').then(r => r.json());
```

---

## 3. WebSocket API Usage

### Connect
- URL: `ws://localhost:8080/ws/state`
- Use native WebSocket or a library (e.g., in React: `new WebSocket(...)`)

### On Connect
- You receive a `state_sync` message with the full state.

### On Update
- You receive messages for timer, score, foul, and shot clock changes.

## WebSocket Message Types

The backend sends the following WebSocket messages to all connected clients:

- **state_sync**: Sent on initial connection and when a state sync is triggered. Contains the full scoreboard state.
  ```json
  {
    "type": "state_sync",
    "data": {
      "timerTenths": 6000,
      "scoreA": 0,
      "scoreB": 0,
      "foulA": 0,
      "foulB": 0,
      "shotClockTenths": 120,
      "isShotClockRunning": false,
      "formattedTimer": "10:00",
      "formattedShotclock": "12.0"
    }
  }
  ```

- **timer_update**: (Legacy, only sent on timer set/reset) Contains the timer value in tenths.
  ```json
  {
    "type": "timer_update",
    "data": {
      "timerTenths": 5999
    }
  }
  ```

- **score_update**: Sent when a team's score changes.
  ```json
  {
    "type": "score_update",
    "data": { "scoreA": 1 } // or { "scoreB": 1 }
  }
  ```

- **foul_update**: Sent when a team's foul count changes.
  ```json
  {
    "type": "foul_update",
    "data": { "foulA": 2 } // or { "foulB": 2 }
  }
  ```

- **shotclock_update**: Sent when the shot clock starts, stops, is set, or reaches zero.
  ```json
  {
    "type": "shotclock_update",
    "data": {
      "shotClockTenths": 110, // current value in tenths
      "isShotClockRunning": true // or false
    }
  }
  ```

- **game_reset**: Sent when the game is reset.
  ```json
  {
    "type": "game_reset",
    "data": { /* full scoreboard state, same as state_sync */ }
  }
  ```

### Notes
- All messages have a `type` and a `data` field.
- The `state_sync` and `game_reset` messages contain the full scoreboard state.
- The `shotclock_update` message always includes both `shotClockTenths` and `isShotClockRunning`.
- The `timer_update` message only includes `timerTenths` (and is only sent on set/reset).
- The backend does not send timer running status, as the timer is only active when the shot clock is running.

### Typical WebSocket Workflow
1. Connect to the WebSocket endpoint.
2. On open, parse the `state_sync` message to initialize your UI.
3. Listen for update messages and update your UI accordingly.
4. Optionally, send control messages if your frontend is allowed to control the game (see API docs for message types).

---

## 4. Log File
- Use `GET /api/log` to fetch a list of all score/foul changes with the timer context.
- Log format: `mm:ss | ScoreA changed to 1`

---

## 5. API Documentation
- Visit [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html) for interactive API docs and to try endpoints in your browser.

---

## 6. Quick Integration Checklist
- [ ] Use REST API for all control actions (timer, score, fouls, shot clock)
- [ ] Use WebSocket for real-time state updates
- [ ] Parse and display all relevant fields from state and update messages
- [ ] Use the log endpoint for audit/history display if needed
- [ ] Refer to Swagger UI for request/response details

---

For any backend changes, see the README or contact the backend team.
