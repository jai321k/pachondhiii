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
                availableRooms[data.name] = {
                    pass: data.pass,
                    host: data.id, // 🌟 FIX: Yaaru Host nu track panrom
                    players: [data.id],
                    settings: { hidingTime: 60, seekingTime: 180 } // Default Timers (seconds)
                };
                console.log(`Room Created: ${data.name} by Host: ${data.id}`);
            }
            
            if (data.type === "get_rooms") {
                for (let roomName in availableRooms) {
                    let room = availableRooms[roomName];
                    let roomInfo = {
                        type: "room_info",
                        name: roomName,
                        pass: room.pass,
                        current: room.players.length,
                        max: 10 // Arbitrary max for lobby
                    };
                    ws.send(JSON.stringify(roomInfo));
                }
            }

            if (data.type === "player_joined") {
                let room = availableRooms[data.room];
                if (room && !room.players.includes(data.id)) {
                    room.players.push(data.id);
                    console.log(`Player joined ${data.room}. Total: ${room.players.length}`);
                    
                    // 🌟 FIX: Player join aana udane ellarukkum update anuppurom (Lobby spawn panna)
                    let lobbyMsg = JSON.stringify({
                        type: "lobby_update",
                        room: data.room,
                        players: room.players
                    });
                    
                    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(lobbyMsg); });
                }
            }

            // 🌟 PUTHU LOGIC: Host settings-a edit pannum pothu
            if (data.type === "update_settings") {
                let room = availableRooms[data.room];
                if (room && room.host === data.id) {
                    room.settings.hidingTime = data.hidingTime;
                    room.settings.seekingTime = data.seekingTime;
                    console.log(`Room ${data.room} Settings Update -> Hiding: ${data.hidingTime}s | Seeking: ${data.seekingTime}s`);
                }
            }

            // 🌟 PUTHU LOGIC: Host "Start Match" click pannum pothu
            if (data.type === "start_match") {
                let room = availableRooms[data.room];
                if (room && room.host === data.id) {
                    console.log(`Host starting match for Room ${data.room}! Assigning roles...`);
                    
                    // Seeker-a random aaga select panrom
                    let randomIndex = Math.floor(Math.random() * room.players.length);
                    let selectedSeekerId = room.players[randomIndex];
                    
                    let startMsg = JSON.stringify({
                        type: "start_game",
                        room: data.room,
                        players: room.players,
                        seeker_id: selectedSeekerId,
                        hiding_time: room.settings.hidingTime,
                        seeking_time: room.settings.seekingTime
                    });
                    
                    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(startMsg); });
                    
                    // Match start aanathum list-la irunthu room-a thookiduvom (Puthusa yaarum join aaga koodathu)
                    delete availableRooms[data.room];
                }
            }
            
        } catch (err) {}

        // Movement, Paint, Eliminate broadcast pandrathu (Appadiye irukku)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msgStr);
            }
        });
    });

    ws.on('close', () => console.log('Player Disconnected'));
});

server.listen(port, () => console.log(`MOGADEV RPG Server Started on port ${port}!`));
