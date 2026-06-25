const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

console.log("RPG Multiplayer Server Started!");

wss.on('connection', (ws) => {
  console.log('Player Connected!');
  
  ws.on('message', (message) => {
    wss.clients.forEach((client) => {
      // Broadcast data to everyone else
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Player Disconnected');
  });
});
