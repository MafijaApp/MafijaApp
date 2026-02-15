const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// SERVIRANJE STATIČKIH FAJLOVA (HTML, JS, CSS) iz "public" foldera
app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
    console.log('Korisnik povezan:', socket.id);

    // KREIRANJE SOBE
    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomID] = { host: socket.id, players: [] };
        socket.join(roomID);
        socket.emit('roomCreated', roomID);
        console.log("Soba kreirana:", roomID);
    });

    // PRIDRUŽIVANJE SOBI
    socket.on('joinRoom', ({ roomID, name }) => {
        roomID = roomID.toUpperCase();
        if (rooms[roomID]) {
            const player = { id: socket.id, name: name, role: null };
            rooms[roomID].players.push(player);
            socket.join(roomID);
            
            // Šaljemo svima u toj sobi novu listu imena
            const names = rooms[roomID].players.map(p => p.name);
            io.to(roomID).emit('updatePlayers', names);
            console.log(`${name} ušao u sobu ${roomID}`);
        } else {
            socket.emit('error', 'Soba sa tim kodom ne postoji!');
        }
    });

    // POKRETANJE IGRE (DODELA ULOGA)
    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        let players = room.players;
        let roles = [];

        // Osnovna mafija logika
        for (let i = 0; i < config.mafija; i++) roles.push('Mafija');
        for (let i = 0; i < config.doktor; i++) roles.push('Doktor');
        for (let i = 0; i < config.policajac; i++) roles.push('Policajac');
        while (roles.length < players.length) roles.push('Gradjanin');

        // Mešanje
        roles.sort(() => Math.random() - 0.5);

        players.forEach((p, i) => {
            p.role = roles[i];
            io.to(p.id).emit('yourRole', { role: p.role });
        });
    });

    socket.on('disconnect', () => {
        console.log('Korisnik se otkačio');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`--- SERVER JE POKRENUT ---`);
    console.log(`Idi na: http://localhost:${PORT}`);
});