class TimerApp {
    constructor() {
        console.log('🏀 Basketball Timer Constructor called!');
        // Timer state
        this.isRunning = false;
        this.gameTimeLeft = 10 * 60.0; // 10 minutes in seconds with decimals
        this.shotTimeLeft = 12.0; // 12 seconds with decimals
        this.gameInterval = null;
        this.shotInterval = null;
        
        // DOM elements
        this.gameDisplay = document.getElementById('gameTimer');
        this.shotDisplay = document.getElementById('shotClock');
        this.startStopBtn = document.getElementById('startStopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.editGameBtn = document.getElementById('editGameBtn');
        this.editShotBtn = document.getElementById('editShotBtn');
        this.container = document.querySelector('.container');
        
        // Edit mode state
        this.isEditingGame = false;
        this.isEditingShot = false;
        
        // Seven-segment display flag
        this.sevenSegInitialized = false;
        this.lastSevenSegValue = null;
        
        // Create fullscreen button
        this.createFullscreenButton();
        
        // Initialize
        this.loadState();
        this.updateDisplays();
        this.bindEvents();
        this.updateFullscreenButton();
        
        // Initialize seven-segment display immediately
        console.log('🏀 Basketball Timer initialized - calling seven-segment...');
        this.initializeSevenSegment();
    }
    
    createFullscreenButton() {
        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.innerHTML = '⛶';
        this.fullscreenBtn.id = 'fullscreenBtn';
        this.fullscreenBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;
            font-size: 20px;
            width: 50px;
            height: 50px;
            cursor: pointer;
            z-index: 1000;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.fullscreenBtn);
    }
    
    bindEvents() {
        this.startStopBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetShotClock());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.editGameBtn.addEventListener('click', () => this.toggleGameEdit());
        this.editShotBtn.addEventListener('click', () => this.toggleShotEdit());
        
        // Handle keyboard events for editing
        this.gameDisplay.addEventListener('keydown', (e) => this.handleEditKeydown(e, 'game'));
        this.shotDisplay.addEventListener('keydown', (e) => this.handleEditKeydown(e, 'shot'));
        this.gameDisplay.addEventListener('blur', () => this.saveGameEdit());
        this.shotDisplay.addEventListener('blur', () => this.saveShotEdit());
        
        // Save state before page unload
        window.addEventListener('beforeunload', () => this.saveState());
        
        // Save state periodically
        setInterval(() => this.saveState(), 1000);
        
