package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"scoreboard-backend/internal/models"
	"scoreboard-backend/internal/services"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type ScoreboardHandler struct {
	scoreboardService *services.ScoreboardService
	websocketService  *services.WebSocketService
	timerService      *services.TimerService
}

func NewScoreboardHandler(
	scoreboardService *services.ScoreboardService,
	websocketService *services.WebSocketService,
	timerService *services.TimerService,
) *ScoreboardHandler {
	return &ScoreboardHandler{
		scoreboardService: scoreboardService,
		websocketService:  websocketService,
		timerService:      timerService,
	}
}

// GetState returns the current scoreboard state
// @Summary Get current scoreboard state
// @Description Returns the current state of the scoreboard, including timer, scores, and shot clock
// @Tags state
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/state [get]
func (h *ScoreboardHandler) GetState(c *gin.Context) {
	state := h.scoreboardService.GetState()

	// Format timer as mm:ss or ss.x
	formattedTimer := ""
	if state.TimerTenths >= 60*10 {
		minutes := state.TimerTenths / (60 * 10)
		seconds := (state.TimerTenths / 10) % 60
		tenths := state.TimerTenths % 10
		if minutes > 0 {
			formattedTimer = fmt.Sprintf("%02d:%02d", minutes, seconds)
		} else {
			formattedTimer = fmt.Sprintf("%02d.%d", seconds, tenths)
		}
	} else {
		seconds := state.TimerTenths / 10
		tenths := state.TimerTenths % 10
		formattedTimer = fmt.Sprintf("%02d.%d", seconds, tenths)
	}

	// Format shot clock as ss.x
	formattedShotclock := ""
	shotSeconds := state.ShotClockTenths / 10
	shotTenths := state.ShotClockTenths % 10
	formattedShotclock = fmt.Sprintf("%02d.%d", shotSeconds, shotTenths)

	c.JSON(http.StatusOK, gin.H{
		"timerTenths":        state.TimerTenths,
		"scoreA":             state.ScoreA,
		"scoreB":             state.ScoreB,
		"shotClockTenths":    state.ShotClockTenths,
		"isShotClockRunning": state.IsShotClockRunning,
		"formattedTimer":     formattedTimer,
		"formattedShotclock": formattedShotclock,
		"foulA":              state.FoulA,
		"foulB":              state.FoulB,
	})
}

// // StartTimer starts the timer
// // @Summary Start the timer
// // @Description Starts the main game timer
// // @Tags timer
// // @Produce json
// // @Success 200 {object} map[string]interface{}
// // @Router /api/timer/start [post]
// func (h *ScoreboardHandler) StartTimer(c *gin.Context) {
// 	err := h.timerService.StartTimer()
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}
// 	c.JSON(http.StatusOK, gin.H{"message": "Timer started"})
// }

// // StopTimer stops the timer
// // @Summary Stop the timer
// // @Description Stops the main game timer
// // @Tags timer
// // @Produce json
// // @Success 200 {object} map[string]interface{}
// // @Router /api/timer/stop [post]
// func (h *ScoreboardHandler) StopTimer(c *gin.Context) {
// 	err := h.timerService.StopTimer()
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}
// 	c.JSON(http.StatusOK, gin.H{"message": "Timer stopped"})
// }

// ResetTimer sets timer to 10:00
// @Summary Reset the timer
// @Description Resets the main timer to 10:00
// @Tags timer
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/timer/reset [post]
func (h *ScoreboardHandler) ResetTimer(c *gin.Context) {
	err := h.timerService.ResetTimer()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Timer reset to 10:00"})
}

// SetTimerRequest is the request body for SetTimer
// @Description Timer in mm:ss format
// @example {"time": "10:00"}
type SetTimerRequest struct {
	Time string `json:"time"`
}

