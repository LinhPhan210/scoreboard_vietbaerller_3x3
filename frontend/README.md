# Basketball Scoreboard & Timer Applications

This repository contains two basketball scoreboard application suites designed for different use cases:

---

## 1. Old Basketball Timer App (Legacy Single-Screen App)

A lightweight single-screen timer web application utilizing custom canvas seven-segment LED display simulation.

### File Path
* [`app/index.html`](file:///home/omen_deb/Siviliga/scoreboard_project/frontend/app/index.html)

### Features & Behavior
* **Single Screen Interface**: Displays game timer and shot clock on a single combined page.
* **Game Timer**: 10-minute countdown timer with `MM:SS` format.
* **Shot Clock**: 12-second countdown timer with `SS.X` format (showing tenths of seconds).
* **Controls**: Basic START, STOP, and RESET controls.
* **State Persistence**: Saves timer state in session storage to preserve state across page reloads.

### Usage
1. Open `app/index.html` in any web browser.
2. Click **START** to begin both timers.
3. Click **STOP** to pause the timers.
4. Click **RESET** to reset both timers to their initial values.

---

## 2. New 5x5 PC Basketball Scoreboard & Timer System (Dual-Monitor System)

A state-of-the-art, dual-monitor stadium LED scoreboard system designed for PC/laptop operators and external stadium monitors.

### Directory Path
* [`app/pc/5x5/`](file:///home/omen_deb/Siviliga/scoreboard_project/frontend/app/pc/5x5/)

### Key Components
1. **Operator Control Console**: [`app/pc/5x5/control.html`](file:///home/omen_deb/Siviliga/scoreboard_project/frontend/app/pc/5x5/control.html)
   * Designed for scorer desk operators.
   * Full controls for match score, team fouls, timeouts left (T.O.L), possession arrows, period selection, timers, side swapping, and stadium audio horn.
2. **Public Stadium Display**: [`app/pc/5x5/display.html`](file:///home/omen_deb/Siviliga/scoreboard_project/frontend/app/pc/5x5/display.html)
   * High-contrast LED stadium scoreboard optimized for 24" & 27" monitors.
   * Clean separation of Game Clock (top) and Shot Clock (bottom, flex 1.35).
3. **App Launcher**: [`app/pc/5x5/index.html`](file:///home/omen_deb/Siviliga/scoreboard_project/frontend/app/pc/5x5/index.html)
   * Quick launcher to open both Control and Display pages.

### Advanced Features
* **Real-Time Cross-Window Sync**: Operates via `BroadcastChannel` API and `localStorage` for zero-latency multi-monitor synchronization without backend setup.
* **Smart Score Formatting**: Automatic 2-digit formatting for scores < 100 (`00`, `12`) and 3-digit formatting for scores $\ge$ 100 (`100`, `105`).
* **Team Fouls Bonus Alert**: When team fouls exceed 3 (`fouls > 3`), the entire lower stats panel (Fouls & T.O.L) highlights in glowing **Neon Red** with pulse animation.
* **Shot Clock Rules (FIBA Standard)**:
  * `RESET 24s` / `RESET 14s` automatically caps shot clock to remaining game time if game time is less than 24s or 14s.
  * Full red screen flash when shot clock expires (`00`).
* **Hold-to-Accelerate Game Clock**: Holding down `+1 SEC` or `-1 SEC` smoothly accelerates time editing (capped at 60 game seconds per 2 real-time seconds).
* **Display Side Swapping**: `⇆ SWAP DISPLAY SIDES` button on control console dynamically flips Home and Guest positions on the public display.
* **Stadium Audio Horn**: Built-in synthesized electric stadium horn buzzer (220Hz-880Hz sawtooth + high-pass filter) triggered automatically or on-demand.
* **Fail-Safe Game Reset**: Double-click button confirmation for clearing/resetting match state without relying on browser native popup dialogs.
* **Hotkeys**:
  * `SPACE` - Start / Pause Timer
  * `R` - Reset Shot Clock to 24s
  * `F` - Reset Shot Clock to 14s
  * `P` - Flip Possession Arrow

### Usage
1. Open `app/pc/5x5/control.html` on the operator's laptop/monitor.
2. Open `app/pc/5x5/display.html` on the stadium/external TV monitor.
3. Operate the game using the control console or keyboard shortcuts.