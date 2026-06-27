const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('MOGADEV RPG Server is Running OK!\n');
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
                // 🌟 FIX: Host input panna max_players-a server-la save panrom
                let targetPlayers = parseInt(data.max_players) || 4;
                
                availableRooms[data.name] = {
                    pass: data.pass,
                    host: data.id, 
                    players: [data.id],
                    maxPlayers: targetPlayers, // Here!
                    settings: { 
                        hidingTime: 60, 
                        seekingTime: 180,
                        limitedHit: false,
                        totalHits: 5
                    } 
                };
                console.log(`Room Created: ${data.name} by Host: ${data.id} | Target Players: ${targetPlayers}`);
                
                // Host-ku lobby details oda max_players-um sethu anuppurom
                let lobbyMsg = JSON.stringify({
                    type: "lobby_update",
                    room: data.name,
                    players: [data.id],
                    max_players: targetPlayers
                });
                ws.send(lobbyMsg);
            }
            
            if (data.type === "get_rooms") {
                for (let roomName in availableRooms) {
                    let room = availableRooms[roomName];
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

            if (data.type === "player_joined") {
                let room = availableRooms[data.room];
                if (room && !room.players.includes(data.id)) {
                    room.players.push(data.id);
                    console.log(`Player joined ${data.room}. Total: ${room.players.length}/${room.maxPlayers}`);
                    
                    // 🌟 FIX: Join aagara ellarukum max_players details share panrom
                    let lobbyMsg = JSON.stringify({
                        type: "lobby_update",
                        room: data.room,
                        players: room.players,
                        max_players: room.maxPlayers
                    });
                    
                    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(lobbyMsg); });
                }
            }

            if (data.type === "update_settings") {
                let room = availableRooms[data.room];
                if (room && room.host === data.id) {
                    room.settings.hidingTime = data.hidingTime;
                    room.settings.seekingTime = data.seekingTime;
                    room.settings.limitedHit = data.limitedHit;
                    room.settings.totalHits = data.totalHits;
                }
            }

            if (data.type === "start_match") {
                let room = availableRooms[data.room];
                // Server side security layer: Room full-aana mattum thaan start panna viduvom
                if (room && room.host === data.id && room.players.length >= room.maxPlayers) {
                    console.log(`Lobby Full! Host starting match for Room ${data.room}!`);
                    
                    let randomIndex = Math.floor(Math.random() * room.players.length);
                    let selectedSeekerId = room.players[randomIndex];
                    
                    let startMsg = JSON.stringify({
                        type: "start_game",
                        room: data.room,
                        players: room.players,
                        seeker_id: selectedSeekerId,
                        hiding_time: room.settings.hidingTime,
                        seeking_time: room.settings.seekingTime,
                        limited_hit: room.settings.limitedHit,
                        total_hits: room.settings.totalHits
                    });
                    
                    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(startMsg); });
                    delete availableRooms[data.room];
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

server.listen(port, () => console.log(`MOGADEV RPG Server Started on port ${port}!`));
