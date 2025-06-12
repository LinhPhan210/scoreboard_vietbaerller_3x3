package main

import (
	"log"
	"scoreboard-backend/internal/handlers"
	"scoreboard-backend/internal/services"
	"strings"

	_ "scoreboard-backend/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Initialize services
	scoreboardService := services.NewScoreboardService()
	websocketService := services.NewWebSocketService()
	timerService := services.NewTimerService(scoreboardService, websocketService)

	// Initialize handlers
	scoreboardHandler := handlers.NewScoreboardHandler(scoreboardService, websocketService, timerService)

	// Setup Gin router
	router := gin.Default()

	// CORS middleware
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// API routes
	api := router.Group("/api")
	{
		api.GET("/state", scoreboardHandler.GetState)
		api.POST("/timer/reset", scoreboardHandler.ResetTimer)
		api.POST("/timer/set", scoreboardHandler.SetTimer)
		api.POST("/scoreA/increment", scoreboardHandler.IncrementScoreA)
		api.POST("/scoreA/decrement", scoreboardHandler.DecrementScoreA)
		api.POST("/scoreB/increment", scoreboardHandler.IncrementScoreB)
		api.POST("/scoreB/decrement", scoreboardHandler.DecrementScoreB)
		api.POST("/shotclock/set", scoreboardHandler.SetShotClock)
		api.POST("/shotclock/reset", scoreboardHandler.ResetShotClock)
		api.POST("/shotclock/start", scoreboardHandler.StartShotClock)
		api.POST("/shotclock/stop", scoreboardHandler.StopShotClock)
		api.POST("/game/reset", scoreboardHandler.ResetGame)
		api.POST("/foulA/increment", scoreboardHandler.IncrementFoulA)
		api.POST("/foulA/decrement", scoreboardHandler.DecrementFoulA)
		api.POST("/foulB/increment", scoreboardHandler.IncrementFoulB)
		api.POST("/foulB/decrement", scoreboardHandler.DecrementFoulB)
		api.GET("/log", scoreboardHandler.GetLog)
		api.POST("/state/sync", scoreboardHandler.TriggerStateSync)
	}

	router.GET("/ws/state", func(c *gin.Context) {
		connectionHeader := c.Request.Header.Get("Connection")
		upgradeHeader := c.Request.Header.Get("Upgrade")
		if strings.Contains(strings.ToLower(connectionHeader), "upgrade") && strings.ToLower(upgradeHeader) == "websocket" {
			scoreboardHandler.HandleWebSocket(c)
			return
		}
		c.JSON(400, gin.H{"error": "WebSocket upgrade required"})
	})

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
