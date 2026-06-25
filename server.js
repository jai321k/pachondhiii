const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

// Render-oda health check HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('RPG Multiplayer Server is Running OK!\n');
});

const wss = new WebSocket.Server({ server });

// Server-laye room details-a store panna oru variable
let availableRooms = {};

console.log("Starting Server...");

wss.on('connection', (ws) => {
    console.log('New Player Connected!');
  
    ws.on('message', (message) => {
        let msgStr = message.toString();
        
        try {
            let data = JSON.parse(msgStr);
            
            // 1. Host puthusa room create pannum pothu, server atha save pannikidum
            if (data.type === "register_room") {
                availableRooms[data.name] = data.pass;
                console.log("New Room Registered on Server:", data.name);
            }
            
            // 2. Joiner room list kekkum pothu, server direct-a reply pannum!
            if (data.type === "get_rooms") {
                for (let roomName in availableRooms) {
                    let roomInfo = {
                        type: "room_info",
                        name: roomName,
                        pass: availableRooms[roomName]
                    };
                    ws.send(JSON.stringify(roomInfo)); // Joiner-ku mattum anupputhu
                }
            }
            
        } catch (err) {
            // Not a JSON format, ignore error
        }

        // 3. Normal Broadcast (Position movement, join info-va mathavangalukku anuppa)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msgStr);
            }
        });
    });

    ws.on('close', () => {
        console.log('Player Disconnected');
    });
});

server.listen(port, () => {
    console.log(`RPG Multiplayer Server Started on port ${port}!`);
});
