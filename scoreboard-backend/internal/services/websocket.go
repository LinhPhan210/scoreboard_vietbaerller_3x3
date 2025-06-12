package services

import (
	"log"
	"net/http"
	"scoreboard-backend/internal/models"
	"sync"

	"github.com/gorilla/websocket"
)

type WebSocketService struct {
	clients    map[string]*models.Client
	register   chan *models.Client
	unregister chan *models.Client
	broadcast  chan models.WebSocketMessage
	mutex      sync.RWMutex
	upgrader   websocket.Upgrader
}

func NewWebSocketService() *WebSocketService {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in development
		},
	}

	service := &WebSocketService{
		clients:    make(map[string]*models.Client),
		register:   make(chan *models.Client),
		unregister: make(chan *models.Client),
		broadcast:  make(chan models.WebSocketMessage),
		upgrader:   upgrader,
	}

	go service.run()
	return service
}

func (ws *WebSocketService) run() {
	for {
		select {
		case client := <-ws.register:
			ws.mutex.Lock()
			ws.clients[client.ID] = client
			ws.mutex.Unlock()
			log.Printf("Client %s connected. Total clients: %d", client.ID, len(ws.clients))

		case client := <-ws.unregister:
			ws.mutex.Lock()
			if _, ok := ws.clients[client.ID]; ok {
				delete(ws.clients, client.ID)
				close(client.Send)
			}
			ws.mutex.Unlock()
			log.Printf("Client %s disconnected. Total clients: %d", client.ID, len(ws.clients))

		case message := <-ws.broadcast:
			ws.mutex.RLock()
			for clientID, client := range ws.clients {
				select {
				case client.Send <- message:
				default:
					delete(ws.clients, clientID)
					close(client.Send)
				}
			}
			ws.mutex.RUnlock()
		}
	}
}

func (ws *WebSocketService) UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return ws.upgrader.Upgrade(w, r, nil)
}

func (ws *WebSocketService) RegisterClient(client *models.Client) {
	ws.register <- client
}

func (ws *WebSocketService) UnregisterClient(client *models.Client) {
	ws.unregister <- client
}

func (ws *WebSocketService) BroadcastMessage(message models.WebSocketMessage) {
	ws.broadcast <- message
}

func (ws *WebSocketService) GetClientCount() int {
	ws.mutex.RLock()
	defer ws.mutex.RUnlock()
	return len(ws.clients)
}