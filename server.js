const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

function clamp(num) {
    return Math.max(0, num || 0);
}

io.on('connection', (socket) => {

    socket.on('createRoom', (name) => {
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
        const id = roomID.toUpperCase();
        const room = rooms[id];

        if (!room) return socket.emit('error', 'Soba ne postoji!');

        room.players.push({ id: socket.id, name });
        socket.join(id);

        const names = room.players.map(p => p.name);
        io.to(id).emit('updatePlayers', names);
    });

    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        const players = room.players;

        let mafija = clamp(config.mafija);
        let doktor = clamp(config.doktor);
        let policajac = clamp(config.policajac);
        let dama = clamp(config.dama);

        let roles = [];

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

        // PLAYER ROLES (NE HOST)
        players.forEach((p, i) => {
            io.to(p.id).emit('yourRole', {
                role: roles[i]
            });
        });

        // ADMIN VIEW (HOST VIDI SVE)
        io.to(room.host).emit('adminRoles', {
            players: players.map((p, i) => ({
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
            const room = rooms[id];
            room.players = room.players.filter(p => p.id !== socket.id);
        }
    });
});
rooms[roomID] = {
    host: socket.id,
    players: [],
    roles: [],
    started: false,
    round: 0
};
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`);
});
