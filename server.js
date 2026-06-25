const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

// Players data store panna oru object
const players = {};

io.on('connection', (socket) => {
    console.log('Pudhu player vanthurukaaru:', socket.id);

    // Pudhu player-a add pandrom
    players[socket.id] = {
        x: 0,
        y: 0,
        playerId: socket.id
    };

    // Puthusa vantha player-kku already irukka players details-a anupurom
    socket.emit('currentPlayers', players);

    // Already game-la irukka matha players-kku pudhu player vanthatha solrom
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Player move aagum pothu
    socket.on('playerMovement', (movementData) => {
        if(players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // Oru player move aaguratha matha ellarukkum anupurom
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Player game-a vittu pogum pothu
    socket.on('disconnect', () => {
        console.log('Player poitaaru:', socket.id);
        delete players[socket.id];
        // Matha players-kku intha player poitaaru nu solrom
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`RPG Server port ${PORT} la run aaguthu!`);
});

