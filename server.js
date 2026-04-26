const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

function generateRoomID() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on('connection', (socket) => {

    // ================= CREATE ROOM =================
    socket.on('createRoom', (name) => {
        const roomID = generateRoomID();

        rooms[roomID] = {
            host: socket.id,
            players: [{ id: socket.id, name }],
            inGame: false
        };

        socket.join(roomID);

        socket.emit('roomCreated', roomID);
        io.to(roomID).emit('updatePlayers', [name]);
    });

    // ================= JOIN ROOM =================
    socket.on('joinRoom', ({ roomID, name }) => {
        const room = rooms[roomID];

        if (!room) {
            socket.emit('error', 'Soba ne postoji!');
            return;
        }

        if (room.inGame) {
            socket.emit('error', 'Igra je već počela!');
            return;
        }

        room.players.push({ id: socket.id, name });
        socket.join(roomID);

        io.to(roomID).emit('updatePlayers', room.players.map(p => p.name));
    });

    // ================= START GAME =================
    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        const players = room.players;

        if (players.length < 3) {
            socket.emit('error', 'Treba bar 3 igrača!');
            return;
        }

        let roles = [];

        for (let i = 0; i < config.mafija; i++) roles.push('Mafija');
        for (let i = 0; i < config.doktor; i++) roles.push('Doktor');
        for (let i = 0; i < config.policajac; i++) roles.push('Policajac');
        for (let i = 0; i < config.dama; i++) roles.push('Dama');

        if (roles.length > players.length) {
            socket.emit('error', 'Previše uloga!');
            return;
        }

        while (roles.length < players.length) {
            roles.push('Gradjanin');
        }

        // shuffle
        roles.sort(() => Math.random() - 0.5);

        players.forEach((p, i) => {
            io.to(p.id).emit('yourRole', { role: roles[i] });
        });

        room.inGame = true;
    });

    // ================= RESET GAME =================
    socket.on('newGame', (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        room.inGame = false;

        io.to(roomID).emit('resetGame');
    });

    // ================= DISCONNECT =================
    socket.on('disconnect', () => {

        for (let roomID in rooms) {
            const room = rooms[roomID];

            room.players = room.players.filter(p => p.id !== socket.id);

            if (room.players.length === 0) {
                delete rooms[roomID];
            } else {
                io.to(roomID).emit('updatePlayers', room.players.map(p => p.name));
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server radi na portu " + PORT);
});