// SetTimer sets the timer to a specific value in mm:ss format
// @Summary Set the timer
// @Description Sets the main timer to a specific value in mm:ss format
// @Tags timer
// @Accept json
// @Produce json
// @Param timer body SetTimerRequest true "Timer in mm:ss format"
// @Success 200 {object} map[string]interface{}
// @Router /api/timer/set [post]
func (h *ScoreboardHandler) SetTimer(c *gin.Context) {
	type reqType = SetTimerRequest
	var req reqType
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var min, sec int
	n, err := fmt.Sscanf(req.Time, "%d:%d", &min, &sec)
	if err != nil || n != 2 || min < 0 || sec < 0 || sec >= 60 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format, expected mm:ss"})
		return
	}
	totalTenths := (min*60 + sec) * 10
	h.scoreboardService.SetTimerTenths(totalTenths)
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "timer_update",
		Data: map[string]interface{}{
			"timerTenths": totalTenths,
		},
	})
	c.JSON(http.StatusOK, gin.H{"message": "Timer set", "timerTenths": totalTenths})
}

// IncrementScoreA increments the score for Team A by 1
// @Summary Increment Team A score
// @Tags score
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/scoreA/increment [post]
func (h *ScoreboardHandler) IncrementScoreA(c *gin.Context) {
	newScore := h.scoreboardService.IncrementScoreA()
	h.logChange("ScoreA", newScore)
	message := models.WebSocketMessage{
		Type: "score_update",
		Data: map[string]interface{}{
			"scoreA": newScore,
		},
	}
	h.websocketService.BroadcastMessage(message)
	c.JSON(http.StatusOK, gin.H{"scoreA": newScore})
}

// DecrementScoreA decrements the score for Team A by 1
// @Summary Decrement Team A score
// @Tags score
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/scoreA/decrement [post]
func (h *ScoreboardHandler) DecrementScoreA(c *gin.Context) {
	newScore := h.scoreboardService.DecrementScoreA()
	h.logChange("ScoreA", newScore)
	message := models.WebSocketMessage{
		Type: "score_update",
		Data: map[string]interface{}{
			"scoreA": newScore,
		},
	}
	h.websocketService.BroadcastMessage(message)
	c.JSON(http.StatusOK, gin.H{"scoreA": newScore})
}

// IncrementScoreB increments the score for Team B by 1
// @Summary Increment Team B score
// @Tags score
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/scoreB/increment [post]
func (h *ScoreboardHandler) IncrementScoreB(c *gin.Context) {
	newScore := h.scoreboardService.IncrementScoreB()
	h.logChange("ScoreB", newScore)
	message := models.WebSocketMessage{
		Type: "score_update",
		Data: map[string]interface{}{
			"scoreB": newScore,
		},
	}
	h.websocketService.BroadcastMessage(message)
	c.JSON(http.StatusOK, gin.H{"scoreB": newScore})
}

// DecrementScoreB decrements the score for Team B by 1
// @Summary Decrement Team B score
// @Tags score
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/scoreB/decrement [post]
func (h *ScoreboardHandler) DecrementScoreB(c *gin.Context) {
	newScore := h.scoreboardService.DecrementScoreB()
	h.logChange("ScoreB", newScore)
	message := models.WebSocketMessage{
		Type: "score_update",
		Data: map[string]interface{}{
			"scoreB": newScore,
		},
	}
	h.websocketService.BroadcastMessage(message)
	c.JSON(http.StatusOK, gin.H{"scoreB": newScore})
}

// IncrementFoulA increments the foul count for Team A by 1
// @Summary Increment Team A foul
// @Tags foul
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/foulA/increment [post]
func (h *ScoreboardHandler) IncrementFoulA(c *gin.Context) {
	newFoul := h.scoreboardService.IncrementFoulA()
	h.logChange("FoulA", newFoul)
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "foul_update",
		Data: map[string]interface{}{"foulA": newFoul},
	})
	c.JSON(http.StatusOK, gin.H{"foulA": newFoul})
}

