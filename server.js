// server.js
const http = require('http');
const { app, setupWebSocket } = require('./app');

// Initialize HTTP server
const server = http.createServer(app);

// Setup WebSocket on that server
setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
