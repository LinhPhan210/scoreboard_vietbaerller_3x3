# Basketball Timer App - Docker Setup

This document explains how to run the Basketball Timer App using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your system
- Port 3001 available on your host machine

## Quick Start

1. Navigate to the project directory:
   ```bash
   cd /home/pi/scoreboard_vietbaerller_3x3/frondendnew
   ```

2. Build and start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the application at: http://localhost:3001

## Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check container status
```bash
docker-compose ps
```

## Application Features

- **Game Timer**: 10-minute countdown with MM:SS format (switches to SS.X when under 1 minute)
- **Shot Clock**: 12-second countdown with SS.X format
- **Controls**: START/STOP and RESET (shot clock only)
- **Edit Mode**: Click EDIT buttons to modify timer values
- **Fullscreen**: Click the fullscreen button (⛶) in bottom-right corner
- **Responsive Design**: Optimized for different screen sizes and orientations
- **State Persistence**: Timer state is saved in browser session storage

## Technical Details

- **Container**: nginx:alpine serving static files
- **Port Mapping**: Host port 3001 → Container port 80
- **Network**: Isolated Docker bridge network
- **Restart Policy**: Restarts automatically unless manually stopped
- **Optimization**: Gzip compression and static asset caching enabled

## File Structure

```
.
├── index.html          # Main HTML file
├── script.js           # Timer application logic
├── style.css           # Responsive CSS styles
├── Dockerfile          # Docker image definition
├── docker-compose.yml  # Docker Compose configuration
├── nginx.conf          # Nginx server configuration
├── .dockerignore       # Docker build context exclusions
└── README-Docker.md    # This documentation
```

## Troubleshooting

- **Port already in use**: Change the host port in `docker-compose.yml` from `3001:80` to another port like `3002:80`
- **Permission denied**: Ensure Docker daemon is running and user has proper permissions
- **Container won't start**: Check logs with `docker-compose logs`
