package services

import (
	"log"
	"sync/atomic"
	"time"
)

type TimerService struct {
	scoreboardService *ScoreboardService
	websocketService  *WebSocketService
	ticker            *time.Ticker
	stopChan          chan bool
	isRunning         int32 // atomic flag
}

func NewTimerService(scoreboardService *ScoreboardService, websocketService *WebSocketService) *TimerService {
	return &TimerService{
		scoreboardService: scoreboardService,
		websocketService:  websocketService,
		stopChan:          make(chan bool),
	}
}

func (t *TimerService) StartTimer() error {
	if !atomic.CompareAndSwapInt32(&t.isRunning, 0, 1) {
		log.Println("Timer is already running")
		return nil
	}

	// Always create a new stopChan for each timer start
	t.stopChan = make(chan bool)
	t.ticker = time.NewTicker(100 * time.Millisecond) // 1/10s
	go func(stopChan chan bool) {
		lastValue := t.scoreboardService.GetTimerTenths()
		for {
			select {
			case <-t.ticker.C:
				remaining := t.scoreboardService.DecrementTimerTenths()
				if remaining != lastValue {
					lastValue = remaining
					if remaining == 0 {
						t.StopTimer()
						return
					}
				}
			case <-stopChan:
				t.ticker.Stop()
				return
			}
		}
	}(t.stopChan)
	return nil
}

func (t *TimerService) StopTimer() error {
	if !atomic.CompareAndSwapInt32(&t.isRunning, 1, 0) {
		log.Println("Timer is not running")
		return nil
	}
	if t.ticker != nil {
		// Only close stopChan if not already closed
		select {
		case <-t.stopChan:
			// already closed
		default:
			close(t.stopChan)
		}
	}
	return nil
}

func (t *TimerService) ResetTimer() error {
	t.StopTimer()
	t.scoreboardService.ResetTimerToTenMinutes()
	log.Println("Timer reset to 10:00")
	return nil
}

func (t *TimerService) IsRunning() bool {
	return atomic.LoadInt32(&t.isRunning) == 1
}
