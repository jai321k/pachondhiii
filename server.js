const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('RPG Lobby Server is Running OK!\n');
});

const wss = new WebSocket.Server({ server });

let availableRooms = {};

console.log("Starting Server...");

wss.on('connection', (ws) => {
    console.log('New Player Connected!');
  
    ws.on('message', (message) => {
        let msgStr = message.toString();
        
        try {
            let data = JSON.parse(msgStr);
            
            if (data.type === "register_room") {
                availableRooms[data.name] = {
                    pass: data.pass,
                    maxPlayers: data.max_players,
                    players: [data.id] 
                };
                console.log(`Room Created: ${data.name} (Max: ${data.max_players})`);
            }
            
            if (data.type === "get_rooms") {
                for (let roomName in availableRooms) {
                    let room = availableRooms[roomName];
                    if (room.players.length < room.maxPlayers) {
                        ws.send(JSON.stringify({
                            type: "room_info",
                            name: roomName,
                            pass: room.pass,
                            current: room.players.length,
                            max: room.maxPlayers
                        }));
                    }
                }
            }

            if (data.type === "player_joined") {
                let room = availableRooms[data.room];
                if (room && !room.players.includes(data.id)) {
                    room.players.push(data.id);
                    console.log(`Player joined ${data.room}. (${room.players.length}/${room.maxPlayers})`);
                    
                    let lobbyMsg = JSON.stringify({
                        type: "lobby_update",
                        room: data.room,
                        current: room.players.length,
                        max: room.maxPlayers
                    });
                    
                    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(lobbyMsg); });

                    // 🌟 FIX: Room Full Aanathum Random Seeker Select Pandrom
                    if (room.players.length >= room.maxPlayers) {
                        console.log(`Room ${data.room} is FULL! Starting game...`);
                        
                        // Random index-a eduthu, antha player ID-a seeker aakkurom
                        const randomIndex = Math.floor(Math.random() * room.players.length);
                        const assignedSeekerId = room.players[randomIndex];

                        let startMsg = JSON.stringify({
                            type: "start_game",
                            room: data.room,
                            players: room.players,
                            seeker: assignedSeekerId // <-- Puthusa add panna data
                        });
                        
                        wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(startMsg); });
                        delete availableRooms[data.room];
                    }
                }
            }
        } catch (err) {}

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msgStr);
            }
        });
    });

    ws.on('close', () => console.log('Player Disconnected'));
});

server.listen(port, () => console.log(`RPG Server Started on port ${port}!`));
