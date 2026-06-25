const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('RPG Lobby Server is Running OK!\n');
});

const wss = new WebSocket.Server({ server });

// Room details: { roomName: { pass, maxPlayers, players: [id1, id2...] } }
let availableRooms = {};

console.log("Starting Server...");

wss.on('connection', (ws) => {
    console.log('New Player Connected!');
  
    ws.on('message', (message) => {
        let msgStr = message.toString();
        
        try {
            let data = JSON.parse(msgStr);
            
            // 1. Host Create Room
            if (data.type === "register_room") {
                availableRooms[data.name] = {
                    pass: data.pass,
                    maxPlayers: data.max_players,
                    players: [data.id] // Host-oda ID first add aagidum
                };
                console.log(`Room Created: ${data.name} (Max: ${data.max_players})`);
            }
            
            // 2. Joiner ketkumpothu Room list anuppurathu
            if (data.type === "get_rooms") {
                for (let roomName in availableRooms) {
                    let room = availableRooms[roomName];
                    // Room full aagalana mattum list-la kaatta anuppuvom
                    if (room.players.length < room.maxPlayers) {
                        let roomInfo = {
                            type: "room_info",
                            name: roomName,
                            pass: room.pass,
                            current: room.players.length,
                            max: room.maxPlayers
                        };
                        ws.send(JSON.stringify(roomInfo));
                    }
                }
            }

            // 3. Oru player join aanathum Lobby-a update panni check pandrathu
            if (data.type === "player_joined") {
                let room = availableRooms[data.room];
                if (room && !room.players.includes(data.id)) {
                    room.players.push(data.id);
                    console.log(`Player joined ${data.room}. (${room.players.length}/${room.maxPlayers})`);
                    
                    // Lobby Update-a ellarukkum anuppurom
                    let lobbyMsg = JSON.stringify({
                        type: "lobby_update",
                        room: data.room,
                        current: room.players.length,
                        max: room.maxPlayers
                    });
                    
                    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(lobbyMsg); });

                    // Room Full aagiducha nu check panrom!
                    if (room.players.length >= room.maxPlayers) {
                        console.log(`Room ${data.room} is FULL! Starting game...`);
                        let startMsg = JSON.stringify({
                            type: "start_game",
                            room: data.room,
                            players: room.players // Ellaroda ID-iyum game-ku anuppurom (Spawning-ku thevai)
                        });
                        
                        wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(startMsg); });
                        
                        // Game start aanathum list-la irunthu room-a thookidurom (Puthusa yaarum vara koodathu)
                        delete availableRooms[data.room];
                    }
                }
            }
            
        } catch (err) {}

        // Normal Broadcast (Move, Paint data)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msgStr);
            }
        });
    });

    ws.on('close', () => console.log('Player Disconnected'));
});

server.listen(port, () => console.log(`RPG Server Started on port ${port}!`));