// DecrementFoulA decrements the foul count for Team A by 1
// @Summary Decrement Team A foul
// @Tags foul
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/foulA/decrement [post]
func (h *ScoreboardHandler) DecrementFoulA(c *gin.Context) {
	newFoul := h.scoreboardService.DecrementFoulA()
	h.logChange("FoulA", newFoul)
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "foul_update",
		Data: map[string]interface{}{"foulA": newFoul},
	})
	c.JSON(http.StatusOK, gin.H{"foulA": newFoul})
}

// IncrementFoulB increments the foul count for Team B by 1
// @Summary Increment Team B foul
// @Tags foul
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/foulB/increment [post]
func (h *ScoreboardHandler) IncrementFoulB(c *gin.Context) {
	newFoul := h.scoreboardService.IncrementFoulB()
	h.logChange("FoulB", newFoul)
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "foul_update",
		Data: map[string]interface{}{"foulB": newFoul},
	})
	c.JSON(http.StatusOK, gin.H{"foulB": newFoul})
}

// DecrementFoulB decrements the foul count for Team B by 1
// @Summary Decrement Team B foul
// @Tags foul
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/foulB/decrement [post]
func (h *ScoreboardHandler) DecrementFoulB(c *gin.Context) {
	newFoul := h.scoreboardService.DecrementFoulB()
	h.logChange("FoulB", newFoul)
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "foul_update",
		Data: map[string]interface{}{"foulB": newFoul},
	})
	c.JSON(http.StatusOK, gin.H{"foulB": newFoul})
}

var (
	changeLog   []string
	logFilePath = "game.log"
)

func appendToLogFile(entry string) {
	f, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Failed to open log file: %v", err)
		return
	}
	defer f.Close()
	f.WriteString(entry + "\n")
}

func clearLogFile() {
	os.WriteFile(logFilePath, []byte{}, 0644)
}

func (h *ScoreboardHandler) logChange(field string, value interface{}) {
	state := h.scoreboardService.GetState()
	formattedTimer := ""
	if state.TimerTenths >= 60*10 {
		minutes := state.TimerTenths / (60 * 10)
		seconds := (state.TimerTenths / 10) % 60
		tenths := state.TimerTenths % 10
		if minutes > 0 {
			formattedTimer = fmt.Sprintf("%02d:%02d", minutes, seconds)
		} else {
			formattedTimer = fmt.Sprintf("%02d.%d", seconds, tenths)
		}
	} else {
		seconds := state.TimerTenths / 10
		tenths := state.TimerTenths % 10
		formattedTimer = fmt.Sprintf("%02d.%d", seconds, tenths)
	}
	logEntry := fmt.Sprintf("%s | %s changed to %v", formattedTimer, field, value)
	changeLog = append(changeLog, logEntry)
	appendToLogFile(logEntry)
	log.Println(logEntry)
}

