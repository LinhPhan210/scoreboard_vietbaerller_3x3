# Scoreboard Backend

A real-time scoreboard backend built with Go and Gin framework, featuring WebSocket support for live updates.

## Features

- **Real-time WebSocket Communication**: Broadcasts timer and score updates to all connected clients
- **RESTful API**: Clean HTTP endpoints for scoreboard operations
- **Thread-safe Operations**: Concurrent access handling with mutexes
- **Timer Management**: Server-side timer with goroutine-based implementation
- **Score Management**: Score increment/decrement with validation
- **CORS Support**: Cross-origin resource sharing for frontend integration

## Prerequisites

- Go 1.23 or higher
- Git (for dependency management)

## Installation

1. Initialize Go modules and download dependencies:
```bash
go mod tidy
```

## Running the Application

### Development Mode
```bash
go run main.go
```

The server will start on `http://localhost:8080`

### Build for Production
```bash
go build -o scoreboard-server main.go
./scoreboard-server
```

## Project Structure

```
internal/
├── handlers/           # HTTP and WebSocket handlers
│   └── handlers.go     # Request handling and WebSocket management
├── models/             # Data structures and types
│   └── models.go       # Scoreboard state, WebSocket messages, client definitions
└── services/           # Business logic services
    ├── scoreboard.go   # Core scoreboard state management
    ├── timer.go        # Timer functionality with goroutines
    └── websocket.go    # WebSocket connection management
main.go                 # Application entry point and server setup
go.mod                  # Go module dependencies
```

## API Endpoints

### REST API

- `GET /api/state` - Get current scoreboard state (now returns `timerTenths` and `shotClockTenths`)
- `POST /api/timer/reset` - Reset the timer to 10:00 (timer only runs when shot clock is running)
- `POST /api/timer/set` - Set the timer to a specific value (body: `{ "time": "mm:ss" }`) (timer only runs when shot clock is running)
- `POST /api/scoreA/increment` - Increment Team A's score by 1
- `POST /api/scoreA/decrement` - Decrement Team A's score by 1
- `POST /api/scoreB/increment` - Increment Team B's score by 1
- `POST /api/scoreB/decrement` - Decrement Team B's score by 1
- `POST /api/foulA/increment` - Increment Team A's foul count by 1
- `POST /api/foulA/decrement` - Decrement Team A's foul count by 1
- `POST /api/foulB/increment` - Increment Team B's foul count by 1
- `POST /api/foulB/decrement` - Decrement Team B's foul count by 1
- `POST /api/shotclock/start` - Start the 12s shot clock
- `POST /api/shotclock/stop` - Stop the shot clock
- `POST /api/shotclock/reset` - Reset the shot clock to 12.0 seconds
- `POST /api/shotclock/set` - Set the shot clock to a specific value (body: `{ "time": "ss.x" }`)
- `POST /api/game/reset` - Reset all state (timer, scores, fouls, shot clock) to default
- `GET /api/log` - View the persistent log file (score/foul changes with timer)
- `GET /health` - Health check endpoint

#### Example: Set Timer
```bash
curl -X POST http://localhost:8080/api/timer/set \
  -H 'Content-Type: application/json' \
  -d '{"time": "09:30"}'
```

#### Example: Increment Team A Score
```bash
curl -X POST http://localhost:8080/api/scoreA/increment
```

#### Example: Get Log
```bash
curl http://localhost:8080/api/log
```

### WebSocket API

- Connect to `ws://localhost:8080/ws/state` for real-time scoreboard updates.
- On connection, you'll receive a `state_sync` message with the full state.
- Updates (timer, score, fouls, shot clock) are broadcast as JSON messages.

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

### API Documentation

- Visit [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html) for interactive API docs and to try endpoints in your browser.

---

For more details, see the full README or Swagger UI.

## Configuration

### Environment Variables

You can configure the server using environment variables:

- `PORT` - Server port (default: 8080)
- `GIN_MODE` - Gin mode (development/production)

Example:
```bash
export PORT=3001
export GIN_MODE=release
go run main.go
```

### CORS Configuration

The server is configured to allow all origins in development. For production, modify the CORS settings in `main.go`:

```go
config := cors.DefaultConfig()
config.AllowOrigins = []string{"https://yourdomain.com"}
```

## Dependencies

The project uses the following key dependencies:

- **Gin**: Web framework for HTTP routing and middleware
- **Gorilla WebSocket**: WebSocket implementation
- **Gin CORS**: Cross-origin resource sharing middleware

All dependencies are managed through Go modules (`go.mod`).

## Architecture

### Services Layer

- **ScoreboardService**: Manages the core state (timer, score, timer status)
- **WebSocketService**: Handles client connections and message broadcasting
- **TimerService**: Manages timer functionality with goroutines

### Handlers Layer

- **ScoreboardHandler**: HTTP request handling and WebSocket connection management

### Concurrency

The application uses Go's built-in concurrency features:

- Goroutines for timer functionality
- Channels for WebSocket message handling
- Mutexes for thread-safe state management

## Development

### Running Tests
```bash
go test ./...
```

### Code Formatting
```bash
go fmt ./...
```

### Dependency Management
```bash
go mod tidy      # Clean up dependencies
go mod vendor    # Vendor dependencies
```

## Deployment

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

Build and run:
```bash
docker build -t scoreboard-backend .
docker run -p 8080:8080 scoreboard-backend
```

### Production Considerations

1. **Environment Configuration**: Use environment variables for configuration
2. **Logging**: Implement structured logging for production
3. **Health Checks**: The `/health` endpoint can be used for load balancer health checks
4. **Security**: Implement proper CORS origins and authentication if needed
5. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 8080
   lsof -i :8080
   # Kill the process
   kill -9 <PID>
   ```

2. **WebSocket Connection Issues**
   - Ensure no firewall blocking WebSocket connections
   - Check client-side WebSocket URL matches server address
   - Verify CORS settings allow frontend origin

3. **Timer Not Updating**
   - Check goroutine isn't panicking (check logs)
   - Verify WebSocket clients are connected
   - Ensure timer service is properly initialized

### Debugging

Enable debug logging by setting Gin mode to debug:
```bash
export GIN_MODE=debug
go run main.go
```

## Performance

- WebSocket connections are managed efficiently with channels
- Timer updates are broadcast to all connected clients simultaneously
- Thread-safe operations ensure data consistency under concurrent access
- Minimal memory footprint with efficient data structures

## API Documentation (Swagger UI)

After starting the server, you can access interactive API documentation at:

- [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)

This page provides a live interface to test and explore all REST API endpoints, including request/response formats and example payloads.

To regenerate the documentation after changing handlers or comments, run:
```bash
swag init --generalInfo main.go --output docs
```
