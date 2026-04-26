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

    // CREATE ROOM
    socket.on('createRoom', (hostName) => {
        const roomID = generateRoomID();

        rooms[roomID] = {
            host: socket.id,
            players: [],   // {id, name, role}
            started: false
        };

        socket.join(roomID);
        socket.emit('roomCreated', roomID);
    });

    // JOIN ROOM
    socket.on('joinRoom', ({ roomID, name }) => {
        roomID = roomID.toUpperCase();
        const room = rooms[roomID];

        if (!room) {
            socket.emit('error', 'Soba ne postoji');
            return;
        }

        room.players.push({
            id: socket.id,
            name,
            role: null
        });

        socket.join(roomID);

        io.to(roomID).emit(
            'updatePlayers',
            room.players.map(p => p.name)
        );
    });

    // START GAME
    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        let roles = [];

        config.mafija = Math.max(0, config.mafija);
        config.doktor = Math.max(0, config.doktor);
        config.policajac = Math.max(0, config.policajac);
        config.dama = Math.max(0, config.dama);

        for (let i = 0; i < config.mafija; i++) roles.push('Mafija');
        for (let i = 0; i < config.doktor; i++) roles.push('Doktor');
        for (let i = 0; i < config.policajac; i++) roles.push('Policajac');
        for (let i = 0; i < config.dama; i++) roles.push('Dama');

        while (roles.length < room.players.length) {
            roles.push('Gradjanin');
        }

        roles.sort(() => Math.random() - 0.5);

        // HOST NE DOBIJA ROLE
        let index = 0;

        room.players.forEach(p => {
            if (p.id === room.host) {
                p.role = 'HOST';
                return;
            }

            p.role = roles[index];
            index++;

            io.to(p.id).emit('yourRole', {
                role: p.role
            });
        });

        room.started = true;

        // ADMIN PANEL DATA
        io.to(room.host).emit('adminPanel', room.players);
    });

    // NEW GAME RESET
    socket.on('newGame', (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        room.players.forEach(p => p.role = null);
        room.started = false;

        io.to(roomID).emit('resetGame');
    });

    // ADMIN REQUEST REFRESH
    socket.on('getAdminData', (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        io.to(room.host).emit('adminPanel', room.players);
    });
});

server.listen(3000, () => console.log("Server running"));