// @Summary Get change log
// @Tags log
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/log [get]
func (h *ScoreboardHandler) GetLog(c *gin.Context) {
	data, err := os.ReadFile(logFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read log file"})
		return
	}
	lines := []string{}
	for _, line := range splitLines(string(data)) {
		if line != "" {
			lines = append(lines, line)
		}
	}
	c.JSON(http.StatusOK, gin.H{"log": lines})
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

// HandleWebSocket handles WebSocket connections
func (h *ScoreboardHandler) HandleWebSocket(c *gin.Context) {
	conn, err := h.websocketService.UpgradeConnection(c.Writer, c.Request)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	// Create client
	clientID := fmt.Sprintf("%s_%d", c.ClientIP(), conn.RemoteAddr())
	client := &models.Client{
		ID:   clientID,
		Conn: conn,
		Send: make(chan models.WebSocketMessage, 256),
	}

	// Register client
	h.websocketService.RegisterClient(client)
	defer h.websocketService.UnregisterClient(client)

	// Send initial state
	initialState := h.scoreboardService.GetState()
	initialMessage := models.WebSocketMessage{
		Type: "state_sync",
		Data: initialState,
	}
	client.Send <- initialMessage

	// Start goroutines for handling WebSocket communication
	go h.writePump(conn, client)
	h.readPump(conn, client)
}

// readPump handles reading messages from WebSocket
func (h *ScoreboardHandler) readPump(conn *websocket.Conn, client *models.Client) {
	defer func() {
		h.websocketService.UnregisterClient(client)
		conn.Close()
	}()

	for {
		var message models.WebSocketMessage
		err := conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle different message types
		h.handleWebSocketMessage(message)
	}
}

// writePump handles writing messages to WebSocket
func (h *ScoreboardHandler) writePump(conn *websocket.Conn, client *models.Client) {
	defer conn.Close()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.WriteJSON(message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

// handleWebSocketMessage processes incoming WebSocket messages
func (h *ScoreboardHandler) handleWebSocketMessage(message models.WebSocketMessage) {
	switch message.Type {
	case "timer_control":
		if data, ok := message.Data.(map[string]interface{}); ok {
			if action, exists := data["action"]; exists {
				switch action {
				case "start":
					h.timerService.StartTimer()
				case "stop":
					h.timerService.StopTimer()
				}
			}
		}

	case "score_update":
		if data, ok := message.Data.(map[string]interface{}); ok {
			if scoreInterface, exists := data["score"]; exists {
				// Handle different number types from JSON
				var score uint
				switch v := scoreInterface.(type) {
				case float64:
					score = uint(v)
				case int:
					score = uint(v)
				case uint:
					score = v
				default:
					log.Printf("Invalid score type: %T", v)
					return
				}

				// Broadcast score update
				broadcastMessage := models.WebSocketMessage{
					Type: "score_update",
					Data: map[string]interface{}{
						"score": score,
					},
				}
				h.websocketService.BroadcastMessage(broadcastMessage)
			}
		}

	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

// Shot clock handlers
// @Summary Start the shot clock
// @Tags shotclock
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/shotclock/start [post]
func (h *ScoreboardHandler) StartShotClock(c *gin.Context) {
	if h.scoreboardService.IsShotClockRunning() {
		c.JSON(http.StatusOK, gin.H{"error": "Shot clock is already running"})
		return
	}
	if h.scoreboardService.GetShotClockTenths() == 0 {
		h.websocketService.BroadcastMessage(models.WebSocketMessage{
			Type: "shotclock_update",
			Data: map[string]interface{}{
				"isShotClockRunning": false,
				"shotClockTenths":    h.scoreboardService.GetShotClockTenths(),
				"timerTenths":        h.scoreboardService.GetTimerTenths(),
			},
		})
		c.JSON(http.StatusOK, gin.H{"error": "Cannot start shot clock when value is 0"})
		return
	}
	h.scoreboardService.SetShotClockRunning(true)
	h.timerService.StartTimer() // Start main timer as well
	// Start shot clock goroutine
	go func() {
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()
		lastValue := h.scoreboardService.GetShotClockTenths()
		for h.scoreboardService.IsShotClockRunning() {
			<-ticker.C
			remaining := h.scoreboardService.DecrementShotClockTenths()
			if remaining != lastValue {
				lastValue = remaining
				if remaining == 0 {
					h.StopShotClock(c)
					return
				}
				h.websocketService.BroadcastMessage(models.WebSocketMessage{
					Type: "shotclock_update",
					Data: map[string]interface{}{
						"isShotClockRunning": true,
						"shotClockTenths":    h.scoreboardService.GetShotClockTenths(),
						"timerTenths":        h.scoreboardService.GetTimerTenths(),
					},
				})
			}
		}
	}()
	c.JSON(http.StatusOK, gin.H{"message": "Shot clock started"})
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "shotclock_update",
		Data: map[string]interface{}{
			"isShotClockRunning": true,
			"shotClockTenths":    h.scoreboardService.GetShotClockTenths(),
			"timerTenths":        h.scoreboardService.GetTimerTenths(),
		},
	})
}

// @Summary Stop the shot clock
// @Tags shotclock
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/shotclock/stop [post]
func (h *ScoreboardHandler) StopShotClock(c *gin.Context) {
	h.scoreboardService.SetShotClockRunning(false)
	h.timerService.StopTimer() // Stop main timer as well
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "shotclock_update",
		Data: map[string]interface{}{
			"isShotClockRunning": false,
			"shotClockTenths":    h.scoreboardService.GetShotClockTenths(),
			"timerTenths":        h.scoreboardService.GetTimerTenths(),
		},
	})
	c.JSON(http.StatusOK, gin.H{"message": "Shot clock stopped"})
}

// ResetShotClock resets the shot clock to 12.0
// @Summary Reset the shot clock
// @Tags shotclock
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/shotclock/reset [post]
func (h *ScoreboardHandler) ResetShotClock(c *gin.Context) {
	wasZero := h.scoreboardService.GetShotClockTenths() == 0
	h.scoreboardService.ResetShotClock()
	if wasZero {
		h.StartShotClock(c)
	} else {
		h.websocketService.BroadcastMessage(models.WebSocketMessage{
			Type: "shotclock_update",
			Data: map[string]interface{}{
				"shotClockTenths":    12 * 10,
				"isShotClockRunning": h.scoreboardService.IsShotClockRunning(),
				"timerTenths":        h.scoreboardService.GetTimerTenths(),
			},
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shot clock reset to 12.0"})
}

// SetShotClockRequest is the request body for SetTimer
// @Description Timer in ss.x format
// @example {"time": "11.0"}
type SetShotClockRequest struct {
	Time string `json:"time"`
}

// SetShotClock sets the shot clock to a specific value in ss.x format
// @Summary Set the shot clock
// @Description Sets the shot clock to a specific value in ss.x format
// @Tags shotclock
// @Accept json
// @Produce json
// @Param shotclock body SetShotClockRequest true "Shot clock in ss.x format"
// @Success 200 {object} map[string]interface{}
// @Router /api/shotclock/set [post]
func (h *ScoreboardHandler) SetShotClock(c *gin.Context) {
	var req SetShotClockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var sec, tenths int
	n, err := fmt.Sscanf(req.Time, "%d.%d", &sec, &tenths)
	if err != nil || n < 1 || sec < 0 || sec > 99 || tenths < 0 || tenths > 9 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format, expected ss.x"})
		return
	}
	totalTenths := sec*10 + tenths
	h.scoreboardService.SetShotClockTenths(totalTenths)
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "shotclock_update",
		Data: map[string]interface{}{
			"shotClockTenths":    totalTenths,
			"isShotClockRunning": h.scoreboardService.IsShotClockRunning(),
			"timerTenths":        h.scoreboardService.GetTimerTenths(),
		},
	})
	c.JSON(http.StatusOK, gin.H{"message": "Shot clock set", "shotClockTenths": totalTenths})
}

// ResetGame resets everything to default
// @Summary Reset the game
// @Description Resets timer, shot clock, and both team scores to default values
// @Tags game
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/game/reset [post]
func (h *ScoreboardHandler) ResetGame(c *gin.Context) {
	h.timerService.StopTimer()
	h.scoreboardService.ResetAll()
	clearLogFile()
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "game_reset",
		Data: h.scoreboardService.GetState(),
	})
	c.JSON(http.StatusOK, gin.H{"message": "Game reset to default"})
}

// TriggerStateSync sends a state_sync message to all WebSocket clients
// @Summary Trigger state_sync WebSocket broadcast
// @Tags state
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/state/sync [post]
func (h *ScoreboardHandler) TriggerStateSync(c *gin.Context) {
	state := h.scoreboardService.GetState()
	h.websocketService.BroadcastMessage(models.WebSocketMessage{
		Type: "state_sync",
		Data: state,
	})
	c.JSON(http.StatusOK, gin.H{"message": "state_sync broadcasted"})
}
