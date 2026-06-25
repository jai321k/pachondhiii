const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

// Render-oda health check-ku reply panna oru basic HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('RPG Multiplayer Server is Running OK!\n');
});

// Antha HTTP server kooda WebSocket-a attach pandrom
const wss = new WebSocket.Server({ server });

console.log("Starting Server...");

wss.on('connection', (ws) => {
    console.log('New Player Connected!');
  
    ws.on('message', (message) => {
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('Player Disconnected');
    });
});

// Server-a listen panna vaikkurom
server.listen(port, () => {
    console.log(`RPG Multiplayer Server Started on port ${port}!`);
});
