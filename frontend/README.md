# Basketball Timer App

A modern, responsive timer application designed for basketball games with both game timer and shot clock functionality.

## Features

- **Game Timer**: 10-minute countdown timer with MM:SS format
- **Shot Clock**: 12-second countdown timer with SS.X format (showing tenths of seconds)
- **Persistent State**: Timer state is saved in session storage to prevent loss on page reload
- **Modern UI**: Beautiful gradient design with responsive layout
- **Visual Feedback**: Timers pulse when running, buttons change color

## How to Use

1. Open `index.html` in your web browser
2. Click **START** to begin both timers
3. Click **STOP** to pause both timers
4. Click **RESET** to reset both timers to their initial values

## Timer Behavior

- **Game Timer**: Counts down from 10:00 to 00:00
- **Shot Clock**: Counts down from 12.0 to 00.0, then automatically resets to 12.0 and continues
- **State Persistence**: If you reload the page while timers are running, they will continue from where they left off

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and responsive design
- `script.js` - Timer functionality and state management

## Browser Compatibility

Works in all modern browsers that support:
- ES6 Classes
- Session Storage
- CSS Grid
- CSS Flexbox 