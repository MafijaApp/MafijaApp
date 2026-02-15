const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomID] = { host: socket.id, players: [] };
        socket.join(roomID);
        socket.emit('roomCreated', roomID);
    });

    socket.on('joinRoom', ({ roomID, name }) => {
        const id = roomID.toUpperCase();
        if (rooms[id]) {
            rooms[id].players.push({ id: socket.id, name });
            socket.join(id);
            const names = rooms[id].players.map(p => p.name);
            io.to(id).emit('updatePlayers', names);
        } else {
            socket.emit('error', 'Soba ne postoji!');
        }
    });

    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        let players = room.players;
        let roles = [];

        // Dodavanje uloga iz config-a (uključujući Damu)
        for (let i = 0; i < config.mafija; i++) roles.push('Mafija');
        for (let i = 0; i < config.doktor; i++) roles.push('Doktor');
        for (let i = 0; i < config.policajac; i++) roles.push('Policajac');
        for (let i = 0; i < config.dama; i++) roles.push('Dama');

        // Ostatak su građani
        while (roles.length < players.length) {
            roles.push('Gradjanin');
        }

        roles.sort(() => Math.random() - 0.5);

        players.forEach((p, i) => {
            io.to(p.id).emit('yourRole', { role: roles[i] });
        });
    });

    socket.on('disconnect', () => {
        // Logika za izlazak (opciono)
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server na portu ${PORT}`));
