package services

import (
	"scoreboard-backend/internal/models"
	"sync"
	"sync/atomic"
)

type ScoreboardService struct {
	state           models.ScoreboardState
	mutex           sync.RWMutex
	atomicTimer     int64 // atomic value for TimerTenths
	atomicShotClock int64 // atomic value for ShotClockTenths
	atomicFoulA     int64 // atomic value for FoulA
	atomicFoulB     int64 // atomic value for FoulB
}

func NewScoreboardService() *ScoreboardService {
	service := &ScoreboardService{
		state: models.ScoreboardState{
			TimerTenths:        10 * 60 * 10, // 10:00 in tenths
			ScoreA:             0,
			ScoreB:             0,
			FoulA:              0,
			FoulB:              0,
			ShotClockTenths:    12 * 10, // 12s in tenths
			IsShotClockRunning: false,
		},
	}
	atomic.StoreInt64(&service.atomicTimer, int64(service.state.TimerTenths))
	atomic.StoreInt64(&service.atomicShotClock, int64(service.state.ShotClockTenths))
	atomic.StoreInt64(&service.atomicFoulA, 0)
	atomic.StoreInt64(&service.atomicFoulB, 0)
	return service
}

func (s *ScoreboardService) GetState() models.ScoreboardState {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	s.state.TimerTenths = int(atomic.LoadInt64(&s.atomicTimer))
	s.state.FoulA = uint(atomic.LoadInt64(&s.atomicFoulA))
	s.state.FoulB = uint(atomic.LoadInt64(&s.atomicFoulB))
	return s.state
}

func (s *ScoreboardService) SetTimerTenths(tenths int) {
	atomic.StoreInt64(&s.atomicTimer, int64(tenths))
	s.mutex.Lock()
	s.state.TimerTenths = tenths
	s.mutex.Unlock()
}

func (s *ScoreboardService) GetTimerTenths() int {
	return int(atomic.LoadInt64(&s.atomicTimer))
}

func (s *ScoreboardService) DecrementTimerTenths() int {
	newVal := atomic.AddInt64(&s.atomicTimer, -1)
	if newVal < 0 {
		atomic.StoreInt64(&s.atomicTimer, 0)
		newVal = 0
	}
	s.mutex.Lock()
	s.state.TimerTenths = int(newVal)
	s.mutex.Unlock()
	return int(newVal)
}

func (s *ScoreboardService) ResetTimerToTenMinutes() {
	atomic.StoreInt64(&s.atomicTimer, 10*60*10)
	s.mutex.Lock()
	s.state.TimerTenths = 10 * 60 * 10
	s.mutex.Unlock()
}

func (s *ScoreboardService) IncrementScoreA() uint {
	s.mutex.Lock()
	s.state.ScoreA++
	val := s.state.ScoreA
	s.mutex.Unlock()
	return val
}
func (s *ScoreboardService) IncrementScoreB() uint {
	s.mutex.Lock()
	s.state.ScoreB++
	val := s.state.ScoreB
	s.mutex.Unlock()
	return val
}
func (s *ScoreboardService) DecrementScoreA() uint {
	s.mutex.Lock()
	if s.state.ScoreA > 0 {
		s.state.ScoreA--
	}
	val := s.state.ScoreA
	s.mutex.Unlock()
	return val
}
func (s *ScoreboardService) DecrementScoreB() uint {
	s.mutex.Lock()
	if s.state.ScoreB > 0 {
		s.state.ScoreB--
	}
	val := s.state.ScoreB
	s.mutex.Unlock()
	return val
}
func (s *ScoreboardService) SetScoreA(score uint) {
	s.mutex.Lock()
	s.state.ScoreA = score
	s.mutex.Unlock()
}
func (s *ScoreboardService) SetScoreB(score uint) {
	s.mutex.Lock()
	s.state.ScoreB = score
	s.mutex.Unlock()
}

// Shot clock atomic methods
func (s *ScoreboardService) SetShotClockTenths(tenths int) {
	atomic.StoreInt64(&s.atomicShotClock, int64(tenths))
	s.mutex.Lock()
	s.state.ShotClockTenths = tenths
	s.mutex.Unlock()
}
func (s *ScoreboardService) GetShotClockTenths() int {
	return int(atomic.LoadInt64(&s.atomicShotClock))
}
func (s *ScoreboardService) DecrementShotClockTenths() int {
	newVal := atomic.AddInt64(&s.atomicShotClock, -1)
	if newVal < 0 {
		atomic.StoreInt64(&s.atomicShotClock, 0)
		newVal = 0
	}
	s.mutex.Lock()
	s.state.ShotClockTenths = int(newVal)
	s.mutex.Unlock()
	return int(newVal)
}
func (s *ScoreboardService) ResetShotClock() {
	atomic.StoreInt64(&s.atomicShotClock, 12*10)
	s.mutex.Lock()
	s.state.ShotClockTenths = 12 * 10
	s.mutex.Unlock()
}
func (s *ScoreboardService) SetShotClockRunning(running bool) {
	s.mutex.Lock()
	s.state.IsShotClockRunning = running
	s.mutex.Unlock()
}
func (s *ScoreboardService) IsShotClockRunning() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.state.IsShotClockRunning
}

func (s *ScoreboardService) IncrementFoulA() uint {
	newVal := atomic.AddInt64(&s.atomicFoulA, 1)
	s.mutex.Lock()
	s.state.FoulA = uint(newVal)
	s.mutex.Unlock()
	return uint(newVal)
}
func (s *ScoreboardService) DecrementFoulA() uint {
	var newVal int64
	for {
		old := atomic.LoadInt64(&s.atomicFoulA)
		if old > 0 {
			if atomic.CompareAndSwapInt64(&s.atomicFoulA, old, old-1) {
				newVal = old - 1
				break
			}
		} else {
			newVal = 0
			break
		}
	}
	s.mutex.Lock()
	s.state.FoulA = uint(newVal)
	s.mutex.Unlock()
	return uint(newVal)
}
func (s *ScoreboardService) IncrementFoulB() uint {
	newVal := atomic.AddInt64(&s.atomicFoulB, 1)
	s.mutex.Lock()
	s.state.FoulB = uint(newVal)
	s.mutex.Unlock()
	return uint(newVal)
}
func (s *ScoreboardService) DecrementFoulB() uint {
	var newVal int64
	for {
		old := atomic.LoadInt64(&s.atomicFoulB)
		if old > 0 {
			if atomic.CompareAndSwapInt64(&s.atomicFoulB, old, old-1) {
				newVal = old - 1
				break
			}
		} else {
			newVal = 0
			break
		}
	}
	s.mutex.Lock()
	s.state.FoulB = uint(newVal)
	s.mutex.Unlock()
	return uint(newVal)
}

func (s *ScoreboardService) ResetAll() {
	atomic.StoreInt64(&s.atomicTimer, 10*60*10)
	atomic.StoreInt64(&s.atomicShotClock, 12*10)
	atomic.StoreInt64(&s.atomicFoulA, 0)
	atomic.StoreInt64(&s.atomicFoulB, 0)
	s.mutex.Lock()
	s.state = models.ScoreboardState{
		TimerTenths:        10 * 60 * 10,
		ScoreA:             0,
		ScoreB:             0,
		FoulA:              0,
		FoulB:              0,
		ShotClockTenths:    12 * 10,
		IsShotClockRunning: false,
	}
	s.mutex.Unlock()
}
