const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

function safeNum(n) {
    n = parseInt(n);
    if (isNaN(n) || n < 0) return 0;
    return n;
}

io.on('connection', (socket) => {

    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();

        rooms[roomID] = {
            host: socket.id,
            players: [],
            roles: [],
            started: false
        };

        socket.join(roomID);
        socket.emit('roomCreated', roomID);
    });

    socket.on('joinRoom', ({ roomID, name }) => {
        const room = rooms[roomID];
        if (!room) return socket.emit('error', 'Soba ne postoji');

        room.players.push({ id: socket.id, name });

        socket.join(roomID);

        io.to(roomID).emit(
            'updatePlayers',
            room.players.map(p => p.name)
        );
    });

    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        const players = room.players;

        let roles = [];

        let mafija = safeNum(config.mafija);
        let doktor = safeNum(config.doktor);
        let policajac = safeNum(config.policajac);
        let dama = safeNum(config.dama);

        for (let i = 0; i < mafija; i++) roles.push('Mafija');
        for (let i = 0; i < doktor; i++) roles.push('Doktor');
        for (let i = 0; i < policajac; i++) roles.push('Policajac');
        for (let i = 0; i < dama; i++) roles.push('Dama');

        while (roles.length < players.length) {
            roles.push('Gradjanin');
        }

        roles.sort(() => Math.random() - 0.5);

        room.roles = roles;
        room.started = true;

        players.forEach((p, i) => {
            io.to(p.id).emit('yourRole', {
                role: roles[i]
            });
        });

        io.to(room.host).emit('adminRoles', {
            data: players.map((p, i) => ({
                name: p.name,
                role: roles[i]
            }))
        });
    });

    socket.on('newGame', (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        room.roles = [];
        room.started = false;

        io.to(roomID).emit('resetGame');
    });

    socket.on('disconnect', () => {
        for (const id in rooms) {
            rooms[id].players = rooms[id].players.filter(p => p.id !== socket.id);
        }
    });
});

server.listen(process.env.PORT || 3000, () =>
    console.log("Server running")
);
