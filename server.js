const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Setup WebSocket server
const wss = new WebSocket.Server({ server });

// Timer state (in seconds)
let duration = 24 * 3600; // 24 hours default
let timerInterval = null;

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Update timer every second if running
function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      if (duration > 0) {
        duration--;
        broadcast({ type: 'update', duration });
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        broadcast({ type: 'stopped' });
      }
    }, 1000);
  }
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    broadcast({ type: 'paused' });
  }
}

// Handle WebSocket connections
wss.on('connection', ws => {
  console.log('Client connected');

  // Send current timer state to new client
  ws.send(JSON.stringify({type: 'update', duration}));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'start':
          startTimer();
          break;
        case 'pause':
          pauseTimer();
          break;
        case 'add':
          duration += data.amount;
          broadcast({type: 'update', duration});
          break;
        case 'subtract':
          duration = Math.max(0, duration - data.amount);
          broadcast({type: 'update', duration});
          break;
        case 'set':
          duration = Math.max(0, data.amount);
          broadcast({type: 'update', duration})
      }
    } catch (err) {
      console.error('Invalid message', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