        // Fullscreen change listener
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
    }
    
    toggleTimer() {
        // Don't allow starting timer while editing
        if (this.isEditingGame || this.isEditingShot) {
            return;
        }
        
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        // Clear any alert states when starting
        this.clearAlertStates();
        
        this.isRunning = true;
        this.startStopBtn.textContent = 'STOP';
        this.startStopBtn.classList.add('stop');
        this.container.classList.add('running');
        
        // Game timer (0.1 second intervals for consistent timing with shot clock)
        this.gameInterval = setInterval(() => {
            if (this.gameTimeLeft > 0) {
                this.gameTimeLeft -= 0.1;
                if (this.gameTimeLeft < 0) this.gameTimeLeft = 0;
                this.updateGameDisplay();
                
                // Check if game timer just hit zero
                if (this.gameTimeLeft <= 0) {
                    this.gameTimerExpired();
                }
            } else {
                this.stopTimer();
            }
        }, 100);
        
        // Shot clock (0.1 second intervals for tenths)
        this.shotInterval = setInterval(() => {
            if (this.shotTimeLeft > 0) {
                this.shotTimeLeft -= 0.1;
                if (this.shotTimeLeft < 0) this.shotTimeLeft = 0;
                this.updateShotDisplay();
                
                // Check if shot clock just hit zero
                if (this.shotTimeLeft <= 0) {
                    this.shotClockExpired();
                }
            } else {
                // Shot clock expired, reset to 12 seconds
                this.shotTimeLeft = 12.0;
                this.updateShotDisplay();
            }
        }, 100);
    }
    
    stopTimer() {
        this.isRunning = false;
        this.startStopBtn.textContent = 'START';
        this.startStopBtn.classList.remove('stop');
        this.container.classList.remove('running');
        
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        if (this.shotInterval) {
            clearInterval(this.shotInterval);
            this.shotInterval = null;
        }
    }
    
    resetShotClock() {
        // Clear any alert states when resetting
        this.clearAlertStates();
        
        // If game timer is less than 12 seconds, shot clock should match game timer
        if (this.gameTimeLeft < 12.0) {
            this.shotTimeLeft = this.gameTimeLeft;
        } else {
            // Normal reset to 12 seconds
            this.shotTimeLeft = 12.0;
        }
        
        this.updateShotDisplay();
        this.saveState();
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    updateFullscreenButton() {
        if (document.fullscreenElement) {
            this.fullscreenBtn.innerHTML = '⛶';
            this.fullscreenBtn.title = 'Exit Fullscreen';
        } else {
            this.fullscreenBtn.innerHTML = '⛶';
            this.fullscreenBtn.title = 'Enter Fullscreen';
        }
    }
    
    initializeSevenSegment() {
        // Wait for both jQuery and sevenSeg to be ready
        const initSevenSeg = () => {
            try {
                console.log('Attempting to initialize seven-segment display...');
                console.log('jQuery available:', typeof $ !== 'undefined');
                console.log('sevenSeg available:', typeof $.fn !== 'undefined' && typeof $.fn.sevenSeg !== 'undefined');
                
                // Check if jQuery and sevenSeg are available
                if (typeof $ === 'undefined') {
                    console.error('jQuery not loaded - showing original display');
                    this.shotDisplay.style.display = 'block';
                    document.getElementById('shotClockSevenSeg').style.display = 'none';
                    return;
                }
                
                if (typeof $.fn.sevenSeg === 'undefined') {
                    console.error('sevenSeg plugin not loaded - showing original display');
                    this.shotDisplay.style.display = 'block';
                    document.getElementById('shotClockSevenSeg').style.display = 'none';
                    return;
                }
                
                console.log('Libraries loaded, initializing seven-segment...');
                
                // Initialize seven-segment display for shot clock
                $('#shotClockSevenSeg').sevenSeg({
                    digits: 3,  // For format like "12.0" - using 3 digits for better spacing
                    value: this.shotTimeLeft,
                    colorOn: '#FF6B35',     // Orange/red color
                    colorOff: '#331100',    // Dark orange for off segments
                    colorBackground: 'transparent',
                    slant: 5,               // Reduced slant for better readability
                    decimalPlaces: 1,       // Show one decimal place
                    decimalPoint: true,     // Show decimal point
                    digitSpacing: 0         // Minimize spacing between digits
                });
                
                this.sevenSegInitialized = true;
                console.log('Seven-segment display initialized successfully');
                
                // Hide the original shot display, show seven-segment
                this.shotDisplay.style.display = 'none';
                document.getElementById('shotClockSevenSeg').style.display = 'block';
                
            } catch (error) {
                console.error('Error initializing seven-segment display:', error);
                console.error('Falling back to original display');
                // Keep original display visible on error
                this.shotDisplay.style.display = 'block';
                document.getElementById('shotClockSevenSeg').style.display = 'none';
            }
        };
        
        // Try immediate initialization since scripts load after DOM
        if (typeof $ !== 'undefined' && typeof $.fn.sevenSeg !== 'undefined') {
            console.log('✅ Libraries ready - initializing immediately');
            initSevenSeg();
        } else {
            console.log('⚠️ Libraries not ready - using fallbacks');
            // Quick fallback: try again very soon
            if (typeof $ !== 'undefined') {
                $(document).ready(() => {
                    initSevenSeg();
                });
            } else {
                // Last resort: wait for window load
                window.addEventListener('load', () => {
                    initSevenSeg();
                });
            }
        }
    }
    
    // Optional: Add method to reset game timer if needed later
    resetGameTimer() {
        // Clear any alert states when resetting
        this.clearAlertStates();
        
        this.gameTimeLeft = 10 * 60.0; // Reset to 10 minutes
        this.updateGameDisplay();
        this.saveState();
    }
    
    shotClockExpired() {
        // Stop all timers
        this.stopTimer();
        
        // Add visual alert to shot clock section
        const shotClockSection = document.querySelector('.shot-clock');
        shotClockSection.classList.add('shot-clock-expired');
        
        // Optional: Add sound or other alert here
        console.log('Shot clock expired!');
    }
    
    gameTimerExpired() {
        // Stop all timers
        this.stopTimer();
        
        // Add visual alert to game timer section
        const gameTimerSection = document.querySelector('.game-timer');
        gameTimerSection.classList.add('game-timer-expired');
        
        // Optional: Add sound or other alert here
        console.log('Game timer expired!');
    }
    
    clearAlertStates() {
        // Remove alert styling from both sections
        const shotClockSection = document.querySelector('.shot-clock');
        const gameTimerSection = document.querySelector('.game-timer');
        
        if (shotClockSection) {
            shotClockSection.classList.remove('shot-clock-expired');
        }
        if (gameTimerSection) {
            gameTimerSection.classList.remove('game-timer-expired');
        }
    }
    
    toggleGameEdit() {
        if (this.isEditingGame) {
            this.saveGameEdit();
        } else {
            this.enterGameEditMode();
        }
    }
    
    toggleShotEdit() {
        if (this.isEditingShot) {
            this.saveShotEdit();
        } else {
            this.enterShotEditMode();
        }
    }
    
    enterGameEditMode() {
        if (this.isRunning) {
            this.stopTimer();
        }
        
        // Clear any alert states when entering edit mode
        this.clearAlertStates();
        
        this.isEditingGame = true;
        this.editGameBtn.textContent = 'SAVE';
        this.editGameBtn.classList.add('editing');
        this.gameDisplay.classList.add('editing');
        this.gameDisplay.contentEditable = true;
        this.gameDisplay.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(this.gameDisplay);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    enterShotEditMode() {
        if (this.isRunning) {
            this.stopTimer();
        }
        
        // Clear any alert states when entering edit mode
        this.clearAlertStates();
        
        this.isEditingShot = true;
        this.editShotBtn.textContent = 'SAVE';
        this.editShotBtn.classList.add('editing');
        
        // Show original display for editing, hide seven-segment
        this.shotDisplay.style.display = 'block';
        const sevenSegElement = document.getElementById('shotClockSevenSeg');
        if (sevenSegElement) {
            sevenSegElement.style.display = 'none';
        }
        
        this.shotDisplay.classList.add('editing');
        this.shotDisplay.contentEditable = true;
        this.shotDisplay.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(this.shotDisplay);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    handleEditKeydown(e, type) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (type === 'game') {
                this.saveGameEdit();
            } else {
                this.saveShotEdit();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (type === 'game') {
                this.cancelGameEdit();
            } else {
                this.cancelShotEdit();
            }
        }
    }
    
    saveGameEdit() {
        if (!this.isEditingGame) return;
        
        const input = this.gameDisplay.textContent.trim();
        const timeInSeconds = this.parseGameTime(input);
        
        if (timeInSeconds !== null) {
            this.gameTimeLeft = timeInSeconds;
            this.updateGameDisplay();
        } else {
            // Invalid input, revert to current time
            this.updateGameDisplay();
        }
        
        this.exitGameEditMode();
    }
    
    saveShotEdit() {
        if (!this.isEditingShot) return;
        
        const input = this.shotDisplay.textContent.trim();
        const timeInSeconds = this.parseShotTime(input);
        
        if (timeInSeconds !== null) {
            this.shotTimeLeft = timeInSeconds;
            this.updateShotDisplay();
        } else {
            // Invalid input, revert to current time
            this.updateShotDisplay();
        }
        
        this.exitShotEditMode();
    }
    
    cancelGameEdit() {
        this.updateGameDisplay(); // Revert display
        this.exitGameEditMode();
    }
    
    cancelShotEdit() {
        this.updateShotDisplay(); // Revert display
        this.exitShotEditMode();
    }
    
    exitGameEditMode() {
        this.isEditingGame = false;
        this.editGameBtn.textContent = 'EDIT';
        this.editGameBtn.classList.remove('editing');
        this.gameDisplay.classList.remove('editing');
        this.gameDisplay.contentEditable = false;
        this.saveState();
    }
    
    exitShotEditMode() {
        this.isEditingShot = false;
        this.editShotBtn.textContent = 'EDIT';
        this.editShotBtn.classList.remove('editing');
        this.shotDisplay.classList.remove('editing');
        this.shotDisplay.contentEditable = false;
        
        // Hide original display, show seven-segment again (if available)
        if (this.sevenSegInitialized) {
            this.shotDisplay.style.display = 'none';
            const sevenSegElement = document.getElementById('shotClockSevenSeg');
            if (sevenSegElement) {
                sevenSegElement.style.display = 'block';
            }
        } else {
            // Keep original display if seven-segment isn't available
            this.shotDisplay.style.display = 'block';
        }
        
        this.saveState();
    }
    
    parseGameTime(input) {
        // Expected formats: MM:SS, M:SS, or SS.X (when under 1 minute)
        const mmssRegex = /^(\d{1,2}):(\d{2})$/;
        const ssxRegex = /^(\d{1,2})\.(\d)$/;
        const integerRegex = /^(\d{1,2})$/;
        
        // Try MM:SS format first
        let match = input.match(mmssRegex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            
            if (minutes >= 0 && minutes <= 99 && seconds >= 0 && seconds <= 59) {
                return minutes * 60 + seconds;
            }
        }
        
        // Try SS.X format (for times under 1 minute)
        match = input.match(ssxRegex);
        if (match) {
            const seconds = parseInt(match[1], 10);
            const tenths = parseInt(match[2], 10);
            
            if (seconds >= 0 && seconds <= 59 && tenths >= 0 && tenths <= 9) {
                return seconds + (tenths / 10);
            }
        }
        
        // Try integer format (assume seconds)
        match = input.match(integerRegex);
        if (match) {
            const seconds = parseInt(match[1], 10);
            if (seconds >= 0 && seconds <= 99) {
                return seconds;
            }
        }
        
        return null; // Invalid format
    }
    
    parseShotTime(input) {
        // Expected format: SS.S or S.S
        const timeRegex = /^(\d{1,2})\.(\d)$/;
        const integerRegex = /^(\d{1,2})$/;
        
        let match = input.match(timeRegex);
        if (match) {
            const seconds = parseInt(match[1], 10);
            const tenths = parseInt(match[2], 10);
            
            if (seconds >= 0 && seconds <= 99 && tenths >= 0 && tenths <= 9) {
                return seconds + (tenths / 10);
            }
        }
        
        // Also allow integer input (assume .0)
        match = input.match(integerRegex);
        if (match) {
            const seconds = parseInt(match[1], 10);
            if (seconds >= 0 && seconds <= 99) {
                return seconds;
            }
        }
        
        return null; // Invalid format
    }
    
    updateDisplays() {
        this.updateGameDisplay();
        this.updateShotDisplay();
    }
    
    updateGameDisplay() {
        // When under 1 minute, show SS.X format like shot clock
        if (this.gameTimeLeft < 60) {
            const seconds = Math.floor(this.gameTimeLeft);
            const tenths = Math.floor((this.gameTimeLeft % 1) * 10);
            this.gameDisplay.textContent = `${seconds.toString().padStart(2, '0')}.${tenths}`;
        } else {
            // Round to nearest second for display, but keep internal decimal precision
            const totalSecondsRounded = Math.round(this.gameTimeLeft);
            const minutes = Math.floor(totalSecondsRounded / 60);
            const seconds = totalSecondsRounded % 60;
            this.gameDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateShotDisplay() {
        const seconds = Math.floor(this.shotTimeLeft);
        const tenths = Math.floor((this.shotTimeLeft % 1) * 10);
        const displayText = `${seconds.toString().padStart(2, '0')}.${tenths}`;
        

        
        // Update original display (for fallback and edit mode)
        this.shotDisplay.textContent = displayText;
        
        // Update seven-segment display if initialized
        if (this.sevenSegInitialized && typeof $ !== 'undefined' && $('#shotClockSevenSeg').length) {
            try {
                const $element = $('#shotClockSevenSeg');
                
                // Check if we're crossing a digit boundary (like 10.x -> 9.x)
                const currentSeconds = Math.floor(this.shotTimeLeft);
                const prevValue = this.lastSevenSegValue || this.shotTimeLeft;
                const prevSeconds = Math.floor(prevValue);
                
                if (currentSeconds !== prevSeconds || !this.lastSevenSegValue) {
                    // Digit boundary crossed or first update - force full re-render
                    console.log(`Digit boundary crossed: ${prevSeconds} -> ${currentSeconds}, force re-render`);
                    
                    if ($element.data('bw-sevenSeg')) {
                        $element.sevenSeg('destroy');
                    }
                    $element.empty();
                    
                    $element.sevenSeg({
                        digits: 3,
                        value: this.shotTimeLeft,
                        colorOn: '#FF6B35',
                        colorOff: '#331100',
                        colorBackground: 'transparent',
                        slant: 5,
                        decimalPlaces: 1,
                        decimalPoint: true
                    });
                } else {
                    // Same digit, just update the value normally
                    $element.sevenSeg('option', 'value', this.shotTimeLeft);
                }
                
                this.lastSevenSegValue = this.shotTimeLeft;
                
            } catch (error) {
                console.error('Error updating seven-segment display:', error);
                // Fall back to original display if seven-segment fails
                this.shotDisplay.style.display = 'block';
                document.getElementById('shotClockSevenSeg').style.display = 'none';
                this.sevenSegInitialized = false;
            }
        }
    }
    
    saveState() {
        const state = {
            isRunning: this.isRunning,
            gameTimeLeft: this.gameTimeLeft,
            shotTimeLeft: this.shotTimeLeft,
            timestamp: Date.now()
        };
        sessionStorage.setItem('timerState', JSON.stringify(state));
    }
    
    loadState() {
        const savedState = sessionStorage.getItem('timerState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const timeDiffSeconds = (Date.now() - state.timestamp) / 1000;
                
                // Restore state
                this.gameTimeLeft = Math.max(0, state.gameTimeLeft || 10 * 60.0);
                this.shotTimeLeft = Math.max(0, state.shotTimeLeft || 12.0);
                
                // If timer was running, adjust for time passed while page was closed
                if (state.isRunning && timeDiffSeconds > 0) {
                    // Adjust game timer (now also uses decimal precision)
                    this.gameTimeLeft = Math.max(0, this.gameTimeLeft - timeDiffSeconds);
                    
                    // Adjust shot clock (it cycles every 12 seconds)
                    const shotTimePassed = timeDiffSeconds % 12; // Time passed within current cycle
                    this.shotTimeLeft = Math.max(0, this.shotTimeLeft - shotTimePassed);
                    if (this.shotTimeLeft <= 0) {
                        // If shot clock expired, calculate position in new cycle
                        const cyclePosition = (-this.shotTimeLeft) % 12;
                        this.shotTimeLeft = 12.0 - cyclePosition;
                    }
                    
                    // Continue running if game time is left
                    if (this.gameTimeLeft > 0) {
                        this.startTimer();
                    }
                }
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        }
    }
}

// Initialize the timer app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM Content Loaded - creating TimerApp...');
    new TimerApp();
}); 