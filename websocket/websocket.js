// websocket/websocket.js
const { WebSocketServer } = require('ws');
const { getLatestData } = require('../services/mqtt.service');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocketServer({ server });
  console.log('[WS] WebSocket server initialized.');

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected.');

    // Immediately send latest data
    ws.send(JSON.stringify({
      type: 'initial',
      data: getLatestData() || {}
    }));

    // Example: broadcast new data every 5 seconds
    const intervalId = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'update',
          data: getLatestData() || {}
        }));
      }
    }, 5000);

    ws.on('close', () => {
      console.log('[WS] Client disconnected.');
      clearInterval(intervalId);
    });
  });
}

module.exports = { setupWebSocket };
