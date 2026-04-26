const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Rešava bagove sa diskonekcijom na mobilnim telefonima
const io = new Server(server, {
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
    console.log('Novi korisnik povezan:', socket.id);

    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomID] = { host: socket.id, players: [] };
        socket.join(roomID);
        socket.emit('roomCreated', roomID);
    });

    socket.on('joinRoom', ({ roomID, name }) => {
        const id = roomID.toUpperCase();
        if (rooms[id]) {
            // Provera da igrač već nije u sobi
            rooms[id].players.push({ id: socket.id, name: name });
            socket.join(id);
            const names = rooms[id].players.map(p => p.name);
            io.to(id).emit('updatePlayers', names);
        } else {
            socket.emit('error', 'Soba sa tim kodom ne postoji!');
        }
    });

    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        let players = room.players;
        let roles = [];
        
        // Dinamički dodajemo uloge iz tvojih inputa (Dama, Mafija...)
        if (config.mafija) for (let i = 0; i < config.mafija; i++) roles.push('Mafija');
        if (config.doktor) for (let i = 0; i < config.doktor; i++) roles.push('Doktor');
        if (config.policajac) for (let i = 0; i < config.policajac; i++) roles.push('Policajac');
        if (config.dama) for (let i = 0; i < config.dama; i++) roles.push('Dama');

        while (roles.length < players.length) {
            roles.push('Gradjanin');
        }

        // Mešanje uloga
        roles.sort(() => Math.random() - 0.5);

        let hostSummary = [];
        players.forEach((p, i) => {
            const assignedRole = roles[i];
            io.to(p.id).emit('yourRole', { role: assignedRole });
            hostSummary.push({ name: p.name, role: assignedRole });
        });

        // Host dobija listu svih igrača i njihovih uloga
        io.to(room.host).emit('hostViewRoles', hostSummary);
    });

    socket.on('disconnect', () => {
        console.log('Korisnik se odjavio');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
