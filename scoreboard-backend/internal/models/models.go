package models

import "time"

// ScoreboardState represents the current state of the scoreboard
type ScoreboardState struct {
	TimerTenths        int  `json:"timerTenths"`        // Timer in tenths of a second
	ScoreA             uint `json:"scoreA"`             // Current score for Team A
	ScoreB             uint `json:"scoreB"`             // Current score for Team B
	FoulA              uint `json:"foulA"`              // Current fouls for Team A
	FoulB              uint `json:"foulB"`              // Current fouls for Team B
	ShotClockTenths    int  `json:"shotClockTenths"`    // Shot clock in tenths of a second
	IsShotClockRunning bool `json:"isShotClockRunning"` // Shot clock running status
}

// WebSocketMessage represents a WebSocket message
type WebSocketMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// TimerControlData represents timer control actions
type TimerControlData struct {
	Action string `json:"action"` // "start" or "stop"
}

// ScoreUpdateData represents score update data
type ScoreUpdateData struct {
	Score uint `json:"score"`
}

// Client represents a WebSocket client
type Client struct {
	ID   string
	Conn interface{} // WebSocket connection (interface for flexibility)
	Send chan WebSocketMessage
}

// TimerState represents the internal timer state
type TimerState struct {
	StartTime      time.Time
	ElapsedSeconds int
	IsRunning      bool
}
