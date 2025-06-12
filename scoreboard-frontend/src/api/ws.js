import React from 'react';
// WebSocket API functions for scoreboard backend integration

export class ScoreboardWebSocket {
  constructor(onMessage, onOpen, onClose, onError) {
    this.ws = null;
    this.onMessageCallback = onMessage;
    this.onOpenCallback = onOpen;
    this.onCloseCallback = onClose;
    this.onErrorCallback = onError;
    this.connectAttempts = 0;
    this.maxConnectAttempts = 5;
    this.connectTimeout = null;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/state');

      this.ws.onopen = (event) => {
        console.log('WebSocket connection opened');
        this.connectAttempts = 0;
        if (this.onOpenCallback) this.onOpenCallback(event);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessageCallback) this.onMessageCallback(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed');
        if (this.onCloseCallback) this.onCloseCallback(event);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onErrorCallback) this.onErrorCallback(error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.connectAttempts < this.maxConnectAttempts) {
      this.connectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.connectAttempts), 30000);
      console.log(`Attempting to reconnect in ${timeout}ms (attempt ${this.connectAttempts})...`);

      if (this.connectTimeout) {
        clearTimeout(this.connectTimeout);
      }

      this.connectTimeout = setTimeout(() => {
        this.connect();
      }, timeout);
    }
  }

  disconnect() {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Hook for React components to use WebSocket
export function useWebSocketConnection(onMessage, onOpen, onClose, onError) {
  React.useEffect(() => {
    const wsConnection = new ScoreboardWebSocket(onMessage, onOpen, onClose, onError);
    wsConnection.connect();

    return () => {
      wsConnection.disconnect();
    };
  }, [onMessage, onOpen, onClose, onError]);
}